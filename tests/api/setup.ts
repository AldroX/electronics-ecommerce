/// ============================================================
/// tests/api/setup.ts - Test setup and mocks
/// ============================================================

import { vi } from 'vitest';

// Every query-builder method the routes chain together. Each one is a vi.fn()
// so tests can assert calls (`toHaveBeenCalledWith`) and stub terminal
// responses (`mockResolvedValue`). By default every method returns the shared
// `builder` object, mirroring the real Supabase client where
// `.from().select().eq().in().range()` all return the same chainable query
// builder. A test that stubs a method (e.g. `range.mockResolvedValue(...)`)
// overrides the default for that method, so the terminal `await` in the route
// resolves to the stubbed `{ data, error, count }`.
const BUILDER_METHODS = [
  'select',
  'eq',
  'neq',
  'in',
  'ilike',
  'gte',
  'lte',
  'gt',
  'order',
  'range',
  'limit',
  'single',
  'maybeSingle',
  'overlaps',
  'returns',
  'insert',
  'update',
  'delete',
] as const;

// All mock clients created in this file (vitest gives each test file its own
// module registry, so this list only ever holds that file's instances).
const mockInstances: any[] = [];

// Shared mock instance
let sharedMockSupabase: any = null;

export function getSharedMockSupabase() {
  if (!sharedMockSupabase) {
    sharedMockSupabase = createMockSupabase();
  }
  return sharedMockSupabase;
}

// Realistic UUIDs for every fixture. API response schemas validate `id` with
// `z.string().uuid()`, so plain ids like "cat-123" fail response validation.
const PRODUCT_ID = '123e4567-e89b-12d3-a456-426614174000';
const RELATED_PRODUCT_ID = '456e4567-e89b-12d3-a456-426614174001';
const CATEGORY_ID = '123e4567-e89b-12d3-a456-426614174002';
const SOLUTION_ID = '123e4567-e89b-12d3-a456-426614174003';
const KIT_ID = '123e4567-e89b-12d3-a456-426614174004';
const OFFER_ID = '123e4567-e89b-12d3-a456-426614174005';
const GUIDE_ID = '123e4567-e89b-12d3-a456-426614174006';
const FAQ_ID = '123e4567-e89b-12d3-a456-426614174007';
const RELATED_GUIDE_ID = '123e4567-e89b-12d3-a456-426614174008';
const SECOND_FAQ_ID = '123e4567-e89b-12d3-a456-426614174009';

// Mock Supabase client
export const createMockSupabase = () => {
  const methodMocks: Record<string, any> = {};
  const builder: any = {};

  for (const name of BUILDER_METHODS) {
    const mock = vi.fn();
    methodMocks[name] = mock;
    builder[name] = mock;
  }

  // Storage: a stable bucket object so `_mocks.storage.from().upload` stubs
  // the exact same object the route receives from `storage.from()`.
  const bucket = {
    upload: vi.fn(),
    createSignedUrl: vi.fn(),
  };
  const storageFrom = vi.fn();
  const storage = { from: storageFrom };

  const mockFrom = vi.fn();
  const mockRpc = vi.fn();

  let lastTable: string | null = null;

  // Routes sometimes await the chain *without* a stubbed terminal, e.g.
  // `await supabase.from('faqs').select('*')` or the category-id lookup in the
  // products list (`...maybeSingle().returns()`). In those cases the awaited
  // value falls through to the builder's thenable. Stubbed terminal mocks
  // short-circuit this because they return a real Promise.
  builder.then = (onFulfilled?: any, onRejected?: any) => {
    const response = resolveDefaultTerminal();
    return Promise.resolve(response).then(onFulfilled, onRejected);
  };

  function resolveDefaultTerminal() {
    // The products list resolves a category slug -> category id before
    // filtering on category_id. Hand back the mock category row so the route's
    // `.eq('category_id', row.id)` branch is exercised without an explicit stub.
    if (lastTable === 'categories') {
      return { data: { ...mockCategory }, error: null };
    }
    return { data: null, error: null, count: 0 };
  }

  // (Re)install the default behaviors. `resetMocks()` calls this so a
  // `mockReset()` (which wipes implementations and stubbed resolutions) never
  // leaves the builder unchainable or the storage defaults missing.
  function installDefaults() {
    for (const name of BUILDER_METHODS) {
      methodMocks[name].mockReset().mockImplementation(() => builder);
    }
    mockFrom.mockReset().mockImplementation((table: string) => {
      lastTable = table;
      return builder;
    });
    mockRpc.mockReset();
    storageFrom.mockReset().mockImplementation(() => bucket);
    bucket.upload.mockReset().mockResolvedValue({ data: { path: 'test-path' }, error: null });
    bucket.createSignedUrl
      .mockReset()
      .mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-url' }, error: null });
    lastTable = null;
  }

  const mockSupabase: any = {
    from: mockFrom,
    storage,
    rpc: mockRpc,
    // Mock functions for testing
    _mocks: {
      ...methodMocks,
      from: mockFrom,
      storage,
      rpc: mockRpc,
    },
    _reset: installDefaults,
  };
  mockSupabase.__mockSupabase = mockSupabase;

  installDefaults();
  mockInstances.push(mockSupabase);
  return mockSupabase;
};

