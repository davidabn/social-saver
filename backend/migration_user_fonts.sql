-- Migração: Criar tabela user_fonts para armazenar fontes personalizadas do usuário
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  family_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_format VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, family_name)
);

-- Índice para buscar fontes por usuário
CREATE INDEX IF NOT EXISTS idx_user_fonts_user ON user_fonts(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_fonts ENABLE ROW LEVEL SECURITY;

-- Política: usuário só pode ver suas próprias fontes
CREATE POLICY "Users can view own fonts" ON user_fonts
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuário só pode inserir suas próprias fontes
CREATE POLICY "Users can insert own fonts" ON user_fonts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuário só pode deletar suas próprias fontes
CREATE POLICY "Users can delete own fonts" ON user_fonts
  FOR DELETE USING (auth.uid() = user_id);
