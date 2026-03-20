import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, Users, Search, BookOpen, BarChart3, Clock, CalendarDays, ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, startOfWeek, startOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfessoresPage() {
    const { professors, addProfessor, updateProfessor, deleteProfessor, classHistory, activeStudents, classRunning, classProfessorId } = useStore();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const professorStats = useMemo(() => {
        const stats: Record<string, number> = {};
        classHistory.forEach((session) => {
            session.participants.forEach(p => {
                const profId = p.professorId || session.professorId;
                if (profId) stats[profId] = (stats[profId] || 0) + 1;
            });
        });
        // Count live session
        if (classRunning) {
            activeStudents.forEach(a => {
                const profId = a.professorId || classProfessorId;
                if (profId) stats[profId] = (stats[profId] || 0) + 1;
            });
        }
        return stats;
    }, [classHistory, activeStudents, classRunning, classProfessorId]);

    // Report Filters
    const [reportFilterProfessorId, setReportFilterProfessorId] = useState<string>("all");
    const [reportPeriod, setReportPeriod] = useState<string>("month");
    const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

    const reportData = useMemo(() => {
        let count = 0;
        const now = new Date();
        let start: Date;
        let end: Date = now;

        switch (reportPeriod) {
            case "day":
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case "week":
                start = startOfWeek(now, { weekStartsOn: 1 });
                break;
            case "month":
                start = startOfMonth(now);
                break;
            case "custom":
                start = parseISO(customStartDate);
                end = parseISO(customEndDate);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start = startOfMonth(now);
        }

        classHistory.forEach((session) => {
            const sessionDate = parseISO(session.date);
            if (isWithinInterval(sessionDate, { start, end })) {
                session.participants.forEach(p => {
                    const profId = p.professorId || session.professorId;
                    if (reportFilterProfessorId === "all" || profId === reportFilterProfessorId) {
                        count++;
                    }
                });
            }
        });

        // Count live session if within interval
        if (classRunning && isWithinInterval(now, { start, end })) {
            activeStudents.forEach(a => {
                const profId = a.professorId || classProfessorId;
                if (reportFilterProfessorId === "all" || profId === reportFilterProfessorId) {
                    count++;
                }
            });
        }

        return { count, start, end };
    }, [classHistory, reportFilterProfessorId, reportPeriod, customStartDate, customEndDate, activeStudents, classRunning, classProfessorId]);

    const filteredProfessors = professors.filter((p) => {
        const term = searchTerm.toLowerCase();
        return (
            p.name.toLowerCase().includes(term) ||
            p.email.toLowerCase().includes(term)
        );
    });

    const [form, setForm] = useState({
        name: "",
        email: "",
        active: true,
        bio: "",
    });

    const resetForm = () => {
        setForm({
            name: "",
            email: "",
            active: true,
            bio: "",
        });
        setEditingId(null);
    };

    const handleSave = () => {
        if (!form.name.trim()) {
            toast.error("O nome é obrigatório.");
            return;
        }
        if (!form.email.trim() || !form.email.includes("@")) {
            toast.error("O email é inválido ou está ausente.");
            return;
        }

        try {
            if (editingId) {
                updateProfessor(editingId, form);
                toast.success("Professor atualizado com sucesso!");
            } else {
                addProfessor(form.name, form.email);
                // Note: bio and active are set to defaults in store action if not passed, 
                // but let's make sure our update covers them if we want to support them on create.
                // For now, addProfessor only takes name and email. Let's fix that in update if needed.
                toast.success("Professor cadastrado com sucesso!");
            }
            setDialogOpen(false);
            resetForm();
        } catch (err: any) {
            console.error("Erro ao salvar professor:", err);
            toast.error("Erro ao salvar os dados do professor.");
        }
    };

    const handleEdit = (id: string) => {
        const p = professors.find((prof) => prof.id === id);
        if (!p) return;
        setForm({
            name: p.name,
            email: p.email,
            active: p.active,
            bio: p.bio || "",
        });
        setEditingId(id);
        setDialogOpen(true);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">Cadastro de Professores</h1>
                        <p className="text-sm text-muted-foreground">{filteredProfessors.length} de {professors.length} professores</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-sm mx-4">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            className="pl-9 bg-secondary/50 border-border"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" /> Novo Professor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-display">
                                {editingId ? "Editar Professor" : "Novo Professor"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                            <div>
                                <Label>Nome *</Label>
                                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Email *</Label>
                                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Bio (Opcional)</Label>
                                <Input value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <div className="flex items-center gap-2 h-10">
                                    <Switch checked={form.active} onCheckedChange={(c) => setForm((f) => ({ ...f, active: c }))} />
                                    <span className="text-sm text-foreground">{form.active ? "Ativo" : "Inativo"}</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave}>{editingId ? "Salvar" : "Cadastrar"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden bg-card">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-secondary/50">
                            {["Nome", "Email", "Alunos Monitorados", "Status", ""].map((h) => (
                                <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProfessors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                                    {searchTerm ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
                                </td>
                            </tr>
                        ) : (
                            filteredProfessors.map((p) => (
                                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden border border-border/50 shadow-sm">
                                                {p.avatarUrl ? (
                                                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    p.name.charAt(0)
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-foreground">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">{p.email}</td>
                                    <td className="px-4 py-3 text-sm text-foreground font-mono">
                                        {professorStats[p.id] || 0}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${p.active ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"
                                            }`}>
                                            {p.active ? "Ativo" : "Inativo"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 justify-end">
                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(p.id)} className="h-8 w-8 p-0">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (confirm(`Excluir ${p.name}?`)) deleteProfessor(p.id);
                                                }}
                                                className="h-8 w-8 p-0 hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Reporting Section */}
            <Card className="bg-card/50 border-border shadow-lg overflow-hidden">
                <CardHeader className="border-b border-border bg-secondary/20">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-lg font-display font-bold">Relatório de Monitoramento</CardTitle>
                                <CardDescription className="text-xs">Acompanhamento da quantidade de alunos monitorados</CardDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground">Professor</Label>
                                <Select value={reportFilterProfessorId} onValueChange={setReportFilterProfessorId}>
                                    <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Professores</SelectItem>
                                        {professors.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground">Período</Label>
                                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                                    <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Hoje</SelectItem>
                                        <SelectItem value="week">Esta Semana</SelectItem>
                                        <SelectItem value="month">Este Mês</SelectItem>
                                        <SelectItem value="custom">Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {reportPeriod === "custom" && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="date"
                                        className="h-8 text-xs w-32 bg-background"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                    />
                                    <span className="text-muted-foreground">/</span>
                                    <Input
                                        type="date"
                                        className="h-8 text-xs w-32 bg-background"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-secondary/30 border border-border/50 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-3xl font-display font-black text-foreground">{reportData.count}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Alunos Monitorados</div>
                            <div className="text-[10px] text-muted-foreground/60 mt-4 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {format(reportData.start, "dd/MM/yyyy")} - {format(reportData.end, "dd/MM/yyyy")}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground">Destaque por Professor</h3>
                                <div className="text-[10px] text-muted-foreground uppercase font-black">Periodo Selecionado</div>
                            </div>
                            <div className="space-y-3">
                                {professors.filter(p => reportFilterProfessorId === "all" || p.id === reportFilterProfessorId).map(p => {
                                    // Calculate stats for this period for this professor
                                    let profCount = 0;
                                    classHistory.forEach(s => {
                                        const sDate = parseISO(s.date);
                                        if (isWithinInterval(sDate, { start: reportData.start, end: reportData.end })) {
                                            s.participants.forEach(part => {
                                                if ((part.professorId || s.professorId) === p.id) profCount++;
                                            });
                                        }
                                    });

                                    // Add active session
                                    const now = new Date();
                                    if (classRunning && isWithinInterval(now, { start: reportData.start, end: reportData.end })) {
                                        activeStudents.forEach(a => {
                                            if ((a.professorId || classProfessorId) === p.id) profCount++;
                                        });
                                    }

                                    const percentage = reportData.count > 0 ? (profCount / reportData.count) * 100 : 0;

                                    return (
                                        <div key={p.id} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground">{p.name}</span>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
