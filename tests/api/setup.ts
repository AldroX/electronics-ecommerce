/// ============================================================
/// tests/api/setup.ts - Test setup and mocks
/// ============================================================

import { vi } from 'vitest';

// Shared mock instance
let sharedMockSupabase: ReturnType<typeof createMockSupabase> | null = null;

export function getSharedMockSupabase() {
  if (!sharedMockSupabase) {
    sharedMockSupabase = createMockSupabase();
  }
  return sharedMockSupabase;
}

// Mock Supabase client
export const createMockSupabase = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockIn = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockIlike = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockOverlaps = vi.fn().mockReturnThis();
  const mockNeq = vi.fn().mockReturnThis();
  const mockGt = vi.fn().mockReturnThis();

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    eq: mockEq,
    in: mockIn,
    gte: mockGte,
    lte: mockLte,
    ilike: mockIlike,
    order: mockOrder,
    range: mockRange,
    limit: mockLimit,
    single: mockSingle,
    overlaps: mockOverlaps,
    neq: mockNeq,
    gt: mockGt,
  }));

  const mockStorage = {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      createSignedUrl: vi
        .fn()
        .mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-url' }, error: null }),
    })),
  };

  const mockRpc = vi.fn();

  return {
    from: mockFrom,
    storage: mockStorage,
    rpc: mockRpc,
    // Mock functions for testing
    _mocks: {
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      order: mockOrder,
      range: mockRange,
      limit: mockLimit,
      single: mockSingle,
      overlaps: mockOverlaps,
      neq: mockNeq,
      gt: mockGt,
      from: mockFrom,
      storage: mockStorage,
      rpc: mockRpc,
    },
  };
};

// Mock product data
export const mockProduct = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  short_description: 'Short description',
  price: 1000,
  compare_at_price: 1200,
  currency: 'ARS',
  category_id: 'cat-123',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  specs: { potencia: '100W', bateriaWh: '500' },
  features: ['feature1', 'feature2'],
  availability: 'in-stock',
  featured: true,
  best_seller: false,
  kit_only: false,
  whatsapp_message: 'Hola, estoy interesado en Test Product. ¿Está disponible?',
  tags: ['tag1', 'tag2'],
  seo_title: 'Test Product SEO',
  seo_description: 'Test Product SEO Description',
  seo_image: 'https://example.com/seo.jpg',
  seo_canonical: 'https://example.com/test-product',
  related_product_ids: ['456e4567-e89b-12d3-a456-426614174000'],
  battery_wh: 500,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock category data
export const mockCategory = {
  id: 'cat-123',
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  image: 'https://example.com/cat.jpg',
  product_ids: ['123e4567-e89b-12d3-a456-426614174000'],
  seo_title: 'Test Category SEO',
  seo_description: 'Test Category SEO Description',
  seo_image: 'https://example.com/cat-seo.jpg',
  seo_canonical: 'https://example.com/test-category',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock solution data
export const mockSolution = {
  id: 'sol-123',
  name: 'Test Solution',
  slug: 'test-solution',
  description: 'Test solution description',
  icon: 'icon-test',
  product_ids: ['123e4567-e89b-12d3-a456-426614174000'],
  seo_title: 'Test Solution SEO',
  seo_description: 'Test Solution SEO Description',
  seo_image: 'https://example.com/sol-seo.jpg',
  seo_canonical: 'https://example.com/test-solution',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock kit data
export const mockKit = {
  id: 'kit-123',
  name: 'Test Kit',
  slug: 'test-kit',
  description: 'Test kit description',
  product_ids: ['123e4567-e89b-12d3-a456-426614174000'],
  price: 800,
  compare_at_price: 1000,
  seo_title: 'Test Kit SEO',
  seo_description: 'Test Kit SEO Description',
  seo_image: 'https://example.com/kit-seo.jpg',
  seo_canonical: 'https://example.com/test-kit',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock offer data
export const mockOffer = {
  id: 'off-123',
  name: 'Test Offer',
  slug: 'test-offer',
  description: 'Test offer description',
  image: 'https://example.com/off.jpg',
  original_price: 1000,
  current_price: 800,
  discount_percent: 20,
  availability: 'in-stock',
  valid_until: '2025-12-31T23:59:59Z',
  currency: 'ARS',
  whatsapp_message: 'Hola, estoy interesado en Test Offer. ¿Está disponible?',
  product_slug: 'test-product',
  seo_title: 'Test Offer SEO',
  seo_description: 'Test Offer SEO Description',
  seo_image: 'https://example.com/off-seo.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock guide data
export const mockGuide = {
  id: 'gui-123',
  title: 'Test Guide',
  slug: 'test-guide',
  description: 'Test guide description',
  image: 'https://example.com/gui.jpg',
  content: '<p>Test content</p>',
  product_ids: ['123e4567-e89b-12d3-a456-426614174000'],
  read_time: 5,
  seo_title: 'Test Guide SEO',
  seo_description: 'Test Guide SEO Description',
  seo_image: 'https://example.com/gui-seo.jpg',
  seo_canonical: 'https://example.com/test-guide',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock FAQ data
export const mockFAQ = {
  id: 'faq-123',
  question: 'Test question?',
  answer: 'Test answer',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Helper to create mock request
export function createMockRequest(url: string, options?: RequestInit): Request {
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
}

// Helper to create mock context
export function createMockContext(request: Request, params: Record<string, string> = {}) {
  return {
    request,
    params,
    url: new URL(request.url),
    site: new URL('http://localhost'),
    generator: 'test',
    clientAddress: '127.0.0.1',
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      keys: vi.fn(),
    },
    locals: {},
    redirect: vi.fn(),
    rewrite: vi.fn(),
    isPrerendered: false,
    canonicalURL: new URL('http://localhost'),
  } as any;
}

// Reset all mocks
export function resetMocks() {
  const mockSupabase = getSharedMockSupabase();
  Object.values(mockSupabase._mocks).forEach((mock: any) => {
    if (typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
  });
}
