import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { activities } from '@/lib/db/schema';

const activitySchema = z.object({
  title: z.string().min(1),
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

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.user_id, user.id))
    .orderBy(desc(activities.created_at));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const [created] = await db
    .insert(activities)
    .values({
      user_id: user.id,
      title: payload.title.trim(),
      position: normalizeText(payload.position) ?? null,
      description_long: normalizeText(payload.description_long) ?? null,
      description_medium: normalizeText(payload.description_medium) ?? null,
      description_short: normalizeText(payload.description_short) ?? null,
      hours_per_week: payload.hours_per_week ?? null,
      weeks_per_year: payload.weeks_per_year ?? null,
      grades: payload.grades?.length ? payload.grades : null,
      times_used: 0
    })
    .returning();

  return NextResponse.json(created);
}
