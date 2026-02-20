import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

export const makeSupabaseJwt = (clerkUserId: string): string => {
  if (!supabaseJwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET is not set');
  }

  return jwt.sign(
    {
      sub: clerkUserId,
      role: 'authenticated',
      aud: 'authenticated'
    },
    supabaseJwtSecret,
    { expiresIn: '15m' }
  );
};

export const createSupabaseServerClient = (clerkUserId: string): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const token = makeSupabaseJwt(clerkUserId);

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};
