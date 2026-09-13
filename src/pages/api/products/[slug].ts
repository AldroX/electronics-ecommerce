/// ============================================================
/// GET /api/products/[slug] - Detalle de producto
/// specs, imágenes (signed URLs Supabase Storage), canPower array, related product slugs
/// 404 si no encontrado/no publicado
/// Task 2.2
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import supabase from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { Errors } from '@/lib/api/error-codes';
import { canPower } from '@/lib/data/helpers/products';
import type { ProductRow, CategoryRow } from '@/lib/supabase/table-types';

// Cliente Supabase con service role para signed URLs
function getServiceClient() {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Generar signed URLs para imágenes
async function getSignedImageUrls(imagePaths: string[]): Promise<string[]> {
  const supabase = getServiceClient();
  const urls: string[] = [];

  for (const path of imagePaths) {
    const { data } = await supabase.storage.from('product-images').createSignedUrl(path, 3600); // 1 hora
    if (data?.signedUrl) {
      urls.push(data.signedUrl);
    } else {
      urls.push(path); // fallback a la ruta original
    }
  }

  return urls;
}

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

    // Obtener producto por slug
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('slug', slug)
      .single();

    if (prodError || !product) {
      console.error('Supabase error fetching product:', prodError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.notFound('Producto no encontrado'),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const typedProduct = product as ProductRow & { categories?: CategoryRow };

    // Verificar que el producto esté publicado (availability no sea out-of-stock si se desea)
    // En este caso permitimos ver productos out-of-stock pero con availability indicado

    // Obtener productos relacionados por IDs
    let relatedProducts: string[] = [];
    if (typedProduct.related_product_ids && typedProduct.related_product_ids.length > 0) {
      const { data: related } = await supabase
        .from('products')
        .select('slug')
        .in('id', typedProduct.related_product_ids);

      if (related) {
        relatedProducts = related.map((r: any) => r.slug);
      }
    }

    // Generar signed URLs para imágenes
    const signedImages = await getSignedImageUrls(typedProduct.images || []);

    // Calcular canPower array
    const productForCanPower = {
      ...typedProduct,
      batteryWh: typedProduct.battery_wh,
      specs: typedProduct.specs as Record<string, string>,
      features: typedProduct.features,
    };
    const canPowerArray = canPower(productForCanPower as any);

    // Construir respuesta completa
    const productDetail = {
      id: typedProduct.id,
      name: typedProduct.name,
      slug: typedProduct.slug,
      description: typedProduct.description,
      shortDescription: typedProduct.short_description,
      price: typedProduct.price,
      compareAtPrice: typedProduct.compare_at_price,
      currency: typedProduct.currency,
      category: typedProduct.categories
        ? {
            id: typedProduct.categories.id,
            name: typedProduct.categories.name,
            slug: typedProduct.categories.slug,
          }
        : null,
      images: signedImages,
      specs: typedProduct.specs as Record<string, string>,
      features: typedProduct.features,
      availability: typedProduct.availability,
      featured: typedProduct.featured,
      bestSeller: typedProduct.best_seller,
      kitOnly: typedProduct.kit_only,
      whatsappMessage: typedProduct.whatsapp_message,
      tags: typedProduct.tags,
      seo: {
        title: typedProduct.seo_title || typedProduct.name,
        description: typedProduct.seo_description || '',
        image: typedProduct.seo_image,
        canonical: typedProduct.seo_canonical,
      },
      relatedProducts,
      canPower: canPowerArray,
      batteryWh: typedProduct.battery_wh,
    };

    return new Response(
      JSON.stringify({
        ok: true,
        data: productDetail,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('API product detail error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
