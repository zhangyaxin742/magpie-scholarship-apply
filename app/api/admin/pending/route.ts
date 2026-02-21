import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { desc, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { scholarships_pending } from '@/lib/db/schema';

const querySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
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

export async function GET(req: NextRequest) {
  if (!hasPipelineAccess(req)) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ensureAdmin(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { status, limit } = parsed.data;
  const statusList = status
    ? status
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : ['pending', 'needs_review'];

  const items = await db
    .select()
    .from(scholarships_pending)
    .where(inArray(scholarships_pending.status, statusList))
    .orderBy(desc(scholarships_pending.created_at))
    .limit(limit ?? 50);

  return NextResponse.json({ items });
}
