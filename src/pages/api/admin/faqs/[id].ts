/// ============================================================
/// PATCH /api/admin/faqs/[id] - Update FAQ (admin only)
/// DELETE /api/admin/faqs/[id] - Delete FAQ (admin only)
/// Task 3.6
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { FAQUpdateSchema } from '@/lib/api/validation';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

function getServiceClient(): any {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

type FAQUpdate = Database['public']['Tables']['faqs']['Update'];
type FAQRow = Database['public']['Tables']['faqs']['Row'];

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

    const bodyResult = FAQUpdateSchema.safeParse(await context.request.json());
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
      .from('faqs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('FAQ no encontrada') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateData: Partial<FAQUpdate> = {};
    const allowedFields = ['question', 'answer'] as const;

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        updateData[field as keyof FAQUpdate] = body[field];
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

    const updateResult = await (supabase.from('faqs').update(updateData) as any)
      .eq('id', id)
      .select()
      .single();

    if (updateResult.error) {
      console.error('Supabase error updating FAQ:', updateResult.error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al actualizar FAQ') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = updateResult.data as FAQRow;

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'update',
      entity_type: 'faq',
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
    console.error('Admin update FAQ error:', err);
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
      .from('faqs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('FAQ no encontrada') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'delete',
      entity_type: 'faq',
      entity_id: id,
      old_data: existing as any,
      new_data: Object.assign({}, existing, { deleted: true }) as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    }) as any);

    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) {
      console.error('Supabase error deleting FAQ:', error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al eliminar FAQ') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Admin delete FAQ error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
