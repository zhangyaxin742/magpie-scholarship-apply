import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { runDiscoveryPipeline } from '@/lib/pipeline/runPipeline';
import type { PipelineProfile } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const requestSchema = z.object({
  profileId: z.string().uuid()
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

const hasPipelineAccess = (req: NextRequest) => {
  if (!process.env.PIPELINE_SECRET) return false;
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.PIPELINE_SECRET}`;
};

export async function POST(req: NextRequest) {
  if (!process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'PIPELINE_SECRET is not configured' }, { status: 500 });
  }

  if (!hasPipelineAccess(req)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ensureAdmin(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const profileRow = await db.query.profiles.findFirst({
    where: (profile, { eq }) => eq(profile.id, parsed.data.profileId)
  });

  if (!profileRow) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const profile: PipelineProfile = {
    city: profileRow.city ?? null,
    state: profileRow.state ?? null,
    gpa: profileRow.gpa ? Number(profileRow.gpa) : null,
    graduationYear: profileRow.graduation_year ?? null,
    ethnicity: profileRow.ethnicity ?? null,
    gender: profileRow.gender ?? null,
    firstGeneration: profileRow.first_generation ?? null,
    agiRange: profileRow.agi_range ?? null,
    intendedMajor: null,
    athletics: null,
    ecCategories: null
  };

  if (!profile.city && !profile.state) {
    return NextResponse.json(
      { error: 'City or state is required to run discovery.' },
      { status: 400 }
    );
  }

  try {
    const result = await runDiscoveryPipeline(profile);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discovery failed';
    console.error('[pipeline] Discovery endpoint failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
