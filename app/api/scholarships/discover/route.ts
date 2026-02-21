import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { runDiscoveryPipeline } from '@/lib/pipeline/runPipeline';
import type { PipelineProfile } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const profileSchema = z.object({
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  gpa: z.number().nullable().optional(),
  graduationYear: z.number().nullable().optional(),
  ethnicity: z.array(z.string()).nullable().optional(),
  gender: z.string().nullable().optional(),
  firstGeneration: z.boolean().nullable().optional(),
  agiRange: z.string().nullable().optional(),
  intendedMajor: z.string().nullable().optional(),
  athletics: z.array(z.string()).nullable().optional(),
  ecCategories: z.array(z.string()).nullable().optional()
});

const normalizeProfile = (payload: z.infer<typeof profileSchema>): PipelineProfile => ({
  city: payload.city ?? null,
  state: payload.state ?? null,
  gpa: payload.gpa ?? null,
  graduationYear: payload.graduationYear ?? null,
  ethnicity: payload.ethnicity ?? null,
  gender: payload.gender ?? null,
  firstGeneration: payload.firstGeneration ?? null,
  agiRange: payload.agiRange ?? null,
  intendedMajor: payload.intendedMajor ?? null,
  athletics: payload.athletics ?? null,
  ecCategories: payload.ecCategories ?? null
});

export async function POST(req: NextRequest) {
  if (!process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'PIPELINE_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.PIPELINE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const profile = normalizeProfile(parsed.data);
  if (!profile.city && !profile.state) {
    return NextResponse.json(
      { error: 'City or state is required to run discovery.' },
      { status: 400 }
    );
  }

  try {
    const result = await runDiscoveryPipeline(profile);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discovery failed';
    console.error('[pipeline] Discovery endpoint failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
