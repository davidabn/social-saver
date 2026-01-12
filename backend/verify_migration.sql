-- Script para verificar se a coluna generated_script existe
-- Execute este script no Supabase SQL Editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_contents' 
  AND column_name = 'generated_script';

-- Se o resultado estiver vazio, execute a migração abaixo:
-- ALTER TABLE saved_contents ADD COLUMN IF NOT EXISTS generated_script TEXT;
