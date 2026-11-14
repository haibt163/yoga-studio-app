import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cleanEnv, getSupabaseConfig } from '@/lib/env';

// Server-only module. Do not import it from a Client Component.
export function createServerSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const key = serviceRoleKey ?? config.anonKey;

  return createClient(config.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
