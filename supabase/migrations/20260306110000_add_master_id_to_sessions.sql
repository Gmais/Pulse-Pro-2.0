-- Adiciona master_id às sessões para identificar qual máquina é a fonte da verdade
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS master_id TEXT;
