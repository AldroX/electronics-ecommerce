/// ============================================================
/// GET /api/products - Listado de productos con paginación y filtros
/// Zod-validated input/output
/// Task 2.1
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { z } from 'zod';
import { ProductListQuerySchema, ProductListResponseSchema } from '@/lib/api/validation';
import { createProductListItem } from '@/lib/data/helpers/products';
import { ErrorCode, Errors } from '@/lib/api/error-codes';
import type { ProductRow } from '@/lib/supabase/table-types';

// Extender el esquema para incluir los campos de la tarea 2.1
const ProductListQueryExtended = ProductListQuerySchema.extend({
  sort: z.enum(['price-asc', 'price-desc', 'name-asc', 'newest', 'popular']).default('newest'),
  solution: z.string().uuid().optional(),
});

type ProductListQueryExtendedType = z.infer<typeof ProductListQueryExtended>;

// Mapear sort a order para Supabase
function mapSortToOrder(sort: string): { column: string; ascending: boolean } {
  switch (sort) {
    case 'price-asc':
      return { column: 'price', ascending: true };
    case 'price-desc':
      return { column: 'price', ascending: false };
    case 'name-asc':
      return { column: 'name', ascending: true };
    case 'newest':
      return { column: 'created_at', ascending: false };
    case 'popular':
      return { column: 'best_seller', ascending: false };
    default:
      return { column: 'created_at', ascending: false };
  }
}

export const GET: APIRoute = async (context) => {
  try {
    // Parsear y validar query params
    const url = new URL(context.request.url);
    const searchParams = url.searchParams;
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = String(value);
    }

    const query = ProductListQueryExtended.safeParse(raw);
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

    const parsed: ProductListQueryExtendedType = query.data;
    const page = parsed.page;
    const perPage = parsed.perPage || 12;
    const sort = parsed.sort;
    const { column, ascending } = mapSortToOrder(sort);

    // Construir query para Supabase
    let querySupabase = supabase.from('products').select('*, categories(*)', { count: 'exact' });

    // Filtrar por categoría: la UI envía el slug (ej. "energia-solar"), pero la BD usa category_id.
    if (parsed.category) {
      const { data: categoryRow } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', parsed.category)
        .maybeSingle()
        .returns<{ id: string } | null>();

      if (categoryRow?.id) {
        querySupabase = querySupabase.eq('category_id', categoryRow.id);
      }
    }

    // Filtrar por solución (solution slug -> category_id via products filter)
    // We'll need to join with solutions or filter products that belong to solution's categories
    if (parsed.solution) {
      // First get the solution's product_ids
      const { data: solution } = await supabase
        .from('solutions')
        .select('product_ids')
        .eq('id', parsed.solution)
        .single();

      const solutionData = solution as { product_ids: string[] } | null;
      if (solutionData?.product_ids && solutionData.product_ids.length > 0) {
        querySupabase = querySupabase.in('id', solutionData.product_ids);
      }
    }

    // Filtrar por búsqueda
    if (parsed.search) {
      querySupabase = querySupabase.ilike('name', `%${parsed.search}%`);
    }

    // Filtrar por disponibilidad
    if (parsed.availability && parsed.availability.length > 0) {
      querySupabase = querySupabase.in('availability', parsed.availability);
    }

    // Filtrar por featured
    if (parsed.featured === true) {
      querySupabase = querySupabase.eq('featured', true);
    }

    // Filtrar por bestSeller
    if (parsed.bestSeller === true) {
      querySupabase = querySupabase.eq('best_seller', true);
    }

    // Filtrar por rango de precio
    if (parsed.minPrice !== undefined) {
      querySupabase = querySupabase.gte('price', parsed.minPrice);
    }
    if (parsed.maxPrice !== undefined) {
      querySupabase = querySupabase.lte('price', parsed.maxPrice);
    }

    // Ordenar
    querySupabase = querySupabase.order(column, { ascending });

    // Paginar: offset = (page - 1) * perPage
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    querySupabase = querySupabase.range(from, to);

    const { data, error, count } = await querySupabase;

    if (error) {
      console.error('Supabase error fetching products:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar productos'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar datos al DTO ProductListItem
    const typedData = (data || []) as ProductRow[];
    const items = typedData.map((product) => createProductListItem(product as any));

    // Calcular totalPages
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);
    const currentPage = page;

    const response = {
      data: items,
      totalPages,
      currentPage,
      totalCount,
    };

    // Validar respuesta con Zod
    const result = ProductListResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Product list response validation failed:', result.error);
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
    console.error('API products error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
