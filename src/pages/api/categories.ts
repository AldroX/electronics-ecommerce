/// ============================================================
/// GET /api/categories - Listado de categorías con conteo de productos
/// Zod output
/// Task 2.3
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { ErrorCode, Errors } from '@/lib/api/error-codes';
import {
  CategoryQuerySchema,
  CategoryListResponseSchema,
  CategoryListItemSchema,
} from '@/lib/api/validation';
import type { CategoryRow, ProductRow } from '@/lib/supabase/table-types';

export const GET: APIRoute = async (context) => {
  try {
    // Parsear y validar query params
    const url = new URL(context.request.url);
    const searchParams = url.searchParams;
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = String(value);
    }

    const query = CategoryQuerySchema.safeParse(raw);
    if (!query.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Error de validación',
            issues: query.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const page = query.data.page;
    const perPage = query.data.perPage || 12;

    // Construir query para Supabase
    let querySupabase = supabase.from('categories').select('*', { count: 'exact' });

    // Filtrar por búsqueda
    if (query.data.search) {
      querySupabase = querySupabase.ilike('name', `%${query.data.search}%`);
    }

    // Paginar: offset = (page - 1) * perPage
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    querySupabase = querySupabase.range(from, to);

    const { data, error, count } = await querySupabase;

    if (error) {
      console.error('Supabase error fetching categories:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar categorías'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const categories = (data || []) as CategoryRow[];

    // Obtener conteo de productos por categoría
    const categoryIds = categories.map((c) => c.id);
    let productCounts: Record<string, number> = {};

    if (categoryIds.length > 0) {
      const { data: productCountsData } = await supabase
        .from('products')
        .select('category_id', { count: 'exact' })
        .in('category_id', categoryIds);

      // Count products per category
      if (productCountsData) {
        for (const p of productCountsData as any[]) {
          productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
        }
      }
    }

    const categoriesData = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      productCount: productCounts[c.id] || 0,
      seo: {
        title: c.seo_title || undefined,
        description: c.seo_description || undefined,
        image: c.seo_image || undefined,
        canonical: c.seo_canonical || undefined,
      },
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);
    const currentPage = page;

    const response = {
      data: categoriesData,
      totalPages,
      currentPage,
      totalCount,
    };

    // Validar respuesta con Zod
    const result = CategoryListResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Category list response validation failed:', result.error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al formatear respuesta'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: result.data,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('API categories error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
