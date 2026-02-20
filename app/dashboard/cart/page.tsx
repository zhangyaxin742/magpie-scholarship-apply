import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { scholarships, user_scholarships } from '@/lib/db/schema';
import { CartClient } from '@/app/components/dashboard/cart/CartClient';
import type { CartItem, CartResponse, CartStatus, Essay, EssayTopic } from '@/app/components/dashboard/cart/types';

const essayTopics = new Set([
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
]);

const isEssayTopic = (value: string): value is EssayTopic => essayTopics.has(value);

const toIsoString = (value: Date | string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

export default async function CartPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, userId)
  });

  if (!user) {
    redirect('/onboarding');
  }

  const [essayRows, cartRows] = await Promise.all([
    db.query.essays.findMany({
      where: (essay, { eq }) => eq(essay.user_id, user.id),
      orderBy: (essay, { desc }) => [desc(essay.created_at)]
    }),
    db
      .select({
        userScholarship: user_scholarships,
        scholarship: scholarships
      })
      .from(user_scholarships)
      .innerJoin(scholarships, eq(user_scholarships.scholarship_id, scholarships.id))
      .where(eq(user_scholarships.user_id, user.id))
  ]);

  const essaysNormalized: Essay[] = essayRows.map((essay) => ({
    id: essay.id,
    topic: isEssayTopic(essay.topic) ? essay.topic : 'other',
    title: essay.title ?? null,
    text: essay.text,
    word_count: essay.word_count ?? null,
    tags: essay.tags ?? null,
    times_used: essay.times_used ?? null,
    created_at: essay.created_at ? essay.created_at.toISOString() : null
  }));

  const cartItems: CartItem[] = cartRows.map((row) => {
    const scholarship = row.scholarship;
    return {
      id: row.userScholarship.id,
      user_id: row.userScholarship.user_id,
      scholarship_id: row.userScholarship.scholarship_id,
      status: row.userScholarship.status as CartStatus,
      added_to_cart_at: toIsoString(row.userScholarship.added_to_cart_at),
      applied_at: toIsoString(row.userScholarship.applied_at),
      decision_date: toIsoString(row.userScholarship.decision_date),
      amount_won: row.userScholarship.amount_won ?? null,
      user_notes: row.userScholarship.user_notes ?? null,
      scholarship: {
        id: scholarship.id,
        name: scholarship.name,
        organization: scholarship.organization ?? null,
        amount: scholarship.amount ?? null,
        deadline: toIsoString(scholarship.deadline) ?? '',
        application_url: scholarship.application_url,
        requires_essay: scholarship.requires_essay ?? false,
        essay_word_count: scholarship.essay_word_count ?? null,
        essay_prompts: scholarship.essay_prompts ?? null,
        requires_recommendation: scholarship.requires_recommendation ?? false,
        requires_transcript: scholarship.requires_transcript ?? false,
        requires_resume: scholarship.requires_resume ?? false
      }
    };
  });

  const inCart: CartResponse['inCart'] = cartItems
    .filter((item) => item.status === 'in_cart')
    .sort(
      (a, b) => new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime()
    );
  const applied: CartResponse['applied'] = cartItems
    .filter((item) => item.status === 'applied')
    .sort(
      (a, b) => (b.applied_at ? new Date(b.applied_at).getTime() : 0) - (a.applied_at ? new Date(a.applied_at).getTime() : 0)
    );
  const won: CartResponse['won'] = cartItems
    .filter((item) => item.status === 'won')
    .sort(
      (a, b) => (b.decision_date ? new Date(b.decision_date).getTime() : 0) - (a.decision_date ? new Date(a.decision_date).getTime() : 0)
    );
  const lost: CartResponse['lost'] = cartItems.filter((item) => item.status === 'lost');

  return (
    <CartClient
      initialCart={{ inCart, applied, won, lost }}
      essays={essaysNormalized}
    />
  );
}