// Mock product data. Carries BOTH the snake_case DB row shape the detail route
// reads directly and the camelCase shape `createProductListItem` (and the
// ProductListItemSchema) expect.
export const mockProduct = {
  id: PRODUCT_ID,
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  short_description: 'Short description',
  shortDescription: 'Short description',
  price: 1000,
  compare_at_price: 1200,
  compareAtPrice: 1200,
  currency: 'ARS',
  category_id: CATEGORY_ID,
  category: 'energia-solar',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  specs: { potencia: '100W', bateriaWh: '500' },
  features: ['feature1', 'feature2'],
  availability: 'in-stock',
  featured: true,
  best_seller: false,
  bestSeller: false,
  kit_only: false,
  kitOnly: false,
  whatsapp_message: 'Hola, estoy interesado en Test Product. ¿Está disponible?',
  whatsappMessage: 'Hola, estoy interesado en Test Product. ¿Está disponible?',
  tags: ['tag1', 'tag2'],
  seo_title: 'Test Product SEO',
  seo_description: 'Test Product SEO Description',
  seo_image: 'https://example.com/seo.jpg',
  seo_canonical: 'https://example.com/test-product',
  related_product_ids: [RELATED_PRODUCT_ID],
  battery_wh: 500,
  batteryWh: 500,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock category data
export const mockCategory = {
  id: CATEGORY_ID,
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  image: 'https://example.com/cat.jpg',
  product_ids: [PRODUCT_ID],
  seo_title: 'Test Category SEO',
  seo_description: 'Test Category SEO Description',
  seo_image: 'https://example.com/cat-seo.jpg',
  seo_canonical: 'https://example.com/test-category',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock solution data
export const mockSolution = {
  id: SOLUTION_ID,
  name: 'Test Solution',
  slug: 'test-solution',
  description: 'Test solution description',
  icon: 'icon-test',
  product_ids: [PRODUCT_ID],
  seo_title: 'Test Solution SEO',
  seo_description: 'Test Solution SEO Description',
  seo_image: 'https://example.com/sol-seo.jpg',
  seo_canonical: 'https://example.com/test-solution',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock kit data
export const mockKit = {
  id: KIT_ID,
  name: 'Test Kit',
  slug: 'test-kit',
  description: 'Test kit description',
  product_ids: [PRODUCT_ID],
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
  id: OFFER_ID,
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
  id: GUIDE_ID,
  title: 'Test Guide',
  slug: 'test-guide',
  description: 'Test guide description',
  image: 'https://example.com/gui.jpg',
  content: '<p>Test content</p>',
  product_ids: [PRODUCT_ID],
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
  id: FAQ_ID,
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

// Reset all mocks (every instance created in this test file)
export function resetMocks() {
  for (const instance of mockInstances) {
    if (typeof instance._reset === 'function') {
      instance._reset();
    }
  }
}
