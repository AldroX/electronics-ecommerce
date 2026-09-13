/// ============================================================
/// PATCH /api/admin/offers/[id] - Update offer (admin only)
/// DELETE /api/admin/offers/[id] - Delete offer (admin only)
/// Task 3.6
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { OfferUpdateSchema } from '@/lib/api/validation';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

function getServiceClient(): any {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

type OfferUpdate = Database['public']['Tables']['offers']['Update'];
type OfferRow = Database['public']['Tables']['offers']['Row'];

const IdParamsSchema = z.object({ id: z.string().uuid() });

export const PATCH: APIRoute = async (context) => {
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

    const paramsResult = IdParamsSchema.safeParse(context.params);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'ID inválido',
            issues: paramsResult.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bodyResult = OfferUpdateSchema.safeParse(await context.request.json());
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

    const { id } = paramsResult.data;
    const body = bodyResult.data;
    const supabase = getServiceClient();

    const { data: existing, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('Oferta no encontrada') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.product_slug) {
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
    }

    if (body.discount_percent !== undefined && body.discount_percent > 100) {
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

    const originalPrice = body.original_price ?? (existing as any).original_price;
    const currentPrice = body.current_price ?? (existing as any).current_price;
    if (currentPrice > originalPrice) {
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

    const updateData: Partial<OfferUpdate> = {};
    const allowedFields = [
      'name',
      'description',
      'image',
      'original_price',
      'current_price',
      'discount_percent',
      'availability',
      'valid_until',
      'currency',
      'whatsapp_message',
      'product_slug',
      'seo_title',
      'seo_description',
      'seo_image',
    ] as const;

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        Object.assign(updateData, { [dbField]: body[field] });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'No hay campos para actualizar' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateResult = await (supabase.from('offers').update(updateData) as any)
      .eq('id', id)
      .select()
      .single();

    if (updateResult.error) {
      console.error('Supabase error updating offer:', updateResult.error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al actualizar oferta') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = updateResult.data as OfferRow;

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'update',
      entity_type: 'offer',
      entity_id: id,
      old_data: existing as any,
      new_data: data as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    }) as any);

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin update offer error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async (context) => {
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

    const paramsResult = IdParamsSchema.safeParse(context.params);
    if (!paramsResult.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'ID inválido',
            issues: paramsResult.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = paramsResult.data;
    const supabase = getServiceClient();

    const { data: existing, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('Oferta no encontrada') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'delete',
      entity_type: 'offer',
      entity_id: id,
      old_data: existing as any,
      new_data: Object.assign({}, existing, { deleted: true }) as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    }) as any);

    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) {
      console.error('Supabase error deleting offer:', error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al eliminar oferta') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Admin delete offer error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
