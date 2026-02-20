import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;

    const { error } = await supabase.from('users').insert({
      clerk_id: id,
      email: email_addresses[0]?.email_address || '',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating user in Supabase:', error);
      return new Response('Error: Failed to create user', { status: 500 });
    }

    console.log(`✅ User created: ${id}`);
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses } = evt.data;

    const { error } = await supabase
      .from('users')
      .update({
        email: email_addresses[0]?.email_address || '',
        last_login_at: new Date().toISOString(),
      })
      .eq('clerk_id', id);

    if (error) {
      console.error('Error updating user in Supabase:', error);
    }

    console.log(`✅ User updated: ${id}`);
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', id);

    if (error) {
      console.error('Error deleting user in Supabase:', error);
    }

    console.log(`✅ User deleted: ${id}`);
  }

  return new Response('Webhook processed', { status: 200 });
}