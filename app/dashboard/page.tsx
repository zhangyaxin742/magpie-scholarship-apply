import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { and, arrayOverlaps, eq, gte, isNull, lte, notInArray, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { profiles, scholarships, user_scholarships, users } from '@/lib/db/schema';
import { HomeContent } from '@/app/components/dashboard/home/HomeContent';

const UPCOMING_LIMIT = 3;
const URGENT_WINDOW_DAYS = 7;

interface UpcomingDeadline {
  id: string;
  name: string;
  deadline: string;
  amount: number | null;
  status: string;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const [userRecord] = await db
    .select({
      id: users.id,
      firstName: profiles.first_name,
      city: profiles.city,
      state: profiles.state,
      gpa: profiles.gpa,
      graduationYear: profiles.graduation_year,
      highSchool: profiles.high_school
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.user_id, users.id))
    .where(eq(users.clerk_id, userId))
    .limit(1);

  if (!userRecord) {
    redirect('/onboarding');
  }

  const userScholarships = await db
    .select({
      id: user_scholarships.id,
      status: user_scholarships.status,
      addedToCartAt: user_scholarships.added_to_cart_at,
      appliedAt: user_scholarships.applied_at,
      decisionDate: user_scholarships.decision_date,
      amountWon: user_scholarships.amount_won,
      scholarshipId: scholarships.id,
      scholarshipName: scholarships.name,
      scholarshipAmount: scholarships.amount,
      scholarshipDeadline: scholarships.deadline
    })
    .from(user_scholarships)
    .innerJoin(scholarships, eq(user_scholarships.scholarship_id, scholarships.id))
    .where(eq(user_scholarships.user_id, userRecord.id));

  const isInCart = (status: string, addedToCartAt: Date | null) =>
    Boolean(addedToCartAt) || status === 'cart' || status === 'saved';
  const isApplied = (status: string, appliedAt: Date | null) =>
    Boolean(appliedAt) || status === 'applied';
  const isWon = (status: string, amountWon: number | null) =>
    Boolean(amountWon && amountWon > 0) || status === 'won';

  const cartScholarships = userScholarships.filter((item) => isInCart(item.status, item.addedToCartAt));
  const appliedScholarships = userScholarships.filter((item) => isApplied(item.status, item.appliedAt));
  const wonScholarships = userScholarships.filter((item) => isWon(item.status, item.amountWon));

  const cartCount = cartScholarships.length;
  const appliedCount = appliedScholarships.length;
  const wonCount = wonScholarships.length;

  const totalPotential = cartScholarships.reduce(
    (total, item) => total + (item.scholarshipAmount ?? 0),
    0
  );

  const amountWon = wonScholarships.reduce((total, item) => {
    if (item.amountWon && item.amountWon > 0) return total + item.amountWon;
    return total + (item.scholarshipAmount ?? 0);
  }, 0);

  const now = new Date();
  const upcomingDeadlines = userScholarships
    .map((item) => {
      if (!item.scholarshipDeadline) return null;
      const deadline = new Date(item.scholarshipDeadline);
      if (Number.isNaN(deadline.getTime()) || deadline < now) return null;
      return {
        id: item.scholarshipId,
        name: item.scholarshipName,
        deadline: deadline.toISOString(),
        amount: item.scholarshipAmount ?? null,
        status: item.status
      } as UpcomingDeadline;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a!.deadline).getTime() - new Date(b!.deadline).getTime())
    .slice(0, UPCOMING_LIMIT) as UpcomingDeadline[];

  const gpaValue = userRecord.gpa ? userRecord.gpa.toString() : null;
  const graduationYear = userRecord.graduationYear ?? null;

  const matchConditions = [
    eq(scholarships.is_active, true),
    gpaValue
      ? and(
          or(isNull(scholarships.min_gpa), lte(scholarships.min_gpa, gpaValue)),
          or(isNull(scholarships.max_gpa), gte(scholarships.max_gpa, gpaValue))
        )
      : undefined,
    graduationYear
      ? and(
          or(isNull(scholarships.min_graduation_year), lte(scholarships.min_graduation_year, graduationYear)),
          or(isNull(scholarships.max_graduation_year), gte(scholarships.max_graduation_year, graduationYear))
        )
      : undefined
  ];

  const locationFilters = [
    userRecord.state ? arrayOverlaps(scholarships.states, [userRecord.state]) : undefined,
    userRecord.city ? arrayOverlaps(scholarships.cities, [userRecord.city]) : undefined,
    userRecord.highSchool ? arrayOverlaps(scholarships.high_schools, [userRecord.highSchool]) : undefined
  ].filter(Boolean);

  if (locationFilters.length) {
    matchConditions.push(or(eq(scholarships.is_national, true), ...(locationFilters as Parameters<typeof or>)));
  }

  const matchedQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(scholarships)
    .where(
      and(
        ...matchConditions,
        notInArray(
          scholarships.id,
          db
            .select({ id: user_scholarships.scholarship_id })
            .from(user_scholarships)
            .where(eq(user_scholarships.user_id, userRecord.id))
        )
      )
    );

  const [{ count: matchedCount } = { count: 0 }] = await matchedQuery;
  const newMatchesCount = Number(matchedCount ?? 0);

  const urgentDeadline = upcomingDeadlines.find((deadline) => {
    const diff = new Date(deadline.deadline).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= URGENT_WINDOW_DAYS;
  });

  return (
    <HomeContent
      firstName={userRecord.firstName}
      city={userRecord.city}
      state={userRecord.state}
      gpa={gpaValue}
      cartCount={cartCount}
      appliedCount={appliedCount}
      wonCount={wonCount}
      totalPotential={totalPotential}
      amountWon={amountWon}
      upcomingDeadlines={upcomingDeadlines}
      newMatchesCount={newMatchesCount}
      urgentDeadline={urgentDeadline ?? null}
    />
  );
}
