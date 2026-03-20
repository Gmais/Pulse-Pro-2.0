import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";
import IndividualReport from "@/components/reports/IndividualReport";
import ReportFilters, { PeriodFilter } from "@/components/reports/ReportFilters";
import { BarChart3 } from "lucide-react";
import {
    startOfDay, endOfDay, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, startOfYear, parseISO
} from "date-fns";

export default function StudentDashboard() {
    const currentStudent = useStore((s) => s.currentStudent);
    const students = useStore((s) => s.students);
    const classHistory = useStore((s) => s.classHistory);
    const zones = useStore((s) => s.zones);
    const turmas = useStore((s) => s.turmas);
    const initializeStudentSession = useStore((s) => s.initializeStudentSession);

    // Filter state — same as ReportsPage
    const [period, setPeriod] = useState<PeriodFilter>("day");
    const [selectedTurmaIds, setSelectedTurmaIds] = useState<string[]>([]);
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");

    const toggleTurma = (id: string) =>
        setSelectedTurmaIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    // Compute date range from period
    const { rangeStart, rangeEnd, periodLabel } = useMemo(() => {
        const now = new Date();
        if (period === "all") return { rangeStart: new Date(0), rangeEnd: new Date(9999, 11, 31), periodLabel: "Histórico Completo" };
        if (period === "day") return { rangeStart: startOfDay(now), rangeEnd: endOfDay(now), periodLabel: "Hoje" };
        if (period === "week") return { rangeStart: startOfWeek(now, { weekStartsOn: 1 }), rangeEnd: endOfWeek(now, { weekStartsOn: 1 }), periodLabel: "Esta Semana" };
        if (period === "month") return { rangeStart: startOfMonth(now), rangeEnd: endOfMonth(now), periodLabel: "Este Mês" };
        if (period === "year") return { rangeStart: startOfYear(now), rangeEnd: endOfDay(now), periodLabel: "Este Ano" };
        return {
            rangeStart: dateStart ? startOfDay(parseISO(dateStart)) : new Date(0),
            rangeEnd: dateEnd ? endOfDay(parseISO(dateEnd)) : new Date(9999, 11, 31),
            periodLabel: dateStart && dateEnd ? `${dateStart} → ${dateEnd}` : "Período Personalizado",
        };
    }, [period, dateStart, dateEnd]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            initializeStudentSession();
        }, 300000);
        return () => clearInterval(interval);
    }, [initializeStudentSession]);


    if (!currentStudent) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>Nenhum aluno identificado. Por favor, faça login novamente.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary">
                    <BarChart3 className="h-5 w-5" />
                    <h1 className="text-xl font-display font-bold uppercase tracking-tight">Meu Desempenho</h1>
                </div>
                <p className="text-muted-foreground text-sm">Acompanhe seu progresso e resultados nos treinos.</p>
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

            {/* Report */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <IndividualReport
                    students={students}
                    classHistory={classHistory}
                    zones={zones}
                    dateStart={rangeStart}
                    dateEnd={rangeEnd}
                    selectedTurmaIds={selectedTurmaIds}
                    periodLabel={periodLabel}
                    forceStudentId={currentStudent.id}
                />
            </div>
        </div>
    );
}
