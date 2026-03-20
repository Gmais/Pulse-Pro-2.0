-- Add connected_seconds column to class_participants
ALTER TABLE public.class_participants ADD COLUMN IF NOT EXISTS connected_seconds INTEGER NOT NULL DEFAULT 0;
