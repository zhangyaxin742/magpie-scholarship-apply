import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { user_scholarships } from '@/lib/db/schema';

const updateSchema = z.object({
  status: z.enum(['in_cart', 'applied', 'won', 'lost']).optional(),
  amount_won: z.number().int().positive().optional(),
  decision_date: z.string().optional(),
  user_notes: z.string().optional()
});

const getUser = async (clerkId: string) =>
  db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, clerkId)
  });

const toDateString = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  
  const payload = parsed.data;
  const updates: Record<string, unknown> = { updated_at: new Date() };

  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.amount_won !== undefined) updates.amount_won = payload.amount_won;
  if (payload.user_notes !== undefined) updates.user_notes = payload.user_notes.trim();
  if (payload.decision_date !== undefined) {
    const decisionDate = toDateString(payload.decision_date);
    if (!decisionDate) {
      return NextResponse.json({ error: 'Invalid decision_date' }, { status: 400 });
    }
    updates.decision_date = decisionDate;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const [updated] = await db
    .update(user_scholarships)
    .set(updates)
    .where(and(eq(user_scholarships.id, id), eq(user_scholarships.user_id, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });

  return NextResponse.json(updated);
}
