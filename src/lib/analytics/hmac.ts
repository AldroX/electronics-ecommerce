/// ============================================================
/// HMAC verification for analytics endpoints
/// Tasks 3.7, 3.8, 3.9
/// ============================================================

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify HMAC signature for analytics payloads.
 * Uses the Supabase verify_analytics_hmac function or local verification.
 */
export async function verifyAnalyticsHmac(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Use timing-safe comparison to prevent timing attacks
  const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');

  // Convert to buffers for timingSafeEqual
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Extract and verify HMAC from request headers.
 * Expected headers: x-analytics-payload (base64), x-analytics-signature (hex)
 */
export async function verifyAnalyticsRequest(
  request: Request,
  secret: string
): Promise<{ valid: boolean; payload?: any; error?: string }> {
  try {
    const payloadHeader = request.headers.get('x-analytics-payload');
    const signatureHeader = request.headers.get('x-analytics-signature');

    if (!payloadHeader || !signatureHeader) {
      return { valid: false, error: 'Missing HMAC headers' };
    }

    // Decode base64 payload
    let payloadStr: string;
    try {
      payloadStr = Buffer.from(payloadHeader, 'base64').toString('utf-8');
    } catch {
      return { valid: false, error: 'Invalid payload encoding' };
    }

    // Verify signature
    const isValid = await verifyAnalyticsHmac(payloadStr, signatureHeader, secret);

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      return { valid: false, error: 'Invalid payload JSON' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: `Verification error: ${err}` };
  }
}

/**
 * Generate HMAC signature for client-side use (testing)
 */
export function generateAnalyticsHmac(
  payload: any,
  secret: string
): { payload: string; signature: string } {
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64');
  const signature = createHmac('sha256', secret).update(payloadStr).digest('hex');
  return { payload: payloadB64, signature };
}

// Analytics secret from environment
export function getAnalyticsSecret(): string {
  return import.meta.env.ANALYTICS_HMAC_SECRET || 'dev-secret-change-in-production';
}
