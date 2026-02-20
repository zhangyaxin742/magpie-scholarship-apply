import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const settingsSchema = z.object({
  emailPreferences: z.object({
    deadlineReminders: z.boolean(),
    newMatches: z.boolean(),
    weeklyDigest: z.boolean()
  })
});

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient(userId);
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }

  if (!userRow) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      email_preferences: parsed.data.emailPreferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', userRow.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
