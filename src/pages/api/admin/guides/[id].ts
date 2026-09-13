/// ============================================================
/// PATCH /api/admin/guides/[id] - Update guide (admin only)
/// DELETE /api/admin/guides/[id] - Delete guide (admin only)
/// Task 3.6
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { GuideUpdateSchema } from '@/lib/api/validation';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

function getServiceClient(): any {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

type GuideUpdate = Database['public']['Tables']['guides']['Update'];
type GuideRow = Database['public']['Tables']['guides']['Row'];

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

    const bodyResult = GuideUpdateSchema.safeParse(await context.request.json());
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
      .from('guides')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('Guía no encontrada') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.product_ids && body.product_ids.length > 0) {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id')
        .in('id', body.product_ids);

      if (prodError || !products || products.length !== body.product_ids.length) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: { code: ErrorCode.VALIDATION_ERROR, message: 'Uno o más productos no existen' },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const updateData: Partial<GuideUpdate> = {};
    const allowedFields = [
      'title',
      'description',
      'image',
      'content',
      'product_ids',
      'read_time',
      'seo_title',
      'seo_description',
      'seo_image',
      'seo_canonical',
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

    const updateResult = await (supabase.from('guides').update(updateData) as any)
      .eq('id', id)
      .select()
      .single();

    if (updateResult.error) {
      console.error('Supabase error updating guide:', updateResult.error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al actualizar guía') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = updateResult.data as GuideRow;

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'update',
      entity_type: 'guide',
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
    console.error('Admin update guide error:', err);
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
      .from('guides')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('Guía no encontrada') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'delete',
      entity_type: 'guide',
      entity_id: id,
      old_data: existing as any,
      new_data: Object.assign({}, existing, { deleted: true }) as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    }) as any);

    const { error } = await supabase.from('guides').delete().eq('id', id);
    if (error) {
      console.error('Supabase error deleting guide:', error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al eliminar guía') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Admin delete guide error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
