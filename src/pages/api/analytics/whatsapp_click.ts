/// ============================================================
/// POST /api/analytics/whatsapp_click - Track WhatsApp clicks (HMAC verified)
/// Task 3.8
/// ============================================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

// HMAC verification helper
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

const WhatsAppClickSchema = z.object({
  product_slug: z.string().min(1),
  source_page: z.string().min(1),
  session_id: z.string().uuid().optional(),
});

const InsertWhatsAppClickSchema = z.object({
  product_slug: z.string(),
  product_name: z.string().optional(),
  source_page: z.string(),
  session_id: z.string().uuid().nullable().optional(),
});

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

    const result = WhatsAppClickSchema.safeParse(payload);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Datos de clic inválidos',
            issues: result.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { product_slug, source_page, session_id } = result.data;

    // Try to get product name from the products table
    let product_name = '';
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name')
        .eq('slug', product_slug)
        .single();

      if (!productError && product) {
        product_name = (product as unknown as { name: string }).name;
      }
    } catch {}

    const insertData: {
      product_slug: string;
      product_name: string;
      source_page: string;
      session_id: string | null;
    } = {
      product_slug,
      product_name,
      source_page,
      session_id: session_id ?? null,
    };

    const { error } = await supabase.from('whatsapp_clicks').insert(insertData as any);

    if (error) {
      console.error('Supabase error inserting whatsapp_click:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al registrar clic en WhatsApp'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Analytics whatsapp_click error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
