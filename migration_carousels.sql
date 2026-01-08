-- Migration: Criar tabela carousels para persistir designs de carrossel
-- Execute este SQL no Supabase SQL Editor

-- Tabela principal
CREATE TABLE IF NOT EXISTS carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Sem título',
  data JSONB NOT NULL,  -- Armazena design + headerTexts + templateId + customPalette
  thumbnail_url TEXT,   -- Preview do primeiro slide (opcional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar carrosseis do usuário rapidamente
CREATE INDEX IF NOT EXISTS idx_carousels_user_id ON carousels(user_id);

-- Índice para ordenar por data de atualização
CREATE INDEX IF NOT EXISTS idx_carousels_updated_at ON carousels(updated_at DESC);

-- Habilitar Row Level Security
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;

-- Política: usuário só pode ver/editar seus próprios carrosseis
DROP POLICY IF EXISTS "Users can CRUD own carousels" ON carousels;
CREATE POLICY "Users can CRUD own carousels" ON carousels
  FOR ALL USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em cada UPDATE
DROP TRIGGER IF EXISTS carousels_updated_at ON carousels;
CREATE TRIGGER carousels_updated_at
  BEFORE UPDATE ON carousels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE carousels IS 'Armazena designs de carrossel do Instagram';
COMMENT ON COLUMN carousels.data IS 'JSON com design, headerTexts, templateId e customPalette';
COMMENT ON COLUMN carousels.thumbnail_url IS 'URL da imagem de preview do primeiro slide';
