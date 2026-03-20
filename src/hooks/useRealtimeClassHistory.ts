/**
 * useRealtimeClassHistory — Supabase Realtime subscription for class_sessions
 * and class_participants tables.
 *
 * When a class finishes (or participants are synced mid-class), inserted/updated
 * rows in these tables are automatically reflected in the local Zustand store.
 * This keeps the Reports, Ranking, and Dashboard pages up-to-date in real time
 * without requiring manual refresh or polling.
 *
 * Mounted globally in AppContent so it's always active.
 * Includes retry with exponential backoff on channel errors.
 */
import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import type { ClassSession } from "@/types/pulse";
import type { RealtimeChannel } from "@supabase/supabase-js";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

export function useRealtimeClassHistory() {
    const currentTenantId = useStore((s) => s.currentTenantId);
    const sessionsChannelRef = useRef<RealtimeChannel | null>(null);
    const participantsChannelRef = useRef<RealtimeChannel | null>(null);
    const sessionsRetryRef = useRef(0);
    const participantsRetryRef = useRef(0);
    const sessionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const participantsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!currentTenantId) return;

        // ── Subscribe to class_sessions ──
        function subscribeSessions() {
            if (sessionsChannelRef.current) {
                supabase.removeChannel(sessionsChannelRef.current);
                sessionsChannelRef.current = null;
            }

            const channel = supabase
                .channel(`class-sessions-rt-${currentTenantId}-${sessionsRetryRef.current}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "class_sessions",
                        filter: `tenant_id=eq.${currentTenantId}`,
                    },
                    (payload) => {
                        const s = payload.new as any;
                        if (!s?.id) return;
                        console.log("[Realtime] Class session event received:", s.id, payload.eventType);

                        const newSession: ClassSession = {
                            id: s.id,
                            tenantId: s.tenant_id,
                            date: s.date,
                            durationSeconds: Number(s.duration_seconds ?? 0),
                            totalPoints: Number(s.total_points ?? 0),
                            totalCalories: Number(s.total_calories ?? 0),
                            turmaId: s.turma_id || undefined,
                            masterId: s.master_id || undefined,
                            participants: [], // participants arrive separately or via UPDATE
                        };

                        const state = useStore.getState();
                        
                        // If a new session starts and we are NOT running anything, join it automatically as follower
                        if (payload.eventType === "INSERT" && !state.classRunning && s.master_id) {
                            console.log(`[Realtime] Remote session started. Joining as follower. Master: ${s.master_id}`);
                            state.joinClass(s.id, s.master_id, s.date);
                        }

                        useStore.setState((state) => {
                            const index = state.classHistory.findIndex((h) => h.id === s.id);
                            if (index >= 0) {
                                // OVERWRITE existing session to ensure we have the DB version (correct totals/master)
                                const updatedHistory = [...state.classHistory];
                                updatedHistory[index] = {
                                    ...updatedHistory[index],
                                    ...newSession,
                                    participants: updatedHistory[index].participants // keep existing participants
                                };
                                return { classHistory: updatedHistory };
                            }
                            return { classHistory: [...state.classHistory, newSession] };
                        });
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "class_sessions",
                        filter: `tenant_id=eq.${currentTenantId}`,
                    },
                    (payload) => {
                        const s = payload.new as any;
                        if (!s?.id) return;
                        console.log("[Realtime] class_session updated:", s.id);

                        useStore.setState((state) => ({
                            currentMasterId: state.currentSessionId === s.id ? (s.master_id || state.currentMasterId) : state.currentMasterId,
                            classHistory: state.classHistory.map((session) =>
                                session.id === s.id
                                    ? {
                                        ...session,
                                        durationSeconds: Number(s.duration_seconds ?? session.durationSeconds),
                                        totalPoints: Number(s.total_points ?? session.totalPoints),
                                        totalCalories: Number(s.total_calories ?? session.totalCalories),
                                        turmaId: s.turma_id || session.turmaId,
                                        masterId: s.master_id || session.masterId,
                                    }
                                    : session
                            ),
                        }));
                    }
                )
                .subscribe((status) => {
                    if (status === "SUBSCRIBED") {
                        console.log("[Realtime] Subscribed to class_sessions for tenant:", currentTenantId);
                        sessionsRetryRef.current = 0;
                    }
                    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                        console.warn(`[Realtime] ${status} on class_sessions (attempt ${sessionsRetryRef.current + 1}/${MAX_RETRIES})`);
                        if (sessionsRetryRef.current < MAX_RETRIES) {
                            const delay = BASE_DELAY_MS * Math.pow(2, sessionsRetryRef.current);
                            sessionsRetryRef.current++;
                            sessionsTimerRef.current = setTimeout(() => subscribeSessions(), delay);
                        }
                    }
                });

            sessionsChannelRef.current = channel;
        }

        // ── Subscribe to class_participants ──
        function subscribeParticipants() {
            if (participantsChannelRef.current) {
                supabase.removeChannel(participantsChannelRef.current);
                participantsChannelRef.current = null;
            }

            const channel = supabase
                .channel(`class-participants-rt-${currentTenantId}-${participantsRetryRef.current}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "class_participants",
                        filter: `tenant_id=eq.${currentTenantId}`,
                    },
                    (payload) => {
                        const p = payload.new as any;
                        if (!p?.session_id || !p?.student_id) return;
                        console.log("[Realtime] New class_participant:", p.student_id, "in session:", p.session_id);

                        const participant = {
                            studentId: p.student_id,
                            points: Number(p.points ?? 0),
                            calories: Number(p.calories ?? 0),
                            avgFcmPercent: Number(p.avg_fcm_percent ?? 0),
                            peakBpm: Number(p.peak_bpm ?? 0),
                            zoneTimeSeconds: (p.zone_time_seconds as Record<string, number>) || {},
                            professorId: p.professor_id || undefined,
                        };

                        useStore.setState((state) => {
                            // ── SYNC ACTIVE STUDENTS ──
                            // If this machine is in the same session, ensure this student is in activeStudents
                            const isActiveSession = state.currentSessionId === p.session_id;
                            const alreadyInActive = state.activeStudents.some(a => a.studentId === p.student_id);
                            
                            let nextActiveStudents = state.activeStudents;
                            if (isActiveSession && !alreadyInActive) {
                                console.log(`[Realtime] Syncing new active student: ${p.student_id}`);
                                const student = state.students.find(s => s.id === p.student_id);
                                if (student) {
                                    nextActiveStudents = [...state.activeStudents, {
                                        studentId: p.student_id,
                                        bpm: 0,
                                        fcmPercent: 0,
                                        calories: Number(p.calories ?? 0),
                                        points: Number(p.points ?? 0),
                                        currentZoneId: "z1",
                                        connected: false,
                                        connectionTimer: null,
                                        zoneTimeSeconds: (p.zone_time_seconds as Record<string, number>) || {},
                                        rssi: null,
                                        batteryLevel: null,
                                        connectedSeconds: Number(p.connected_seconds ?? 0),
                                        sessionStartPoints: student.totalPoints,
                                        sessionStartCalories: student.totalCalories,
                                        professorId: p.professor_id || undefined,
                                        lastHeartbeat: Date.now(),
                                    }];
                                }
                            }

                            return {
                                activeStudents: nextActiveStudents,
                                classHistory: state.classHistory.map((session) => {
                                    if (session.id !== p.session_id) return session;
                                    const alreadyExists = session.participants.some(
                                        (pp) => pp.studentId === p.student_id
                                    );
                                    if (alreadyExists) {
                                        // Update existing instead of skipping, to ensure latest data
                                        return {
                                            ...session,
                                            participants: session.participants.map(pp => 
                                                pp.studentId === p.student_id ? { ...participant, connectedSeconds: Number(p.connected_seconds ?? 0) } : pp
                                            )
                                        };
                                    }
                                    return {
                                        ...session,
                                        participants: [...session.participants, participant],
                                    };
                                }),
                            };
                        });
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "class_participants",
                        filter: `tenant_id=eq.${currentTenantId}`,
                    },
                    (payload) => {
                        const p = payload.new as any;
                        if (!p?.session_id || !p?.student_id) return;

                        useStore.setState((state) => ({
                            activeStudents: state.activeStudents.map((a) =>
                                a.studentId === p.student_id && state.currentSessionId === p.session_id
                                    ? {
                                        ...a,
                                        points: Number(p.points ?? a.points),
                                        calories: Number(p.calories ?? a.calories),
                                        connectedSeconds: Number(p.connected_seconds ?? a.connectedSeconds),
                                        zoneTimeSeconds: (p.zone_time_seconds as Record<string, number>) || a.zoneTimeSeconds,
                                    }
                                    : a
                            ),
                            classHistory: state.classHistory.map((session) => {
                                if (session.id !== p.session_id) return session;
                                return {
                                    ...session,
                                    participants: session.participants.map((pp) =>
                                        pp.studentId === p.student_id
                                            ? {
                                                ...pp,
                                                points: Number(p.points ?? pp.points),
                                                calories: Number(p.calories ?? pp.calories),
                                                avgFcmPercent: Number(p.avg_fcm_percent ?? pp.avgFcmPercent),
                                                peakBpm: Number(p.peak_bpm ?? pp.peakBpm),
                                                connectedSeconds: Number(p.connected_seconds ?? pp.connectedSeconds),
                                                zoneTimeSeconds: (p.zone_time_seconds as Record<string, number>) || pp.zoneTimeSeconds,
                                                professorId: p.professor_id || pp.professorId,
                                            }
                                            : pp
                                    ),
                                };
                            }),
                        }));
                    }
                )
                .subscribe((status) => {
                    if (status === "SUBSCRIBED") {
                        console.log("[Realtime] Subscribed to class_participants for tenant:", currentTenantId);
                        participantsRetryRef.current = 0;
                    }
                    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                        console.warn(`[Realtime] ${status} on class_participants (attempt ${participantsRetryRef.current + 1}/${MAX_RETRIES})`);
                        if (participantsRetryRef.current < MAX_RETRIES) {
                            const delay = BASE_DELAY_MS * Math.pow(2, participantsRetryRef.current);
                            participantsRetryRef.current++;
                            participantsTimerRef.current = setTimeout(() => subscribeParticipants(), delay);
                        }
                    }
                });

            participantsChannelRef.current = channel;
        }

        subscribeSessions();
        subscribeParticipants();

        return () => {
            if (sessionsTimerRef.current) clearTimeout(sessionsTimerRef.current);
            if (participantsTimerRef.current) clearTimeout(participantsTimerRef.current);
            if (sessionsChannelRef.current) supabase.removeChannel(sessionsChannelRef.current);
            if (participantsChannelRef.current) supabase.removeChannel(participantsChannelRef.current);
            sessionsRetryRef.current = 0;
            participantsRetryRef.current = 0;
        };
    }, [currentTenantId]);
}

