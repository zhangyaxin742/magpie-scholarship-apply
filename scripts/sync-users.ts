import { config } from 'dotenv';
import { resolve } from 'path';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncAllUsers() {
  console.log('🔄 Starting user sync from Clerk to Supabase...');

  try {
    // Fetch all users from Clerk (paginated)
    let allUsers: any[] = [];
    let hasMore = true;
    let offset = 0;
    const limit = 100;

    while (hasMore) {
      const response = await clerkClient.users.getUserList({
        limit,
        offset,
      });

      allUsers = allUsers.concat(response);
      hasMore = response.length === limit;
      offset += limit;

      console.log(`Fetched ${allUsers.length} users from Clerk...`);
    }

    console.log(`📊 Total users in Clerk: ${allUsers.length}`);

    // Prepare data for Supabase
    const usersData = allUsers.map((user) => ({
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      onboarding_completed: false,
      created_at: new Date(user.createdAt).toISOString(),
      last_login_at: user.lastSignInAt 
        ? new Date(user.lastSignInAt).toISOString() 
        : null,
    }));

    // Upsert to Supabase (insert or update if exists)
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(usersData, { 
        onConflict: 'clerk_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Error syncing to Supabase:', error);
      throw error;
    }

    console.log(`✅ Successfully synced ${allUsers.length} users to Supabase`);

    // Verify sync
    const { count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total users in Supabase: ${count}`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncAllUsers();