import {
  ProductListResponseSchema,
  type ProductListQuery,
  type ProductListResponse,
  type CategoryQuery,
  type OfferListQuery,
  type GuideQuery,
} from '@/lib/api/validation';

/**
 * Type-safe fetch for products API with Zod response validation.
 */
export async function fetchProducts(params: ProductListQuery) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) {
      searchParams.set(k, Array.isArray(v) ? v.join(',') : String(v));
    }
  });

  const res = await fetch(`/api/products?${searchParams}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  return ProductListResponseSchema.parse(await res.json());
}

/**
 * Type-safe fetch for categories API.
 */
export async function fetchCategories(params?: CategoryQuery) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.set(k, String(v));
    });
  }

  const res = await fetch(`/api/categories?${searchParams}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Type-safe fetch for solutions API.
 */
export async function fetchSolutions(params?: CategoryQuery) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.set(k, String(v));
    });
  }

  const res = await fetch(`/api/solutions?${searchParams}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Type-safe fetch for kits API.
 */
export async function fetchKits(params?: CategoryQuery) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.set(k, String(v));
    });
  }

  const res = await fetch(`/api/kits?${searchParams}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Type-safe fetch for offers API.
 */
export async function fetchOffers(params: OfferListQuery) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) {
      searchParams.set(k, Array.isArray(v) ? v.join(',') : String(v));
    }
  });

  const res = await fetch(`/api/offers?${searchParams}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Type-safe fetch for guides API.
 */
export async function fetchGuides(params?: GuideQuery) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.set(k, String(v));
    });
  }

  const res = await fetch(`/api/guides?${searchParams}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}

/**
 * Type-safe fetch for FAQs API.
 */
export async function fetchFaqs() {
  const res = await fetch(`/api/faqs`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}
