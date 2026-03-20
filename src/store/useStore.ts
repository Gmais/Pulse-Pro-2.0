/**
 * useStore — Global State Management
 * Forced Sync Trigger: 2026-03-17 21:14
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { Student, Zone, ActiveStudent, ClassSession, Turma, Challenge, DEFAULT_ZONES, Sensor } from "@/types/pulse";
import {
  insertStudent, updateStudentDb, deleteStudentDb, fetchStudents,
  insertTurma, updateTurmaDb, deleteTurmaDb, fetchTurmas,
  fetchProfessors, insertProfessor, updateProfessorDb, deleteProfessorDb,
  upsertZones, fetchZones,
  insertClassSession, upsertClassSession, upsertClassParticipants, fetchClassSessions, bulkUpdateStudents,
  insertChallenge, updateChallengeDb, deleteChallengeDb, fetchChallenges,
  fetchSensors, insertSensor, updateSensorDb, deleteSensorDb,
  fetchTenantById,
} from "@/services/dataService";
import { Tenant, Professor } from "@/types/pulse";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_TURMA_ID = "00000000-0000-0000-0000-000000000001";

interface PulseStore {
  // Students
  students: Student[];
  addStudent: (s: Omit<Student, "id" | "tenantId" | "totalPoints" | "totalCalories" | "totalClasses" | "totalMinutes">) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Turmas
  turmas: Turma[];
  addTurma: (name: string, color: string) => void;
  updateTurma: (id: string, data: Partial<Turma>) => void;
  deleteTurma: (id: string) => void;

  // Professors
  professors: Professor[];
  addProfessor: (name: string, email: string) => void;
  updateProfessor: (id: string, data: Partial<Professor>) => void;
  deleteProfessor: (id: string) => void;

  // Zones
  zones: Zone[];
  setZones: (z: Zone[]) => void;

  // Active class
  activeStudents: ActiveStudent[];
  classRunning: boolean;
  classElapsed: number;
  soundAlert: boolean;
  displayMetric: "fcm" | "bpm" | "cal";
  classTurmaId: string;
  classProfessorId: string;
  currentSessionId: string | null;
  currentMasterId: string | null;
  sessionStartDate: string | null;
  isMonitorMode: boolean;
  setIsMonitorMode: (val: boolean) => void;

  addActiveStudent: (studentId: string, professorId?: string) => void;
  removeActiveStudent: (studentId: string) => void;
  updateActiveStudent: (studentId: string, data: Partial<ActiveStudent>) => void;
  startClass: () => void;
  stopClass: () => void;
  tickClass: () => void;
  toggleSound: () => void;
  setDisplayMetric: (m: "fcm" | "bpm" | "cal") => void;
  clearActiveStudents: () => void;
  setClassTurmaId: (id: string) => void;
  setClassProfessorId: (id: string) => void;
  finishClass: () => void;
  joinClass: (sessionId: string, masterId: string, startDate?: string) => void;
  syncClassStatus: (isRunning: boolean) => void;

  // Session participants cache
  sessionParticipantsCache: Record<string, { points: number; calories: number; zoneTimeSeconds: Record<string, number>; connectedSeconds: number; sessionStartPoints: number; sessionStartCalories: number; professorId?: string }>;
  cacheSessionParticipant: (studentId: string, data: { points: number; calories: number; zoneTimeSeconds: Record<string, number>; connectedSeconds?: number; sessionStartPoints?: number; sessionStartCalories?: number; professorId?: string }) => void;
  clearSessionCache: () => void;

  // History
  classHistory: ClassSession[];
  addClassSession: (session: ClassSession) => void;

  // Challenges
  challenges: Challenge[];
  addChallenge: (c: Omit<Challenge, "id" | "createdAt" | "tenantId">) => void;
  updateChallenge: (id: string, data: Partial<Challenge>) => void;
  deleteChallenge: (id: string) => void;

  // Sensors
  sensors: Sensor[];
  addSensor: (friendlyId: string, antId: string, name?: string) => void;
  updateSensor: (id: string, data: Partial<Sensor>) => void;
  deleteSensor: (id: string) => void;

  // Tenant
  currentTenant: Tenant | null;
  currentTenantId: string | null;
  setTenant: (tenant: Tenant) => void;
  initializeTenant: () => Promise<void>;

  // Connection
  connectionMethod: "both" | "ble" | "ant";
  setConnectionMethod: (method: "both" | "ble" | "ant") => void;
  antBridgeConnected: boolean;
  setAntBridgeConnected: (connected: boolean) => void;

  // Student Session
  currentStudent: Student | null;
  initializeStudentSession: () => Promise<void>;

  // Machine ID (for Master/Follower logic)
  machineId: string | null;
  setMachineId: (id: string) => void;
  isAdminAuthorized: boolean;
  registerMachineAsMaster: () => Promise<void>;
  resetStudentPoints: (studentId: string, date: string) => Promise<void>;
}

// DB sync helper with detailed error notification
const dbSync = (fn: () => Promise<void>, errorMessage = "Erro ao sincronizar") => {
  fn().catch((err: any) => {
    console.error("DB sync error:", err);
    const detail = err.message || err.details || "Erro desconhecido";
    toast.error(`${errorMessage}: ${detail}`);
  });
};

export const useStore = create<PulseStore>()(
  persist(
    (set, get) => ({
      students: [],
      zones: DEFAULT_ZONES,
      turmas: [],
      activeStudents: [],
      professors: [],
      classRunning: false,
      classElapsed: 0,
      soundAlert: true,
      displayMetric: "fcm",
      classTurmaId: DEFAULT_TURMA_ID,
      classProfessorId: "",
      currentSessionId: null,
      currentMasterId: null,
      sessionStartDate: null,
      isMonitorMode: true,
      setIsMonitorMode: (val) => set({ isMonitorMode: val }),
      classHistory: [],
      challenges: [],
      sensors: [],
      sessionParticipantsCache: {},
      currentTenant: null,
      currentTenantId: null,
      currentStudent: null,
      connectionMethod: "both",
      antBridgeConnected: false,
      machineId: localStorage.getItem("machine_id"),
      isAdminAuthorized: false,

      setMachineId: (id) => {
        localStorage.setItem("machine_id", id);
        set({ machineId: id });
        const tenant = get().currentTenant;
        if (tenant) {
          set({ isAdminAuthorized: !!tenant.masterMachineId && tenant.masterMachineId === id });
        }
      },

      setConnectionMethod: (method) => set({ connectionMethod: method }),
      setAntBridgeConnected: (connected) => set({ antBridgeConnected: connected }),

      initializeTenant: async () => {
        // Ensure we have a persistent machineId
        if (!get().machineId) {
          const newId = `pc-${Math.random().toString(36).slice(2, 7)}`;
          localStorage.setItem("machine_id", newId);
          set({ machineId: newId });
        }

        const storedTenantId = localStorage.getItem("current_tenant_id");
        const tenantId = storedTenantId || DEFAULT_TENANT_ID;

        console.log("[Sync] Initializing tenant:", tenantId);

        try {
          // Fetch full tenant details from DB (important for logoUrl)
          const tenant = await fetchTenantById(tenantId);

          if (tenant) {
            console.log("[Sync] Tenant found:", tenant.name);
            set({
              currentTenant: tenant,
              currentTenantId: tenantId
            });
          } else {
            console.warn("[Sync] Tenant not found in DB, using fallback:", tenantId);
            set({
              currentTenant: {
                id: tenantId,
                name: "Pulse Monitor",
                planTier: "pro"
              },
              currentTenantId: tenantId
            });
          }

          // Fetch other relative data
          console.log("[Sync] Fetching all remote data tables...");

          // Helper to catch errors on individual fetches and return empty array
          const safeFetch = async <T>(promise: Promise<T>, label: string, fallback: T): Promise<T> => {
            try {
              return await promise;
            } catch (e) {
              console.error(`[Sync] Non-critical fetch failed (${label}):`, e);
              return fallback;
            }
          };

          // Students, Turmas and ClassHistory are critical. 
          // Professors, Challenges and Sensors are semi-optional if missing from DB schema
          const [students, turmas, professors, zones, history, challenges, sensors] = await Promise.all([
            fetchStudents(tenantId),
            fetchTurmas(tenantId),
            safeFetch(fetchProfessors(tenantId), "professors", []),
            fetchZones(),
            fetchClassSessions(tenantId),
            safeFetch(fetchChallenges(tenantId), "challenges", []),
            safeFetch(fetchSensors(tenantId), "sensors", []),
          ]);

          console.log("[Sync] Data tables fetched successfully (some might be empty):", {
            students: students.length,
            turmas: turmas.length,
            professors: professors.length,
            zones: zones.length,
            history: history.length,
            challenges: challenges.length,
            sensors: sensors.length
          });

          let finalStudents = students;
          const mid = get().machineId;
          const isAuth = !!tenant?.masterMachineId && tenant.masterMachineId === mid;

          if (isAuth) {
            // Self-healing: recalculate totals from classHistory
            const statsFromHistory: Record<string, { classes: number, points: number, calories: number, minutes: number }> = {};
            
            history.forEach((session) => {
              session.participants.forEach((p) => {
                const sId = p.studentId;
                if (!statsFromHistory[sId]) {
                  statsFromHistory[sId] = { classes: 0, points: 0, calories: 0, minutes: 0 };
                }
                statsFromHistory[sId].classes += 1;
                statsFromHistory[sId].points += p.points;
                statsFromHistory[sId].calories += p.calories;
                // TRUST the connectedSeconds from the DB if it exists, otherwise use 0 (don't fallback to session total)
                statsFromHistory[sId].minutes += Math.floor((p.connectedSeconds || 0) / 60);
              });
            });

            finalStudents = students.map((s) => {
              const fromH = statsFromHistory[s.id] || { classes: 0, points: 0, calories: 0, minutes: 0 };
              
              const needsFix = 
                s.totalClasses !== fromH.classes ||
                Math.abs(s.totalPoints - fromH.points) > 1 ||
                Math.abs(s.totalCalories - fromH.calories) > 1 ||
                Math.abs(s.totalMinutes - fromH.minutes) > 1;

              if (needsFix) {
                console.log(`[Sync] Self-healing student ${s.name} (${s.id}):`, {
                  old: { pts: s.totalPoints, cal: s.totalCalories, min: s.totalMinutes, cls: s.totalClasses },
                  new: { pts: fromH.points, cal: fromH.calories, min: fromH.minutes, cls: fromH.classes }
                });
                
                const fixedData = {
                  totalPoints: fromH.points,
                  totalCalories: fromH.calories,
                  totalMinutes: fromH.minutes,
                  totalClasses: fromH.classes
                };
                
                // Push fix to DB in background
                dbSync(() => updateStudentDb(s.id, fixedData));
                return { ...s, ...fixedData };
              }
              return s;
            });
          }

          set({
            students: finalStudents,
            turmas,
            professors,
            zones: zones.length > 0 ? zones : DEFAULT_ZONES,
            isAdminAuthorized: isAuth,
            classHistory: history,
            challenges,
            sensors,
          });

          // ── DETECT ACTIVE SESSION ON LOAD (for Followers/Refreshes) ──
          const lastSession = history[history.length - 1];
          if (lastSession && lastSession.date) {
            const sessionTime = new Date(lastSession.date).getTime();
            const now = new Date().getTime();
            const oneHour = 60 * 60 * 1000;

            // If last session started less than 1 hour ago and has a master, join it
            if (now - sessionTime < oneHour && !get().classRunning && lastSession.masterId) {
              console.log(`[Sync] Found potentially active session: ${lastSession.id}. Joining as follower.`);
              get().joinClass(lastSession.id, lastSession.masterId, lastSession.date);
            }
          }

          console.log("[Sync] Store state updated successfully");
        } catch (error) {
          console.error("[Sync] CRITICAL Error during initializeTenant:", error);
          console.warn("Could not fetch remote data, staying with local/empty state:", error);
        }
      },

      initializeStudentSession: async () => {
        const studentId = localStorage.getItem("current_student_id");
        let tenantId = localStorage.getItem("current_tenant_id");
        if (!tenantId || tenantId === "undefined" || tenantId === "null") {
          tenantId = DEFAULT_TENANT_ID;
        }

        console.log("initializeStudentSession: start", { studentId, tenantId });
        if (!studentId) {
          console.warn("initializeStudentSession: no studentId in localStorage");
          return;
        }

        try {
          console.log("initializeStudentSession: fetching data for tenant:", tenantId);
          let [students, tenant, history, zones, turmas] = await Promise.all([
            fetchStudents(tenantId),
            fetchTenantById(tenantId),
            fetchClassSessions(tenantId),
            fetchZones(),
            fetchTurmas(tenantId),
          ]);

          let student = students.find(s => s.id === studentId);

          if (!student && tenantId !== DEFAULT_TENANT_ID) {
            console.log("initializeStudentSession: student not found in current tenant, trying default tenant fallback");
            const fallbackStudents = await fetchStudents(DEFAULT_TENANT_ID);
            student = fallbackStudents.find(s => s.id === studentId);

            if (student) {
              tenantId = DEFAULT_TENANT_ID;
              localStorage.setItem("current_tenant_id", tenantId);
              students = fallbackStudents;
              [tenant, history, turmas] = await Promise.all([
                fetchTenantById(tenantId),
                fetchClassSessions(tenantId),
                fetchTurmas(tenantId),
              ]);
            }
          }

          if (student) {
            set({
              currentStudent: student,
              currentTenant: tenant || { id: tenantId, name: "Pulse Monitor", planTier: "pro" },
              currentTenantId: tenantId,
              classHistory: history,
              zones: zones.length > 0 ? zones : DEFAULT_ZONES,
              students: students,
              turmas: turmas,
            });
            console.log("initializeStudentSession: store updated successfully");
          } else {
            console.error("initializeStudentSession: student not found");
          }
        } catch (error) {
          console.error("initializeStudentSession ERROR:", error);
        }
      },

      setTenant: (tenant) => set({ currentTenant: tenant, currentTenantId: tenant.id }),

      cacheSessionParticipant: (studentId, data) =>
        set((state) => ({
          sessionParticipantsCache: {
            ...state.sessionParticipantsCache,
            [studentId]: {
              points: data.points,
              calories: data.calories,
              zoneTimeSeconds: data.zoneTimeSeconds,
              connectedSeconds: data.connectedSeconds || 0,
              sessionStartPoints: data.sessionStartPoints || state.students.find(s => s.id === studentId)?.totalPoints || 0,
              sessionStartCalories: data.sessionStartCalories || state.students.find(s => s.id === studentId)?.totalCalories || 0,
              professorId: data.professorId,
            },
          },
        })),

      clearSessionCache: () => set({ sessionParticipantsCache: {} }),

      addStudent: (s) => {
        const tenantId = get().currentTenantId || DEFAULT_TENANT_ID;
        const newStudent: Student = {
          ...s,
          id: crypto.randomUUID(),
          tenantId,
          totalPoints: 0,
          totalCalories: 0,
          totalClasses: 0,
          totalMinutes: 0,
        };
        set((state) => ({ students: [...state.students, newStudent] }));
        dbSync(() => insertStudent(newStudent));

        // Update sensor history if antId is provided
        if (newStudent.antId) {
          const state = get();
          const sensor = state.sensors.find(sn => sn.antId.trim().toLowerCase() === newStudent.antId?.trim().toLowerCase());
          if (sensor) {
            const currentHistory = sensor.lastStudentIds || [];
            // Add student to front, keep unique, max 2
            const newHistory = [newStudent.id, ...currentHistory.filter(sid => sid !== newStudent.id)].slice(0, 2);
            state.updateSensor(sensor.id, { lastStudentIds: newHistory });
          }
        }
      },

      updateStudent: (id, data) => {
        const previousStudent = get().students.find(s => s.id === id);
        
        // --- SENSOR UNIQUENESS & CLEANING ---
        const newAntId = data.antId?.trim().toLowerCase();
        if (newAntId && newAntId !== previousStudent?.antId?.trim().toLowerCase()) {
          const state = get();
          const othersWithSameAnt = state.students.filter(s => s.id !== id && s.antId?.trim().toLowerCase() === newAntId);
          
          if (othersWithSameAnt.length > 0) {
            console.log(`[Store] Sensor ${newAntId} reassigned from ${othersWithSameAnt.map(o => o.name).join(", ")} to ${previousStudent?.name || id}`);
            
            // 1. Clear antId for others in local state and remove from active session
            set((state) => ({
              students: state.students.map(s => 
                (s.id !== id && s.antId?.trim().toLowerCase() === newAntId) ? { ...s, antId: "" } : s
              ),
              activeStudents: state.activeStudents.filter(as => 
                !othersWithSameAnt.some(o => o.id === as.studentId)
              )
            }));
            
            // 2. Persist DB changes for others
            othersWithSameAnt.forEach(o => {
              dbSync(() => updateStudentDb(o.id, { antId: "" }));
            });

            // 3. Clear from sensor history (we'll update it for the new student below)
            const sensor = state.sensors.find(sn => sn.antId.trim().toLowerCase() === newAntId);
            if (sensor) {
              state.updateSensor(sensor.id, { lastStudentIds: [] });
            }
          }
        }

        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
        dbSync(() => updateStudentDb(id, data), "Erro ao atualizar dados do aluno");

        // If antId changed, update sensor history
        if (data.antId !== undefined && data.antId !== previousStudent?.antId) {
          const state = get();
          const sensor = state.sensors.find(sn => sn.antId.trim().toLowerCase() === data.antId?.trim().toLowerCase());
          if (sensor) {
            const currentHistory = sensor.lastStudentIds || [];
            // Add student to front, keep unique, max 2
            const newHistory = [id, ...currentHistory.filter(sid => sid !== id)].slice(0, 2);
            state.updateSensor(sensor.id, { lastStudentIds: newHistory });
          }
        }
      },

      deleteStudent: (id) => {
        set((state) => ({ students: state.students.filter((s) => s.id !== id) }));
        dbSync(() => deleteStudentDb(id), "Erro ao excluir aluno");
      },

      // Turmas
      addTurma: (name, color) => {
        const tenantId = get().currentTenantId || DEFAULT_TENANT_ID;
        const turma: Turma = { id: crypto.randomUUID(), tenantId, name, color };
        set((state) => ({ turmas: [...state.turmas, turma] }));
        dbSync(() => insertTurma(turma));
      },

      updateTurma: (id, data) => {
        set((state) => ({
          turmas: state.turmas.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
        dbSync(() => updateTurmaDb(id, data));
      },

      deleteTurma: (id) => {
        set((state) => ({ turmas: state.turmas.filter((t) => t.id !== id) }));
        dbSync(() => deleteTurmaDb(id));
      },

      // Professors
      addProfessor: (name, email) => {
        const tenantId = get().currentTenantId || DEFAULT_TENANT_ID;
        const professor: Professor = { id: crypto.randomUUID(), tenantId, name, email, active: true };
        set((state) => ({ professors: [...state.professors, professor] }));
        dbSync(() => insertProfessor(professor));
      },

      updateProfessor: (id, data) => {
        set((state) => ({
          professors: state.professors.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
        dbSync(() => updateProfessorDb(id, data));
      },

      deleteProfessor: (id) => {
        set((state) => ({ professors: state.professors.filter((p) => p.id !== id) }));
        dbSync(() => deleteProfessorDb(id));
      },

      setZones: (z) => {
        set({ zones: z });
        dbSync(() => upsertZones(z));
      },

      addActiveStudent: (studentId, professorId) =>
        set((state) => ({
          activeStudents: [
            ...state.activeStudents,
            {
              studentId,
              bpm: 0,
              fcmPercent: 0,
              calories: 0,
              points: 0,
              currentZoneId: state.zones[0].id,
              connected: false,
              connectionTimer: null,
              zoneTimeSeconds: {},
              rssi: null,
              batteryLevel: null,
              connectedSeconds: 0,
              sessionStartPoints: state.students.find(s => s.id === studentId)?.totalPoints || 0,
              sessionStartCalories: state.students.find(s => s.id === studentId)?.totalCalories || 0,
              professorId: professorId || state.classProfessorId || undefined,
              lastHeartbeat: Date.now(),
            },
          ],
        })),

      removeActiveStudent: (studentId) =>
        set((state) => ({
          activeStudents: state.activeStudents.filter((a) => a.studentId !== studentId),
        })),

      updateActiveStudent: (studentId, data) =>
        set((state) => ({
          activeStudents: state.activeStudents.map((a) =>
            a.studentId === studentId ? { ...a, ...data } : a
          ),
        })),

      startClass: () => {
        const sessionId = crypto.randomUUID();
        const masterId = get().machineId || `pc-${Math.random().toString(36).slice(2, 7)}`;
        set({
          classRunning: true,
          classElapsed: 0,
          currentSessionId: sessionId,
          currentMasterId: masterId,
          sessionStartDate: new Date().toISOString(),
          activeStudents: [], // Clear any leftover state
          sessionParticipantsCache: {}, // Clear cache to prevent zombie data from previous unfinished classes
        });
      },
      stopClass: () => set({ classRunning: false, currentMasterId: null }),
      tickClass: () => set((state) => ({ classElapsed: state.classElapsed + 1 })),
      joinClass: (sessionId, masterId, startDate) => {
        const state = get();
        if (state.currentSessionId === sessionId) return;
        
        console.log(`[Store] Joining existing session: ${sessionId} (Master: ${masterId})`);
        set({
          classRunning: true,
          classElapsed: 0,
          currentSessionId: sessionId,
          currentMasterId: masterId,
          sessionStartDate: startDate || new Date().toISOString(),
        });
      },
      syncClassStatus: (isRunning) => {
        if (!isRunning && get().classRunning) {
          console.log("[Store] Session ended remotely");
          set({ classRunning: false, currentMasterId: null });
        }
      },
      toggleSound: () => set((state) => ({ soundAlert: !state.soundAlert })),
      setDisplayMetric: (m) => set({ displayMetric: m }),
      clearActiveStudents: () => set({ activeStudents: [] }),
      setClassTurmaId: (id) => set({ classTurmaId: id }),
      setClassProfessorId: (id) => set({ classProfessorId: id }),

      finishClass: () => {
        const state = get();
        if (state.activeStudents.length === 0 && Object.keys(state.sessionParticipantsCache).length === 0) return;
        if (state.classElapsed === 0) return;

        const participantMap = new Map<string, { points: number; calories: number; avgFcmPercent: number; peakBpm: number; zoneTimeSeconds: Record<string, number>; connectedSeconds: number; professorId?: string }>();

        Object.entries(state.sessionParticipantsCache).forEach(([studentId, cached]) => {
          participantMap.set(studentId, {
            points: Math.round(cached.points),
            calories: Math.round(cached.calories),
            avgFcmPercent: 0,
            peakBpm: 0,
            zoneTimeSeconds: { ...cached.zoneTimeSeconds },
            connectedSeconds: cached.connectedSeconds || 0,
            professorId: cached.professorId,
          });
        });

        state.activeStudents.forEach((a) => {
          participantMap.set(a.studentId, {
            points: Math.round(a.points),
            calories: Math.round(a.calories),
            avgFcmPercent: a.fcmPercent,
            peakBpm: a.bpm,
            zoneTimeSeconds: { ...a.zoneTimeSeconds },
            connectedSeconds: a.connectedSeconds,
            professorId: a.professorId,
          });
        });

        const participants = Array.from(participantMap.entries()).map(([studentId, data]) => ({
          studentId,
          ...data,
        }));

        const tenantId = get().currentTenantId;
        if (!tenantId) return;

        const session: ClassSession = {
          id: get().currentSessionId || crypto.randomUUID(),
          tenantId,
          date: get().sessionStartDate || new Date().toISOString(),
          durationSeconds: state.classElapsed,
          totalPoints: participants.reduce((s, p) => s + p.points, 0),
          totalCalories: participants.reduce((s, p) => s + p.calories, 0),
          turmaId: state.classTurmaId,
          professorId: state.classProfessorId || undefined,
          participants,
        };

        // Calculate final precise totals for each participant using their start values + session gain
        const studentUpdates: { id: string; data: Partial<Student> }[] = [];

        // Persist session and student updates to DB ONLY IF WE ARE THE MASTER
        const isMaster = !state.currentMasterId || state.currentMasterId === state.machineId;

        if (isMaster) {
          console.log("[Store] Master machine: Persisting final session results to DB");
          
          set((s) => ({
            classHistory: [...s.classHistory, session],
            sessionParticipantsCache: {},
            students: s.students.map((student) => {
              const participant = session.participants.find((p) => p.studentId === student.id);
              if (!participant) {
                const { _sessionStartMinutes, ...rest } = student as any;
                return rest as Student;
              }

              const activeStudent = state.activeStudents.find(a => a.studentId === student.id);
              const cachedParticipant = state.sessionParticipantsCache[student.id];
              const basePoints = activeStudent?.sessionStartPoints ?? cachedParticipant?.sessionStartPoints ?? (student as any)._sessionStartPoints ?? student.totalPoints;
              const baseCalories = activeStudent?.sessionStartCalories ?? cachedParticipant?.sessionStartCalories ?? (student as any)._sessionStartCalories ?? student.totalCalories;
              const baseMinutes = (student as any)._sessionStartMinutes ?? student.totalMinutes;
              const sessionMinutes = Math.floor((activeStudent?.connectedSeconds || participant.connectedSeconds || 0) / 60);

              const finalPoints = basePoints + participant.points;
              const finalCalories = baseCalories + participant.calories;
              const finalMinutes = baseMinutes + sessionMinutes;
              const finalClasses = student.totalClasses + 1;

              studentUpdates.push({
                id: student.id,
                data: {
                  totalPoints: finalPoints,
                  totalCalories: finalCalories,
                  totalMinutes: finalMinutes,
                  totalClasses: finalClasses,
                },
              });

              const { _sessionStartMinutes, ...rest } = student as any;
              return {
                ...rest,
                totalPoints: finalPoints,
                totalCalories: finalCalories,
                totalMinutes: finalMinutes,
                totalClasses: finalClasses,
              } as Student;
            }),
            classRunning: false,
            currentSessionId: null,
            currentMasterId: null,
            activeStudents: [],
          }));

          dbSync(async () => {
            await upsertClassSession(session);
            await upsertClassParticipants(session.id, participants, tenantId);
            await bulkUpdateStudents(studentUpdates);
          });
        } else {
          console.log("[Store] Follower machine: Cleaning up local state, waiting for Realtime sync");
          set({
            classRunning: false,
            currentSessionId: null,
            currentMasterId: null,
            activeStudents: [],
            sessionParticipantsCache: {},
          });
        }
      },

      addClassSession: (session) =>
        set((state) => ({ classHistory: [...state.classHistory, session] })),

      // Challenges
      addChallenge: (c) => {
        const tenantId = get().currentTenantId || DEFAULT_TENANT_ID;
        const challenge: Challenge = {
          ...c,
          id: crypto.randomUUID(),
          tenantId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ challenges: [...state.challenges, challenge] }));
        dbSync(() => insertChallenge(challenge));
      },

      updateChallenge: (id, data) => {
        set((state) => ({
          challenges: state.challenges.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
        dbSync(() => updateChallengeDb(id, data));
      },

      deleteChallenge: (id) => {
        set((state) => ({ challenges: state.challenges.filter((c) => c.id !== id) }));
        dbSync(() => deleteChallengeDb(id));
      },

      // Sensors
      addSensor: (friendlyId, antId, name) => {
        const tenantId = get().currentTenantId || DEFAULT_TENANT_ID;
        const sensor: Sensor = { id: crypto.randomUUID(), tenantId, friendlyId, antId, name };
        set((state) => ({ sensors: [...state.sensors, sensor] }));
        dbSync(() => insertSensor(sensor));
      },

      updateSensor: (id, data) => {
        set((state) => ({
          sensors: state.sensors.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
        dbSync(() => updateSensorDb(id, data));
      },

      deleteSensor: (id) => {
        set((state) => ({ sensors: state.sensors.filter((s) => s.id !== id) }));
        dbSync(() => deleteSensorDb(id));
      },

      registerMachineAsMaster: async () => {
        const state = get();
        const tenant = state.currentTenant;
        const mid = state.machineId;
        if (!tenant || !mid) return;

        console.log(`[Store] Registering machine ${mid} as master for tenant ${tenant.id}`);
        try {
          const { updateTenant } = await import("@/services/dataService");
          const updatedTenant = await updateTenant(tenant.id, { masterMachineId: mid });
          set({ 
            currentTenant: updatedTenant,
            isAdminAuthorized: true 
          });
          toast.success("Esta máquina foi registrada como Mestra com sucesso!");
        } catch (err: any) {
          console.error("[Store] Failed to register master machine:", err);
          toast.error("Erro ao registrar máquina mestra: " + (err.message || "Erro desconhecido"));
        }
      },

      resetStudentPoints: async (studentId: string, date: string) => {
        const tenantId = get().currentTenantId;
        if (!tenantId) return;

        try {
          const { resetStudentDailyPoints } = await import("@/services/dataService");
          await resetStudentDailyPoints(studentId, date, tenantId);
          
          // Re-initialize to trigger self-healing (recalculates totals from history)
          await get().initializeTenant();
          toast.success("Pontos do dia resetados com sucesso!");
        } catch (err: any) {
          console.error("[Store] Failed to reset points:", err);
          toast.error("Erro ao resetar pontos: " + (err.message || "Erro desconhecido"));
        }
      },
    }),
    {
      name: "pulse-monitor-store",
      partialize: (state) => ({
        students: state.students,
        zones: state.zones,
        turmas: state.turmas,
        professors: state.professors,
        challenges: state.challenges,
        sensors: state.sensors,
        currentTenant: state.currentTenant,
        currentTenantId: state.currentTenantId,
        currentStudent: state.currentStudent,
        connectionMethod: state.connectionMethod,
        currentMasterId: state.currentMasterId,
        sessionStartDate: state.sessionStartDate,
        isMonitorMode: state.isMonitorMode,
        activeStudents: state.activeStudents,
        sessionParticipantsCache: state.sessionParticipantsCache,
        machineId: state.machineId,
      }),
    }
  )
);
