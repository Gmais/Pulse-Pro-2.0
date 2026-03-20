-- Add professor_id to class_participants table
ALTER TABLE public.class_participants ADD COLUMN professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL;
