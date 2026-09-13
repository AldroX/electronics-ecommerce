import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  user_metadata: Record<string, unknown>;
}

/**
 * Verify if the current user is an admin from an Astro APIRoute context
 * Uses Supabase Auth session + custom user_metadata.role check
 */
export async function verifyAdminSession(request: Request): Promise<AdminUser | null> {
  // Get cookies from request headers
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    })
  );

  const supabase = createServerSupabaseClient(request.headers, {
    get: (name: string) => {
      const value = cookies[name];
      if (value === undefined) {
        return undefined;
      }

      return {
        value,
        json: () => undefined,
        number: () => Number(value),
        boolean: () => value === 'true',
      };
    },
    set: () => {},
    delete: () => {},
  } as any);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Check if user has admin role in user_metadata
  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    role: 'admin',
    user_metadata: user.user_metadata,
  };
}

/**
 * Verify if the current user is an admin (legacy signature for server components)
 */
export async function verifyAdmin(headers: Headers, cookies: any): Promise<AdminUser | null> {
  const supabase = createServerSupabaseClient(headers, cookies);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Check if user has admin role in user_metadata
  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    role: 'admin',
    user_metadata: user.user_metadata,
  };
}
