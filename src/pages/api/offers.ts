/// ============================================================
/// GET /api/offers - Listado con filtro active (rangos de fecha)
/// Solo ofertas vigentes. Zod output
/// Task 2.8
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { OfferListQuerySchema, OfferListResponseSchema } from '@/lib/api/validation';
import type { OfferRow } from '@/lib/supabase/table-types';

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const searchParams = url.searchParams;
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = String(value);
    }

    const query = OfferListQuerySchema.safeParse(raw);
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
    const availability = query.data.availability;

    // Construir query para ofertas vigentes (valid_until > NOW)
    let querySupabase = supabase
      .from('offers')
      .select('*, products(*)', { count: 'exact' })
      .gt('valid_until', new Date().toISOString());

    // Filtrar por disponibilidad
    if (availability && availability.length > 0) {
      querySupabase = querySupabase.in('availability', availability);
    }

    // Filtrar por active = true (solo ofertas vigentes, ya filtrado arriba)
    if (query.data.active === false) {
      // Si active=false, mostrar todas incluyendo expiradas
      querySupabase = supabase.from('offers').select('*, products(*)', { count: 'exact' });
      if (availability && availability.length > 0) {
        querySupabase = querySupabase.in('availability', availability);
      }
    }

    // Paginar
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    querySupabase = querySupabase.range(from, to);

    const { data, error, count } = await querySupabase;

    if (error) {
      console.error('Supabase error fetching offers:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar ofertas'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const offersData = ((data || []) as (OfferRow & { products?: any })[]).map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      description: o.description,
      image: o.image,
      originalPrice: o.original_price,
      currentPrice: o.current_price,
      discountPercent: o.discount_percent,
      availability: o.availability,
      validUntil: o.valid_until,
      productSlug: o.product_slug,
      whatsappMessage: o.whatsapp_message,
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / perPage);
    const currentPage = page;

    const response = {
      data: offersData,
      totalPages,
      currentPage,
      totalCount,
    };

    // Validar respuesta con Zod
    const result = OfferListResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Offer list response validation failed:', result.error);
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
    console.error('API offers error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
