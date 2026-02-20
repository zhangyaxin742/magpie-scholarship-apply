import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { user_scholarships, users } from '@/lib/db/schema';

const postSchema = z.object({
  scholarshipId: z.string().uuid(),
  action: z.enum(['add', 'reject'])
});

const deleteSchema = z.object({
  scholarshipId: z.string().uuid()
});

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

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, userId)
  });

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
        added_to_cart_at: now,
        updated_at: now
      })
      .onConflictDoUpdate({
        target: [user_scholarships.user_id, user_scholarships.scholarship_id],
        set: {
          status: 'in_cart',
          added_to_cart_at: now,
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
      added_to_cart_at: null,
      updated_at: now
    })
    .onConflictDoUpdate({
      target: [user_scholarships.user_id, user_scholarships.scholarship_id],
      set: {
        status: 'rejected_by_user',
        added_to_cart_at: null,
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

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, userId)
  });

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
