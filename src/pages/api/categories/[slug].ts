/// ============================================================
/// GET /api/categories/[slug] - Detalle de categoría + productos paginados
/// Task 2.4
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { ErrorCode, Errors } from '@/lib/api/error-codes';
import { createProductListItem } from '@/lib/data/helpers/products';
import { CategorySlugSchema, CategoryDetailResponseSchema } from '@/lib/api/validation';
import type { CategoryRow, ProductRow } from '@/lib/supabase/table-types';

export const GET: APIRoute = async (context) => {
  try {
    const slug = context.params.slug;
    if (!slug) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'Slug requerido' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar slug
    const slugValidation = CategorySlugSchema.safeParse({ slug });
    if (!slugValidation.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: ErrorCode.VALIDATION_ERROR, message: 'Slug inválido' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener categoría por slug
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      console.error('Supabase error fetching category:', catError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.notFound('Categoría no encontrada'),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const typedCategory = category as CategoryRow;

    // Parsear parámetros de paginación
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '12');

    // Obtener productos de esta categoría con paginación
    const {
      data: products,
      error: prodError,
      count,
    } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('category_id', typedCategory.id)
      .order('best_seller', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (prodError) {
      console.error('Supabase error fetching products for category:', prodError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar productos'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const typedProducts = (products || []) as ProductRow[];
    const productItems = typedProducts.map((p) => createProductListItem(p as any));

    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / perPage);

    const response = {
      ok: true,
      data: {
        category: {
          id: typedCategory.id,
          name: typedCategory.name,
          slug: typedCategory.slug,
          description: typedCategory.description,
          image: typedCategory.image,
        },
        products: productItems,
        totalProducts,
        currentPage: page,
        totalPages,
      },
    };

    // Validar respuesta con Zod
    const result = CategoryDetailResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Category detail response validation failed:', result.error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al formatear respuesta'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('API category slug error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
