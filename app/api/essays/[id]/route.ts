import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { essays } from '@/lib/db/schema';

const essayUpdateSchema = z.object({
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
  ]).optional(),
  title: z.string().optional(),
  text: z.string().min(1).optional(),
  word_count: z.number().int().min(1).max(10000).optional(),
  tags: z.array(z.string()).optional()
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

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = essayUpdateSchema.safeParse(body);
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

  if (payload.topic !== undefined) updates.topic = payload.topic;
  if (payload.title !== undefined) updates.title = normalizeText(payload.title) ?? null;
  if (payload.text !== undefined) {
    const normalizedText = payload.text.trim();
    updates.text = normalizedText;
    if (payload.word_count === undefined) {
      updates.word_count = countWords(normalizedText);
    }
  }
  if (payload.word_count !== undefined) updates.word_count = payload.word_count;
  if (payload.tags !== undefined) updates.tags = payload.tags.length ? payload.tags : null;

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const [updated] = await db
    .update(essays)
    .set(updates)
    .where(and(eq(essays.id, params.id), eq(essays.user_id, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Essay not found' }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [deleted] = await db
    .delete(essays)
    .where(and(eq(essays.id, params.id), eq(essays.user_id, user.id)))
    .returning({ id: essays.id });

  if (!deleted) return NextResponse.json({ error: 'Essay not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
