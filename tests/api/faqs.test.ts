/// ============================================================
/// tests/api/faqs.test.ts - Integration tests for faqs API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockFAQ,
  createMockRequest,
  createMockContext,
  resetMocks,
  getSharedMockSupabase,
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

async function callFaqsList(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/faqs');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const request = createMockRequest(url.toString());
  const context = createMockContext(request);

  const { GET } = await import('@/pages/api/faqs');
  return GET(context);
}

describe('GET /api/faqs', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should return grouped FAQs on happy path', async () => {
    mockSupabase._mocks.select.mockResolvedValue({
      data: [
        mockFAQ,
        { ...mockFAQ, id: '123e4567-e89b-12d3-a456-426614174009', question: 'Entrega question?' },
      ],
      error: null,
      count: 2,
    });

    const response = await callFaqsList({ page: '1', limit: '12' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.data).toBeDefined();
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(json.data.totalCount).toBe(2);
  });

  it('should return 400 for invalid query params', async () => {
    const response = await callFaqsList({ page: 'invalid' });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 500 on Supabase error', async () => {
    mockSupabase._mocks.select.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
      count: 0,
    });

    const response = await callFaqsList({});
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });
});
