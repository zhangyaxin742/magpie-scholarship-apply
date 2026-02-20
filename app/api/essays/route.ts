import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { essays } from '@/lib/db/schema';

const essaySchema = z.object({
  topic: z.enum([
    'personal_statement',
    'leadership',
    'challenge',
    'community_service',
    'diversity',
    'career_goals',
    'academic_interest',
    'extracurricular',
    'work_experience',
    'other'
  ]),
  title: z.string().optional(),
  text: z.string().min(1),
  word_count: z.number().int().min(1).max(10000),
  tags: z.array(z.string()).optional().default([])
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
    .from(essays)
    .where(eq(essays.user_id, user.id))
    .orderBy(asc(essays.topic), asc(essays.created_at));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = essaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const [created] = await db
    .insert(essays)
    .values({
      user_id: user.id,
      topic: payload.topic,
      title: normalizeText(payload.title) ?? null,
      text: payload.text.trim(),
      word_count: payload.word_count,
      tags: payload.tags.length ? payload.tags : null,
      times_used: 0
    })
    .returning();

  return NextResponse.json(created);
}
