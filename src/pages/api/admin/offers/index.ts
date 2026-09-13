/// ============================================================
/// POST /api/admin/offers - Create offer (admin only)
/// Task 3.6
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { OfferCreateSchema } from '@/lib/api/validation';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

function getServiceClient(): any {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

type OfferInsert = Database['public']['Tables']['offers']['Insert'];
type OfferRow = Database['public']['Tables']['offers']['Row'];

export const POST: APIRoute = async (context) => {
  try {
    const adminUser = await verifyAdminSession(context.request);
    if (!adminUser) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Admin authentication required' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bodyResult = OfferCreateSchema.safeParse(await context.request.json());
    if (!bodyResult.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Error de validación en body',
            issues: bodyResult.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = bodyResult.data;
    const supabase = getServiceClient();

    const { data: existing } = await supabase
      .from('offers')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'El slug ya existe' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: product } = await supabase
      .from('products')
      .select('id, slug')
      .eq('slug', body.product_slug)
      .single();

    if (!product) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'Producto asociado no encontrado' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.discount_percent > 100) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'El descuento no puede ser mayor al 100%',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.current_price > body.original_price) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'El precio actual no puede ser mayor al original',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const insertData: OfferInsert = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      image: body.image,
      original_price: body.original_price,
      current_price: body.current_price,
      discount_percent: body.discount_percent,
      availability: body.availability,
      valid_until: body.valid_until,
      currency: body.currency,
      whatsapp_message: body.whatsapp_message,
      product_slug: body.product_slug,
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      seo_image: body.seo_image ?? null,
    };

    const insertResult = await (supabase.from('offers').insert(insertData) as any)
      .select()
      .single();

    if (insertResult.error) {
      console.error('Supabase error creating offer:', insertResult.error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al crear oferta') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = insertResult.data as OfferRow;

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'create',
      entity_type: 'offer',
      entity_id: data.id,
      new_data: data as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    }) as any);

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin create offer error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
