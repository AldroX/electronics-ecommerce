/// ============================================================
/// GET /api/faqs - Listado agrupado por categoría
/// Zod output
/// Task 2.12
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { FAQQuerySchema, FAQListResponseWrapperSchema } from '@/lib/api/validation';

export const GET: APIRoute = async (context) => {
  try {
    const url = new URL(context.request.url);
    const searchParams = url.searchParams;
    const raw: Record<string, string | string[]> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = String(value);
    }

    const query = FAQQuerySchema.safeParse(raw);
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

    const {
      data: faqs,
      error,
      count,
    } = await supabase.from('faqs').select('*', { count: 'exact' });

    if (error) {
      console.error('Supabase error fetching faqs:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar FAQs'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Agrupar FAQs por categoría (basado en palabras clave en la pregunta)
    const categories = ['compra', 'entrega', 'garantia', 'pago', 'bateria', 'general'];

    const grouped = categories.map((cat) => ({ category: cat, faqs: [] as any[] }));

    const allFaqs = (faqs || []).map((f: any) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    }));

    allFaqs.forEach((faq) => {
      const question = faq.question.toLowerCase();
      let assigned = false;

      for (const cat of categories) {
        if (question.includes(cat) || question.includes(cat.slice(0, -1))) {
          const idx = grouped.findIndex((g) => g.category === cat);
          if (idx >= 0) {
            grouped[idx].faqs.push(faq);
            assigned = true;
            break;
          }
        }
      }

      if (!assigned) {
        grouped[grouped.length - 1].faqs.push(faq); // general
      }
    });

    // Filtrar categorías vacías
    const filteredGroups = grouped.filter((g) => g.faqs.length > 0);

    const response = {
      ok: true,
      data: {
        data: filteredGroups,
        totalCount: count || 0,
      },
    };

    // Validar respuesta con Zod
    const result = FAQListResponseWrapperSchema.safeParse(response);
    if (!result.success) {
      console.error('FAQ list response validation failed:', result.error);
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
    console.error('API faqs error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
