-- Relax RLS policies for custom tenant-based authentication
-- This allows the application to perform CRUD operations without Supabase Auth sessions

-- 1. Students
DROP POLICY IF EXISTS "Tenant view students" ON public.students;
DROP POLICY IF EXISTS "Allow all on students" ON public.students;
CREATE POLICY "Public students access" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- 2. Turmas
DROP POLICY IF EXISTS "Tenant read turmas" ON public.turmas;
DROP POLICY IF EXISTS "Tenant insert turmas" ON public.turmas;
DROP POLICY IF EXISTS "Tenant update turmas" ON public.turmas;
DROP POLICY IF EXISTS "Tenant delete turmas" ON public.turmas;
DROP POLICY IF EXISTS "Allow all on turmas" ON public.turmas;
CREATE POLICY "Public turmas access" ON public.turmas FOR ALL USING (true) WITH CHECK (true);

-- 3. Class Sessions
DROP POLICY IF EXISTS "Tenant view sessions" ON public.class_sessions;
DROP POLICY IF EXISTS "Allow all on class_sessions" ON public.class_sessions;
CREATE POLICY "Public sessions access" ON public.class_sessions FOR ALL USING (true) WITH CHECK (true);

-- 4. Class Participants
DROP POLICY IF EXISTS "Tenant view participants" ON public.class_participants;
DROP POLICY IF EXISTS "Allow all on class_participants" ON public.class_participants;
CREATE POLICY "Public participants access" ON public.class_participants FOR ALL USING (true) WITH CHECK (true);

-- 5. Challenges
DROP POLICY IF EXISTS "Tenant view challenges" ON public.challenges;
DROP POLICY IF EXISTS "Allow all on challenges" ON public.challenges;
CREATE POLICY "Public challenges access" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

-- 6. Sensors
DROP POLICY IF EXISTS "Allow all on sensors" ON public.sensors;
CREATE POLICY "Public sensors access" ON public.sensors FOR ALL USING (true) WITH CHECK (true);

-- 7. Tenants (Allow public login check)
DROP POLICY IF EXISTS "Allow all on tenants" ON public.tenants;
CREATE POLICY "Public tenants access" ON public.tenants FOR ALL USING (true) WITH CHECK (true);
