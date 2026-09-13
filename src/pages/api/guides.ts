/// ============================================================
/// GET /api/guides - Listado con filtro categoría
/// Zod output
/// Task 2.10
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { GuideQuerySchema, GuideListResponseSchema } from '@/lib/api/validation';
import type { GuideRow } from '@/lib/supabase/table-types';

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const searchParams = url.searchParams;
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = String(value);
    }

    const query = GuideQuerySchema.safeParse(raw);
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

    let querySupabase = supabase.from('guides').select('*', { count: 'exact' });

    if (query.data.categoria) {
      querySupabase = querySupabase.eq('category_id', query.data.categoria);
    }

    if (query.data.search) {
      querySupabase = querySupabase.ilike('title', `%${query.data.search}%`);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    querySupabase = querySupabase.range(from, to);

    const { data, error, count } = await querySupabase;

    if (error) {
      console.error('Supabase error fetching guides:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar guías'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const guidesData = ((data || []) as GuideRow[]).map((g) => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      description: g.description,
      image: g.image,
      productCount: g.product_ids ? g.product_ids.length : 0,
      seo: {
        title: g.seo_title || undefined,
        description: g.seo_description || undefined,
        image: g.seo_image || undefined,
        canonical: g.seo_canonical || undefined,
      },
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);
    const currentPage = page;

    const response = {
      data: guidesData,
      totalPages,
      currentPage,
      totalCount,
    };

    // Validar respuesta con Zod
    const result = GuideListResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Guide list response validation failed:', result.error);
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
    console.error('API guides error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
