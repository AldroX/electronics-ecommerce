/// ============================================================
/// POST /api/auth/signin - Magic link sign-in (PKCE flow)
/// Sends a magic link email via Supabase Auth
/// ============================================================

import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.formData();
    const email = body.get('email')?.toString().trim();
    const redirect = body.get('redirect')?.toString() || '/';

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El email es requerido',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';
    const redirectUrl = `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirect)}`;

    const supabase = createServerSupabaseClient(context.request.headers, context.cookies);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error('Sign in with OTP error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Te enviamos un email con el link de acceso. Revisa tu bandeja de entrada.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Signin endpoint error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
