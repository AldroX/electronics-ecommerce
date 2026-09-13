-- 003_storage.sql
-- Supabase Storage bucket for product images
-- Public read access, signed URLs for uploads

-- ============================================================
-- CREATE STORAGE BUCKET
-- ============================================================
-- Note: This migration assumes you run it via Supabase CLI or Dashboard
-- The bucket creation via SQL requires the storage extension

-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    TRUE,  -- public bucket for read access
    5242880,  -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Enable RLS on storage.objects (already enabled by default in Supabase)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read access for product-images bucket
CREATE POLICY "product_images_public_read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'product-images');

-- Service role (admin) can upload, update, delete
CREATE POLICY "product_images_admin_write" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

-- Authenticated users can upload to their own folder (optional, for future user uploads)
-- CREATE POLICY "product_images_auth_upload" ON storage.objects
--     FOR INSERT TO authenticated
--     WITH CHECK (
--         bucket_id = 'product-images' AND
--         (storage.foldername(name))[1] = auth.uid()::text
--     );

-- Signed URL generation is handled client-side via Supabase client
-- No additional policy needed - the client generates signed URLs with service_role key

-- ============================================================
-- HELPER FUNCTION FOR SIGNED UPLOAD URLS
-- ============================================================
-- This function can be called from Edge Functions or API routes
-- to generate signed upload URLs for direct browser uploads

CREATE OR REPLACE FUNCTION generate_product_image_upload_url(
    p_file_name TEXT,
    p_content_type TEXT,
    p_expires_in INTEGER DEFAULT 3600
) RETURNS TEXT AS $$
DECLARE
    v_signed_url TEXT;
BEGIN
    -- Generate a unique path: products/{uuid}/{filename}
    -- The actual signed URL generation happens via Supabase client
    -- This function returns the path that should be used
    RETURN 'products/' || gen_random_uuid()::text || '/' || p_file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION generate_product_image_upload_url(TEXT, TEXT, INTEGER) TO service_role;

-- ============================================================
-- NOTE: Signed URL generation is typically done client-side
-- using the Supabase JavaScript client:
--
-- const { data, error } = await supabase.storage
--   .from('product-images')
--   .createSignedUploadUrl('products/' + productId + '/' + fileName)
--
-- The signed URL allows direct browser upload without exposing
-- the service role key to the client.
-- ============================================================