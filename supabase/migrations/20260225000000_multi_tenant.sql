-- Multi-tenancy Migration

-- 1. Create Tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  logo_url TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'free',
  owner_id UUID REFERENCES auth.users(id)
);

-- 2. Create Profiles table (link Auth users to Tenants)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user'
);

-- 3. Add tenant_id to existing tables
ALTER TABLE public.turmas ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.students ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.class_sessions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.challenges ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.class_participants ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);

-- 4. Create a default tenant for existing data
INSERT INTO public.tenants (id, name) VALUES ('00000000-0000-0000-0000-000000000000', 'Default Gym');

UPDATE public.turmas SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.students SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.class_sessions SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.challenges SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;
UPDATE public.class_participants SET tenant_id = '00000000-0000-0000-0000-000000000000' WHERE tenant_id IS NULL;

-- 5. Set tenant_id to NOT NULL after backfilling
ALTER TABLE public.turmas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.students ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.class_sessions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.challenges ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.class_participants ALTER COLUMN tenant_id SET NOT NULL;

-- 6. Update Row Level Security (RLS) policies
-- We transition from "Allow all" to "Tenant scoped" policies

DROP POLICY "Allow all on turmas" ON public.turmas;
CREATE POLICY "Tenant read turmas" ON public.turmas FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant insert turmas" ON public.turmas FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant update turmas" ON public.turmas FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant delete turmas" ON public.turmas FOR DELETE USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY "Allow all on students" ON public.students;
CREATE POLICY "Tenant view students" ON public.students FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY "Allow all on class_sessions" ON public.class_sessions;
CREATE POLICY "Tenant view sessions" ON public.class_sessions FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY "Allow all on class_participants" ON public.class_participants;
CREATE POLICY "Tenant view participants" ON public.class_participants FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY "Allow all on challenges" ON public.challenges;
CREATE POLICY "Tenant view challenges" ON public.challenges FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
