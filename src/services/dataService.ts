import { supabase as _supabase } from "@/integrations/supabase/client";
import type { Student, Turma, Zone, ClassSession, Challenge, Tenant, Sensor, Professor } from "@/types/pulse";

// Cast to any to avoid type mismatches with tables not yet in the generated types
const supabase = _supabase as any;

// ─── Tenants ─────────────────────────────────────────────

export async function fetchCurrentTenant(): Promise<Tenant | null> {
  // Simplification: Always return a Global tenant for now to ensure stability
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Academia Pulse",
    planTier: "pro",
  };
}

export async function fetchAllTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    logoUrl: t.logo_url,
    planTier: t.plan_tier,
    ownerId: t.owner_id,
    trialExpiresAt: t.trial_expires_at,
    adminNotes: t.admin_notes,
    loginEmail: t.login_email,
    loginPassword: t.login_password,
    masterMachineId: t.master_machine_id,
  }));
}

export async function fetchTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url,
    planTier: data.plan_tier,
    ownerId: data.owner_id,
    trialExpiresAt: data.trial_expires_at,
    adminNotes: data.admin_notes,
    loginEmail: data.login_email,
    loginPassword: data.login_password,
    masterMachineId: data.master_machine_id,
  };
}

export async function createTenant(tenant: Omit<Tenant, "id">): Promise<Tenant> {
  const newId = crypto.randomUUID();
  const { data, error } = await supabase
    .from("tenants")
    .insert({
      id: newId,
      name: tenant.name,
      logo_url: tenant.logoUrl,
      plan_tier: tenant.planTier,
      trial_expires_at: tenant.trialExpiresAt,
      admin_notes: tenant.adminNotes,
      login_email: tenant.loginEmail,
      login_password: tenant.loginPassword,
      master_machine_id: tenant.masterMachineId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url,
    planTier: data.plan_tier,
    ownerId: data.owner_id,
    trialExpiresAt: data.trial_expires_at,
    adminNotes: data.admin_notes,
    loginEmail: data.login_email,
    loginPassword: data.login_password,
    masterMachineId: data.master_machine_id,
  };
}

export async function loginAcademy(email: string, password: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("login_email", email)
    .eq("login_password", password)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url,
    planTier: data.plan_tier,
    ownerId: data.owner_id,
    trialExpiresAt: data.trial_expires_at,
    adminNotes: data.admin_notes,
    loginEmail: data.login_email,
    loginPassword: data.login_password,
    masterMachineId: data.master_machine_id,
  };
}

