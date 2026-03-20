-- Update tenants table for multi-academy support
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update plan_tier constraints if any, or just ensure it's a string
-- The original migration had: plan_tier TEXT NOT NULL DEFAULT 'free'
-- We'll use: 'trial', 'basic', 'advanced', 'black'

-- Update existing tenants to 'basic' if they are 'free'
UPDATE public.tenants SET plan_tier = 'basic' WHERE plan_tier = 'free';
