/// ============================================================
/// Margin maintenance helper — triggered on conversion events
/// Recalculates/updates product margins in the product_margins table
/// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

function getServiceClient() {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/// Get or create a product margin record, adding the estimated value to existing margins
export async function mantenedorMargen(productId: string, estimatedValue: number) {
  const supabase = getServiceClient();

  // Get the current product with category info
  const { data: product, error: productError } = await (supabase as any)
    .from('products')
    .select(
      `
      *,
      categories!
    `
    )
    .eq('id', productId)
    .single();

  if (productError || !product) {
    console.error('Error fetching product for margin calc:', productError);
    return;
  }

  const currency = product.currency;

  // Calculate margin percent based on price difference
  // This is a simplified calculation - in production, you'd have cost price tracked
  const salePrice = product.price;
  // Assume a default cost of 60% of sale price for backup power systems
  const costPrice = Number((salePrice * 0.6).toFixed(2));
  const marginAmount = salePrice - costPrice;
  const marginPercent = (marginAmount / salePrice) * 100;

  // Upsert into product_margins table
  const { error } = await (supabase as any)
    .from('product_margins')
    .upsert({
      product_id: productId,
      cost_price: costPrice,
      sale_price: salePrice,
      margin_amount: marginAmount,
      margin_percent: marginPercent,
      currency: currency,
      effective_from: new Date().toISOString(),
      effective_until: null,
    })
    .select();

  if (error) {
    console.error('Error upserting product_margin:', error);
  }
}