export async function loginStudent(email: string, matricula: string): Promise<Student | null> {
  const { data: s, error } = await supabase
    .from("students")
    .select("*")
    .eq("email", email)
    .eq("matricula", matricula)
    .single();

  if (error || !s) return null;

  return {
    id: s.id,
    tenantId: s.tenant_id,
    matricula: s.matricula,
    name: s.name,
    email: s.email,
    age: s.age,
    sex: s.sex as "M" | "F",
    weight: Number(s.weight),
    fcm: s.fcm,
    avatarColor: s.avatar_color,
    active: s.active,
    turmaId: s.turma_id || "",
    antId: s.ant_id || "",
    avatarUrl: s.avatar_url || "",
    totalPoints: Number(s.total_points),
    totalCalories: Number(s.total_calories),
    totalClasses: s.total_classes,
    totalMinutes: s.total_minutes,
  };
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
  const { data, error } = await supabase
    .from("tenants")
    .update({
      name: updates.name,
      logo_url: updates.logoUrl,
      plan_tier: updates.planTier,
      trial_expires_at: updates.trialExpiresAt,
      admin_notes: updates.adminNotes,
      login_email: updates.loginEmail,
      login_password: updates.loginPassword,
      master_machine_id: updates.masterMachineId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url,
    planTier: data.plan_tier,
    ownerId: data.owner_id,
    trialExpiresAt: data.trial_expires_at,
    adminNotes: data.admin_notes,
    loginEmail: data.login_email,
    loginPassword: data.login_password,
    masterMachineId: data.master_machine_id,
  };
}

export async function deleteTenant(id: string): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadLogo(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('logos')
    .getPublicUrl(filePath);

  return publicUrl;
}

// ─── Turmas ────────────────────────────────────────────────

export async function fetchTurmas(tenantId: string): Promise<Turma[]> {
  const { data, error } = await supabase.from("turmas").select("*").eq("tenant_id", tenantId);
  if (error) throw error;
  return (data || []).map((t: any) => ({ id: t.id, tenantId: t.tenant_id, name: t.name, color: t.color }));
}

export async function insertTurma(turma: Turma) {
  const { error } = await supabase.from("turmas").insert({
    id: turma.id,
    name: turma.name,
    color: turma.color,
    tenant_id: turma.tenantId,
  });
  if (error) throw error;
}

export async function updateTurmaDb(id: string, data: Partial<Turma>) {
  const dbData: Record<string, unknown> = {};
  if (data.name !== undefined) dbData.name = data.name;
  if (data.color !== undefined) dbData.color = data.color;
  if (Object.keys(dbData).length === 0) return;
  const { error } = await supabase.from("turmas").update(dbData).eq("id", id);
  if (error) throw error;
}

export async function deleteTurmaDb(id: string) {
  const { error } = await supabase.from("turmas").delete().eq("id", id);
  if (error) throw error;
}

// ─── Professors ───────────────────────────────────────────

export async function fetchProfessors(tenantId: string): Promise<Professor[]> {
  const { data, error } = await supabase.from("professors").select("*").eq("tenant_id", tenantId);
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    tenantId: p.tenant_id,
    name: p.name,
    email: p.email,
    active: p.active,
    bio: p.bio,
    avatarUrl: p.avatar_url,
    createdAt: p.created_at,
  }));
}

export async function insertProfessor(p: Professor) {
  const { error } = await supabase.from("professors").insert({
    id: p.id,
    name: p.name,
    email: p.email,
    active: p.active,
    bio: p.bio,
    avatar_url: p.avatarUrl,
    tenant_id: p.tenantId,
  });
  if (error) throw error;
}

export async function updateProfessorDb(id: string, data: Partial<Professor>) {
  const dbData: Record<string, unknown> = {};
  if (data.name !== undefined) dbData.name = data.name;
  if (data.email !== undefined) dbData.email = data.email;
  if (data.active !== undefined) dbData.active = data.active;
  if (data.bio !== undefined) dbData.bio = data.bio;
  if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;

  if (Object.keys(dbData).length === 0) return;
  const { error } = await supabase.from("professors").update(dbData).eq("id", id);
  if (error) throw error;
}

export async function deleteProfessorDb(id: string) {
  const { error } = await supabase.from("professors").delete().eq("id", id);
  if (error) throw error;
}

// ─── Students ──────────────────────────────────────────────

export async function fetchStudents(tenantId: string): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*").eq("tenant_id", tenantId);
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: s.id,
    tenantId: s.tenant_id,
    matricula: s.matricula,
    name: s.name,
    email: s.email,
    age: s.age,
    sex: s.sex as "M" | "F",
    weight: Number(s.weight),
    fcm: s.fcm,
    avatarColor: s.avatar_color,
    active: s.active,
    turmaId: s.turma_id || "",
    antId: s.ant_id || "",
    avatarUrl: s.avatar_url || "",
    totalPoints: Number(s.total_points),
    totalCalories: Number(s.total_calories),
    totalClasses: s.total_classes,
    totalMinutes: s.total_minutes,
  }));
}

export async function insertStudent(s: Student) {
  const { error } = await supabase.from("students").insert({
    id: s.id,
    matricula: s.matricula,
    name: s.name,
    email: s.email,
    age: s.age,
    sex: s.sex,
    weight: s.weight,
    fcm: s.fcm,
    avatar_color: s.avatarColor,
    active: s.active,
    turma_id: s.turmaId || null,
    ant_id: s.antId || null,
    avatar_url: s.avatarUrl || null,
    total_points: s.totalPoints,
    total_calories: s.totalCalories,
    total_classes: s.totalClasses,
    total_minutes: s.totalMinutes,
    tenant_id: s.tenantId,
  });
  if (error) throw error;
}

