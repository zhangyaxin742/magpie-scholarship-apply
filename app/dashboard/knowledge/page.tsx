import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { asc, desc } from 'drizzle-orm';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { KnowledgeBaseClient } from '@/app/components/dashboard/knowledge/KnowledgeBaseClient';

type EssayTopic =
  | 'personal_statement'
  | 'leadership'
  | 'challenge'
  | 'community_service'
  | 'diversity'
  | 'career_goals'
  | 'academic_interest'
  | 'extracurricular'
  | 'work_experience'
  | 'other';

type NormalizedEssay = {
  id: string;
  topic: EssayTopic;
  title: string | null;
  text: string;
  word_count: number | null;
  tags: string[] | null;
  times_used: number | null;
  created_at: string | null;
};

type NormalizedActivity = {
  id: string;
  title: string;
  position: string | null;
  description_short: string | null;
  description_medium: string | null;
  description_long: string | null;
  hours_per_week: number | null;
  weeks_per_year: number | null;
  grades: number[] | null;
  times_used: number | null;
  created_at: string | null;
};

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

export default async function KnowledgePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerk_id, userId)
  });

  if (!user) {
    redirect('/onboarding');
  }

  const [initialEssays, initialActivities] = await Promise.all([
    db.query.essays.findMany({
      where: (essay, { eq }) => eq(essay.user_id, user.id),
      orderBy: (essay, { asc }) => [asc(essay.topic), asc(essay.created_at)]
    }),
    db.query.activities.findMany({
      where: (activity, { eq }) => eq(activity.user_id, user.id),
      orderBy: (activity, { desc }) => [desc(activity.created_at)]
    })
  ]);

  const normalizedEssays: NormalizedEssay[] = initialEssays.map((essay) => ({
    id: essay.id,
    topic: essayTopics.has(essay.topic) ? (essay.topic as EssayTopic) : 'other',
    title: essay.title ?? null,
    text: essay.text,
    word_count: essay.word_count ?? null,
    tags: essay.tags ?? null,
    times_used: essay.times_used ?? null,
    created_at: essay.created_at ? essay.created_at.toISOString() : null
  }));

  const normalizedActivities: NormalizedActivity[] = initialActivities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    position: activity.position ?? null,
    description_short: activity.description_short ?? null,
    description_medium: activity.description_medium ?? null,
    description_long: activity.description_long ?? null,
    hours_per_week: activity.hours_per_week ?? null,
    weeks_per_year: activity.weeks_per_year ?? null,
    grades: activity.grades ?? null,
    times_used: activity.times_used ?? null,
    created_at: activity.created_at ? activity.created_at.toISOString() : null
  }));

  return (
    <KnowledgeBaseClient
      initialEssays={normalizedEssays}
      initialActivities={normalizedActivities}
    />
  );
}
