-- 001_initial_schema.sql
-- Initial schema for electronics-ecommerce
-- 7 entity tables + analytics tables + admin audit_log table

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE availability_enum AS ENUM ('in-stock', 'limited', 'out-of-stock');
CREATE TYPE currency_enum AS ENUM ('USD', 'ARS', 'EUR');

-- ============================================================
-- ENTITY TABLES
-- ============================================================

-- categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    product_ids UUID[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    seo_image TEXT,
    seo_canonical TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    short_description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price > 0),
    currency currency_enum NOT NULL DEFAULT 'USD',
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    images TEXT[] NOT NULL DEFAULT '{}',
    specs JSONB NOT NULL DEFAULT '{}',
    features TEXT[] NOT NULL DEFAULT '{}',
    availability availability_enum NOT NULL DEFAULT 'in-stock',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    best_seller BOOLEAN NOT NULL DEFAULT FALSE,
    kit_only BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_message TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    seo_image TEXT,
    seo_canonical TEXT,
    related_product_ids UUID[] DEFAULT '{}',
    battery_wh INTEGER CHECK (battery_wh > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- solutions
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    product_ids UUID[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    seo_image TEXT,
    seo_canonical TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- kits
CREATE TABLE kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    product_ids UUID[] NOT NULL DEFAULT '{}',
    price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price > 0),
    seo_title TEXT,
    seo_description TEXT,
    seo_image TEXT,
    seo_canonical TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- offers
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    original_price NUMERIC(12, 2) NOT NULL CHECK (original_price > 0),
    current_price NUMERIC(12, 2) NOT NULL CHECK (current_price > 0),
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    availability availability_enum NOT NULL DEFAULT 'in-stock',
    valid_until TIMESTAMPTZ NOT NULL,
    currency currency_enum NOT NULL DEFAULT 'USD',
    whatsapp_message TEXT NOT NULL,
    product_slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    seo_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- guides
CREATE TABLE guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    content TEXT NOT NULL,
    product_ids UUID[] DEFAULT '{}',
    read_time INTEGER NOT NULL DEFAULT 0 CHECK (read_time >= 0),
    seo_title TEXT,
    seo_description TEXT,
    seo_image TEXT,
    seo_canonical TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- faqs
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS TABLES
-- ============================================================

-- page_views
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_hash TEXT, -- hashed IP for privacy
    session_id TEXT,
    country_code CHAR(2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- whatsapp_clicks
CREATE TABLE whatsapp_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_slug TEXT NOT NULL,
    product_name TEXT NOT NULL,
    source_page TEXT NOT NULL, -- e.g., '/producto/slug', '/productos', '/'
    user_agent TEXT,
    ip_hash TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- conversions
CREATE TABLE conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL UNIQUE,
    items JSONB NOT NULL, -- array of {product_id, product_slug, name, quantity, price, margin}
    total_amount NUMERIC(12, 2) NOT NULL,
    total_margin NUMERIC(12, 2),
    currency currency_enum NOT NULL DEFAULT 'USD',
    customer_phone TEXT,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, shipped, cancelled
    source TEXT, -- 'whatsapp', 'web', 'phone'
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- product_margins
CREATE TABLE product_margins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    cost_price NUMERIC(12, 2) NOT NULL CHECK (cost_price >= 0),
    sale_price NUMERIC(12, 2) NOT NULL CHECK (sale_price > 0),
    margin_amount NUMERIC(12, 2) GENERATED ALWAYS AS (sale_price - cost_price) STORED,
    margin_percent NUMERIC(5, 2) GENERATED ALWAYS AS (CASE WHEN sale_price > 0 THEN ((sale_price - cost_price) / sale_price) * 100 ELSE 0 END) STORED,
    currency currency_enum NOT NULL DEFAULT 'USD',
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADMIN TABLES
-- ============================================================

-- audit_log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID, -- Supabase auth user ID
    actor_email TEXT,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', 'export'
    entity_type TEXT NOT NULL, -- 'products', 'categories', 'orders', etc.
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR QUERY PATTERNS
-- ============================================================

-- categories
CREATE INDEX idx_categories_created_at ON categories(created_at DESC);

-- products (main query patterns from design)
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_availability ON products(availability);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX idx_products_best_seller ON products(best_seller) WHERE best_seller = TRUE;
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_category_availability ON products(category_id, availability);
CREATE INDEX idx_products_category_featured ON products(category_id, featured) WHERE featured = TRUE;
CREATE INDEX idx_products_kit_only ON products(kit_only) WHERE kit_only = TRUE;
-- Full-text search index for product search (disabled for now)
-- CREATE INDEX idx_products_search ON products USING GIN (
--     to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_description, ''))
-- );

-- solutions
CREATE INDEX idx_solutions_created_at ON solutions(created_at DESC);

-- kits
CREATE INDEX idx_kits_created_at ON kits(created_at DESC);

-- offers
CREATE INDEX idx_offers_valid_until ON offers(valid_until);
CREATE INDEX idx_offers_availability ON offers(availability);
CREATE INDEX idx_offers_product_slug ON offers(product_slug);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);

-- guides
CREATE INDEX idx_guides_created_at ON guides(created_at DESC);
-- Full-text search for guides (disabled for now)
-- CREATE INDEX idx_guides_search ON guides USING GIN (
--     to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, ''))
-- );

-- faqs
CREATE INDEX idx_faqs_created_at ON faqs(created_at DESC);

-- page_views
CREATE INDEX idx_page_views_path ON page_views(path);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_path_created ON page_views(path, created_at DESC);

-- whatsapp_clicks
CREATE INDEX idx_whatsapp_clicks_product_slug ON whatsapp_clicks(product_slug);
CREATE INDEX idx_whatsapp_clicks_created_at ON whatsapp_clicks(created_at DESC);
CREATE INDEX idx_whatsapp_clicks_session_id ON whatsapp_clicks(session_id);
CREATE INDEX idx_whatsapp_clicks_product_source ON whatsapp_clicks(product_slug, source_page);

-- conversions
CREATE INDEX idx_conversions_created_at ON conversions(created_at DESC);
CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_conversions_order_id ON conversions(order_id);
CREATE INDEX idx_conversions_utm ON conversions(utm_source, utm_medium, utm_campaign);

-- product_margins
CREATE INDEX idx_product_margins_product_id ON product_margins(product_id);
CREATE INDEX idx_product_margins_effective ON product_margins(product_id, effective_from, effective_until);

-- audit_log
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON solutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kits_updated_at BEFORE UPDATE ON kits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guides_updated_at BEFORE UPDATE ON guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_margins_updated_at BEFORE UPDATE ON product_margins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();