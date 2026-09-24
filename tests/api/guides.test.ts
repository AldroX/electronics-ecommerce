/// ============================================================
/// tests/api/guides.test.ts - Integration tests for guides API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabase,
  mockGuide,
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

async function callGuidesList(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/guides');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request);

  const { GET } = await import('@/pages/api/guides');
  return GET(context);
}

async function callGuidesDetail(slug: string) {
  const request = createMockRequest(`http://localhost/api/guides/${slug}`);
  const context = createMockContext(request, { slug });

  const { GET } = await import('@/pages/api/guides/[slug]');
  return GET(context);
}

describe('GET /api/guides', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return guides on happy path', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockGuide],
      error: null,
      count: 1,
    });

    const response = await callGuidesList({ page: '1', limit: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.data).toHaveLength(1);
    expect(json.data.data[0].title).toBe('Test Guide');
    expect(json.data.data[0].productCount).toBe(1);
  });

  it('should filter by categoria', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockGuide],
      error: null,
      count: 1,
    });

    const response = await callGuidesList({ categoria: 'cat-123' });
    await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase._mocks.eq).toHaveBeenCalledWith('category_id', 'cat-123');
  });

  it('should handle search filter', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [mockGuide],
      error: null,
      count: 1,
    });

    const response = await callGuidesList({ search: 'test' });
    await response.json();

    expect(response.status).toBe(200);
    expect(mockSupabase._mocks.ilike).toHaveBeenCalledWith('title', '%test%');
  });

  it('should return 400 for invalid query params', async () => {
    const response = await callGuidesList({ page: 'invalid' });
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

    const response = await callGuidesList({});
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /api/guides/[slug]', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return guide detail with related guides on happy path', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: mockGuide, error: null });
    mockSupabase._mocks.limit.mockResolvedValue({
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174008',
          title: 'Related Guide',
          slug: 'related-guide',
        },
      ],
      error: null,
    });

    const response = await callGuidesDetail('test-guide');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.guide.title).toBe('Test Guide');
    expect(json.data.guide.content).toBe('<p>Test content</p>');
    expect(json.data.relatedGuides).toHaveLength(1);
    expect(json.data.relatedGuides[0].title).toBe('Related Guide');
  });

  it('should return 404 for non-existent guide', async () => {
    mockSupabase._mocks.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const response = await callGuidesDetail('non-existent');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for missing slug', async () => {
    const request = createMockRequest('http://localhost/api/guides/');
    const context = createMockContext(request, { slug: '' });

    const { GET } = await import('@/pages/api/guides/[slug]');
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

    const response = await callGuidesDetail('test-guide');
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });
});
