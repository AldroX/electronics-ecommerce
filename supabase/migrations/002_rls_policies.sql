-- 002_rls_policies.sql
-- Row Level Security policies for electronics-ecommerce
-- Public read for published content, service-role write for admin, anon insert for analytics

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_margins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ POLICIES (anon role)
-- ============================================================

-- Categories: public read all
CREATE POLICY "categories_public_read" ON categories
    FOR SELECT TO anon
    USING (TRUE);

-- Products: public read all (we don't have a published flag yet, all are public)
CREATE POLICY "products_public_read" ON products
    FOR SELECT TO anon
    USING (TRUE);

-- Solutions: public read all
CREATE POLICY "solutions_public_read" ON solutions
    FOR SELECT TO anon
    USING (TRUE);

-- Kits: public read all
CREATE POLICY "kits_public_read" ON kits
    FOR SELECT TO anon
    USING (TRUE);

-- Offers: public read only valid (not expired) offers
CREATE POLICY "offers_public_read_valid" ON offers
    FOR SELECT TO anon
    USING (valid_until > NOW());

-- Guides: public read all
CREATE POLICY "guides_public_read" ON guides
    FOR SELECT TO anon
    USING (TRUE);

-- FAQs: public read all
CREATE POLICY "faqs_public_read" ON faqs
    FOR SELECT TO anon
    USING (TRUE);

-- ============================================================
-- ADMIN WRITE POLICIES (service_role)
-- ============================================================
-- service_role bypasses RLS by default, but we define explicit policies for clarity

-- Categories: service_role full access
CREATE POLICY "categories_admin_all" ON categories
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Products: service_role full access
CREATE POLICY "products_admin_all" ON products
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Solutions: service_role full access
CREATE POLICY "solutions_admin_all" ON solutions
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Kits: service_role full access
CREATE POLICY "kits_admin_all" ON kits
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Offers: service_role full access
CREATE POLICY "offers_admin_all" ON offers
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Guides: service_role full access
CREATE POLICY "guides_admin_all" ON guides
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- FAQs: service_role full access
CREATE POLICY "faqs_admin_all" ON faqs
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Product margins: service_role full access
CREATE POLICY "product_margins_admin_all" ON product_margins
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Audit log: service_role full access
CREATE POLICY "audit_log_admin_all" ON audit_log
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================
-- ANALYTICS INSERT POLICIES (anon with HMAC verification)
-- ============================================================

-- page_views: anon can insert, but we validate HMAC in the policy
-- Note: The HMAC secret should be stored in Supabase Vault or as a database function
-- For now, we allow anon insert with basic validation
CREATE POLICY "page_views_anon_insert" ON page_views
    FOR INSERT TO anon
    WITH CHECK (
        -- Basic validation: path is not empty, created_at is recent (within 1 hour)
        path IS NOT NULL AND path != '' AND
        created_at > NOW() - INTERVAL '1 hour' AND
        created_at < NOW() + INTERVAL '1 minute'
    );

-- whatsapp_clicks: anon can insert with basic validation
CREATE POLICY "whatsapp_clicks_anon_insert" ON whatsapp_clicks
    FOR INSERT TO anon
    WITH CHECK (
        product_slug IS NOT NULL AND product_slug != '' AND
        product_name IS NOT NULL AND product_name != '' AND
        source_page IS NOT NULL AND source_page != '' AND
        created_at > NOW() - INTERVAL '1 hour' AND
        created_at < NOW() + INTERVAL '1 minute'
    );

-- conversions: only service_role can insert (server-side webhook with HMAC)
CREATE POLICY "conversions_service_insert" ON conversions
    FOR INSERT TO service_role
    WITH CHECK (TRUE);

-- conversions: service_role can update (status changes)
CREATE POLICY "conversions_service_update" ON conversions
    FOR UPDATE TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================
-- HMAC VERIFICATION FUNCTION FOR ANALYTICS (Optional Enhancement)
-- ============================================================
-- This function can be used to verify HMAC signatures from client-side events
-- The secret should be stored securely (Supabase Vault or environment variable)

CREATE OR REPLACE FUNCTION verify_analytics_hmac(
    p_payload JSONB,
    p_signature TEXT,
    p_secret TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_expected_signature TEXT;
BEGIN
    -- In production, use HMAC-SHA256 with the secret
    -- This is a placeholder - implement proper HMAC verification
    -- v_expected_signature := encode(hmac(p_secret::bytea, p_payload::text::bytea, 'sha256'), 'hex');
    -- RETURN p_signature = v_expected_signature;
    RETURN TRUE; -- Placeholder: always allow for development
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
-- anon role gets SELECT on all public tables
GRANT SELECT ON categories, products, solutions, kits, offers, guides, faqs TO anon;
GRANT INSERT ON page_views, whatsapp_clicks TO anon;

-- authenticated role (if used) gets same as anon for public data
GRANT SELECT ON categories, products, solutions, kits, offers, guides, faqs TO authenticated;
GRANT INSERT ON page_views, whatsapp_clicks TO authenticated;

-- service_role already has full access via policies