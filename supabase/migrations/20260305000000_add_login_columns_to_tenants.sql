-- Add login_email and login_password columns to tenants table
-- These are referenced by loginAcademy and fetchTenantById but were never created
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS login_email TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS login_password TEXT;
