/// ============================================================
/// POST /api/auth/signout - Sign out and clear session
/// ============================================================

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const supabase = createServerSupabaseClient(context.request.headers, context.cookies);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirect: '/login',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Signout endpoint error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
