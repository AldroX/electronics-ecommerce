import type { Database } from '@/lib/supabase/types';

/**
 * Type helper to extract row type from Database table
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Type helper to extract insert type from Database table
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Type helper to extract update type from Database table
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience types for common tables
export type ProductRow = TableRow<'products'>;
export type CategoryRow = TableRow<'categories'>;
export type SolutionRow = TableRow<'solutions'>;
export type KitRow = TableRow<'kits'>;
export type OfferRow = TableRow<'offers'>;
export type GuideRow = TableRow<'guides'>;
export type FAQRow = TableRow<'faqs'>;
export type PageViewRow = TableRow<'page_views'>;
export type WhatsAppClickRow = TableRow<'whatsapp_clicks'>;
export type ConversionRow = TableRow<'conversions'>;
export type ProductMarginRow = TableRow<'product_margins'>;
export type AuditLogRow = TableRow<'audit_log'>;
