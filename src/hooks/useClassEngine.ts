/**
 * useClassEngine — Global class timer hook.
 *
 * Mounted at App level so timers persist across route navigations.
 * Contains: per-second tick, points/calories accumulation & flush, cloud sync.
 *
 * This is intentionally separate from MonitorPage so that navigating to
 * RankingPage (or any other page) does not stop the running class.
 */
import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { getZoneForPercent, calculateCalories, ActiveStudent } from "@/types/pulse";
import { upsertClassSession, upsertClassParticipants } from "@/services/dataService";
import { toast } from "sonner";

export function useClassEngine() {
    const classRunning = useStore((s) => s.classRunning);
    const tickClass = useStore((s) => s.tickClass);
    const isMonitorMode = useStore((s) => s.isMonitorMode);
    const activeStudentsCount = useStore((s) => s.activeStudents.length);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inactivityRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cloudSyncRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── 1. CLASS ENGINE: Ticking, Metrics Aggregation ───
    useEffect(() => {
        if (!classRunning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(async () => {
            const state = useStore.getState();
            if (!state.currentTenantId) return;

            // Only designated Master machine should authoritative-tick the class time
            const sessionFromHistory = state.classHistory.find(s => s.id === state.currentSessionId);
            const masterId = state.currentMasterId || sessionFromHistory?.masterId;
            const isMaster = !masterId || masterId === state.machineId;

            if (!isMaster) return;

            const studentUpdates: Record<string, Partial<ActiveStudent>> = {};

            state.activeStudents.forEach((a) => {
                const student = state.students.find((s) => s.id === a.studentId);
                if (!student || !student.active) return;

                const lastHB = a.lastHeartbeat;
                const secondsSinceLastHB = lastHB ? (Date.now() - lastHB) / 1000 : 99999;

                // 1. Increment connected seconds (Only if sensor is sending data within 15s)
                const nextConnectedSeconds = a.connectedSeconds + (a.connected && secondsSinceLastHB <= 15 ? 1 : 0);

                // 2. Zone Time accumulation
                const zone = getZoneForPercent(a.fcmPercent, state.zones);
                const nextZoneTime = { ...(a.zoneTimeSeconds || {}) };
                nextZoneTime[zone.id] = (nextZoneTime[zone.id] || 0) + 1;

                // 3. Points accumulation
                const pointsPerSec = (zone.pointsPerMinute || 0) / 60;
                const nextPoints = a.points + pointsPerSec;

                // 4. Calories accumulation
                const calPerSec = calculateCalories(
                    a.bpm,
                    student.weight || 70,
                    student.sex || 'M',
                    student.age || 25,
                    1
                );
                const nextCalories = a.calories + calPerSec;

                studentUpdates[a.studentId] = {
                    connectedSeconds: nextConnectedSeconds,
                    zoneTimeSeconds: nextZoneTime,
                    points: nextPoints,
                    calories: nextCalories,
                    currentZoneId: zone.id,
                };
            });

            // Apply all student updates at once
            if (Object.keys(studentUpdates).length > 0) {
                useStore.setState((prev) => ({
                    activeStudents: prev.activeStudents.map((s) => 
                        studentUpdates[s.studentId] ? { ...s, ...studentUpdates[s.studentId] } : s
                    )
                }));
            }

            // Central time tick for the whole class
            state.tickClass();
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [classRunning, tickClass]);

    // ─── 2. INACTIVITY MONITOR: Signal Loss & Auto-Removal ───
    useEffect(() => {
        if (activeStudentsCount === 0) {
            if (inactivityRef.current) {
                clearInterval(inactivityRef.current);
                inactivityRef.current = null;
            }
            return;
        }

        inactivityRef.current = setInterval(() => {
            const state = useStore.getState();
            const machineId = state.machineId;
            const currentMasterId = state.currentMasterId;
            const studentUpdates: Record<string, Partial<ActiveStudent>> = {};

            // Authorities for removal: Master machine or Local Mode (no master set)
            const canPerformRemoval = isMonitorMode && (!currentMasterId || currentMasterId === machineId);

            state.activeStudents.forEach((a) => {
                const lastHB = a.lastHeartbeat;
                const secondsSinceLastHB = lastHB ? (Date.now() - lastHB) / 1000 : 99999;
                const student = state.students.find((s) => s.id === a.studentId);
                
                // Stage 2: Automatic Removal (60s)
                if (secondsSinceLastHB > 60) {
                    if (canPerformRemoval && student) {
                        state.cacheSessionParticipant(a.studentId, {
                            points: a.points,
                            calories: a.calories,
                            zoneTimeSeconds: { ...a.zoneTimeSeconds },
                            connectedSeconds: a.connectedSeconds,
                            sessionStartPoints: a.sessionStartPoints,
                            sessionStartCalories: a.sessionStartCalories,
                            professorId: a.professorId,
                        });
                        state.removeActiveStudent(a.studentId);
                        toast.error(`Removido por inatividade (60s): ${student.name}`, { id: `remove-${a.studentId}` });
                    }
                    return;
                }

                // Stage 1: Warning & Disconnection (15s)
                if (secondsSinceLastHB > 15 && a.connected) {
                    studentUpdates[a.studentId] = {
                        connected: false,
                        bpm: 0,
                        fcmPercent: 0
                    };
                    if (student) {
                        toast.warning(`Sinal perdido (15s): ${student.name}`, { id: `warn-${a.studentId}` });
                    }
                }
            });

            if (Object.keys(studentUpdates).length > 0) {
                useStore.setState((prev) => ({
                    activeStudents: prev.activeStudents.map((s) => 
                        studentUpdates[s.studentId] ? { ...s, ...studentUpdates[s.studentId] } : s
                    )
                }));
            }
        }, 1000);

        return () => {
            if (inactivityRef.current) clearInterval(inactivityRef.current);
        };
    }, [activeStudentsCount, isMonitorMode]);

    // ─── 3. CLOUD SYNC: Final persistence every 10s ───
    useEffect(() => {
        if (!classRunning || !isMonitorMode) {
            if (cloudSyncRef.current) {
                clearInterval(cloudSyncRef.current);
                cloudSyncRef.current = null;
            }
            return;
        }

        cloudSyncRef.current = setInterval(async () => {
            const state = useStore.getState();
            const tenantId = state.currentTenantId;
            const sessionId = state.currentSessionId;
            if (!tenantId || !sessionId) return;

            // AM I THE MASTER?
            const sessionFromHistory = state.classHistory.find(s => s.id === sessionId);
            const masterId = state.currentMasterId || sessionFromHistory?.masterId;
            const isMaster = isMonitorMode && (!masterId || masterId === state.machineId);
            
            if (!isMaster) return;

            const participantMap = new Map<string, any>();
            
            // Cached participants
            Object.entries(state.sessionParticipantsCache).forEach(([studentId, cached]) => {
                participantMap.set(studentId, {
                    studentId,
                    points: Math.round(cached.points),
                    calories: Math.round(cached.calories),
                    avgFcmPercent: 0,
                    peakBpm: 0,
                    zoneTimeSeconds: { ...cached.zoneTimeSeconds },
                    connectedSeconds: cached.connectedSeconds || 0,
                    professorId: cached.professorId,
                });
            });

            // Active participants
            state.activeStudents.forEach((a) => {
                participantMap.set(a.studentId, {
                    studentId: a.studentId,
                    points: Math.round(a.points),
                    calories: Math.round(a.calories),
                    avgFcmPercent: a.fcmPercent,
                    peakBpm: a.bpm,
                    zoneTimeSeconds: { ...a.zoneTimeSeconds },
                    connectedSeconds: a.connectedSeconds,
                    professorId: a.professorId,
                });
            });

            const participantUpdates = Array.from(participantMap.values()).filter(p => p.points > 0 || p.connectedSeconds > 0);
            if (participantUpdates.length === 0) return;

            try {
                await upsertClassSession({
                    id: sessionId,
                    tenantId,
                    date: state.sessionStartDate || new Date().toISOString(),
                    durationSeconds: state.classElapsed,
                    totalPoints: participantUpdates.reduce((s, p) => s + p.points, 0),
                    totalCalories: participantUpdates.reduce((s, p) => s + p.calories, 0),
                    turmaId: state.classTurmaId,
                    professorId: state.classProfessorId,
                    participants: [],
                });
                await upsertClassParticipants(sessionId, participantUpdates, tenantId);
            } catch (err) {
                console.error("[CloudSync] Periodic sync failed:", err);
            }
        }, 10000);

        return () => {
            if (cloudSyncRef.current) clearInterval(cloudSyncRef.current);
        };
    }, [classRunning, isMonitorMode]);
}
