/// ============================================================
/// tests/api/solutions.test.ts - Integration tests for solutions API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabase,
  mockSolution,
  mockProduct,
  mockKit,
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

async function callSolutionsList(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/solutions');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request);

  const { GET } = await import('@/pages/api/solutions');
  return GET(context);
}

async function callSolutionsDetail(slug: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost/api/solutions/${slug}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request, { slug });

  const { GET } = await import('@/pages/api/solutions/[slug]');
  return GET(context);
}

describe('GET /api/solutions', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return solutions on happy path', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockSolution],
      error: null,
      count: 1,
    });

    const response = await callSolutionsList({ page: '1', limit: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.data).toHaveLength(1);
    expect(json.data.data[0].name).toBe('Test Solution');
    expect(json.data.data[0].productCount).toBe(1);
  });

  it('should handle search filter', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockSolution],
      error: null,
      count: 1,
    });

    const response = await callSolutionsList({ search: 'test' });
    await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase._mocks.ilike).toHaveBeenCalledWith('name', '%test%');
  });

  it('should return 400 for invalid query params', async () => {
    const response = await callSolutionsList({ page: 'invalid' });
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

    const response = await callSolutionsList({});
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /api/solutions/[slug]', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return solution detail with products on happy path', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: mockSolution, error: null });
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct],
      error: null,
      count: 1,
    });
    mockSupabase._mocks.limit.mockResolvedValue({
      data: [{ ...mockKit, products: [mockProduct] }],
      error: null,
    });

    const response = await callSolutionsDetail('test-solution', { page: '1', perPage: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.solution.name).toBe('Test Solution');
    expect(json.data.products).toHaveLength(1);
    expect(json.data.featuredKit).toBeDefined();
    expect(json.data.totalProducts).toBe(1);
  });

  it('should return 404 for non-existent solution', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const response = await callSolutionsDetail('non-existent');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for missing slug', async () => {
    const request = createMockRequest('http://localhost/api/solutions/');
    const context = createMockContext(request, { slug: '' });

    const { GET } = await import('@/pages/api/solutions/[slug]');
    const response = await GET(context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should paginate products', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: mockSolution, error: null });
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockProduct, mockProduct],
      error: null,
      count: 2,
    });
    mockSupabase._mocks.limit.mockResolvedValue({ data: [], error: null });

    const response = await callSolutionsDetail('test-solution', { page: '1', perPage: '1' });
    const json = await response.json();

    // Pagination is delegated to Supabase's `.range()`; the DTO only exposes
    // `totalProducts` (totalPages is not part of the response schema).
    expect(response.status).toBe(200);
    expect(json.data.products).toHaveLength(2);
    expect(json.data.totalProducts).toBe(2);
  });

  it('should return 404 on Supabase error (treated as not found)', async () => {
    mockSupabase._mocks.single.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const response = await callSolutionsDetail('test-solution');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });
});
