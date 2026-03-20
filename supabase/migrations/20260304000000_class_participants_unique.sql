-- Add unique constraint to class_participants to allow UPSERTs during live sessions
ALTER TABLE public.class_participants DROP CONSTRAINT IF EXISTS class_participants_session_student_unique;
ALTER TABLE public.class_participants ADD CONSTRAINT class_participants_session_student_unique UNIQUE (session_id, student_id);
