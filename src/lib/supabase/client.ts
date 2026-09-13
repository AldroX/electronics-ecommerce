import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Browser client for client-side operations (Realtime, auth, etc.)
// Uses import.meta.env for Astro/Vite environment variables
// Lazy initialization to handle build-time when env vars may not be available
let _supabase: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (!_supabase) {
    const url = import.meta.env.PUBLIC_SUPABASE_URL;
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const siteUrl = import.meta.env.SITE_URL;
    const disableEmailConfirm = import.meta.env.DISABLE_EMAIL_CONFIRMATION_FOR_DEV === 'true';

    if (!url || !key) {
      // Return a mock client for build-time/prerendering
      // This allows static generation to proceed without real credentials
      return createClient<Database>('http://localhost:54321', 'mock-key');
    }

    _supabase = createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        // Magic link settings
        flowType: 'pkce',
        // Disable email confirmations in dev environment
        // (magic links will be used instead for sign-in/sign-up)
        ...(disableEmailConfirm ? { disableSignUp: true, autoConfirmEmail: true } : {}),
      },
      // Magic link redirect URL
      ...(siteUrl ? { siteUrl } : {}),
    });
  }
  return _supabase;
}

// Export a proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient<Database>];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default supabase;

// Server-side factory for API routes (uses service role key for admin operations)
export function createServiceSupabaseClient(): SupabaseClient<Database> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = import.meta.env.SITE_URL;

  if (!url || !key) {
    return createClient<Database>('http://localhost:54321', 'mock-key');
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...(siteUrl ? { siteUrl } : {}),
  });
}
