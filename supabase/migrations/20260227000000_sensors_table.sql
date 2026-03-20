-- Create sensors table
CREATE TABLE IF NOT EXISTS public.sensors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id),
    friendly_id text NOT NULL,
    ant_id text NOT NULL,
    name text,
    created_at timestamptz DEFAULT now()
);

-- Add unique constraint per tenant
ALTER TABLE public.sensors DROP CONSTRAINT IF EXISTS sensors_friendly_id_tenant_unique;
ALTER TABLE public.sensors ADD CONSTRAINT sensors_friendly_id_tenant_unique UNIQUE (tenant_id, friendly_id);

-- Enable RLS
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sensors' AND policyname = 'Users can view sensors of their tenant'
    ) THEN
        CREATE POLICY "Users can view sensors of their tenant" ON public.sensors
            FOR SELECT USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sensors' AND policyname = 'Users can manage sensors of their tenant'
    ) THEN
        CREATE POLICY "Users can manage sensors of their tenant" ON public.sensors
            FOR ALL USING (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid)
            WITH CHECK (tenant_id = '00000000-0000-0000-0000-000000000001'::uuid);
    END IF;
END $$;
