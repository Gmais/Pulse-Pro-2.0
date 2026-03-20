/**
 * useRealtimeStudents — Supabase Realtime subscription for the students table.
 *
 * When another device (e.g. the monitor PC) writes updated totals to Supabase,
 * this hook automatically updates the local Zustand store so the Ranking page
 * reflects changes instantly without needing a manual page refresh.
 *
 * Mounted globally in AppContent so it's always active.
 * Includes retry with exponential backoff on channel errors.
 */
import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

export function useRealtimeStudents() {
    const currentTenantId = useStore((s) => s.currentTenantId);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!currentTenantId) return;

        function subscribe() {
            // Clean up previous channel if any
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            const channel = supabase
                .channel(`students-realtime-${currentTenantId}-${retryCountRef.current}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "students",
                        filter: `tenant_id=eq.${currentTenantId}`,
                    },
                    (payload) => {
                        const s = payload.new as any;
                        if (!s?.id) return;

                        // Update only the fields that change during a class (totals)
                        // Don't overwrite the whole student to avoid losing local state
                        useStore.setState((state) => ({
                            students: state.students.map((student) =>
                                student.id === s.id
                                    ? {
                                        ...student,
                                        totalPoints: Number(s.total_points ?? student.totalPoints),
                                        totalCalories: Number(s.total_calories ?? student.totalCalories),
                                        totalMinutes: Number(s.total_minutes ?? student.totalMinutes),
                                        totalClasses: Number(s.total_classes ?? student.totalClasses),
                                    }
                                    : student
                            ),
                        }));
                    }
                )
                .subscribe((status) => {
                    if (status === "SUBSCRIBED") {
                        console.log("[Realtime] Subscribed to students table for tenant:", currentTenantId);
                        retryCountRef.current = 0; // Reset on success
                    }
                    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                        console.warn(`[Realtime] ${status} on students table (attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);
                        if (retryCountRef.current < MAX_RETRIES) {
                            const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current);
                            retryCountRef.current++;
                            console.log(`[Realtime] Retrying students subscription in ${delay}ms...`);
                            retryTimerRef.current = setTimeout(() => subscribe(), delay);
                        } else {
                            console.error("[Realtime] Max retries reached for students table. Giving up.");
                        }
                    }
                });

            channelRef.current = channel;
        }

        subscribe();

        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            if (channelRef.current) supabase.removeChannel(channelRef.current);
            retryCountRef.current = 0;
        };
    }, [currentTenantId]);
}
