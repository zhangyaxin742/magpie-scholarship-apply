import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Verify cron secret (security)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    let allUsers: Awaited<ReturnType<typeof clerkClient.users.getUserList>> = [];
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      const users = await clerkClient.users.getUserList({
        limit: 100,
        offset,
      });

      allUsers = allUsers.concat(users);
      hasMore = users.length === 100;
      offset += 100;
    }

    const usersData = allUsers.map((user) => ({
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      onboarding_completed: false,
      created_at: new Date(user.createdAt).toISOString(),
      last_login_at: user.lastSignInAt
        ? new Date(user.lastSignInAt).toISOString()
        : null,
    }));

    const { error } = await supabaseAdmin
      .from('users')
      .upsert(usersData, { onConflict: 'clerk_id' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      synced: allUsers.length,
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}