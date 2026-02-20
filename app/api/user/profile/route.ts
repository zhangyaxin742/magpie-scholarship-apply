import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { activities, essays, profiles, users } from '@/lib/db/schema';
import { truncateAtWord } from '@/lib/utils/text';
import type { PreferencesData } from '@/lib/onboarding/types';

const extractPgErrorDetails = (error: unknown) => {
  const candidate = (error && typeof error === 'object' ? error : null) as
    | Record<string, unknown>
    | null;
  const maybePgError =
    candidate?.cause && typeof candidate.cause === 'object'
      ? (candidate.cause as Record<string, unknown>)
      : candidate;

  if (!maybePgError) return null;

  const keys = [
    'code',
    'detail',
    'hint',
    'constraint',
    'table',
    'column',
    'schema',
    'severity',
    'where',
    'position',
    'message',
    'routine'
  ];

  const details: Record<string, unknown> = {};
  for (const key of keys) {
    if (maybePgError[key] !== undefined) {
      details[key] = maybePgError[key];
    }
  }

  if (maybePgError.query !== undefined) details.query = maybePgError.query;
  if (maybePgError.statement !== undefined) details.statement = maybePgError.statement;
  if (maybePgError.parameters !== undefined) details.parameters = maybePgError.parameters;

  return Object.keys(details).length ? details : null;
};

const logDbError = (error: unknown, step: string, userId?: string | null) => {
  const details = extractPgErrorDetails(error);
  console.error('Profile save error:', {
    step,
    userId,
    details,
    error
  });
};

