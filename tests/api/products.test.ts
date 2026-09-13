/// ============================================================
/// tests/api/products.test.ts - Integration tests for products API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSharedMockSupabase,
  mockProduct,
  createMockRequest,
  createMockContext,
  resetMocks,
} from './setup';

// Mock the supabase module
vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = getSharedMockSupabase();
  return {
    default: mockSupabase,
    __mockSupabase: mockSupabase,
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => getSharedMockSupabase()),
}));

// Import the mocked supabase
import supabase from '@/lib/supabase/client';
const mockSupabase = (supabase as any).__mockSupabase;

// Helper to call the API handler
async function callProductsList(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/products');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request);

  // Dynamic import to get the handler
  const { GET } = await import('@/pages/api/products');
  return GET(context);
}

async function callProductsDetail(slug: string) {
  const request = createMockRequest(`http://localhost/api/products/${slug}`);
  const context = createMockContext(request, { slug });

  const { GET } = await import('@/pages/api/products/[slug]');
  return GET(context);
}

describe('GET /api/products', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return paginated products on happy path', async () => {
    // Setup mock
    mockSupabase._mocks.single.mockResolvedValue({ data: mockProduct, error: null });
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct],
      error: null,
      count: 1,
    });

    const response = await callProductsList({ page: '1', limit: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.data).toHaveLength(1);
    expect(json.data.data[0].name).toBe('Test Product');
    expect(json.data.totalCount).toBe(1);
    expect(json.data.currentPage).toBe(1);
    expect(json.data.totalPages).toBe(1);
  });

  it('should return 400 for invalid query params', async () => {
    const response = await callProductsList({ page: 'invalid' });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle search filter', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct],
      error: null,
      count: 1,
    });

    const response = await callProductsList({ search: 'test' });
    await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase._mocks.ilike).toHaveBeenCalledWith('name', '%test%');
  });

  it('should handle category filter', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct],
      error: null,
      count: 1,
    });

    const response = await callProductsList({ category: 'cat-123' });
    await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('category_id', 'cat-123');
  });

  it('should handle price range filters', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct],
      error: null,
      count: 1,
    });

    const response = await callProductsList({ minPrice: '500', maxPrice: '2000' });
    await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase._mocks.gte).toHaveBeenCalledWith('price', 500);
    expect(mockSupabase._mocks.lte).toHaveBeenCalledWith('price', 2000);
  });

  it('should handle sort options', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct],
      error: null,
      count: 1,
    });

    await callProductsList({ sort: 'price-asc' });
    expect(mockSupabase._mocks.order).toHaveBeenCalledWith('price', { ascending: true });

    await callProductsList({ sort: 'price-desc' });
    expect(mockSupabase._mocks.order).toHaveBeenCalledWith('price', { ascending: false });

    await callProductsList({ sort: 'name-asc' });
    expect(mockSupabase._mocks.order).toHaveBeenCalledWith('name', { ascending: true });

    await callProductsList({ sort: 'newest' });
    expect(mockSupabase._mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });

    await callProductsList({ sort: 'popular' });
    expect(mockSupabase._mocks.order).toHaveBeenCalledWith('best_seller', { ascending: false });
  });

  it('should return 500 on Supabase error', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
      count: 0,
    });

    const response = await callProductsList({});
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /api/products/[slug]', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return product detail on happy path', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: mockProduct, error: null });
    mockSupabase._mocks.in.mockResolvedValue({ data: [{ slug: 'related-product' }], error: null });

    const response = await callProductsDetail('test-product');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.name).toBe('Test Product');
    expect(json.data.slug).toBe('test-product');
    expect(json.data.canPower).toBeDefined();
    expect(json.data.relatedProducts).toContain('related-product');
  });

  it('should return 404 for non-existent product', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const response = await callProductsDetail('non-existent');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for missing slug', async () => {
    const request = createMockRequest('http://localhost/api/products/');
    const context = createMockContext(request, { slug: '' });

    const { GET } = await import('@/pages/api/products/[slug]');
    const response = await GET(context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should include signed URLs for images', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: mockProduct, error: null });
    mockSupabase._mocks.in.mockResolvedValue({ data: [], error: null });

    const response = await callProductsDetail('test-product');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.images).toBeDefined();
    expect(Array.isArray(json.data.images)).toBe(true);
  });

  it('should return 500 on Supabase error', async () => {
    mockSupabase._mocks.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const response = await callProductsDetail('test-product');
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});
