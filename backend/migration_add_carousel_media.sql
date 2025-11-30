-- Run this SQL in your Supabase SQL Editor to add the new column for rich media support

ALTER TABLE saved_contents 
ADD COLUMN IF NOT EXISTS carousel_media JSONB DEFAULT NULL;

-- Optional: Add a comment description
COMMENT ON COLUMN saved_contents.carousel_media IS 'Stores rich media structure for carousels (video/image types and URLs)';
