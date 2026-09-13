import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import type { AstroCookies } from 'astro';

export function createServerSupabaseClient(_headers: unknown, cookies: AstroCookies) {
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookies.set(name, value, options);
          } catch {
            // The user may not have cookies enabled
          }
        },
        remove(name: string, options: any) {
          try {
            cookies.delete(name, options);
          } catch {
            // The user may not have cookies enabled
          }
        },
      },
    }
  );
}
