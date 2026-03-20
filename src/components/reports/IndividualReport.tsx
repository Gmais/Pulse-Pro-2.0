import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Student, ClassSession, Zone, getZoneCssColor } from "@/types/pulse";
import { Search, Download, Flame, Trophy, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Podium from "@/components/Podium";
import { toast } from "sonner";

interface Props {
  students: Student[];
  classHistory: ClassSession[];
  zones: Zone[];
  dateStart: Date;
  dateEnd: Date;
  selectedTurmaIds: string[];
  periodLabel?: string;
  forceStudentId?: string;
}

export default function IndividualReport({
  students,
  classHistory,
  zones,
  dateStart,
  dateEnd,
  selectedTurmaIds,
  periodLabel = "Período",
  forceStudentId
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(forceStudentId || null);
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.matricula.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [students, search]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  // Get student's filtered sessions
  const studentData = useMemo(() => {
    if (!selectedStudentId) return null;

    const sessions = classHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate < dateStart || sessionDate > dateEnd) return false;
      if (selectedTurmaIds.length > 0 && session.turmaId && !selectedTurmaIds.includes(session.turmaId)) return false;
      return session.participants.some((p) => p.studentId === selectedStudentId);
    });

    const participations = sessions.flatMap((s) =>
      s.participants.filter((p) => p.studentId === selectedStudentId)
    );

    const totalCalories = Math.round(participations.reduce((s, p) => s + p.calories, 0));
    const totalPoints = Math.round(participations.reduce((s, p) => s + p.points, 0));
    const totalDurationMin = Math.floor(participations.reduce((s, p) => s + (p.connectedSeconds || 0), 0) / 60);

    const zoneTotals: Record<string, number> = {};
    participations.forEach((p) => {
      Object.entries(p.zoneTimeSeconds).forEach(([zoneId, seconds]) => {
        zoneTotals[zoneId] = (zoneTotals[zoneId] || 0) + seconds;
      });
    });

    const totalZoneSeconds = Object.values(zoneTotals).reduce((s, v) => s + v, 0);

    const zoneData = zones.map((z) => ({
      id: z.id,
      name: z.name,
      color: getZoneCssColor(z.color),
      seconds: zoneTotals[z.id] || 0,
      minutes: Math.floor((zoneTotals[z.id] || 0) / 60),
      percent: totalZoneSeconds > 0 ? Math.round(((zoneTotals[z.id] || 0) / totalZoneSeconds) * 100) : 0,
    }));

    return { totalCalories, totalPoints, totalDurationMin, zoneData, sessionsCount: sessions.length };
  }, [selectedStudentId, classHistory, dateStart, dateEnd, selectedTurmaIds, zones]);

  // Compute rank among all students for the filtered period
  const studentRank = useMemo(() => {
    if (!selectedStudentId || !studentData) return null;

    // Aggregate points for all students in the filtered sessions
    const filteredSessions = classHistory.filter((session) => {
      const sessionDate = new Date(session.date);
      if (sessionDate < dateStart || sessionDate > dateEnd) return false;
      if (selectedTurmaIds.length > 0 && session.turmaId && !selectedTurmaIds.includes(session.turmaId)) return false;
      return true;
    });

    const pointsMap = new Map<string, number>();
    filteredSessions.forEach((session) => {
      session.participants.forEach((p) => {
        pointsMap.set(p.studentId, (pointsMap.get(p.studentId) || 0) + p.points);
      });
    });

    const sorted = [...pointsMap.entries()].sort((a, b) => b[1] - a[1]);
    const idx = sorted.findIndex(([id]) => id === selectedStudentId);
    return idx >= 0 ? idx + 1 : null;
  }, [selectedStudentId, studentData, classHistory, dateStart, dateEnd, selectedTurmaIds]);

  const handleDownloadPdf = () => {
    const studentName = selectedStudent?.name || "relatorio";
    const originalTitle = document.title;
    document.title = `Relatório - ${studentName}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="space-y-4">
      {/* Search - Hidden if student is forced (Student Portal) */}
      {!forceStudentId && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou matrícula..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value.trim()) setSelectedStudentId(null);
            }}
            className="pl-9 h-10"
          />
          {filteredStudents.length > 0 && !selectedStudentId && (
            <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setSearch(s.name);
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                    style={{ backgroundColor: s.avatarUrl ? 'transparent' : s.avatarColor, color: "white" }}
                  >
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      s.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.matricula}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Individual report card */}
      {selectedStudent && studentData && (
        <div ref={reportRef} className="bg-card border border-border rounded-xl overflow-hidden print:border-none print:shadow-none">
          {/* Header */}
          <div className="p-5 flex items-center gap-4 border-b border-border">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden"
              style={{ backgroundColor: selectedStudent.avatarUrl ? 'transparent' : selectedStudent.avatarColor, color: "white" }}
            >
              {selectedStudent.avatarUrl ? (
                <img src={selectedStudent.avatarUrl} alt={selectedStudent.name} className="w-full h-full object-cover" />
              ) : (
                selectedStudent.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-display font-bold text-foreground truncate">{selectedStudent.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedStudent.matricula} · {studentData.sessionsCount} aula{studentData.sessionsCount !== 1 ? "s" : ""} no período
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5 shrink-0">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>

          {studentData.sessionsCount === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma aula encontrada para este aluno no período selecionado
            </div>
          ) : (
            <>
              {/* Individual Podium */}
              <div className="flex justify-center border-b border-border">
                <Podium
                  mode="individual"
                  rank={studentRank || undefined}
                  entries={[{
                    name: selectedStudent.name,
                    value: studentData.totalPoints,
                    valueLabel: "pts",
                    sex: selectedStudent.sex as "M" | "F",
                    avatarColor: selectedStudent.avatarColor,
                    avatarUrl: selectedStudent.avatarUrl,
                  }]}
                />
              </div>

              {/* Zone donut + bars */}
              <div className="p-5 flex flex-col md:flex-row items-center gap-6">
                {/* Donut */}
                <div className="w-48 h-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studentData.zoneData.filter((z) => z.seconds > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        dataKey="percent"
                        strokeWidth={2}
                        stroke="hsl(var(--card))"
                      >
                        {studentData.zoneData
                          .filter((z) => z.seconds > 0)
                          .map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Zone bars */}
                <div className="flex-1 w-full space-y-2.5">
                  {studentData.zoneData.map((z) => {
                    const maxMin = Math.max(...studentData.zoneData.map((zz) => zz.minutes), 1);
                    const barWidth = Math.max((z.minutes / maxMin) * 100, 2);
                    const label = z.minutes > 0 ? `${z.minutes}min` : `${z.seconds}seg`;
                    return (
                      <div key={z.id} className="flex items-center gap-3">
                        <span className="text-xs font-semibold w-28 truncate" style={{ color: z.color }}>
                          {z.name}
                        </span>
                        <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${barWidth}%`, backgroundColor: z.color }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-14 text-right">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 border-t border-border">
                <div className="p-4 flex flex-col items-center gap-1 border-r border-border">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Calorias</span>
                  <span className="text-xl font-display font-bold text-foreground">
                    {studentData.totalCalories}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">kcal</span>
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center gap-1 border-r border-border">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Pontuação</span>
                  <span className="text-xl font-display font-bold text-foreground">{studentData.totalPoints}</span>
                </div>
                <div className="p-4 flex flex-col items-center gap-1">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Duração</span>
                  <span className="text-xl font-display font-bold text-foreground">
                    {studentData.totalDurationMin}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">min</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!selectedStudentId && (
        <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground text-sm">
          Pesquise um aluno para ver o relatório individual
        </div>
      )}
    </div>
  );
}
