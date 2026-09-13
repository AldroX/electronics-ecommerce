/// ============================================================
/// POST /api/analytics/conversion - Track conversions (HMAC verified)
/// Triggers margin calculation; Task 3.9
/// ============================================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { Errors, ErrorCode } from '@/lib/api/error-codes';
import { mantenedorMargen } from '@/lib/data/margin-maintenance';

const ConversionSchema = z.object({
  product_slug: z.string().min(1),
  estimated_value: z.number().positive(),
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

    const result = ConversionSchema.safeParse(payload);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Datos de conversión inválidos',
            issues: result.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { product_slug, estimated_value, session_id } = result.data;

    // Get product info to determine category and estimate margin
    const { data: product, error: productError } = await (supabase as any)
      .from('products')
      .select('*, categories(*)')
      .eq('slug', product_slug)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'Producto no encontrado' },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert conversion record
    const insertData = {
      product_slug,
      estimated_value,
      session_id: session_id ?? null,
    };

    const { error: insertError } = await supabase.from('conversions').insert(insertData as any);

    if (insertError) {
      console.error('Supabase error inserting conversion:', insertError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al registrar conversión'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Trigger margin calculation/update
    try {
      await mantenedorMargen((product as any).id, estimated_value);
    } catch (marginError) {
      console.error('Margin calculation warning:', marginError);
      // Continue even if margin calc fails - conversion is logged
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Analytics conversion error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
