import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  and,
  arrayOverlaps,
  eq,
  gt,
  gte,
  isNull,
  lt,
  lte,
  notInArray,
  or,
  sql
} from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { activities, essays, profiles, scholarships, user_scholarships, users } from '@/lib/db/schema';
import { anthropic } from '@/lib/parseWithHaiku';

const MAX_CANDIDATES = 50;

const querySchema = z.object({
  location: z.enum(['local', 'state', 'national', 'all']).default('all'),
  amount: z.enum(['any', '1k', '5k', '10k']).default('any'),
  deadline: z.enum(['any', 'month', 'quarter']).default('any'),
  competition: z.enum(['any', 'low', 'medium', 'high']).default('any'),
  requiresEssay: z.enum(['any', 'yes', 'no']).default('any'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional()
});

type RankedScholarship = {
  id: string;
  reason: string;
};

const systemPrompt = `You are a scholarship matching assistant. Given a student's profile and a list of scholarships, rank the scholarships from best to worst match for this specific student. Consider: demographic eligibility (gender, ethnicity, first-gen status, income), geographic proximity (local > state > national), competition level (low competition is better for win probability), essay topic alignment (does the student have relevant essays already written?), and activity alignment (do their ECs match scholarship focus areas?).

Respond ONLY with a valid JSON array of objects. No explanation, no markdown, no preamble. Each object must have exactly two fields:
  id: the scholarship UUID (string)
  reason: one concise sentence (max 15 words) explaining why this is a strong match for THIS student specifically`;

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

const extractJsonArray = (text: string): RankedScholarship[] => {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Claude returned empty response');
  const withoutFences = trimmed.startsWith('```')
    ? trimmed.replace(/```(?:json)?/g, '').trim()
    : trimmed;
  const firstBracket = withoutFences.indexOf('[');
  const lastBracket = withoutFences.lastIndexOf(']');
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error('Claude returned invalid JSON array');
  }
  const jsonText = withoutFences.slice(firstBracket, lastBracket + 1);
  const parsed = JSON.parse(jsonText) as RankedScholarship[];
  if (!Array.isArray(parsed)) {
    throw new Error('Claude returned invalid JSON array');
  }
  return parsed.filter(
    (item): item is RankedScholarship =>
      Boolean(item) && typeof item.id === 'string' && typeof item.reason === 'string'
  );
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsedParams = querySchema.safeParse(rawParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsedParams.error.issues },
      { status: 400 }
    );
  }

  const params = parsedParams.data;
  const limitDefault = params.cursor ? 5 : 20;
  const limit = Math.min(params.limit ?? limitDefault, 20);

  const [userRecord] = await db
    .select({
      userId: users.id,
      profileId: profiles.id,
      city: profiles.city,
      state: profiles.state,
      gpa: profiles.gpa,
      graduationYear: profiles.graduation_year,
      gender: profiles.gender,
      ethnicity: profiles.ethnicity,
      firstGeneration: profiles.first_generation,
      agiRange: profiles.agi_range
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.user_id, users.id))
    .where(eq(users.clerk_id, userId))
    .limit(1);

  if (!userRecord) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!userRecord.profileId) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const [essayRows, activityRows] = await Promise.all([
    db
      .select({
        topic: essays.topic
      })
      .from(essays)
      .where(eq(essays.user_id, userRecord.userId)),
    db
      .select({
        title: activities.title
      })
      .from(activities)
      .where(eq(activities.user_id, userRecord.userId))
  ]);

  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);
  const gpaValue = userRecord.gpa ? userRecord.gpa.toString() : null;
  const graduationYear = userRecord.graduationYear ?? null;
  const userCity = userRecord.city ?? null;
  const userState = userRecord.state ?? null;

  const conditions = [
    eq(scholarships.is_active, true),
    gte(scholarships.deadline, todayString),
    userState
      ? or(isNull(scholarships.states), arrayOverlaps(scholarships.states, [userState]))
      : isNull(scholarships.states),
    userCity
      ? or(isNull(scholarships.cities), arrayOverlaps(scholarships.cities, [userCity]))
      : isNull(scholarships.cities),
    gpaValue
      ? and(
          or(isNull(scholarships.min_gpa), lte(scholarships.min_gpa, gpaValue)),
          or(isNull(scholarships.max_gpa), gte(scholarships.max_gpa, gpaValue))
        )
      : and(isNull(scholarships.min_gpa), isNull(scholarships.max_gpa)),
    graduationYear
      ? and(
          or(isNull(scholarships.min_graduation_year), lte(scholarships.min_graduation_year, graduationYear)),
          or(isNull(scholarships.max_graduation_year), gte(scholarships.max_graduation_year, graduationYear))
        )
      : and(isNull(scholarships.min_graduation_year), isNull(scholarships.max_graduation_year)),
    notInArray(
      scholarships.id,
      db
        .select({ id: user_scholarships.scholarship_id })
        .from(user_scholarships)
        .where(eq(user_scholarships.user_id, userRecord.userId))
    )
  ];

  switch (params.location) {
    case 'local':
      conditions.push(userCity ? arrayOverlaps(scholarships.cities, [userCity]) : sql`false`);
      break;
    case 'state':
      conditions.push(userState ? arrayOverlaps(scholarships.states, [userState]) : sql`false`);
      break;
    case 'national':
      conditions.push(eq(scholarships.is_national, true));
      break;
    default:
      break;
  }

  switch (params.amount) {
    case '1k':
      conditions.push(gte(scholarships.amount, 1000));
      break;
    case '5k':
      conditions.push(gte(scholarships.amount, 5000));
      break;
    case '10k':
      conditions.push(gte(scholarships.amount, 10000));
      break;
    default:
      break;
  }

  if (params.deadline !== 'any') {
    const daysToAdd = params.deadline === 'month' ? 30 : 90;
    const endDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const endDateString = endDate.toISOString().slice(0, 10);
    conditions.push(lte(scholarships.deadline, endDateString));
  }

  switch (params.competition) {
    case 'low':
      conditions.push(
        or(lt(scholarships.estimated_applicants, 100), eq(scholarships.competition_level, 'local'))
      );
      break;
    case 'medium':
      conditions.push(
        and(gte(scholarships.estimated_applicants, 100), lte(scholarships.estimated_applicants, 500))
      );
      break;
    case 'high':
      conditions.push(
        or(gt(scholarships.estimated_applicants, 500), eq(scholarships.competition_level, 'national'))
      );
      break;
    default:
      break;
  }

  if (params.requiresEssay === 'yes') {
    conditions.push(eq(scholarships.requires_essay, true));
  }

  if (params.requiresEssay === 'no') {
    conditions.push(eq(scholarships.requires_essay, false));
  }

  const candidates = await db
    .select({
      id: scholarships.id,
      name: scholarships.name,
      organization: scholarships.organization,
      amount: scholarships.amount,
      deadline: scholarships.deadline,
      applicationUrl: scholarships.application_url,
      shortDescription: scholarships.short_description,
      fullDescription: scholarships.full_description,
      competitionLevel: scholarships.competition_level,
      estimatedApplicants: scholarships.estimated_applicants,
      requiresEssay: scholarships.requires_essay,
      requiresRecommendation: scholarships.requires_recommendation,
      requiresTranscript: scholarships.requires_transcript,
      requiresResume: scholarships.requires_resume,
      essayWordCount: scholarships.essay_word_count,
      essayPrompts: scholarships.essay_prompts,
      isNational: scholarships.is_national,
      cities: scholarships.cities,
      states: scholarships.states,
      requiredDemographics: scholarships.required_demographics,
      minGpa: scholarships.min_gpa
    })
    .from(scholarships)
    .where(and(...conditions))
    .limit(MAX_CANDIDATES);

  const essayTopics = essayRows.map((essay) => essay.topic).filter(Boolean);
  const activityTitles = activityRows.map((activity) => activity.title).filter(Boolean);

  const userContext = `Student profile:\n- Location: ${userRecord.city ?? 'not provided'}, ${userRecord.state ?? 'not provided'}\n- GPA: ${gpaValue ?? 'not provided'}\n- Graduation year: ${graduationYear ?? 'not provided'}\n- Gender: ${userRecord.gender ?? 'not provided'}\n- Ethnicity: ${userRecord.ethnicity?.join(', ') ?? 'not provided'}\n- First generation: ${userRecord.firstGeneration ? 'yes' : 'no'}\n- Income range: ${userRecord.agiRange ?? 'not provided'}\n- Essays written on topics: ${essayTopics.join(', ') || 'none'}\n- Activities: ${activityTitles.join(', ') || 'none'}`;

  const scholarshipListString = candidates
    .map((scholarship) => {
      const deadlineValue = scholarship.deadline
        ? toDate(scholarship.deadline).toISOString().split('T')[0]
        : 'unknown';
      const demographics = scholarship.requiredDemographics?.join(', ') || 'none';
      return `- id: ${scholarship.id}\n  name: ${scholarship.name}\n  organization: ${scholarship.organization ?? 'not provided'}\n  amount: ${scholarship.amount ?? 'not provided'}\n  deadline: ${deadlineValue}\n  competitionLevel: ${scholarship.competitionLevel ?? 'not provided'}\n  estimatedApplicants: ${scholarship.estimatedApplicants ?? 'not provided'}\n  requiresEssay: ${scholarship.requiresEssay ? 'yes' : 'no'}\n  requiredDemographics: ${demographics}\n  shortDescription: ${scholarship.shortDescription ?? 'not provided'}`;
    })
    .join('\n\n');

  let aiRanked = true;
  let rankedResults = candidates;
  const matchReasonMap = new Map<string, string>();

  if (candidates.length > 0) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Student profile:\n${userContext}\n\nScholarships to rank:\n${scholarshipListString}`
          }
        ]
      });

      const textBlock = message.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Claude returned a non-text response');
      }

      const ranking = extractJsonArray(textBlock.text);
      const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
      ranking.forEach((item) => {
        matchReasonMap.set(item.id, item.reason);
      });
      const rankedByAi = ranking
        .map((item) => candidateMap.get(item.id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const rankedIds = new Set(ranking.map((item) => item.id));
      const remaining = candidates.filter((candidate) => !rankedIds.has(candidate.id));
      rankedResults = [...rankedByAi, ...remaining];
    } catch (error) {
      console.error('Haiku ranking failed:', error);
      aiRanked = false;
    }
  }

  if (!aiRanked) {
    const locationRank = (candidate: (typeof candidates)[number]) => {
      const cityMatch = userCity ? candidate.cities?.includes(userCity) : false;
      const stateMatch = userState ? candidate.states?.includes(userState) : false;
      if (cityMatch) return 0;
      if (stateMatch) return 1;
      if (candidate.isNational) return 2;
      return 3;
    };

    rankedResults = [...candidates].sort((a, b) => {
      const rankA = locationRank(a);
      const rankB = locationRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return toDate(a.deadline).getTime() - toDate(b.deadline).getTime();
    });
  }

  const startIndex = params.cursor
    ? Math.max(0, rankedResults.findIndex((item) => item.id === params.cursor) + 1)
    : 0;
  const pagedResults = rankedResults.slice(startIndex, startIndex + limit);
  const lastResult = pagedResults[pagedResults.length - 1];
  const nextCursor =
    lastResult && startIndex + pagedResults.length < rankedResults.length ? lastResult.id : null;

  const responseScholarships = pagedResults.map((item) => {
    const deadlineDate = toDate(item.deadline);
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isLocal = userCity ? item.cities?.includes(userCity) ?? false : false;
    return {
      id: item.id,
      name: item.name,
      organization: item.organization,
      amount: item.amount,
      deadline: deadlineDate.toISOString(),
      applicationUrl: item.applicationUrl,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      competitionLevel: item.competitionLevel,
      estimatedApplicants: item.estimatedApplicants,
      requiresEssay: item.requiresEssay,
      requiresRecommendation: item.requiresRecommendation,
      requiresTranscript: item.requiresTranscript,
      requiresResume: item.requiresResume,
      essayWordCount: item.essayWordCount,
      essayPrompts: item.essayPrompts,
      isNational: item.isNational,
      isLocal,
      daysUntilDeadline,
      matchReason: aiRanked ? matchReasonMap.get(item.id) ?? null : null,
      minGpa: item.minGpa
    };
  });

  return NextResponse.json({
    scholarships: responseScholarships,
    nextCursor,
    totalCount: rankedResults.length,
    aiRanked
  });
}
