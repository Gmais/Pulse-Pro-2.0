-- Add student_ids column to challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS student_ids UUID[] DEFAULT '{}';

-- Update scope constraint to include 'collective'
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_scope_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_scope_check CHECK (scope IN ('team', 'individual', 'collective'));
