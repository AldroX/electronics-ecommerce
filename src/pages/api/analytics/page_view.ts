/// ============================================================
/// POST /api/analytics/page_view - Track page views (HMAC verified)
/// Task 3.7
/// ============================================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

const PageViewSchema = z.object({
  path: z.string().min(1),
  referrer: z.string().url().nullable().optional(),
  session_id: z.string().uuid().optional(),
});

// HMAC verification helper (async, runs inside handler)
async function verifyHMAC(
  request: Request,
  secret: string
): Promise<{ valid: boolean; payload: any }> {
  const body = await request.json();
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature') || '';
  const timestamp = request.headers.get('x-timestamp') || request.headers.get('X-Timestamp') || '';

  if (!signature) {
    return { valid: false, payload: body };
  }

  // Reconstruct the message: timestamp + body
  const message = timestamp + JSON.stringify(body);

  // Compute HMAC-SHA256
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  const expectedSignature = hmac.digest('hex');

  const valid = hmac.equals(Buffer.from(expectedSignature, 'hex'), Buffer.from(signature, 'hex'));

  return { valid, payload: body };
}

export const POST: APIRoute = async (context) => {
  try {
    // HMAC verification using service role secret
    const supabase = createClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { valid, payload } = await verifyHMAC(
      context.request,
      import.meta.env.ANALYTICS_HMAC_SECRET || ''
    );

    if (!valid) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'Firma HMAC inválida' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = PageViewSchema.safeParse(payload);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Datos de página inválidos',
            issues: result.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { path, referrer, session_id } = result.data;

    const insertData = {
      path,
      referrer: referrer ?? null,
      session_id: session_id ?? null,
    };

    const { error } = await supabase.from('page_views').insert(insertData as any);

    if (error) {
      console.error('Supabase error inserting page_view:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al registrar vista de página'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Analytics page_view error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
