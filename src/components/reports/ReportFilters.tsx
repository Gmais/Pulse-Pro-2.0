import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Turma } from "@/types/pulse";

export type PeriodFilter = "all" | "day" | "week" | "month" | "year" | "custom";

interface Props {
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  dateStart: string;
  setDateStart: (v: string) => void;
  dateEnd: string;
  setDateEnd: (v: string) => void;
  turmas: Turma[];
  selectedTurmaIds: string[];
  toggleTurma: (id: string) => void;
}

const periodLabels: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "Geral" },
  { value: "day", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Período" },
];

export default function ReportFilters({
  period, setPeriod, dateStart, setDateStart, dateEnd, setDateEnd,
  turmas, selectedTurmaIds, toggleTurma,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-display font-semibold text-foreground">Filtros</h2>

      {/* Period chips */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Período</label>
        <div className="flex flex-wrap gap-1.5">
          {periodLabels.map((p) => (
            <Badge
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              className="cursor-pointer select-none transition-colors"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {period === "custom" && (
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

      {/* Turma chips */}
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
    </div>
  );
}
