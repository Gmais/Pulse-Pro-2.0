-- Reset ALL students to 0, then recalculate from class_participants history
-- This fixes the compounding inflation bug from mid-session cloud sync writes

-- Step 1: Reset all students to 0
UPDATE public.students SET total_points = 0, total_calories = 0, total_classes = 0, total_minutes = 0;

-- Step 2: Recalculate from actual class_participants history
WITH student_stats AS (
  SELECT 
    cp.student_id,
    ROUND(SUM(cp.points)) as total_points,
    ROUND(SUM(cp.calories)) as total_calories,
    COUNT(DISTINCT cp.session_id) as total_classes,
    ROUND(SUM(COALESCE(
      (cp.zone_time_seconds->>'connectedSeconds')::numeric, 
      cs.duration_seconds
    )) / 60) as total_minutes
  FROM public.class_participants cp
  JOIN public.class_sessions cs ON cs.id = cp.session_id
  GROUP BY cp.student_id
)
UPDATE public.students s
SET 
  total_points = ss.total_points,
  total_calories = ss.total_calories,
  total_classes = ss.total_classes,
  total_minutes = ss.total_minutes
FROM student_stats ss
WHERE s.id = ss.student_id;