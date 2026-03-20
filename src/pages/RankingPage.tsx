import { useState, useMemo, useEffect, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { fetchStudents } from "@/services/dataService";
import { Trophy, Flame, Star, Award, Filter } from "lucide-react";
import Podium from "@/components/Podium";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type PeriodFilter = "all" | "day" | "week" | "month" | "year" | "custom";
type SortBy = "points" | "calories" | "classes" | "minutes";

// Default tiebreak order: points → calories → minutes → classes
const defaultOrder: SortBy[] = ["points", "calories", "minutes", "classes"];

function multiSort(a: any, b: any, primary: SortBy): number {
  // Build order: primary first, then remaining in default order
  const order = [primary, ...defaultOrder.filter((k) => k !== primary)];
  for (const key of order) {
    const field = `rank${key.charAt(0).toUpperCase() + key.slice(1)}`;
    const diff = (b[field] as number) - (a[field] as number);
    if (diff !== 0) return diff;
  }
  return 0;
}

const periodLabels: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Geral" },
  { value: "day", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Período" },
];

export default function RankingPage() {
  const { 
    students, classHistory, turmas, activeStudents, classRunning, classElapsed, 
    sessionParticipantsCache, currentSessionId, sessionStartDate, classTurmaId, currentTenantId 
  } = useStore();
  const [selectedTurmaIds, setSelectedTurmaIds] = useState<string[]>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("day");
  const [sortBy, setSortBy] = useState<SortBy>("points");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleTurma = (id: string) =>
    setSelectedTurmaIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // Day string for reactive updates across midnight
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Unified date range logic — matches ReportsPage exactly
  const getDateRange = useCallback((): { from: Date; to: Date } | null => {
    const now = new Date();
    switch (periodFilter) {
      case "day":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "week":
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
      case "month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "year":
        return { from: startOfYear(now), to: endOfDay(now) };
      case "custom":
        if (dateStart && dateEnd) return { from: startOfDay(parseISO(dateStart)), to: endOfDay(parseISO(dateEnd)) };
        return null;
      default:
        return null; // "all" — no date filter
    }
  }, [periodFilter, dateStart, dateEnd, todayStr]);

  // ── Unified Session Filtering (Matches ReportsPage) ──
  const filteredSessions = useMemo(() => {
    const range = getDateRange();
    let base = classHistory.filter((session) => {
      if (!range) return true; // "all"
      const sessionDate = new Date(session.date);
      if (sessionDate < range.from || sessionDate > range.to) return false;
      if (selectedTurmaIds.length > 0 && (!session.turmaId || !selectedTurmaIds.includes(session.turmaId))) return false;
      return true;
    });

    // ── Inject live session data ──
    if (classRunning && currentSessionId) {
      const rangeDate = range || { from: new Date(0), to: new Date(9999, 11, 31) };
      const sessionDate = new Date(sessionStartDate || new Date());
      const matchesDate = sessionDate >= rangeDate.from && sessionDate <= rangeDate.to;
      const matchesTurma = selectedTurmaIds.length === 0 || (classTurmaId && selectedTurmaIds.includes(classTurmaId));

      if (matchesDate && matchesTurma) {
        const liveParticipantsMap = new Map<string, any>();
        Object.entries(sessionParticipantsCache).forEach(([studentId, cached]) => {
          liveParticipantsMap.set(studentId, {
            studentId,
            points: Math.round(cached.points),
            calories: Math.round(cached.calories),
            avgFcmPercent: 0,
            peakBpm: 0,
            zoneTimeSeconds: { ...cached.zoneTimeSeconds }
          });
        });
        activeStudents.forEach((a) => {
          liveParticipantsMap.set(a.studentId, {
            studentId: a.studentId,
            points: Math.round(a.points),
            calories: Math.round(a.calories),
            avgFcmPercent: a.fcmPercent,
            peakBpm: a.bpm,
            zoneTimeSeconds: { ...a.zoneTimeSeconds },
            connectedSeconds: a.connectedSeconds
          });
        });

        const participants = Array.from(liveParticipantsMap.values());
        const liveSession = {
          id: currentSessionId,
          tenantId: currentTenantId,
          date: sessionStartDate || new Date().toISOString(),
          durationSeconds: classElapsed,
          totalPoints: participants.reduce((s, p) => s + p.points, 0),
          totalCalories: participants.reduce((s, p) => s + p.calories, 0),
          turmaId: classTurmaId,
          participants
        };
        
        const existingIndex = base.findIndex(s => s.id === currentSessionId);
        if (existingIndex >= 0) {
          base[existingIndex] = liveSession;
        } else {
          base = [...base, liveSession];
        }
      }
    }
    return base;
  }, [classHistory, classRunning, currentSessionId, sessionStartDate, classTurmaId, classElapsed, activeStudents, sessionParticipantsCache, selectedTurmaIds, getDateRange]);

  const filteredParticipants = useMemo(() => 
    filteredSessions.flatMap((s) => s.participants)
      .filter((p) => {
        const student = students.find((st) => st.id === p.studentId);
        return student && student.active;
      })
  , [filteredSessions, students]);

  const ranked = useMemo(() => {
    const range = getDateRange();
    const filteredStudents = students.filter((s) => s.active);

    if (!range) {
      // "all" — Use cumulative totals + handle live session specially for deduplication
      return filteredStudents.map((s) => {
        // Find if this student has live data for the CURRENT session
        // Note: filteredSessions[existingIndex] already has the live session data
        const liveParticipant = filteredParticipants.find(p => p.studentId === s.id && filteredSessions.some(sess => sess.id === currentSessionId && sess.participants.some(pp => pp.studentId === s.id)));
        
        // If there's an active session, use sessionStartPoints to avoid double counting synced deltas
        const active = activeStudents.find((a) => a.studentId === s.id);
        const basePoints = active ? active.sessionStartPoints : s.totalPoints;
        const baseCalories = active ? active.sessionStartCalories : s.totalCalories;
        
        // However, if the session is NOT active but in cache, sessionStartPoints might be missing
        // For simplicity in "All" mode, we still rely on the logic that base + live gain is correct
        // but RankingPage "All" mode is usually stable.
        
        // Re-calculate live points from the unified source
        const live = filteredParticipants.find(p => p.studentId === s.id && filteredSessions.some(sess => sess.id === currentSessionId));

        return {
          ...s,
          rankPoints: basePoints + (live?.points || 0),
          rankCalories: baseCalories + (live?.calories || 0),
          rankClasses: s.totalClasses + (live ? 1 : 0),
          rankMinutes: s.totalMinutes + (live ? Math.floor((live as any).connectedSeconds / 60) : 0),
        };
      }).sort((a, b) => multiSort(a, b, sortBy));
    }

    // RANGE MODE: Aggregate from filteredSessions (already contains live injection and deduplication)
    const studentMap = new Map<string, { points: number; calories: number; classes: number; minutes: number }>();

    filteredSessions.forEach((session) => {
      session.participants.forEach((p) => {
        const existing = studentMap.get(p.studentId) || { points: 0, calories: 0, classes: 0, minutes: 0 };
        existing.points += p.points;
        existing.calories += p.calories;
        existing.classes += 1;
        existing.minutes += Math.floor((p.connectedSeconds || 0) / 60);
        studentMap.set(p.studentId, existing);
      });
    });

    return filteredStudents
      .map((s) => {
        const data = studentMap.get(s.id) || { points: 0, calories: 0, classes: 0, minutes: 0 };
        return {
          ...s,
          rankPoints: data.points,
          rankCalories: data.calories,
          rankClasses: data.classes,
          rankMinutes: data.minutes,
        };
      })
      .sort((a, b) => multiSort(a, b, sortBy));
  }, [students, filteredSessions, filteredParticipants, sortBy, currentSessionId, activeStudents, getDateRange]);

  // Lightweight student refresh: polls DB every 8s to pick up live updates from other devices
  // Reads tenantId directly from store (not closure) to avoid stale-closure timing bugs
  const refreshStudents = useCallback(async () => {
    const tenantId = useStore.getState().currentTenantId;
    if (!tenantId) {
      console.log("[Ranking] refreshStudents: tenantId not yet set, skipping");
      return;
    }
    try {
      const fresh = await fetchStudents(tenantId);
      console.log(`[Ranking] refreshStudents: fetched ${fresh.length} students from DB`);
      if (fresh.length === 0) return;

      useStore.setState((s) => {
        // Replace entirely if size changed or local list was empty
        if (s.students.length !== fresh.length) {
          console.log(`[Ranking] refreshStudents: list size mismatch (${s.students.length} vs ${fresh.length}), replacing list`);
          return { students: fresh };
        }
        // Otherwise update only the total fields to keep local transient state (like selected student)
        return {
          students: s.students.map((existing) => {
            const updated = fresh.find((f) => f.id === existing.id);
            if (!updated) return existing;
            return {
              ...existing,
              totalPoints: updated.totalPoints,
              totalCalories: updated.totalCalories,
              totalClasses: updated.totalClasses,
              totalMinutes: updated.totalMinutes,
            };
          }),
        };
      });
    } catch (err) {
      console.warn("[Ranking] refreshStudents: fetch failed", err);
    }
  }, []); // no deps — reads from getState() directly

  useEffect(() => {
    // Fetch immediately on mount; retry once after 2s in case tenantId wasn't ready
    refreshStudents();
    const retryTimer = setTimeout(refreshStudents, 2000);
    // Then poll every 8 seconds
    const interval = setInterval(refreshStudents, 8000);
    return () => {
      clearTimeout(retryTimer);
      clearInterval(interval);
    };
  }, [refreshStudents]);

  const medals = ["🥇", "🥈", "🥉"];

  const totalActive = ranked.length;
  // Use filteredParticipants for total KPIs to match ReportsPage exactly
  const totalPoints = Math.round(filteredParticipants.reduce((s, p) => s + p.points, 0));
  const totalCalories = Math.round(filteredParticipants.reduce((s, p) => s + p.calories, 0));

  const currentPeriodLabel = periodLabels.find((p) => p.value === periodFilter)?.label || "Geral";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Ranking & Gamificação</h1>
      </div>

      {/* Filters — unified with ReportsPage */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-display font-semibold text-foreground">Filtros</h2>

        {/* Period chips */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Período</label>
          <div className="flex flex-wrap gap-1.5">
            {periodLabels.map((p) => (
              <Badge
                key={p.value}
                variant={periodFilter === p.value ? "default" : "outline"}
                className="cursor-pointer select-none transition-colors"
                onClick={() => setPeriodFilter(p.value)}
              >
                {p.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom date range */}
        {periodFilter === "custom" && (
          <div className="flex gap-3 max-w-md">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Data Início</label>
              <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Data Fim</label>
              <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
        )}

        {/* Turma chips — multi-select like ReportsPage */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Turmas</label>
          <div className="flex flex-wrap gap-1.5">
            {turmas.map((t) => (
              <Badge
                key={t.id}
                variant={selectedTurmaIds.includes(t.id) ? "default" : "outline"}
                className="cursor-pointer select-none transition-colors"
                onClick={() => toggleTurma(t.id)}
              >
                {t.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Sort by */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Ordenar por</label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="points">Pontos</SelectItem>
              <SelectItem value="calories">Calorias</SelectItem>
              <SelectItem value="classes">Aulas</SelectItem>
              <SelectItem value="minutes">Minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Podium - Top 3 */}
      {ranked.length >= 2 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <Podium
            entries={ranked.slice(0, 3).map((s) => ({
              name: s.name,
              value: sortBy === "points" ? s.rankPoints : sortBy === "calories" ? s.rankCalories : sortBy === "classes" ? s.rankClasses : s.rankMinutes,
              valueLabel: sortBy === "points" ? "pts" : sortBy === "calories" ? "kcal" : sortBy === "classes" ? "aulas" : "min",
              sex: s.sex as "M" | "F",
              avatarColor: s.avatarColor,
              avatarUrl: s.avatarUrl,
            }))}
          />
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total de Alunos", value: totalActive, icon: Star, color: "text-zone-warmup" },
          { label: "Pontos Distribuídos", value: Math.round(totalPoints), icon: Award, color: "text-primary" },
          { label: "Calorias Queimadas", value: Math.round(totalCalories), icon: Flame, color: "text-zone-burn-full" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ranking table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <h2 className="text-sm font-display font-semibold text-foreground">
            Ranking {currentPeriodLabel}
            {selectedTurmaIds.length > 0 && ` — ${selectedTurmaIds.map((id) => turmas.find((t) => t.id === id)?.name).filter(Boolean).join(", ")}`}
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Pos", "Nome", "Aulas", "Minutos", "Calorias", "Pontos"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum dado disponível ainda. Inicie aulas para gerar o ranking.
                </td>
              </tr>
            ) : (
              ranked.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-lg">
                    {i < 3 ? medals[i] : <span className="text-sm text-muted-foreground">{i + 1}º</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground overflow-hidden"
                        style={{ backgroundColor: s.avatarUrl ? 'transparent' : s.avatarColor }}
                      >
                        {s.avatarUrl ? (
                          <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          s.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        {selectedTurmaIds.length === 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            {turmas.find((t) => t.id === s.turmaId)?.name || "—"}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground tabular-nums">{s.rankClasses}</td>
                  <td className="px-4 py-3 text-sm text-foreground tabular-nums">{s.rankMinutes}</td>
                  <td className="px-4 py-3 text-sm text-foreground tabular-nums">{Math.round(s.rankCalories)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-display font-bold text-primary tabular-nums">{Math.round(s.rankPoints)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Points system info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-3">Sistema de Pontuação</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { zone: "Início da Queima", pts: "1 pt/min", color: "bg-zone-burn-start" },
            { zone: "Queima Total", pts: "2 pts/min", color: "bg-zone-burn-full" },
            { zone: "Performance", pts: "3 pts/min", color: "bg-zone-performance" },
          ].map(({ zone, pts, color }) => (
            <div key={zone} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <div>
                <div className="text-xs font-medium text-foreground">{zone}</div>
                <div className="text-[10px] text-muted-foreground">{pts}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
