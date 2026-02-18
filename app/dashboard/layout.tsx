import type { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { profiles, users } from '@/lib/db/schema';
import { DashboardShell } from '@/app/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const [userRecord] = await db
    .select({
      onboardingCompleted: users.onboarding_completed,
      firstName: profiles.first_name
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.user_id, users.id))
    .where(eq(users.clerk_id, userId))
    .limit(1);

  if (!userRecord || !userRecord.onboardingCompleted) {
    redirect('/onboarding');
  }

  return <DashboardShell firstName={userRecord.firstName}>{children}</DashboardShell>;
}
