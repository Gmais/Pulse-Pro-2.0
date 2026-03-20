
-- Turmas table
CREATE TABLE public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'hsl(210, 100%, 55%)'
);

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  age INTEGER NOT NULL DEFAULT 25,
  sex TEXT NOT NULL DEFAULT 'M' CHECK (sex IN ('M', 'F')),
  weight NUMERIC NOT NULL DEFAULT 70,
  fcm INTEGER NOT NULL DEFAULT 195,
  avatar_color TEXT NOT NULL DEFAULT 'hsl(210, 100%, 55%)',
  active BOOLEAN NOT NULL DEFAULT true,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  total_points NUMERIC NOT NULL DEFAULT 0,
  total_calories NUMERIC NOT NULL DEFAULT 0,
  total_classes INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0
);

-- Zones table
CREATE TABLE public.zones (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  min_percent INTEGER NOT NULL DEFAULT 0,
  max_percent INTEGER NOT NULL DEFAULT 100,
  points_per_minute NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Class sessions table
CREATE TABLE public.class_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  total_points NUMERIC NOT NULL DEFAULT 0,
  total_calories NUMERIC NOT NULL DEFAULT 0,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL
);

-- Class participants table
CREATE TABLE public.class_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  points NUMERIC NOT NULL DEFAULT 0,
  calories NUMERIC NOT NULL DEFAULT 0,
  avg_fcm_percent NUMERIC NOT NULL DEFAULT 0,
  peak_bpm INTEGER NOT NULL DEFAULT 0,
  zone_time_seconds JSONB NOT NULL DEFAULT '{}'
);

-- Challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'points' CHECK (type IN ('points', 'calories')),
  scope TEXT NOT NULL DEFAULT 'individual' CHECK (scope IN ('team', 'individual')),
  target_value NUMERIC NOT NULL DEFAULT 0,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable RLS for now (single-user studio app, auth can be added later)
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (public access)
CREATE POLICY "Allow all on turmas" ON public.turmas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on zones" ON public.zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on class_sessions" ON public.class_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on class_participants" ON public.class_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

-- Insert default zones
INSERT INTO public.zones (id, name, color, min_percent, max_percent, points_per_minute, sort_order) VALUES
  ('z1', 'Repouso', 'zone-rest', 0, 59, 0, 1),
  ('z2', 'Aquecimento', 'zone-warmup', 60, 69, 0, 2),
  ('z3', 'Início da Queima', 'zone-burn-start', 70, 79, 1, 3),
  ('z4', 'Queima Total', 'zone-burn-full', 80, 90, 2, 4),
  ('z5', 'Performance', 'zone-performance', 91, 100, 3, 5);

-- Insert default turma
INSERT INTO public.turmas (id, name, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Geral', 'hsl(210, 100%, 55%)');
