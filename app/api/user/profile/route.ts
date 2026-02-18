import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { PreferencesData } from '@/lib/onboarding/types';

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
  const supabase = getSupabaseAdmin();

  let email = body.personal?.email;

  if (!email) {
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  }

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const toNumber = (value?: string) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const normalizeText = (value?: string) => {
    if (value === undefined) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  try {
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          clerk_id: userId,
          email,
          phone: normalizeText(body.personal?.phone),
          onboarding_completed: body.markOnboardingComplete ?? false,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'clerk_id' }
      )
      .select('id')
      .single();

    if (userError) {
      throw userError;
    }

    const supabaseUserId = userRow?.id;

    if (!supabaseUserId) {
      throw new Error('User not found after upsert');
    }

    const profileUpdate: Record<string, unknown> = {
      user_id: supabaseUserId,
      updated_at: new Date().toISOString()
    };

    if (body.personal) {
      profileUpdate.first_name = normalizeText(body.personal.firstName);
      profileUpdate.last_name = normalizeText(body.personal.lastName);
      profileUpdate.email = normalizeText(body.personal.email ?? email);
      profileUpdate.phone = normalizeText(body.personal.phone);
      profileUpdate.street_address = normalizeText(body.personal.streetAddress);
      profileUpdate.city = normalizeText(body.personal.city);
      profileUpdate.state = normalizeText(body.personal.state);
      profileUpdate.zip = normalizeText(body.personal.zip);
    }

    if (body.academic) {
      profileUpdate.high_school = normalizeText(body.academic.highSchool);
      profileUpdate.graduation_year = body.academic.graduationYear ?? null;
      profileUpdate.gpa = toNumber(body.academic.gpa);
      profileUpdate.weighted_gpa = toNumber(body.academic.weightedGpa);
      profileUpdate.sat_score = toNumber(body.academic.satScore);
      profileUpdate.act_score = toNumber(body.academic.actScore);
      profileUpdate.class_rank = normalizeText(body.academic.classRank);
    }

    if (body.preferences) {
      profileUpdate.first_generation = body.preferences.firstGen ?? null;
      profileUpdate.agi_range = body.preferences.incomeRange ?? null;
      profileUpdate.ethnicity = body.preferences.ethnicity ?? null;
      profileUpdate.gender = body.preferences.gender ?? null;
    }

    if (Object.keys(profileUpdate).length > 2) {
      await supabase
        .from('profiles')
        .upsert(
          profileUpdate,
          { onConflict: 'user_id' }
        );
    }

    if (Array.isArray(body.activities)) {
      await supabase.from('activities').delete().eq('user_id', supabaseUserId);
      if (body.activities.length) {
        await supabase.from('activities').insert(
          body.activities.map((activity) => {
            const descriptionLong = normalizeText(activity.descriptionLong);
            return {
              user_id: supabaseUserId,
              title: activity.title,
              position: normalizeText(activity.position),
              description_long: descriptionLong ? descriptionLong.slice(0, 500) : null,
              description_medium: descriptionLong ? descriptionLong.slice(0, 150) : null,
              description_short: descriptionLong ? descriptionLong.slice(0, 50) : null,
              hours_per_week: activity.hoursPerWeek ?? null,
              weeks_per_year: activity.weeksPerYear ?? null,
              grades: activity.grades ?? null
            };
          })
        );
      }
    }

    if (Array.isArray(body.essays)) {
      await supabase.from('essays').delete().eq('user_id', supabaseUserId);
      if (body.essays.length) {
        await supabase.from('essays').insert(
          body.essays.map((essay) => ({
            user_id: supabaseUserId,
            topic: essay.topic,
            title: normalizeText(essay.title),
            tags: essay.tags ?? null,
            text: essay.text,
            word_count: essay.wordCount ?? essay.text.trim().split(/\s+/).length
          }))
        );
      }
    }

    if (body.markOnboardingComplete) {
      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', supabaseUserId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
