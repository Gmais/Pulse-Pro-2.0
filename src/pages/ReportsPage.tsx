import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { getZoneCssColor } from "@/types/pulse";
import { BarChart3, Users, Clock, Flame, Trophy, Heart, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReportFilters, { PeriodFilter } from "@/components/reports/ReportFilters";
import IndividualReport from "@/components/reports/IndividualReport";

export default function ReportsPage() {
  const students = useStore((s) => s.students);
  const turmas = useStore((s) => s.turmas);
  const classHistory = useStore((s) => s.classHistory);
  const zones = useStore((s) => s.zones);
  const activeStudents = useStore((s) => s.activeStudents);
  const classRunning = useStore((s) => s.classRunning);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const sessionStartDate = useStore((s) => s.sessionStartDate);
  const classTurmaId = useStore((s) => s.classTurmaId);
  const classElapsed = useStore((s) => s.classElapsed);
  const classProfessorId = useStore((s) => s.classProfessorId);
  const currentTenantId = useStore((s) => s.currentTenantId);
  const sessionParticipantsCache = useStore((s) => s.sessionParticipantsCache);

  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [selectedTurmaIds, setSelectedTurmaIds] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const toggleTurma = (id: string) =>
    setSelectedTurmaIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // Day string for reactive updates across midnight
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Compute date range from period
  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    if (period === "all") return { rangeStart: new Date(0), rangeEnd: new Date(9999, 11, 31) };
    if (period === "day") return { rangeStart: startOfDay(now), rangeEnd: endOfDay(now) };
    if (period === "week") return { rangeStart: startOfWeek(now, { weekStartsOn: 1 }), rangeEnd: endOfWeek(now, { weekStartsOn: 1 }) };
    if (period === "month") return { rangeStart: startOfMonth(now), rangeEnd: endOfMonth(now) };
    if (period === "year") return { rangeStart: startOfYear(now), rangeEnd: endOfDay(now) };
    // custom
    return {
      rangeStart: dateStart ? startOfDay(parseISO(dateStart)) : new Date(0),
      rangeEnd: dateEnd ? endOfDay(parseISO(dateEnd)) : new Date(9999, 11, 31),
    };
  }, [period, dateStart, dateEnd, todayStr]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    let base = classHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate < rangeStart || sessionDate > rangeEnd) return false;
      if (selectedTurmaIds.length > 0 && (!session.turmaId || !selectedTurmaIds.includes(session.turmaId))) return false;
      return true;
    });

    // ── Inject live session data ──
    if (classRunning && currentSessionId) {
      const sessionDate = new Date(sessionStartDate || new Date());
      const matchesDate = sessionDate >= rangeStart && sessionDate <= rangeEnd;
      const matchesTurma = selectedTurmaIds.length === 0 || (classTurmaId && selectedTurmaIds.includes(classTurmaId));

      if (matchesDate && matchesTurma) {
        // If the session is already in base (via cloud sync), remove the stale one and use the live one
        // ── LIVE PARTICIPANTS AGGREGATION ──
        // Combine active and cached (disconnected) participants to avoid missing data mid-class
        const liveParticipantsMap = new Map<string, any>();
        
        // 1. Add cached participants (those who left/disconnected)
        Object.entries(sessionParticipantsCache).forEach(([studentId, cached]) => {
          liveParticipantsMap.set(studentId, {
            studentId,
            points: Math.round(cached.points),
            calories: Math.round(cached.calories),
            avgFcmPercent: 0,
            peakBpm: 0,
            zoneTimeSeconds: { ...cached.zoneTimeSeconds },
            professorId: cached.professorId
          });
        });

        // 2. Add/Override with active participants
        activeStudents.forEach((a) => {
          liveParticipantsMap.set(a.studentId, {
            studentId: a.studentId,
            points: Math.round(a.points),
            calories: Math.round(a.calories),
            avgFcmPercent: a.fcmPercent,
            peakBpm: a.bpm,
            zoneTimeSeconds: { ...a.zoneTimeSeconds },
            connectedSeconds: a.connectedSeconds,
            professorId: a.professorId
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
          professorId: classProfessorId || undefined,
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
  }, [classHistory, rangeStart, rangeEnd, selectedTurmaIds, classRunning, currentSessionId, sessionStartDate, classTurmaId, classElapsed, activeStudents, classProfessorId]);

  const filteredParticipants = useMemo(() => 
    filteredSessions.flatMap((s) => s.participants)
      .filter((p) => {
        const student = students.find((st) => st.id === p.studentId);
        return student && student.active;
      })
  , [filteredSessions, students]);

  // KPIs
  const totalAulas = filteredSessions.length;
  const uniqueStudentIds = new Set(filteredParticipants.map((p) => p.studentId));
  const mediaAlunos = totalAulas > 0 ? Math.round(uniqueStudentIds.size / totalAulas * 10) / 10 : 0;
  const avgFcm = filteredParticipants.length > 0
    ? Math.round(filteredParticipants.reduce((s, p) => s + p.avgFcmPercent, 0) / filteredParticipants.length)
    : 0;
  const totalCalories = Math.round(filteredParticipants.reduce((s, p) => s + p.calories, 0));
  const totalPoints = Math.round(filteredParticipants.reduce((s, p) => s + p.points, 0));
  const totalMinutes = Math.round(filteredSessions.reduce((s, sess) => s + sess.durationSeconds, 0) / 60);

  // Bar chart
  const barChartData = useMemo(() => {
    return filteredSessions.map((session) => {
      const parts = session.participants;
      const avg = parts.length > 0
        ? Math.round(parts.reduce((s, p) => s + p.avgFcmPercent, 0) / parts.length)
        : 0;
      const cal = Math.round(parts.reduce((s, p) => s + p.calories, 0));
      return {
        name: format(new Date(session.date), "dd/MM", { locale: ptBR }),
        "BPM Médio": avg,
        Calorias: cal,
      };
    });
  }, [filteredSessions]);

  // Zone distribution with minutes
  const zoneDistribution = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredParticipants.forEach((p) => {
      Object.entries(p.zoneTimeSeconds).forEach(([zoneId, seconds]) => {
        totals[zoneId] = (totals[zoneId] || 0) + seconds;
      });
    });
    const totalSeconds = Object.values(totals).reduce((s, v) => s + v, 0);
    if (totalSeconds === 0) return [];
    return zones
      .filter((z) => (totals[z.id] || 0) > 0)
      .map((z) => ({
        name: z.name,
        value: Math.round(((totals[z.id] || 0) / totalSeconds) * 100),
        minutes: Math.round((totals[z.id] || 0) / 60),
        color: getZoneCssColor(z.color),
      }));
  }, [filteredParticipants, zones]);

  const kpis = [
    { icon: CalendarDays, label: "Aulas", value: totalAulas, color: "hsl(var(--chart-2))" },
    { icon: Users, label: "Média Alunos", value: mediaAlunos, color: "hsl(var(--chart-3))" },
    { icon: Heart, label: "%FCM Médio", value: avgFcm, color: "hsl(var(--chart-2))" },
    { icon: Flame, label: "Calorias", value: totalCalories, color: "hsl(var(--chart-4))" },
    { icon: Trophy, label: "Pontos", value: totalPoints, color: "hsl(var(--chart-1))" },
    { icon: Clock, label: "Minutos", value: totalMinutes, color: "hsl(var(--chart-3))" },
  ];

  // Real-time updates are handled globally by useRealtimeClassHistory in App.tsx
  // No polling needed — data arrives instantly via Supabase Realtime channels

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análises de desempenho e progresso</p>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        period={period}
        setPeriod={setPeriod}
        dateStart={dateStart}
        setDateStart={setDateStart}
        dateEnd={dateEnd}
        setDateEnd={setDateEnd}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
        toggleTurma={toggleTurma}
      />

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="professores">Professores</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1"
                style={{ borderTopColor: kpi.color, borderTopWidth: 3 }}
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
                  <span className="text-xs font-medium">{kpi.label}</span>
                </div>
                <span className="text-2xl font-display font-bold text-foreground">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-sm font-display font-semibold text-foreground mb-1">Desempenho por Aula</h2>
            <p className="text-xs text-muted-foreground mb-4">Frequência cardíaca média e calorias queimadas</p>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(225, 20%, 12%)", border: "1px solid hsl(225, 15%, 20%)", borderRadius: 8, color: "hsl(210, 40%, 96%)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215, 15%, 55%)" }} />
                  <Bar yAxisId="left" dataKey="BPM Médio" fill="hsl(210, 100%, 55%)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Calorias" fill="hsl(25, 100%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado disponível para os filtros selecionados
              </div>
            )}
          </div>

          {/* Pie Chart with minutes */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-sm font-display font-semibold text-foreground mb-1">Distribuição Geral de Zonas</h2>
            <p className="text-xs text-muted-foreground mb-4">Tempo em cada zona de intensidade</p>
            {zoneDistribution.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width={280} height={280}>
                  <PieChart>
                    <Pie
                      data={zoneDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={45}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {zoneDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(225, 20%, 12%)", border: "1px solid hsl(225, 15%, 20%)", borderRadius: 8, color: "hsl(210, 40%, 96%)" }}
                      formatter={(value: number, _name: string, props: any) => [`${value}% · ${props.payload.minutes}min`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5 w-full">
                  {zoneDistribution.map((z) => {
                    const maxMin = Math.max(...zoneDistribution.map((zz) => zz.minutes), 1);
                    const barWidth = Math.max((z.minutes / maxMin) * 100, 2);
                    return (
                      <div key={z.name} className="flex items-center gap-3">
                        <span className="text-xs font-semibold w-28 truncate" style={{ color: z.color }}>
                          {z.name}
                        </span>
                        <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: z.color }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-14 text-right">{z.minutes}min</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado de zonas disponível
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="individual">
          <IndividualReport
            students={students}
            classHistory={classHistory}
            zones={zones}
            dateStart={rangeStart}
            dateEnd={rangeEnd}
            selectedTurmaIds={selectedTurmaIds}
            periodLabel={period === "all" ? "Geral" : period === "day" ? "Hoje" : period === "week" ? "Esta Semana" : period === "month" ? "Este Mês" : period === "year" ? "Este Ano" : `${dateStart} a ${dateEnd}`}
          />
        </TabsContent>

        <TabsContent value="professores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-sm font-display font-semibold text-foreground mb-4">Alunos por Professor</h2>
              <div className="space-y-4">
                {useStore.getState().professors.map(prof => {
                  const profCount = filteredParticipants.filter(p => (p.professorId === prof.id || (!p.professorId && filteredSessions.find(s => s.id === (p as any).sessionId)?.professorId === prof.id))).length;
                  const total = filteredParticipants.length || 1;
                  const percentage = (profCount / total) * 100;
                  
                  return (
                    <div key={prof.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{prof.name}</span>
                        <span className="font-bold text-foreground">{profCount} alunos</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{filteredParticipants.length}</p>
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Total de Alunos no Período</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
