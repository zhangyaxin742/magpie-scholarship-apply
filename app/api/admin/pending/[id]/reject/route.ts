import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { scholarships_pending } from '@/lib/db/schema';

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

  const now = new Date();

  const result = await db
    .update(scholarships_pending)
    .set({
      status: 'rejected',
      reviewer_notes: parsedBody.data.reviewerNotes ?? null,
      reviewed_by: userId,
      reviewed_at: now
    })
    .where(eq(scholarships_pending.id, id))
    .returning({ id: scholarships_pending.id });

  if (result.length === 0) {
    return NextResponse.json({ error: 'Pending record not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
