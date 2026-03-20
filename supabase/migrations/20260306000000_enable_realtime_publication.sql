-- Enable Supabase Realtime for the tables used by postgres_changes subscriptions.
-- Without this, Realtime channels get CHANNEL_ERROR and follower devices never
-- receive live updates.

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_participants;

-- Set REPLICA IDENTITY FULL so UPDATE payloads include all columns (not just PKs)
ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.class_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.class_participants REPLICA IDENTITY FULL;
