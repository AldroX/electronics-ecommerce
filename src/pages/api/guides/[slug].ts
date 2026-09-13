/// ============================================================
/// GET /api/guides/[slug] - Detalle + related guides (mismo categoría, límite 3)
/// Task 2.11
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { CategorySlugSchema, GuideDetailResponseSchema } from '@/lib/api/validation';
import type { GuideRow } from '@/lib/supabase/table-types';

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

    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('*, products(*)')
      .eq('slug', slug)
      .single();

    if (guideError || !guide) {
      console.error('Supabase error fetching guide:', guideError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.notFound('Guía no encontrada'),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const typedGuide = guide as GuideRow;

    // Obtener guías relacionadas (mismo categoría basada en productos compartidos)
    let relatedGuides: any[] = [];
    if (typedGuide.product_ids && typedGuide.product_ids.length > 0) {
      const { data: related, error: relatedError } = await supabase
        .from('guides')
        .select('id, title, slug')
        .in('product_ids', typedGuide.product_ids)
        .neq('id', typedGuide.id)
        .limit(3);

      if (!relatedError && related) {
        relatedGuides = (related as any[]).map((g: any) => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
        }));
      }
    }

    const response = {
      ok: true,
      data: {
        guide: {
          id: typedGuide.id,
          title: typedGuide.title,
          slug: typedGuide.slug,
          description: typedGuide.description,
          image: typedGuide.image,
          content: typedGuide.content,
          readTime: typedGuide.read_time,
        },
        relatedGuides,
      },
    };

    // Validar respuesta con Zod
    const result = GuideDetailResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Guide detail response validation failed:', result.error);
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
    console.error('API guide slug error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
