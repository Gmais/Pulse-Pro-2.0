
-- Professors table
CREATE TABLE public.professors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  bio TEXT,
  avatar_url TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add professor_id to class_sessions
ALTER TABLE public.class_sessions ADD COLUMN professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (public access matching other tables)
CREATE POLICY "Allow all on professors" ON public.professors FOR ALL USING (true) WITH CHECK (true);