export async function updateStudentDb(id: string, data: Partial<Student>) {
  const dbData: Record<string, unknown> = {};
  if (data.matricula !== undefined) dbData.matricula = data.matricula;
  if (data.name !== undefined) dbData.name = data.name;
  if (data.email !== undefined) dbData.email = data.email;
  if (data.age !== undefined) dbData.age = data.age;
  if (data.sex !== undefined) dbData.sex = data.sex;
  if (data.weight !== undefined) dbData.weight = data.weight;
  if (data.fcm !== undefined) dbData.fcm = data.fcm;
  if (data.avatarColor !== undefined) dbData.avatar_color = data.avatarColor;
  if (data.active !== undefined) dbData.active = data.active;
  if (data.turmaId !== undefined) dbData.turma_id = data.turmaId || null;
  if (data.antId !== undefined) dbData.ant_id = data.antId || null;
  if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl || null;
  if (data.totalPoints !== undefined) dbData.total_points = data.totalPoints;
  if (data.totalCalories !== undefined) dbData.total_calories = data.totalCalories;
  if (data.totalClasses !== undefined) dbData.total_classes = data.totalClasses;
  if (data.totalMinutes !== undefined) dbData.total_minutes = data.totalMinutes;

  if (Object.keys(dbData).length === 0) return;
  const { data: updated, error } = await supabase.from("students").update(dbData).eq("id", id).select();

  if (error) throw error;
  if (!updated || updated.length === 0) {
    throw new Error(`Aluno não encontrado no banco (ID: ${id})`);
  }
}

export async function deleteStudentDb(id: string) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

// ─── Zones ─────────────────────────────────────────────────

export async function fetchZones(): Promise<Zone[]> {
  const { data, error } = await supabase.from("zones").select("*").order("sort_order");
  if (error) throw error;
  return (data || []).map((z: any) => ({
    id: z.id,
    name: z.name,
    color: z.color,
    minPercent: z.min_percent,
    maxPercent: z.max_percent,
    pointsPerMinute: Number(z.points_per_minute),
  }));
}

export async function upsertZones(zones: Zone[]) {
  const rows = zones.map((z, i) => ({
    id: z.id,
    name: z.name,
    color: z.color,
    min_percent: z.minPercent,
    max_percent: z.maxPercent,
    points_per_minute: z.pointsPerMinute,
    sort_order: i,
  }));
  const { error } = await supabase.from("zones").upsert(rows);
  if (error) throw error;
}

// ─── Class Sessions ────────────────────────────────────────

export async function fetchClassSessions(tenantId: string): Promise<ClassSession[]> {
  const { data: sessions, error: sessErr } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })
    .limit(90);
  if (sessErr) throw sessErr;

  const { data: participants, error: partErr } = await supabase
    .from("class_participants")
    .select("*")
    .eq("tenant_id", tenantId);
  if (partErr) throw partErr;

  const partMap = new Map<string, ClassSession["participants"]>();
  ((participants || []) as any[]).forEach((p) => {
    const list = partMap.get(p.session_id) || [];
    list.push({
      studentId: p.student_id,
      points: Number(p.points),
      calories: Number(p.calories),
      avgFcmPercent: Number(p.avg_fcm_percent),
      peakBpm: p.peak_bpm,
      zoneTimeSeconds: (p.zone_time_seconds as Record<string, number>) || {},
      connectedSeconds: Number(p.connected_seconds || 0),
      professorId: p.professor_id || undefined,
    });
    partMap.set(p.session_id, list);
  });

  return ((sessions || []) as any[]).reverse().map((s) => ({
    id: s.id,
    tenantId: s.tenant_id,
    date: s.date,
    durationSeconds: s.duration_seconds,
    totalPoints: Number(s.total_points),
    totalCalories: Number(s.total_calories),
    turmaId: s.turma_id || undefined,
    professorId: s.professor_id || undefined,
    masterId: s.master_id || undefined,
    participants: partMap.get(s.id) || [],
  }));
}

