import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { activities } from '@/lib/db/schema';

const activityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  position: z.string().optional(),
  description_long: z.string().max(500).optional(),
  description_medium: z.string().max(150).optional(),
  description_short: z.string().max(50).optional(),
  hours_per_week: z.number().int().min(0).max(168).optional(),
  weeks_per_year: z.number().int().min(0).max(52).optional(),
  grades: z.array(z.number().int().min(9).max(12)).max(4).optional()
});

const normalizeText = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const getUser = async (clerkId: string) =>
  db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, clerkId)
  });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;

  const body = await req.json();
  const parsed = activityUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const updates: Record<string, unknown> = {
    updated_at: new Date()
  };

  if (payload.title !== undefined) updates.title = payload.title.trim();
  if (payload.position !== undefined) updates.position = normalizeText(payload.position) ?? null;
  if (payload.description_long !== undefined) {
    updates.description_long = normalizeText(payload.description_long) ?? null;
  }
  if (payload.description_medium !== undefined) {
    updates.description_medium = normalizeText(payload.description_medium) ?? null;
  }
  if (payload.description_short !== undefined) {
    updates.description_short = normalizeText(payload.description_short) ?? null;
  }
  if (payload.hours_per_week !== undefined) updates.hours_per_week = payload.hours_per_week;
  if (payload.weeks_per_year !== undefined) updates.weeks_per_year = payload.weeks_per_year;
  if (payload.grades !== undefined) updates.grades = payload.grades.length ? payload.grades : null;

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const [updated] = await db
    .update(activities)
    .set(updates)
    .where(and(eq(activities.id, id), eq(activities.user_id, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;

  const [deleted] = await db
    .delete(activities)
    .where(and(eq(activities.id, id), eq(activities.user_id, user.id)))
    .returning({ id: activities.id });

  if (!deleted) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
