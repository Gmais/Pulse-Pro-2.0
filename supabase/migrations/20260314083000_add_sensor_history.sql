-- Adicionar coluna last_student_ids à tabela sensors
ALTER TABLE public.sensors ADD COLUMN IF NOT EXISTS last_student_ids jsonb DEFAULT '[]'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.sensors.last_student_ids IS 'Lista dos últimos 2 IDs de alunos que utilizaram este sensor, ordenados do mais recente para o mais antigo.';