export async function insertClassSession(session: ClassSession) {
  const { error: sessErr } = await supabase.from("class_sessions").insert({
    id: session.id,
    date: session.date,
    duration_seconds: session.durationSeconds,
    total_points: Math.round(session.totalPoints || 0),
    total_calories: Math.round(session.totalCalories || 0),
    turma_id: session.turmaId || null,
    professor_id: session.professorId || null,
    tenant_id: session.tenantId,
    master_id: (session as any).masterId || null,
  });
  if (sessErr) {
    console.error("[DataService] Erro ao inserir sessão:", sessErr);
    throw sessErr;
  }

  if (session.participants.length > 0) {
    const rows = session.participants.map((p) => ({
      session_id: session.id,
      student_id: p.studentId,
      points: Math.round(p.points || 0),
      calories: Math.round(p.calories || 0),
      professor_id: p.professorId || null,
      avg_fcm_percent: Number.isFinite(p.avgFcmPercent) ? p.avgFcmPercent : 0,
      peak_bpm: Number.isFinite(p.peakBpm) ? p.peakBpm : 0,
      zone_time_seconds: p.zoneTimeSeconds || {},
      connected_seconds: p.connectedSeconds || 0,
      tenant_id: session.tenantId,
    }));
    const { error: partErr } = await supabase.from("class_participants").insert(rows);
    if (partErr) {
      console.error("[DataService] Erro ao inserir participantes:", partErr);
      throw partErr;
    }
  }
}

export async function upsertClassSession(session: ClassSession) {
  const { error } = await supabase.from("class_sessions").upsert({
    id: session.id,
    date: session.date,
    duration_seconds: session.durationSeconds,
    total_points: Math.round(session.totalPoints || 0),
    total_calories: Math.round(session.totalCalories || 0),
    turma_id: session.turmaId || null,
    professor_id: session.professorId || null,
    tenant_id: session.tenantId,
    master_id: (session as any).masterId || null,
  });
  if (error) {
    console.error("[DataService] Erro no upsert da sessão:", error);
    throw error;
  }
}

export async function upsertClassParticipants(sessionId: string, participants: any[], tenantId: string) {
  if (participants.length === 0) return;
  const rows = participants.map((p) => ({
    session_id: sessionId,
    student_id: p.studentId,
    points: Math.round(p.points || 0),
    calories: Math.round(p.calories || 0),
    avg_fcm_percent: Number.isFinite(p.avgFcmPercent) ? p.avgFcmPercent : 0,
    peak_bpm: Number.isFinite(p.peakBpm) ? p.peakBpm : 0,
    zone_time_seconds: p.zoneTimeSeconds || {},
    connected_seconds: p.connectedSeconds || 0,
    professor_id: p.professorId || null,
    tenant_id: tenantId,
  }));
  
  const { error } = await supabase.from("class_participants").upsert(rows, {
    onConflict: 'session_id,student_id'
  });
  
  if (error) {
    console.error("[DataService] Falha no upsert de participantes do CloudSync:", {
      error,
      sessionId,
      rowCount: rows.length,
      firstRow: rows[0]
    });
    throw error;
  }
}

// ─── Challenges ────────────────────────────────────────────

export async function fetchChallenges(tenantId: string): Promise<Challenge[]> {
  const { data, error } = await supabase.from("challenges").select("*").eq("tenant_id", tenantId).order("created_at");
  if (error) throw error;
  return ((data || []) as any[]).map((c) => ({
    id: c.id,
    tenantId: c.tenant_id,
    name: c.name,
    description: c.description,
    type: c.type as "points" | "calories",
    scope: c.scope as "team" | "individual" | "collective",
    targetValue: Number(c.target_value),
    turmaId: c.turma_id || undefined,
    studentIds: c.student_ids || [],
    active: c.active,
    createdAt: c.created_at,
  }));
}

