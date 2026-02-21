import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { scholarships, scholarships_pending } from '@/lib/db/schema';
import type { ScholarshipExtracted } from '@/lib/pipeline/types';

const bodySchema = z.object({
  reviewerNotes: z.string().max(2000).optional()
});

const parseAdminIds = () =>
  (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const ensureAdmin = (userId: string) => {
  const adminIds = parseAdminIds();
  if (adminIds.length === 0) return true;
  return adminIds.includes(userId);
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length ? value.trim() : null;

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const asStringArray = (value: unknown): string[] | null =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : null;

const toDecimalString = (value: number | null | undefined) =>
  value === null || value === undefined ? null : value.toString();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ensureAdmin(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const idCheck = z.string().uuid().safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: 'Invalid pending id' }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsedBody.error.issues },
      { status: 400 }
    );
  }

  const pending = await db.query.scholarships_pending.findFirst({
    where: (table, { eq: eqOp }) => eqOp(table.id, id)
  });

  if (!pending) {
    return NextResponse.json({ error: 'Pending record not found' }, { status: 404 });
  }

  const extracted = pending.extracted_data as ScholarshipExtracted | null;
  if (!extracted) {
    return NextResponse.json({ error: 'No extracted data to approve' }, { status: 400 });
  }

  const name = asString(extracted.name);
  const deadline = asString(extracted.deadline);
  const applicationUrl = asString(extracted.applicationUrl) ?? pending.source_url;

  if (!name || !deadline || !applicationUrl) {
    return NextResponse.json(
      { error: 'Missing required fields (name, deadline, applicationUrl).' },
      { status: 400 }
    );
  }

  const now = new Date();

  const insertPayload = {
    name,
    organization: asString(extracted.organization),
    amount: asNumber(extracted.amount),
    deadline,
    application_url: applicationUrl,
    short_description: asString(extracted.shortDescription),
    full_description: asString(extracted.fullDescription),
    min_gpa: toDecimalString(extracted.minGpa),
    max_gpa: toDecimalString(extracted.maxGpa),
    min_graduation_year: null,
    max_graduation_year: null,
    is_national: extracted.isNational ?? false,
    states: asStringArray(extracted.states),
    cities: asStringArray(extracted.cities),
    counties: asStringArray(extracted.counties),
    high_schools: asStringArray(extracted.highSchools),
    required_demographics: asStringArray(extracted.requiredDemographics),
    required_major: asStringArray(extracted.requiredMajor),
    agi_max: asNumber(extracted.agiMax),
    requires_essay: extracted.requiresEssay ?? false,
    essay_prompts: asStringArray(extracted.essayPrompts),
    essay_word_count: asNumber(extracted.essayWordCount),
    requires_recommendation: extracted.requiresRecommendation ?? false,
    requires_transcript: extracted.requiresTranscript ?? false,
    required_athletics: asStringArray(extracted.requiredAthletics),
    required_ec_categories: asStringArray(extracted.requiredEcCategories),
    requires_resume: extracted.requiresResume ?? false,
    source: 'pipeline',
    source_url: pending.source_url,
    last_verified: now,
    is_active: true,
    competition_level: asString(extracted.competitionLevel),
    estimated_applicants: asNumber(extracted.estimatedApplicants)
  };

  const result = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(scholarships)
      .values(insertPayload)
      .returning({ id: scholarships.id });

    await tx
      .update(scholarships_pending)
      .set({
        status: 'approved',
        reviewer_notes: parsedBody.data.reviewerNotes ?? null,
        reviewed_by: userId,
        reviewed_at: now,
        scholarship_id: inserted?.id ?? null
      })
      .where(eq(scholarships_pending.id, pending.id));

    return inserted;
  });

  return NextResponse.json({ success: true, scholarshipId: result?.id ?? null });
}
