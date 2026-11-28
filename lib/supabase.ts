import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://placeholder.supabase.co';

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-anon-key';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  'placeholder-service-key';

let cachedPublicClient: SupabaseClient | null = null;

// Client for public / client-side queries
export function getPublicSupabase(): SupabaseClient {
  if (!cachedPublicClient) {
    cachedPublicClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedPublicClient;
}

// Admin / Service client for server-side queries (Server Actions, Route Handlers, Seeds)
export function getServiceSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

