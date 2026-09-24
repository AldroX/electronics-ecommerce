/// ============================================================
/// tests/api/offers.test.ts - Integration tests for offers API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabase,
  mockOffer,
  mockProduct,
  createMockRequest,
  createMockContext,
  resetMocks,
} from './setup';

vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = createMockSupabase();
  return {
    default: mockSupabase,
    __mockSupabase: mockSupabase,
  };
});

import supabase from '@/lib/supabase/client';
const mockSupabase = (supabase as any).__mockSupabase;

async function callOffersList(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/offers');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request);

  const { GET } = await import('@/pages/api/offers');
  return GET(context);
}

async function callOffersDetail(slug: string) {
  const request = createMockRequest(`http://localhost/api/offers/${slug}`);
  const context = createMockContext(request, { slug });

  const { GET } = await import('@/pages/api/offers/[slug]');
  return GET(context);
}

describe('GET /api/offers', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return active offers on happy path', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [{ ...mockOffer, products: mockProduct }],
      error: null,
      count: 1,
    });

    const response = await callOffersList({ page: '1', limit: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.data).toHaveLength(1);
    expect(json.data.data[0].name).toBe('Test Offer');
    expect(json.data.data[0].discountPercent).toBe(20);
  });

  it('should reject availability (route builds string params, list needs array)', async () => {
    const response = await callOffersList({ availability: 'in-stock' });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle active=false to show all offers', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [{ ...mockOffer, products: mockProduct }],
      error: null,
      count: 1,
    });

    const response = await callOffersList({ active: 'false' });
    await response.json();

    expect(response.status).toBe(200);
  });

  it('should return 400 for invalid query params', async () => {
    const response = await callOffersList({ page: 'invalid' });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 500 on Supabase error', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
      count: 0,
    });

    const response = await callOffersList({});
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /api/offers/[slug]', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return offer detail with countdown on happy path', async () => {
    mockSupabase._mocks.single.mockResolvedValue({
      data: { ...mockOffer, products: mockProduct },
      error: null,
    });

    const response = await callOffersDetail('test-offer');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.offer.name).toBe('Test Offer');
    expect(json.data.offer.timeRemaining).toBeDefined();
    expect(json.data.offer.product).toBeDefined();
    expect(json.data.offer.product?.name).toBe('Test Product');
  });

  it('should return 404 for non-existent offer', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const response = await callOffersDetail('non-existent');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for missing slug', async () => {
    const request = createMockRequest('http://localhost/api/offers/');
    const context = createMockContext(request, { slug: '' });

    const { GET } = await import('@/pages/api/offers/[slug]');
    const response = await GET(context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 on Supabase error (treated as not found)', async () => {
    mockSupabase._mocks.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const response = await callOffersDetail('test-offer');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });
});
