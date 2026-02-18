// scripts/check-sync.ts
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSync() {
  const clerkUsers = await clerkClient.users.getUserList({ limit: 500 });
  const { count: supabaseCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true });

  console.log(`Clerk users: ${clerkUsers.length}`);
  console.log(`Supabase users: ${supabaseCount}`);
  console.log(`Difference: ${clerkUsers.length - (supabaseCount || 0)}`);
}

checkSync();