import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  defaultSearchFilters,
  type SearchFilters
} from '@/lib/scholarships/types';
import { ScholarshipSearchError, searchScholarships } from '@/lib/scholarships/search';

const querySchema = z.object({
  location: z.enum(['local', 'state', 'national', 'all']).default('all'),
  amount: z.enum(['any', '1k', '5k', '10k']).default('any'),
  deadline: z.enum(['any', 'month', 'quarter']).default('any'),
  competition: z.enum(['any', 'low', 'medium', 'high']).default('any'),
  requiresEssay: z.enum(['any', 'yes', 'no']).default('any'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional()
});

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
  const filters: SearchFilters = {
    ...defaultSearchFilters,
    location: params.location,
    amount: params.amount,
    deadline: params.deadline,
    competition: params.competition,
    requiresEssay: params.requiresEssay
  };

  try {
    const result = await searchScholarships({
      userId,
      filters,
      cursor: params.cursor ?? null,
      limit: params.limit
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ScholarshipSearchError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Scholarship search failed:', error);
    return NextResponse.json({ error: 'Failed to fetch scholarships' }, { status: 500 });
  }
}
