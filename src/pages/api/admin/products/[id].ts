/// ============================================================
/// PATCH /api/admin/products/[id] - Update product (admin only)
/// DELETE /api/admin/products/[id] - Soft delete product (admin only)
/// Task 3.4, 3.5
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { ProductUpdateSchema } from '@/lib/api/validation';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

function getServiceClient(): any {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

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

    const bodyResult = ProductUpdateSchema.safeParse(await context.request.json());
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
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('Producto no encontrado') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.category_id) {
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', body.category_id)
        .single();

      if (catError || !category) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: { code: ErrorCode.VALIDATION_ERROR, message: 'Categoría no encontrada' },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (body.related_product_ids && body.related_product_ids.length > 0) {
      const { data: related, error: relError } = await supabase
        .from('products')
        .select('id')
        .in('id', body.related_product_ids);

      if (relError || !related || related.length !== body.related_product_ids.length) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Uno o más productos relacionados no existen',
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const updateData: Record<string, any> = {};
    const allowedFields = [
      'name',
      'description',
      'short_description',
      'price',
      'compare_at_price',
      'currency',
      'category_id',
      'images',
      'specs',
      'features',
      'availability',
      'featured',
      'best_seller',
      'kit_only',
      'whatsapp_message',
      'tags',
      'seo_title',
      'seo_description',
      'seo_image',
      'seo_canonical',
      'related_product_ids',
      'battery_wh',
    ] as const;

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined) {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbField] = body[field];
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

    const { data, error } = await supabase
      .from('products')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating product:', error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al actualizar producto') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'update',
      entity_type: 'product',
      entity_id: id,
      old_data: existing as any,
      new_data: data as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    } as any);

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin update product error:', err);
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
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return new Response(
        JSON.stringify({ ok: false, error: Errors.notFound('Producto no encontrado') }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('products')
      .update({ availability: 'out-of-stock', updated_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      console.error('Supabase error soft deleting product:', error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al eliminar producto') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'soft_delete',
      entity_type: 'product',
      entity_id: id,
      old_data: existing as any,
      new_data: { ...existing, availability: 'out-of-stock' } as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    } as any);

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('Admin delete product error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
