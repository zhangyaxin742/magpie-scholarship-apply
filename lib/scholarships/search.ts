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

import { db } from '@/lib/db';
import { profiles, scholarships, user_scholarships, users } from '@/lib/db/schema';
import { anthropic } from '@/lib/parseWithHaiku';
import type { ScholarshipSearchResponse, SearchFilters, ScholarshipResult } from '@/lib/scholarships/types';

const MAX_CANDIDATES = 50;

const systemPrompt = `You are a scholarship matching assistant. Rank the provided scholarships by relevance to the student profile. Return ONLY a valid JSON array of scholarship IDs in ranked order — most relevant first. No explanation, no markdown, no other text.`;

export class ScholarshipSearchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

const extractJsonArray = (text: string): string[] => {
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
  const parsed = JSON.parse(withoutFences.slice(firstBracket, lastBracket + 1));
  if (!Array.isArray(parsed)) throw new Error('Claude returned invalid JSON array');
  return parsed.filter((item): item is string => typeof item === 'string');
};

interface SearchParams {
  userId: string;
  filters: SearchFilters;
  cursor?: string | null;
  limit?: number;
}

export async function searchScholarships({
  userId,
  filters,
  cursor,
  limit
}: SearchParams): Promise<ScholarshipSearchResponse> {
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

  if (!userRecord) throw new ScholarshipSearchError(404, 'User not found');
  if (!userRecord.profileId) throw new ScholarshipSearchError(404, 'Profile not found');

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
  ].filter(Boolean);

  switch (filters.location) {
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

  switch (filters.amount) {
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

  if (filters.deadline !== 'any') {
    const daysToAdd = filters.deadline === 'month' ? 30 : 90;
    const endDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const endDateString = endDate.toISOString().slice(0, 10);
    conditions.push(lte(scholarships.deadline, endDateString));
  }

  switch (filters.competition) {
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

  if (filters.requiresEssay === 'yes') conditions.push(eq(scholarships.requires_essay, true));
  if (filters.requiresEssay === 'no') conditions.push(eq(scholarships.requires_essay, false));

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

  if (candidates.length === 0) {
    return {
      scholarships: [],
      nextCursor: null,
      totalCount: 0,
      aiRanked: true
    };
  }

  let aiRanked = true;
  let rankedResults = candidates;

  if (candidates.length > 0) {
    try {
      const studentProfile = {
        gpa: userRecord.gpa ? Number(userRecord.gpa) : null,
        city: userRecord.city,
        state: userRecord.state,
        graduationYear: userRecord.graduationYear,
        gender: userRecord.gender,
        ethnicity: userRecord.ethnicity,
        firstGeneration: userRecord.firstGeneration,
        agiRange: userRecord.agiRange
      };

      const scholarshipsPayload = candidates.map((scholarship) => ({
        id: scholarship.id,
        name: scholarship.name,
        amount: scholarship.amount,
        deadline: scholarship.deadline,
        competitionLevel: scholarship.competitionLevel,
        estimatedApplicants: scholarship.estimatedApplicants,
        isNational: scholarship.isNational,
        states: scholarship.states,
        cities: scholarship.cities,
        requiredDemographics: scholarship.requiredDemographics,
        minGpa: scholarship.minGpa
      }));

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `STUDENT PROFILE:\n${JSON.stringify(studentProfile)}\n\nRanking criteria (in order of importance):\n1. Geographic proximity: local (city match) > state match > national\n2. GPA fit: closer to min_gpa is better match\n3. Demographic alignment: required_demographics overlap with profile\n4. Deadline urgency: sooner deadlines ranked higher among similar matches\n5. Competition level: lower competition ranked higher among equal matches\n\nSCHOLARSHIPS:\n${JSON.stringify(scholarshipsPayload)}`
          }
        ]
      });

      const textBlock = message.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') throw new Error('Claude returned a non-text response');

      const ranking = extractJsonArray(textBlock.text);
      const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));

      const rankedByAi = ranking
        .map((id) => candidateMap.get(id))
        .filter((item): item is (typeof candidates)[number] => Boolean(item));
      const rankedIds = new Set(ranking);
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

  const limitValue = Math.min(limit ?? 5, 20);
  const startIndex = cursor
    ? Math.max(0, rankedResults.findIndex((item) => item.id === cursor) + 1)
    : 0;
  const pagedResults = rankedResults.slice(startIndex, startIndex + limitValue);
  const lastResult = pagedResults[pagedResults.length - 1];
  const nextCursor =
    lastResult && startIndex + pagedResults.length < rankedResults.length ? lastResult.id : null;

  const responseScholarships: ScholarshipResult[] = pagedResults.map((item) => {
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
      competitionLevel: item.competitionLevel as ScholarshipResult['competitionLevel'],
      estimatedApplicants: item.estimatedApplicants,
      requiresEssay: Boolean(item.requiresEssay),
      requiresRecommendation: Boolean(item.requiresRecommendation),
      requiresTranscript: Boolean(item.requiresTranscript),
      requiresResume: Boolean(item.requiresResume),
      essayWordCount: item.essayWordCount,
      essayPrompts: item.essayPrompts,
      isNational: Boolean(item.isNational),
      isLocal,
      daysUntilDeadline,
      matchReason: null,
      minGpa: item.minGpa
    };
  });

  return {
    scholarships: responseScholarships,
    nextCursor,
    totalCount: rankedResults.length,
    aiRanked
  };
}
