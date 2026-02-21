import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { runDiscoveryPipeline } from '@/lib/pipeline/runPipeline';
import type { PipelineProfile } from '@/lib/pipeline/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const buildProfile = (city: string | null, state: string | null): PipelineProfile => ({
  city,
  state,
  gpa: null,
  graduationYear: null,
  ethnicity: null,
  gender: null,
  firstGeneration: null,
  agiRange: null,
  intendedMajor: null,
  athletics: null,
  ecCategories: null
});

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({ city: profiles.city, state: profiles.state })
    .from(profiles);

  const locations = new Map<string, { city: string | null; state: string | null }>();
  for (const row of rows) {
    if (!row.city && !row.state) continue;
    const key = `${row.city ?? ''}|${row.state ?? ''}`.toLowerCase();
    if (!locations.has(key)) {
      locations.set(key, { city: row.city ?? null, state: row.state ?? null });
    }
  }

  const results: Array<{ city: string | null; state: string | null; result: unknown }> = [];

  for (const location of locations.values()) {
    const profile = buildProfile(location.city, location.state);
    const result = await runDiscoveryPipeline(profile);
    results.push({ city: location.city, state: location.state, result });
  }

  return NextResponse.json({
    success: true,
    locationsProcessed: results.length,
    results
  });
}