export async function insertChallenge(c: Challenge) {
  const { error } = await supabase.from("challenges").insert({
    id: c.id,
    name: c.name,
    description: c.description,
    type: c.type,
    scope: c.scope,
    target_value: c.targetValue,
    turma_id: c.turmaId || null,
    student_ids: c.studentIds || null,
    active: c.active,
    created_at: c.createdAt,
    tenant_id: c.tenantId,
  });
  if (error) throw error;
}

export async function updateChallengeDb(id: string, data: Partial<Challenge>) {
  const dbData: Record<string, unknown> = {};
  if (data.name !== undefined) dbData.name = data.name;
  if (data.description !== undefined) dbData.description = data.description;
  if (data.type !== undefined) dbData.type = data.type;
  if (data.scope !== undefined) dbData.scope = data.scope;
  if (data.targetValue !== undefined) dbData.target_value = data.targetValue;
  if (data.turmaId !== undefined) dbData.turma_id = data.turmaId || null;
  if (data.studentIds !== undefined) dbData.student_ids = data.studentIds || null;
  if (data.active !== undefined) dbData.active = data.active;

  if (Object.keys(dbData).length === 0) return;
  const { error } = await supabase.from("challenges").update(dbData).eq("id", id);
  if (error) throw error;
}

export async function deleteChallengeDb(id: string) {
  const { error } = await supabase.from("challenges").delete().eq("id", id);
  if (error) throw error;
}

// ─── Bulk student update (for finishClass) ─────────────────

export async function bulkUpdateStudents(updates: { id: string; data: Partial<Student> }[]) {
  await Promise.all(updates.map((u) => updateStudentDb(u.id, u.data)));
}

// ─── Sensors ───────────────────────────────────────────────

export async function fetchSensors(tenantId: string): Promise<Sensor[]> {
  const { data, error } = await supabase.from("sensors").select("*").eq("tenant_id", tenantId);
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: s.id,
    tenantId: s.tenant_id,
    friendlyId: s.friendly_id,
    antId: s.ant_id,
    name: s.name || "",
    createdAt: s.created_at,
    lastStudentIds: s.last_student_ids || [],
  }));
}

export async function insertSensor(s: Sensor) {
  const { error } = await supabase.from("sensors").insert({
    id: s.id,
    friendly_id: s.friendlyId,
    ant_id: s.antId,
    name: s.name,
    tenant_id: s.tenantId,
    last_student_ids: s.lastStudentIds || [],
  });
  if (error) throw error;
}

export async function updateSensorDb(id: string, data: Partial<Sensor>) {
  const dbData: Record<string, unknown> = {};
  if (data.friendlyId !== undefined) dbData.friendly_id = data.friendlyId;
  if (data.antId !== undefined) dbData.ant_id = data.antId;
  if (data.name !== undefined) dbData.name = data.name;
  if (data.lastStudentIds !== undefined) dbData.last_student_ids = data.lastStudentIds;

  if (Object.keys(dbData).length === 0) return;
  const { error } = await supabase.from("sensors").update(dbData).eq("id", id);
  if (error) throw error;
}

export async function deleteSensorDb(id: string) {
  const { error } = await supabase.from("sensors").delete().eq("id", id);
  if (error) throw error;
}

export async function resetStudentDailyPoints(studentId: string, dateStr: string, tenantId: string) {
  // 1. Fetch sessions for that day
  const { data: sessions, error: sessErr } = await supabase
    .from("class_sessions")
    .select("id")
    .eq("tenant_id", tenantId)
    .gte("date", `${dateStr}T00:00:00`)
    .lte("date", `${dateStr}T23:59:59`);

  if (sessErr) throw sessErr;
  if (!sessions || sessions.length === 0) return;

  const sessionIds = sessions.map((s: any) => s.id);

  // 2. Clear participants data for this student in those sessions
  const { error: partErr } = await supabase
    .from("class_participants")
    .update({
      points: 0,
      calories: 0,
      zone_time_seconds: {},
      connected_seconds: 0,
    })
    .eq("student_id", studentId)
    .in("session_id", sessionIds);

  if (partErr) throw partErr;

  console.log(`[DataService] Reset points for student ${studentId} on ${dateStr} across ${sessionIds.length} sessions.`);
}
