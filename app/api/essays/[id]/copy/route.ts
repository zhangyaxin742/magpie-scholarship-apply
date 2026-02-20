import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { essays } from '@/lib/db/schema';

const getUser = async (clerkId: string) =>
  db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, clerkId)
  });

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  
  const [updated] = await db
    .update(essays)
    .set({
      times_used: sql<number>`coalesce(${essays.times_used}, 0) + 1`,
      updated_at: new Date()
    })
    .where(and(eq(essays.id, id), eq(essays.user_id, user.id)))
    .returning({ times_used: essays.times_used });

  if (!updated) return NextResponse.json({ error: 'Essay not found' }, { status: 404 });

  return NextResponse.json({ times_used: updated.times_used ?? 0 });
}
