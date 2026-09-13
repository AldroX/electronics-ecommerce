/// ============================================================
/// tests/api/kits.test.ts - Integration tests for kits API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockSupabase,
  mockKit,
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

async function callKitsList(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/kits');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request);

  const { GET } = await import('@/pages/api/kits');
  return GET(context);
}

describe('GET /api/kits', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return kits on happy path', async () => {
    mockSupabase._mocks.range.mockResolvedValue({
      data: [{ ...mockKit, products: [mockProduct] }],
      error: null,
      count: 1,
    });

    const response = await callKitsList({ page: '1', limit: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.data).toHaveLength(1);
    expect(json.data.data[0].name).toBe('Test Kit');
    expect(json.data.data[0].discount).toBe('20');
    expect(json.data.data[0].productCount).toBe(1);
  });

  it('should return 400 for invalid query params', async () => {
    const response = await callKitsList({ page: 'invalid' });
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

    const response = await callKitsList({});
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});
