// Database types generated from supabase/migrations/001_initial_schema.sql
// This file serves as the single source of truth for Supabase database types.
// Run `scripts/sync-types.ts` to regenerate from live Supabase project.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          image: string;
          product_ids: string[];
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          seo_canonical: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          image: string;
          product_ids?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          image?: string;
          product_ids?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          short_description: string;
          price: number;
          compare_at_price: number | null;
          currency: 'USD' | 'ARS' | 'EUR';
          category_id: string;
          images: string[];
          specs: Json;
          features: string[];
          availability: 'in-stock' | 'limited' | 'out-of-stock';
          featured: boolean;
          best_seller: boolean;
          kit_only: boolean;
          whatsapp_message: string;
          tags: string[];
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          seo_canonical: string | null;
          related_product_ids: string[];
          battery_wh: number | null;
          rating: number | null;
          rating_count: number | null;
          details: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          short_description: string;
          price: number;
          compare_at_price?: number | null;
          currency?: 'USD' | 'ARS' | 'EUR';
          category_id: string;
          images?: string[];
          specs?: Json;
          features?: string[];
          availability?: 'in-stock' | 'limited' | 'out-of-stock';
          featured?: boolean;
          best_seller?: boolean;
          kit_only?: boolean;
          whatsapp_message: string;
          tags?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          related_product_ids?: string[];
          battery_wh?: number | null;
          rating?: number | null;
          rating_count?: number | null;
          details?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          short_description?: string;
          price?: number;
          compare_at_price?: number | null;
          currency?: 'USD' | 'ARS' | 'EUR';
          category_id?: string;
          images?: string[];
          specs?: Json;
          features?: string[];
          availability?: 'in-stock' | 'limited' | 'out-of-stock';
          featured?: boolean;
          best_seller?: boolean;
          kit_only?: boolean;
          whatsapp_message?: string;
          tags?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          related_product_ids?: string[];
          battery_wh?: number | null;
          rating?: number | null;
          rating_count?: number | null;
          details?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      solutions: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          icon: string;
          product_ids: string[];
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          seo_canonical: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          icon: string;
          product_ids?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          icon?: string;
          product_ids?: string[];
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kits: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          product_ids: string[];
          price: number;
          compare_at_price: number | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          seo_canonical: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          product_ids: string[];
          price: number;
          compare_at_price?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          product_ids?: string[];
          price?: number;
          compare_at_price?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          image: string;
          original_price: number;
          current_price: number;
          discount_percent: number;
          availability: 'in-stock' | 'limited' | 'out-of-stock';
          valid_until: string;
          currency: 'USD' | 'ARS' | 'EUR';
          whatsapp_message: string;
          product_slug: string;
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          image: string;
          original_price: number;
          current_price: number;
          discount_percent: number;
          availability?: 'in-stock' | 'limited' | 'out-of-stock';
          valid_until: string;
          currency?: 'USD' | 'ARS' | 'EUR';
          whatsapp_message: string;
          product_slug: string;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          image?: string;
          original_price?: number;
          current_price?: number;
          discount_percent?: number;
          availability?: 'in-stock' | 'limited' | 'out-of-stock';
          valid_until?: string;
          currency?: 'USD' | 'ARS' | 'EUR';
          whatsapp_message?: string;
          product_slug?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guides: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          image: string;
          content: string;
          product_ids: string[];
          read_time: number;
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          seo_canonical: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          image: string;
          content: string;
          product_ids?: string[];
          read_time?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          image?: string;
          content?: string;
          product_ids?: string[];
          read_time?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_canonical?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          created_at: string;
          updated_at: string;
          Relationships: [];
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      page_views: {
        Row: {
          id: string;
          path: string;
          referrer: string | null;
          user_agent: string | null;
          ip_hash: string | null;
          session_id: string | null;
          country_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          referrer?: string | null;
          user_agent?: string | null;
          ip_hash?: string | null;
          session_id?: string | null;
          country_code?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          referrer?: string | null;
          user_agent?: string | null;
          ip_hash?: string | null;
          session_id?: string | null;
          country_code?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      whatsapp_clicks: {
        Row: {
          id: string;
          product_id: string | null;
          product_slug: string;
          product_name: string;
          source_page: string;
          user_agent: string | null;
          ip_hash: string | null;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          product_slug: string;
          product_name: string;
          source_page: string;
          user_agent?: string | null;
          ip_hash?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          product_slug?: string;
          product_name?: string;
          source_page?: string;
          user_agent?: string | null;
          ip_hash?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversions: {
        Row: {
          id: string;
          order_id: string;
          items: Json;
          total_amount: number;
          total_margin: number | null;
          currency: 'USD' | 'ARS' | 'EUR';
          customer_phone: string | null;
          customer_name: string | null;
          status: string;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
          updated_at: string;
          Relationships: [];
        };
        Insert: {
          id?: string;
          order_id: string;
          items: Json;
          total_amount: number;
          total_margin?: number | null;
          currency?: 'USD' | 'ARS' | 'EUR';
          customer_phone?: string | null;
          customer_name?: string | null;
          status?: string;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          items?: Json;
          total_amount?: number;
          total_margin?: number | null;
          currency?: 'USD' | 'ARS' | 'EUR';
          customer_phone?: string | null;
          customer_name?: string | null;
          status?: string;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_margins: {
        Row: {
          id: string;
          product_id: string;
          cost_price: number;
          sale_price: number;
          margin_amount: number;
          margin_percent: number;
          currency: 'USD' | 'ARS' | 'EUR';
          effective_from: string;
          effective_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          cost_price: number;
          sale_price: number;
          currency?: 'USD' | 'ARS' | 'EUR';
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          cost_price?: number;
          sale_price?: number;
          currency?: 'USD' | 'ARS' | 'EUR';
          effective_from?: string;
          effective_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_email?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_email?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      verify_analytics_hmac: {
        Args: { p_payload: Json; p_signature: string; p_secret: string };
        Returns: boolean;
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      availability_enum: 'in-stock' | 'limited' | 'out-of-stock';
      currency_enum: 'USD' | 'ARS' | 'EUR';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Row'];

export type InsertTables<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Insert'];

export type UpdateTables<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Update'];

export type Enums<EnumName extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][EnumName];

// Convenience types
export type Product = Tables<'products'>;
export type ProductInsert = InsertTables<'products'>;
export type ProductUpdate = UpdateTables<'products'>;

export type Category = Tables<'categories'>;
export type CategoryInsert = InsertTables<'categories'>;
export type CategoryUpdate = UpdateTables<'categories'>;

export type Solution = Tables<'solutions'>;
export type SolutionInsert = InsertTables<'solutions'>;
export type SolutionUpdate = UpdateTables<'solutions'>;

export type Kit = Tables<'kits'>;
export type KitInsert = InsertTables<'kits'>;
export type KitUpdate = UpdateTables<'kits'>;

export type Offer = Tables<'offers'>;
export type OfferInsert = InsertTables<'offers'>;
export type OfferUpdate = UpdateTables<'offers'>;

export type Guide = Tables<'guides'>;
export type GuideInsert = InsertTables<'guides'>;
export type GuideUpdate = UpdateTables<'guides'>;

export type FAQ = Tables<'faqs'>;
export type FAQInsert = InsertTables<'faqs'>;
export type FAQUpdate = UpdateTables<'faqs'>;

export type PageView = Tables<'page_views'>;
export type PageViewInsert = InsertTables<'page_views'>;

export type WhatsAppClick = Tables<'whatsapp_clicks'>;
export type WhatsAppClickInsert = InsertTables<'whatsapp_clicks'>;

export type Conversion = Tables<'conversions'>;
export type ConversionInsert = InsertTables<'conversions'>;

export type ProductMargin = Tables<'product_margins'>;
export type ProductMarginInsert = InsertTables<'product_margins'>;

export type AuditLog = Tables<'audit_log'>;
export type AuditLogInsert = InsertTables<'audit_log'>;
