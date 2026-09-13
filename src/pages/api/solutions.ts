/// ============================================================
/// GET /api/solutions - Listado de soluciones con conteo de productos
/// Zod output
/// Task 2.5
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { SolutionQuerySchema, SolutionListResponseSchema } from '@/lib/api/validation';
import type { SolutionRow } from '@/lib/supabase/table-types';

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const searchParams = url.searchParams;
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = String(value);
    }

    const query = SolutionQuerySchema.safeParse(raw);
    if (!query.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
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
    let querySupabase = supabase.from('solutions').select('*', { count: 'exact' });

    // Filtrar por búsqueda
    if (query.data.search) {
      querySupabase = querySupabase.ilike('name', `%${query.data.search}%`);
    }

    // Paginar
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    querySupabase = querySupabase.range(from, to);

    const { data, error, count } = await querySupabase;

    if (error) {
      console.error('Supabase error fetching solutions:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar soluciones'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const solutionsData = ((data || []) as SolutionRow[]).map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon,
      productCount: s.product_ids ? s.product_ids.length : 0,
      seo: {
        title: s.seo_title || undefined,
        description: s.seo_description || undefined,
        image: s.seo_image || undefined,
        canonical: s.seo_canonical || undefined,
      },
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);
    const currentPage = page;

    const response = {
      data: solutionsData,
      totalPages,
      currentPage,
      totalCount,
    };

    // Validar respuesta con Zod
    const result = SolutionListResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Solution list response validation failed:', result.error);
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
    console.error('API solutions error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
