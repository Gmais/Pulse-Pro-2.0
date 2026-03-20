import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

export function useDataSync() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializeTenant = useStore((s) => s.initializeTenant);
  const initializeStudentSession = useStore((s) => s.initializeStudentSession);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      console.log("useDataSync: starting loadAll...");
      try {
        const isStudent = !!localStorage.getItem("student_auth");
        console.log("useDataSync: isStudent authenticated:", isStudent);

        if (isStudent) {
          console.log("useDataSync: calling initializeStudentSession...");
          await initializeStudentSession();
        } else {
          console.log("useDataSync: calling initializeTenant...");
          await initializeTenant();
        }

        if (cancelled) {
          console.log("useDataSync: cancelled");
          return;
        }
        console.log("useDataSync: finished successfully");
      } catch (err: any) {
        console.error("useDataSync: Failed to initialize sync:", err);
        if (!cancelled) setError(err.message);
      } finally {
        console.log("useDataSync: setting loading to false");
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [initializeTenant]);

  return { loading, error };
}
