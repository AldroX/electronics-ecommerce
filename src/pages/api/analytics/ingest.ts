/// ============================================================
/// POST /api/analytics/ingest - Public analytics ingest (browser wired)
/// Task: frontend analytics ingest
///
/// Public alternative to the HMAC endpoints for browser clients. Trusted
/// server callers keep using the HMAC endpoints; this one is browser-only.
///
/// Anti-abuse (v1): origin allowlist + per-IP in-memory rate limits.
/// NOTE: the rate limiter lives in process memory, so it is per server
/// process/instance, resets on redeploy, and does not share state across
/// instances. Enough for v1; replace with a shared store for multi-instance.
/// ============================================================

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { z } from 'zod';
import config from '@/config/config.json';
import {
  ErrorCode,
  createApiError,
  type ApiError,
  type ErrorCodeValue,
} from '@/lib/api/error-codes';

const PageViewSchema = z.object({
  path: z
    .string()
    .min(1)
    .max(200)
    .refine((value) => value.startsWith('/') && !value.startsWith('/api/'), {
      message: 'path must start with "/" and must not start with "/api/"',
    }),
  referrer: z.string().url().nullable().optional(),
  session_id: z.string().uuid().optional(),
});

const WhatsAppClickSchema = z.object({
  product_slug: z.string().min(1).max(120),
  source_page: z
    .string()
    .min(1)
    .max(200)
    .refine((value) => value.startsWith('/'), { message: 'source_page must start with "/"' }),
  session_id: z.string().uuid().optional(),
});

const IngestSchema = z.discriminatedUnion('type', [
  PageViewSchema.extend({ type: z.literal('page_view') }),
  WhatsAppClickSchema.extend({ type: z.literal('whatsapp_click') }),
]);

/// Anti-abuse limits ---------------------------------------------------------
/// Timestamps per IP are stored in arrays; entries older than RATE_WINDOW_MS
/// are purged on access. The map is capped and evicts the oldest bucket.

const MAX_BODY_BYTES = 4096;
const RATE_WINDOW_MS = 60_000;
const MAX_PAGE_VIEWS = 60;
const MAX_CLICKS = 30;
const MAX_BUCKETS = 5000;

type RateKind = 'pageViews' | 'clicks';

interface RateBucket {
  pageViews: number[];
  clicks: number[];
}

const rateBuckets = new Map<string, RateBucket>();

const DEV_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

function isAllowedOrigin(origin: string): boolean {
  return origin === config.site.base_url || DEV_ORIGIN_RE.test(origin);
}

function getClientIp(context: { request: Request; clientAddress?: string }): string {
  const forwarded = context.request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return context.clientAddress || 'unknown';
}

function checkRateLimit(ip: string, kind: RateKind, max: number, now: number): boolean {
  let bucket = rateBuckets.get(ip);
  if (!bucket) {
    if (rateBuckets.size >= MAX_BUCKETS) {
      const oldest = rateBuckets.keys().next().value;
      if (oldest !== undefined) rateBuckets.delete(oldest);
    }
    bucket = { pageViews: [], clicks: [] };
    rateBuckets.set(ip, bucket);
  }
  const timestamps = bucket[kind];
  while (timestamps.length > 0 && timestamps[0] <= now - RATE_WINDOW_MS) timestamps.shift();
  if (timestamps.length >= max) return false;
  timestamps.push(now);
  return true;
}

function jsonError(
  code: ErrorCodeValue,
  message: string,
  status: number,
  issues?: unknown
): Response {
  const error: ApiError & { issues?: unknown } = createApiError(code, message);
  if (issues !== undefined) error.issues = issues;
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async (context) => {
  try {
    // Browser-only endpoint: the Origin header must be present and allowed.
    const origin = context.request.headers.get('origin');
    if (!origin || !isAllowedOrigin(origin)) {
      return jsonError(ErrorCode.FORBIDDEN, 'Origen no permitido', 403);
    }

    const ip = getClientIp(context);
    const now = Date.now();

    // Hard size cap before any parsing (reduced abuse surface).
    const rawBody = await context.request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return jsonError(
        ErrorCode.VALIDATION_ERROR,
        'Cuerpo de solicitud demasiado grande (máx. 4 KB)',
        413
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return jsonError(ErrorCode.VALIDATION_ERROR, 'JSON inválido', 400);
    }

    const parsed = IngestSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonError(
        ErrorCode.VALIDATION_ERROR,
        'Datos de seguimiento inválidos',
        400,
        parsed.error.issues
      );
    }

    const event = parsed.data;
    const isPageView = event.type === 'page_view';

    if (
      !checkRateLimit(
        ip,
        isPageView ? 'pageViews' : 'clicks',
        isPageView ? MAX_PAGE_VIEWS : MAX_CLICKS,
        now
      )
    ) {
      return jsonError(ErrorCode.RATE_LIMITED, 'Demasiadas solicitudes, intente más tarde', 429);
    }

    const supabase = createClient<Database>(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (isPageView) {
      const { path, referrer, session_id } = event;
      const insertData = {
        path,
        referrer: referrer ?? null,
        session_id: session_id ?? null,
      };

      const { error } = await supabase.from('page_views').insert(insertData as any);

      if (error) {
        console.error('Supabase error inserting page_view:', error);
        return jsonError(ErrorCode.INTERNAL_ERROR, 'Error al registrar vista de página', 500);
      }
    } else {
      const { product_slug, source_page, session_id } = event;
      const insertData: {
        product_slug: string;
        product_name: string;
        source_page: string;
        session_id: string | null;
      } = {
        product_slug,
        product_name: '',
        source_page,
        session_id: session_id ?? null,
      };

      const { error } = await supabase.from('whatsapp_clicks').insert(insertData as any);

      if (error) {
        console.error('Supabase error inserting whatsapp_click:', error);
        return jsonError(ErrorCode.INTERNAL_ERROR, 'Error al registrar clic en WhatsApp', 500);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Analytics ingest error:', err);
    return jsonError(ErrorCode.INTERNAL_ERROR, 'Error interno del servidor', 500);
  }
};
