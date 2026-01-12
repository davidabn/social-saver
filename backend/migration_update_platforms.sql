-- Atualizar a constraint de platform na tabela saved_contents
ALTER TABLE saved_contents DROP CONSTRAINT IF EXISTS saved_contents_platform_check;
ALTER TABLE saved_contents ADD CONSTRAINT saved_contents_platform_check CHECK (platform IN ('instagram', 'tiktok', 'youtube'));

-- Atualizar a constraint de platform na tabela monitored_profiles
ALTER TABLE monitored_profiles DROP CONSTRAINT IF EXISTS monitored_profiles_platform_check;
ALTER TABLE monitored_profiles ADD CONSTRAINT monitored_profiles_platform_check CHECK (platform IN ('instagram', 'tiktok', 'youtube'));

-- Atualizar a constraint de platform na tabela feed_items
ALTER TABLE feed_items DROP CONSTRAINT IF EXISTS feed_items_platform_check;
ALTER TABLE feed_items ADD CONSTRAINT feed_items_platform_check CHECK (platform IN ('instagram', 'tiktok', 'youtube'));
