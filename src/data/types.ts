export interface SEOData {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category: string;
  images: string[];
  specs: Record<string, string>;
  features: string[];
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  featured: boolean;
  bestSeller: boolean;
  kitOnly: boolean;
  whatsappMessage: string;
  tags: string[];
  seo: SEOData;
  relatedProducts: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: string[];
  seo: SEOData;
}

export interface Solution {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  products: string[];
  seo: SEOData;
}

export interface Kit {
  id: string;
  name: string;
  slug: string;
  description: string;
  products: string[];
  price: number;
  compareAtPrice?: number;
  seo: SEOData;
}
