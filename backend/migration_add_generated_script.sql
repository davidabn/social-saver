-- Adiciona a coluna generated_script na tabela saved_contents para persistir o roteiro gerado
ALTER TABLE saved_contents 
ADD COLUMN IF NOT EXISTS generated_script TEXT;
