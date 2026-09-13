/// ============================================================
/// POST /api/admin/products - Create product (admin only)
/// Task 3.3
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { ProductCreateSchema } from '@/lib/api/validation';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

function getServiceClient(): any {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductRow = Database['public']['Tables']['products']['Row'];

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

    const bodyResult = ProductCreateSchema.safeParse(await context.request.json());
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

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('products')
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

    // Check if category exists
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

    // Verify related products exist
    if (body.related_product_ids.length > 0) {
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

    // Prepare insert data
    const insertData: ProductInsert = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      short_description: body.short_description,
      price: body.price,
      compare_at_price: body.compare_at_price ?? null,
      currency: body.currency,
      category_id: body.category_id,
      images: body.images,
      specs: body.specs,
      features: body.features,
      availability: body.availability,
      featured: body.featured,
      best_seller: body.best_seller,
      kit_only: body.kit_only,
      whatsapp_message: body.whatsapp_message,
      tags: body.tags,
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      seo_image: body.seo_image ?? null,
      seo_canonical: body.seo_canonical ?? null,
      related_product_ids: body.related_product_ids,
      battery_wh: body.battery_wh ?? null,
    };

    // Insert - cast to any to bypass type inference issues
    const insertResult = await (supabase.from('products').insert(insertData) as any)
      .select()
      .single();

    if (insertResult.error) {
      console.error('Supabase error creating product:', insertResult.error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al crear producto'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = insertResult.data as ProductRow;

    // Log audit
    await (supabase.from('audit_log').insert({
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'create',
      entity_type: 'product',
      entity_id: data.id,
      new_data: data as any,
      ip_address: context.request.headers.get('x-forwarded-for') ?? null,
      user_agent: context.request.headers.get('user-agent') ?? null,
    }) as any);

    return new Response(
      JSON.stringify({
        ok: true,
        data,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Admin create product error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
