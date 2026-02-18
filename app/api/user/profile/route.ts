import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { PreferencesData } from '@/lib/onboarding/types';

interface ProfilePayload {
  personal?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state: string;
    zip?: string;
  };
  academic?: {
    highSchool: string;
    graduationYear: number;
    gpa?: string;
    weightedGpa?: string;
    sat?: string;
    act?: string;
    classRank?: string;
  };
  activities?: Array<{
    title: string;
    position?: string;
    description?: string;
    hoursPerWeek?: number;
    weeksPerYear?: number;
    grades?: number[];
  }>;
  essays?: Array<{
    topic: string;
    text: string;
    wordCount?: number;
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
    const user = await clerkClient.users.getUser(userId);
    email = user.emailAddresses?.[0]?.emailAddress ?? '';
  }

  try {
    await supabase
      .from('users')
      .upsert(
        {
          clerk_id: userId,
          email,
          onboarding_completed: body.markOnboardingComplete ?? false,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'clerk_id' }
      );

    if (body.personal || body.academic || body.preferences) {
      await supabase
        .from('profiles')
        .upsert(
          {
            clerk_id: userId,
            first_name: body.personal?.firstName,
            last_name: body.personal?.lastName,
            email: body.personal?.email ?? email,
            phone: body.personal?.phone,
            address: body.personal?.address,
            city: body.personal?.city,
            state: body.personal?.state,
            zip: body.personal?.zip,
            high_school: body.academic?.highSchool,
            graduation_year: body.academic?.graduationYear,
            gpa: body.academic?.gpa,
            weighted_gpa: body.academic?.weightedGpa,
            sat: body.academic?.sat,
            act: body.academic?.act,
            class_rank: body.academic?.classRank,
            first_gen: body.preferences?.firstGen,
            income_range: body.preferences?.incomeRange,
            ethnicity: body.preferences?.ethnicity,
            gender: body.preferences?.gender,
            gender_other: body.preferences?.genderOther,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'clerk_id' }
        );
    }

    if (Array.isArray(body.activities)) {
      await supabase.from('activities').delete().eq('clerk_id', userId);
      if (body.activities.length) {
        await supabase.from('activities').insert(
          body.activities.map((activity) => ({
            clerk_id: userId,
            title: activity.title,
            position: activity.position,
            description: activity.description,
            hours_per_week: activity.hoursPerWeek,
            weeks_per_year: activity.weeksPerYear,
            grades: activity.grades
          }))
        );
      }
    }

    if (Array.isArray(body.essays)) {
      await supabase.from('essays').delete().eq('clerk_id', userId);
      if (body.essays.length) {
        await supabase.from('essays').insert(
          body.essays.map((essay) => ({
            clerk_id: userId,
            topic: essay.topic,
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
        .eq('clerk_id', userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
