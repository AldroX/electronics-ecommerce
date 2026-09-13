/// ============================================================
/// GET /api/kits - Listado con productos bundle + discount
/// Zod output
/// Task 2.7
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { KitQuerySchema, KitListResponseSchema } from '@/lib/api/validation';
import type { KitRow } from '@/lib/supabase/table-types';

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const searchParams = url.searchParams;
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = String(value);
    }

    const query = KitQuerySchema.safeParse(raw);
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
    let querySupabase = supabase.from('kits').select('*, products(*)', { count: 'exact' });

    // Paginar
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    querySupabase = querySupabase.range(from, to);

    const { data, error, count } = await querySupabase;

    if (error) {
      console.error('Supabase error fetching kits:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar kits'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const kitsData = ((data || []) as (KitRow & { products?: any[] })[]).map((k) => {
      const products = k.products || [];
      const productCount = Array.isArray(products) ? products.length : 0;
      return {
        id: k.id,
        name: k.name,
        slug: k.slug,
        description: k.description,
        price: k.price,
        compareAtPrice: k.compare_at_price,
        discount: k.compare_at_price ? ((1 - k.price / k.compare_at_price) * 100).toFixed(0) : '0',
        productCount,
        seo: {
          title: k.seo_title || undefined,
          description: k.seo_description || undefined,
          image: k.seo_image || undefined,
          canonical: k.seo_canonical || undefined,
        },
      };
    });

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);
    const currentPage = page;

    const response = {
      data: kitsData,
      totalPages,
      currentPage,
      totalCount,
    };

    // Validar respuesta con Zod
    const result = KitListResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Kit list response validation failed:', result.error);
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
    console.error('API kits error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
