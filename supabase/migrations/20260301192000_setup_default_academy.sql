-- Setup Default Academy: Planeta Corpo Club+
-- 1. Upsert the default tenant
INSERT INTO public.tenants (id, name, plan_tier)
VALUES ('00000000-0000-0000-0000-000000000001', 'Planeta Corpo Club+', 'black')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, plan_tier = EXCLUDED.plan_tier;

-- 2. Link all existing data to this tenant if not already linked
UPDATE public.students SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';
UPDATE public.turmas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';
UPDATE public.class_sessions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';
UPDATE public.challenges SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';
UPDATE public.class_participants SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';
UPDATE public.sensors SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';
UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL OR tenant_id = '00000000-0000-0000-0000-000000000000';
