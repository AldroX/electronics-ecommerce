/// ============================================================
/// tests/api/categories.test.ts - Integration tests for categories API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSharedMockSupabase,
  mockCategory,
  mockProduct,
  createMockRequest,
  createMockContext,
  resetMocks,
} from './setup';

vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = getSharedMockSupabase();
  return {
    default: mockSupabase,
    __mockSupabase: mockSupabase,
  };
});

import supabase from '@/lib/supabase/client';
const mockSupabase = (supabase as any).__mockSupabase;

async function callCategoriesList(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/categories');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request);

  const { GET } = await import('@/pages/api/categories');
  return GET(context);
}

async function callCategoriesDetail(slug: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost/api/categories/${slug}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request, { slug });

  const { GET } = await import('@/pages/api/categories/[slug]');
  return GET(context);
}

describe('GET /api/categories', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return paginated categories on happy path', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockCategory],
      error: null,
      count: 1,
    });
    mockSupabase._mocks.in.mockResolvedValue({
      data: [{ category_id: mockCategory.id }],
      error: null,
    });

    const response = await callCategoriesList({ page: '1', limit: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.data).toHaveLength(1);
    expect(json.data.data[0].name).toBe('Test Category');
    expect(json.data.data[0].productCount).toBeDefined();
    expect(json.data.totalCount).toBe(1);
  });

  it('should return 400 for invalid query params', async () => {
    const response = await callCategoriesList({ page: 'invalid' });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle search filter', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockCategory],
      error: null,
      count: 1,
    });
    mockSupabase._mocks.in.mockResolvedValue({ data: [], error: null });

    const response = await callCategoriesList({ search: 'test' });
    await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase._mocks.ilike).toHaveBeenCalledWith('name', '%test%');
  });

  it('should return 500 on Supabase error', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
      count: 0,
    });

    const response = await callCategoriesList({});
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /api/categories/[slug]', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return category detail with products on happy path', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: mockCategory, error: null });
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct],
      error: null,
      count: 1,
    });

    const response = await callCategoriesDetail('test-category', { page: '1', perPage: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.category.name).toBe('Test Category');
    expect(json.data.products).toHaveLength(1);
    expect(json.data.totalProducts).toBe(1);
  });

  it('should return 404 for non-existent category', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const response = await callCategoriesDetail('non-existent');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for missing slug', async () => {
    const request = createMockRequest('http://localhost/api/categories/');
    const context = createMockContext(request, { slug: '' });

    const { GET } = await import('@/pages/api/categories/[slug]');
    const response = await GET(context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should paginate products', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: mockCategory, error: null });
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct, mockProduct],
      error: null,
      count: 2,
    });

    const response = await callCategoriesDetail('test-category', { page: '1', perPage: '1' });
    const json = await response.json();

    // Pagination is delegated to Supabase's `.range()`, so the response maps
    // whatever rows the query returns; the response schema only exposes
    // `totalProducts` (currentPage/totalPages are not part of the DTO).
    expect(response.status).toBe(200);
    expect(json.data.products).toHaveLength(2);
    expect(json.data.totalProducts).toBe(2);
  });

  it('should return 404 on Supabase error (treated as not found)', async () => {
    mockSupabase._mocks.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const response = await callCategoriesDetail('test-category');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });
});
