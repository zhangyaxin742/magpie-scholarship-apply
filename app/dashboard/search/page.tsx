import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { profiles, users } from '@/lib/db/schema';
import { searchScholarships } from '@/lib/scholarships/search';
import { defaultSearchFilters } from '@/lib/scholarships/types';
import { ScholarshipSearchClient } from '@/app/components/dashboard/search/ScholarshipSearchClient';

export default async function SearchPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const [userRecord] = await db
    .select({
      userId: users.id,
      profileId: profiles.id,
      city: profiles.city,
      state: profiles.state,
      gpa: profiles.gpa,
      graduationYear: profiles.graduation_year,
      gender: profiles.gender,
      ethnicity: profiles.ethnicity,
      firstGeneration: profiles.first_generation,
      agiRange: profiles.agi_range
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.user_id, users.id))
    .where(eq(users.clerk_id, userId))
    .limit(1);

  if (!userRecord || !userRecord.profileId) {
    redirect('/onboarding');
  }

  const initialResult = await searchScholarships({
    userId,
    filters: defaultSearchFilters,
    cursor: null,
    limit: 20
  });

  return (
    <ScholarshipSearchClient
      initialScholarships={initialResult.scholarships}
      initialCursor={initialResult.nextCursor}
      initialAiRanked={initialResult.aiRanked}
      userProfile={{
        city: userRecord.city ?? null,
        state: userRecord.state ?? null,
        gpa: userRecord.gpa ? Number(userRecord.gpa) : null,
        graduationYear: userRecord.graduationYear ?? null,
        gender: userRecord.gender ?? null,
        ethnicity: userRecord.ethnicity ?? null,
        firstGeneration: userRecord.firstGeneration ?? null,
        agiRange: userRecord.agiRange ?? null
      }}
    />
  );
}
