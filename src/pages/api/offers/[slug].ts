/// ============================================================
/// GET /api/offers/[slug] - Detalle con producto + countdown timestamp
/// Task 2.9
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { CategorySlugSchema, OfferDetailResponseSchema } from '@/lib/api/validation';
import type { OfferRow } from '@/lib/supabase/table-types';

export const GET: APIRoute = async (context) => {
  try {
    const slug = context.params.slug;
    if (!slug) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'Slug requerido' },
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
          error: { code: 'VALIDATION_ERROR', message: 'Slug inválido' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*, products(*)')
      .eq('slug', slug)
      .single();

    if (offerError || !offer) {
      console.error('Supabase error fetching offer:', offerError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.notFound('Oferta no encontrada'),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const typedOffer = offer as OfferRow & { products?: any };

    const now = new Date().toISOString();
    const validUntil = new Date(typedOffer.valid_until);
    const timeRemaining =
      validUntil > new Date(now)
        ? Math.max(0, Math.floor((validUntil.getTime() - new Date(now).getTime()) / 1000))
        : 0;

    const product = typedOffer.products
      ? {
          id: typedOffer.products.id,
          name: typedOffer.products.name,
          slug: typedOffer.products.slug,
          price: typedOffer.products.price,
          currency: typedOffer.products.currency,
          images: typedOffer.products.images,
        }
      : null;

    const response = {
      ok: true,
      data: {
        offer: {
          id: typedOffer.id,
          name: typedOffer.name,
          slug: typedOffer.slug,
          description: typedOffer.description,
          image: typedOffer.image,
          originalPrice: typedOffer.original_price,
          currentPrice: typedOffer.current_price,
          discountPercent: typedOffer.discount_percent,
          availability: typedOffer.availability,
          validUntil: typedOffer.valid_until,
          timeRemaining,
          product,
          whatsappMessage: typedOffer.whatsapp_message,
        },
      },
    };

    // Validar respuesta con Zod
    const result = OfferDetailResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Offer detail response validation failed:', result.error);
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
    console.error('API offer slug error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