interface ProfilePayload {
  personal?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    streetAddress: string;
    city: string;
    state: string;
    zip?: string;
  };
  academic?: {
    highSchool: string;
    graduationYear: number;
    gpa?: string;
    weightedGpa?: string;
    satScore?: string;
    actScore?: string;
    classRank?: string;
  };
  activities?: Array<{
    title: string;
    position?: string;
    descriptionShort?: string;
    descriptionMedium?: string;
    descriptionLong?: string;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    grades?: number[];
  }>;
  essays?: Array<{
    topic: string;
    text: string;
    wordCount?: number;
    title?: string;
    tags?: string[];
  }>;
  preferences?: PreferencesData;
  markOnboardingComplete?: boolean;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as ProfilePayload;
  let email = body.personal?.email;
  if (!email) {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  }

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const toNumber = (value?: string | number | null) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'number') return Number.isNaN(value) ? null : value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const toDecimalString = (value?: string | number | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value.toString();
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed.toString();
};

  const normalizeText = (value?: string | null) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  try {
    let dbStep = 'start';
    await db.transaction(async (tx) => {
      dbStep = 'users_upsert';
      const [userRow] = await tx
        .insert(users)
        .values({
          clerk_id: userId,
          email,
          phone: body.personal ? normalizeText(body.personal.phone) ?? undefined : undefined,
          onboarding_completed: body.markOnboardingComplete ?? false
        })
        .onConflictDoUpdate({
          target: users.clerk_id,
          set: {
            email,
            ...(body.personal ? { phone: normalizeText(body.personal.phone) } : {}),
            ...(body.markOnboardingComplete ? { onboarding_completed: true } : {})
          }
        })
        .returning({ id: users.id });

      const dbUserId = userRow?.id;
      if (!dbUserId) {
        throw new Error('User not found after upsert');
      }

      const profileValues: typeof profiles.$inferInsert = { user_id: dbUserId };
      const profileSet: Partial<typeof profiles.$inferInsert> = {};

      const assign = <Key extends keyof typeof profiles.$inferInsert>(
        key: Key,
        value: typeof profiles.$inferInsert[Key] | undefined
      ) => {
        if (value === undefined) return;
        profileValues[key] = value;
        profileSet[key] = value;
      };

      if (body.personal) {
        assign('first_name', normalizeText(body.personal.firstName));
        assign('last_name', normalizeText(body.personal.lastName));
        assign('email', normalizeText(body.personal.email ?? email));
        assign('phone', normalizeText(body.personal.phone));
        assign('street_address', normalizeText(body.personal.streetAddress));
        assign('city', normalizeText(body.personal.city));
        assign('state', normalizeText(body.personal.state));
        assign('zip', normalizeText(body.personal.zip));
      }

      if (body.academic) {
        assign('high_school', normalizeText(body.academic.highSchool));
        assign('graduation_year', body.academic.graduationYear ?? null);
assign('gpa', toDecimalString(body.academic.gpa));
assign('weighted_gpa', toDecimalString(body.academic.weightedGpa));
        assign('sat_score', toNumber(body.academic.satScore));
        assign('act_score', toNumber(body.academic.actScore));
        assign('class_rank', normalizeText(body.academic.classRank));
      }


      if (body.preferences) {
        assign('first_generation', body.preferences.firstGen ?? undefined);
        assign('agi_range', body.preferences.incomeRange ?? undefined);
        assign('ethnicity', body.preferences.ethnicity ?? undefined);
        const genderValue =
          body.preferences.gender === 'other'
            ? normalizeText(body.preferences.genderSelfDescribe) ?? 'other'
            : body.preferences.gender;
        assign('gender', genderValue ?? undefined);
      }

      if (Object.keys(profileSet).length > 0) {
        dbStep = 'profiles_upsert';
        await tx
          .insert(profiles)
          .values(profileValues)
          .onConflictDoUpdate({ target: profiles.user_id, set: profileSet });
      }

      if (Array.isArray(body.activities)) {
        dbStep = 'activities_delete';
        await tx.delete(activities).where(eq(activities.user_id, dbUserId));
        const normalizedActivities = body.activities
          .map((activity) => {
            const title = normalizeText(activity.title);
            if (!title) return null;
            const longSource =
              normalizeText(activity.descriptionLong) ??
              normalizeText(activity.descriptionMedium) ??
              normalizeText(activity.descriptionShort);
            const descriptionLong = longSource ? truncateAtWord(longSource, 500) : null;
            const descriptionMedium = descriptionLong ? truncateAtWord(descriptionLong, 150) : null;
            const descriptionShort = descriptionLong ? truncateAtWord(descriptionLong, 50) : null;
            const grades = (activity.grades ?? []).filter((grade) => grade >= 9 && grade <= 12);

            return {
              user_id: dbUserId,
              title,
              position: normalizeText(activity.position),
              description_long: descriptionLong,
              description_medium: descriptionMedium,
              description_short: descriptionShort,
              hours_per_week: activity.hoursPerWeek ?? null,
              weeks_per_year: activity.weeksPerYear ?? null,
              grades: grades.length ? grades : null
            };
          })
          .filter(Boolean) as Array<typeof activities.$inferInsert>;

        if (normalizedActivities.length) {
          dbStep = 'activities_insert';
          await tx.insert(activities).values(normalizedActivities);
        }
      }

      if (Array.isArray(body.essays)) {
        dbStep = 'essays_delete';
        await tx.delete(essays).where(eq(essays.user_id, dbUserId));
        const normalizedEssays = body.essays
          .map((essay) => {
            const text = normalizeText(essay.text);
            if (!text) return null;
            return {
              user_id: dbUserId,
              topic: essay.topic,
              title: normalizeText(essay.title),
              tags: essay.tags?.length ? essay.tags : null,
              text,
              word_count: essay.wordCount ?? text.trim().split(/\s+/).length
            };
          })
          .filter(Boolean) as Array<typeof essays.$inferInsert>;

        if (normalizedEssays.length) {
          dbStep = 'essays_insert';
          await tx.insert(essays).values(normalizedEssays);
        }
      }

      if (body.markOnboardingComplete) {
        dbStep = 'users_onboarding_update';
        await tx.update(users).set({ onboarding_completed: true }).where(eq(users.id, dbUserId));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logDbError(error, 'transaction_failed', userId);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
