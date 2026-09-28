/// ============================================================
/// POST /api/admin/products - Create product (admin only)
/// Task 3.3
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { ProductCreateSchema, ProductAdminListQuerySchema } from '@/lib/api/validation';
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

/// ============================================================
/// GET /api/admin/products - List products (admin only)
/// Task T01
/// ============================================================

export const GET: APIRoute = async (context) => {
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

    const url = new URL(context.request.url);
    const queryResult = ProductAdminListQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!queryResult.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Error de validación en query parameters',
            issues: queryResult.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { page, limit, search, category, availability, sort, showArchived } = queryResult.data;
    const supabase = getServiceClient();

    // Build base query
    let query = supabase.from('products').select(
      `
        id,
        name,
        slug,
        price,
        currency,
        availability,
        featured,
        best_seller,
        images,
        created_at,
        updated_at,
        deleted_at,
        categories!inner (
          name
        )
      `,
      { count: 'exact' }
    );

    // Filter out archived (soft-deleted) products unless showArchived is true
    if (!showArchived) {
      query = query.is('deleted_at', null);
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    // Category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Availability filter
    if (availability) {
      query = query.eq('availability', availability);
    }

    // Sorting
    const [sortField, sortOrder] = sort.split('-');
    const fieldMap: Record<string, string> = {
      name: 'name',
      price: 'price',
      created: 'created_at',
      updated: 'updated_at',
    };
    const dbField = fieldMap[sortField] || 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(dbField, { ascending });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Supabase error fetching products:', error);
      return new Response(
        JSON.stringify({ ok: false, error: Errors.internalError('Error al obtener productos') }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Transform to admin list item shape
    const productItems = (products ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryName: p.categories?.name ?? 'Sin categoría',
      price: p.price,
      currency: p.currency,
      availability: p.availability,
      featured: p.featured,
      bestSeller: p.best_seller,
      thumbnail: p.images?.[0] ?? null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      deletedAt: p.deleted_at,
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          products: productItems,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Admin list products error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: Errors.internalError('Error interno del servidor') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
