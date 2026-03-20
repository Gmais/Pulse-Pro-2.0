-- Migration: Add avatar_url to students table

ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS if necessary (usually not needed for just adding a column if policies use *)
