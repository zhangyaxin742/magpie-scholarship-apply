import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient(userId);
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, clerk_id')
    .eq('clerk_id', userId)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }

  if (!userRow) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    await clerkClient.users.deleteUser(userRow.clerk_id);
  } catch {
    return NextResponse.json({ error: 'Failed to delete Clerk account' }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from('users').delete().eq('id', userRow.id);
  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
