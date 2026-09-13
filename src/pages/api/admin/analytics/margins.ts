/// ============================================================
/// GET /api/admin/analytics/margins - Aggregated margins per product/category (admin only)
/// Task 3.10
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { verifyAdminSession } from '@/lib/auth/admin-guard';
import { Errors, ErrorCode } from '@/lib/api/error-codes';

const MarginsQuerySchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  category_id: z.string().uuid().optional(),
  group_by: z.enum(['product', 'category']).default('product'),
});

function getServiceClient() {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export const GET: APIRoute = async (context) => {
  try {
    await verifyAdminSession(context.request);

    const url = new URL(context.request.url);
    const queryResult = MarginsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!queryResult.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Parámetros inválidos',
            issues: queryResult.error.issues,
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { start_date, end_date, category_id, group_by } = queryResult.data;
    const supabase = getServiceClient();

    let query = supabase.from('product_margins').select(`
        id,
        product_id,
        cost_price,
        sale_price,
        margin_amount,
        margin_percent,
        currency,
        effective_from,
        effective_until,
        products!inner (
          id,
          name,
          slug,
          category_id,
          categories!inner (
            id,
            name,
            slug
          )
        )
      `);

    if (start_date) {
      query = query.gte('effective_from', start_date);
    }
    if (end_date) {
      query = query.lte('effective_from', end_date);
    }
    if (category_id) {
      query = query.eq('products.category_id', category_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching margins:', error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al consultar márgenes'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const margins = (data || []).map((row: any) => ({
      product_id: row.product_id,
      product_name: row.products?.name,
      product_slug: row.products?.slug,
      category_id: row.products?.categories?.id,
      category_name: row.products?.categories?.name,
      category_slug: row.products?.categories?.slug,
      cost_price: row.cost_price,
      sale_price: row.sale_price,
      margin_amount: row.margin_amount,
      margin_percent: row.margin_percent,
      currency: row.currency,
      effective_from: row.effective_from,
      effective_until: row.effective_until,
    }));

    let aggregated: any[];
    if (group_by === 'category') {
      const byCategory = new Map<string, any>();
      for (const m of margins) {
        const key = m.category_id;
        if (!byCategory.has(key)) {
          byCategory.set(key, {
            category_id: m.category_id,
            category_name: m.category_name,
            category_slug: m.category_slug,
            total_cost: 0,
            total_sale: 0,
            total_margin: 0,
            product_count: 0,
            avg_margin_percent: 0,
            margins: [],
          });
        }
        const cat = byCategory.get(key);
        cat.total_cost += m.cost_price;
        cat.total_sale += m.sale_price;
        cat.total_margin += m.margin_amount;
        cat.product_count += 1;
        cat.margins.push(m);
      }
      aggregated = Array.from(byCategory.values()).map((c) => ({
        ...c,
        avg_margin_percent: c.total_sale > 0 ? (c.total_margin / c.total_sale) * 100 : 0,
      }));
    } else {
      aggregated = margins;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: aggregated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Admin margins error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
