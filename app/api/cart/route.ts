import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { scholarships, user_scholarships } from '@/lib/db/schema';

const postSchema = z.object({
  scholarshipId: z.string().uuid(),
  action: z.enum(['add', 'reject'])
});

const deleteSchema = z.object({
  scholarshipId: z.string().uuid()
});

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
    .select({
      userScholarship: user_scholarships,
      scholarship: scholarships
    })
    .from(user_scholarships)
    .innerJoin(scholarships, eq(user_scholarships.scholarship_id, scholarships.id))
    .where(eq(user_scholarships.user_id, user.id));

  const items = rows.map((row) => ({
    ...row.userScholarship,
    scholarship: row.scholarship
  }));

  const inCart = items
    .filter((item) => item.status === 'in_cart')
    .sort(
      (a, b) =>
        new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime()
    );
  const applied = items
    .filter((item) => item.status === 'applied')
    .sort(
      (a, b) =>
        (b.applied_at ? new Date(b.applied_at).getTime() : 0) -
        (a.applied_at ? new Date(a.applied_at).getTime() : 0)
    );
  const won = items
    .filter((item) => item.status === 'won')
    .sort(
      (a, b) =>
        (b.decision_date ? new Date(b.decision_date).getTime() : 0) -
        (a.decision_date ? new Date(a.decision_date).getTime() : 0)
    );
  const lost = items.filter((item) => item.status === 'lost');

  return NextResponse.json({ inCart, applied, won, lost });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const user = await getUser(userId);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { scholarshipId, action } = parsed.data;
  const now = new Date();

  if (action === 'add') {
    await db
      .insert(user_scholarships)
      .values({
        user_id: user.id,
        scholarship_id: scholarshipId,
        status: 'in_cart',
        updated_at: now
      })
      .onConflictDoUpdate({
        target: [user_scholarships.user_id, user_scholarships.scholarship_id],
        set: {
          status: 'in_cart',
          updated_at: now
        }
      });

    return NextResponse.json({ success: true });
  }

  await db
    .insert(user_scholarships)
    .values({
      user_id: user.id,
      scholarship_id: scholarshipId,
      status: 'rejected_by_user',
      updated_at: now
    })
    .onConflictDoUpdate({
      target: [user_scholarships.user_id, user_scholarships.scholarship_id],
      set: {
        status: 'rejected_by_user',
        updated_at: now
      }
    });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const user = await getUser(userId);

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await db
    .delete(user_scholarships)
    .where(
      and(
        eq(user_scholarships.user_id, user.id),
        eq(user_scholarships.scholarship_id, parsed.data.scholarshipId)
      )
    );

  return NextResponse.json({ success: true });
}
