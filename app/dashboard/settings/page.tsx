import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SettingsClient } from '@/app/components/dashboard/settings/SettingsClient';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = createSupabaseServerClient(userId);
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, email, created_at, email_preferences')
    .eq('clerk_id', userId)
    .maybeSingle();

  if (userError) {
    throw new Error('Failed to load settings');
  }

  if (!userRow) {
    redirect('/onboarding');
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, first_name, last_name, email, phone, street_address, city, state, zip, high_school, graduation_year, gpa, weighted_gpa, sat_score, act_score, class_rank, gender, ethnicity, first_generation, agi_range, updated_at'
    )
    .eq('user_id', userRow.id)
    .maybeSingle();

  if (profileError) {
    throw new Error('Failed to load profile');
  }

  return (
    <SettingsClient
      user={{
        email: userRow.email,
        created_at: userRow.created_at ?? null,
        email_preferences: userRow.email_preferences ?? null
      }}
      profile={profileRow ?? null}
    />
  );
}
