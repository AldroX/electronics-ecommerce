/// ============================================================
/// GET /api/solutions/[slug] - Detalle de solución + productos paginados + featured kit
/// Task 2.6
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { Errors } from '@/lib/api/error-codes';
import { createProductListItem } from '@/lib/data/helpers/products';
import { CategorySlugSchema, SolutionDetailResponseSchema } from '@/lib/api/validation';
import type { SolutionRow, ProductRow, KitRow } from '@/lib/supabase/table-types';

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

    const { data: solution, error: solError } = await supabase
      .from('solutions')
      .select('*')
      .eq('slug', slug)
      .single();

    if (solError || !solution) {
      console.error('Supabase error fetching solution:', solError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.notFound('Solución no encontrada'),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const typedSolution = solution as SolutionRow;

    // Parsear parámetros de paginación
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '12');

    // Obtener productos de esta solución (via category_id overlap)
    const {
      data: products,
      error: prodError,
      count,
    } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .in('category_id', typedSolution.product_ids || [])
      .order('best_seller', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (prodError) {
      console.error('Supabase error fetching products for solution:', prodError);
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

    // Buscar kit destacado relacionado
    let featuredKit = null;
    if (typedSolution.product_ids && typedSolution.product_ids.length > 0) {
      const { data: kits, error: kitError } = await supabase
        .from('kits')
        .select('*, products(*)')
        .overlaps('product_ids', typedSolution.product_ids)
        .limit(1);

      if (!kitError && kits && kits.length > 0) {
        const kitData = kits[0] as KitRow & { products?: any[] };
        const products = kitData.products || [];
        const productCount = Array.isArray(products) ? products.length : 0;
        featuredKit = {
          id: kitData.id,
          name: kitData.name,
          slug: kitData.slug,
          price: kitData.price,
          discount: kitData.compare_at_price
            ? ((1 - kitData.price / kitData.compare_at_price) * 100).toFixed(0)
            : '0',
        };
      }
    }

    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / perPage);

    const response = {
      ok: true,
      data: {
        solution: {
          id: typedSolution.id,
          name: typedSolution.name,
          slug: typedSolution.slug,
          description: typedSolution.description,
          icon: typedSolution.icon,
        },
        products: productItems,
        featuredKit,
        totalProducts,
        currentPage: page,
        totalPages,
      },
    };

    // Validar respuesta con Zod
    const result = SolutionDetailResponseSchema.safeParse(response);
    if (!result.success) {
      console.error('Solution detail response validation failed:', result.error);
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
    console.error('API solution slug error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
