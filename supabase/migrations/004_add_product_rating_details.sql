-- 004_add_product_rating_details.sql
-- Product rating and long-form description blocks.
--
-- The application already SELECTs these columns (PRODUCT_COLUMNS in
-- src/lib/api/fetchers.ts) and maps `details` into { whatIs, purpose, forWhom }
-- blocks. This migration makes that contract reproducible from a clean or CI
-- database instead of relying on columns that were added out of band.
--
-- Fully additive and idempotent: nothing is dropped, rewritten or backfilled
-- with fabricated data, and re-running the file is a no-op.

-- ============================================================
-- PRODUCTS
-- ============================================================
-- rating and rating_count stay NULL until real reviews exist. The product page
-- renders the rating only when rating_count > 0, so NULL means "no rating",
-- never "0 stars".
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1);

ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_count INTEGER;

-- details: { whatIs, purpose, forWhom }. Unknown keys are ignored by mapDetails.
ALTER TABLE products ADD COLUMN IF NOT EXISTS details JSONB;
