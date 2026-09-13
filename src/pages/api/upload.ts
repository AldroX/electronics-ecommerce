/// ============================================================
/// POST /api/upload - Imagen multipart → Supabase Storage
/// product-images/{uuid}.webp. Valida MIME type (image/*), size ≤5MB.
/// Retorna signed URL (1 hora). Zod output.
/// Task 2.13
/// ============================================================

import type { APIRoute } from 'astro';

export const prerender = false;
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import { Errors } from '@/lib/api/error-codes';
import { UploadResponseWrapperSchema } from '@/lib/api/validation';

function getServiceClient() {
  return createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.formData();
    const file = body.get('file') as File | null;
    const fileName = body.get('fileName') as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.validationError('No se recibió ningún archivo'),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.validationError(
            `El archivo es demasiado grande. Máximo 5MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(1)}MB`
          ),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.validationError('El archivo debe ser una imagen (MIME type image/*)'),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar nombre único: product-images/{uuid}.webp
    const uuid = crypto.randomUUID();
    const extension = fileName?.split('.').pop() || 'webp';
    const storagePath = `product-images/${uuid}.${extension}`;

    const supabase = getServiceClient();

    // Subir a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: 'max-age=31536000',
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al subir imagen a storage'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generar URL firmada (1 hora = 3600 segundos)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('product-images')
      .createSignedUrl(storagePath, 3600);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return new Response(
        JSON.stringify({
          ok: false,
          error: Errors.internalError('Error al generar URL firmada'),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = {
      ok: true,
      data: {
        url: signedUrlData?.signedUrl || '',
        path: storagePath,
        expiresIn: 3600,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
      },
    };

    // Validar respuesta con Zod
    const result = UploadResponseWrapperSchema.safeParse(response);
    if (!result.success) {
      console.error('Upload response validation failed:', result.error);
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
    console.error('API upload error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: Errors.internalError('Error interno del servidor'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
