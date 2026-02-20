import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { activities } from '@/lib/db/schema'

const getUser = async (clerkId: string) =>
  db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, clerkId)
  })

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { id } = await params // ✅ THIS is the key change

  const [updated] = await db
    .update(activities)
    .set({
      times_used: sql<number>`coalesce(${activities.times_used}, 0) + 1`,
      updated_at: new Date()
    })
    .where(and(eq(activities.id, id), eq(activities.user_id, user.id)))
    .returning({ times_used: activities.times_used })

  if (!updated) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })

  return NextResponse.json({ times_used: updated.times_used ?? 0 })
}