/// ============================================================
/// tests/api/upload.test.ts - Integration tests for upload API
/// Task 2.17
/// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSharedMockSupabase, createMockContext, resetMocks } from './setup';

vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = getSharedMockSupabase();
  return {
    default: mockSupabase,
    __mockSupabase: mockSupabase,
  };
});

// The upload route always uses the service-role client via `createClient`
// (@supabase/supabase-js), never the default `@/lib/supabase/client` export.
// Point it at the same mock instance so storage stubs apply.
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => getSharedMockSupabase()),
}));

import supabase from '@/lib/supabase/client';
const mockSupabase = (supabase as any).__mockSupabase;

async function callUpload(file: File, fileName?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (fileName) {
    formData.append('fileName', fileName);
  }

  const request = new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });

  const context = createMockContext(request);

  const { POST } = await import('@/pages/api/upload');
  return POST(context);
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  it('should upload image and return signed URL on happy path', async () => {
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    mockSupabase._mocks.storage.from().upload.mockResolvedValue({
      data: { path: 'product-images/test-uuid.jpg' },
      error: null,
    });
    mockSupabase._mocks.storage.from().createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    });

    const response = await callUpload(file, 'test.jpg');
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.url).toBe('https://example.com/signed-url');
    expect(json.data.path).toContain('product-images/');
    expect(json.data.expiresIn).toBe(3600);
    expect(json.data.mimeType).toBe('image/jpeg');
  });

  it('should return 400 when no file provided', async () => {
    const formData = new FormData();
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });
    const context = createMockContext(request);

    const { POST } = await import('@/pages/api/upload');
    const response = await POST(context);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for file too large', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    const response = await callUpload(largeFile);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('demasiado grande');
  });

  it('should return 400 for non-image file', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    const response = await callUpload(file);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toContain('debe ser una imagen');
  });

  it('should handle upload error', async () => {
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    mockSupabase._mocks.storage.from().upload.mockResolvedValue({
      data: null,
      error: { message: 'Storage error' },
    });

    const response = await callUpload(file);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });

  it('should handle signed URL error', async () => {
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    mockSupabase._mocks.storage.from().upload.mockResolvedValue({
      data: { path: 'product-images/test-uuid.jpg' },
      error: null,
    });
    mockSupabase._mocks.storage.from().createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Signed URL error' },
    });

    const response = await callUpload(file);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });

  it('should generate .webp extension by default', async () => {
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    mockSupabase._mocks.storage.from().upload.mockResolvedValue({
      data: { path: 'product-images/test-uuid.webp' },
      error: null,
    });
    mockSupabase._mocks.storage.from().createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    });

    const response = await callUpload(file); // no fileName provided
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.path).toContain('.webp');
  });
});
