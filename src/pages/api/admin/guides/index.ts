/// ============================================================
/// POST /api/admin/guides - Create guide (admin only)
/// Task 3.6
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { GuideCreateSchema } from '@/lib/api/validation';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

function getServiceClient(): any {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

type GuideInsert = Database['public']['Tables']['guides']['Insert'];
type GuideRow = Database['public']['Tables']['guides']['Row'];

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

    const bodyResult = GuideCreateSchema.safeParse(await context.request.json());
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
      .from('guides')
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

    if (body.product_ids.length > 0) {
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

    const insertData: GuideInsert = {
      title: body.title,
      slug: body.slug,
      description: body.description,
      image: body.image,
      content: body.content,
      product_ids: body.product_ids,
      read_time: body.read_time,
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      seo_image: body.seo_image ?? null,
      seo_canonical: body.seo_canonical ?? null,
    };

    const insertResult = await (supabase.from('guides').insert(insertData) as any)
      .select()
      .single();

    if (insertResult.error) {
      console.error('Supabase error creating guide:', insertResult.error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al crear guía') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = insertResult.data as GuideRow;

    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'create',
      entity_type: 'guide',
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
    console.error('Admin create guide error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
