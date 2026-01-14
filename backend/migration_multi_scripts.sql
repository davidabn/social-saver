-- Migration to add multi-script support
-- 1. Add generated_scripts JSONB column
ALTER TABLE saved_contents 
ADD COLUMN IF NOT EXISTS generated_scripts JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing script data (optional but good practice)
-- If generated_script has content, move it to the scripts object using the current content_type
UPDATE saved_contents 
SET generated_scripts = jsonb_build_object(content_type, generated_script)
WHERE generated_script IS NOT NULL 
AND (generated_scripts IS NULL OR generated_scripts = '{}'::jsonb);
