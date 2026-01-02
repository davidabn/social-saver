-- Adiciona a coluna platform para identificar a origem do conteúdo (instagram ou tiktok)
ALTER TABLE saved_contents 
ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok'));

-- Atualiza os registros existentes para garantir que sejam marcados como instagram
UPDATE saved_contents SET platform = 'instagram' WHERE platform IS NULL;

-- Cria um índice para melhorar a performance de filtros por plataforma
CREATE INDEX IF NOT EXISTS idx_saved_contents_platform ON saved_contents(platform);
