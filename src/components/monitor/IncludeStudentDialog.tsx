import { useState } from "react";
import { Search, UserPlus, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Student } from "@/types/pulse";
import { useStore } from "@/store/useStore";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableStudents: Student[];
    onAddStudent: (id: string, professorId: string) => void;
}

export default function IncludeStudentDialog({ open, onOpenChange, availableStudents, onAddStudent }: Props) {
    const [studentSearch, setStudentSearch] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const { professors } = useStore();

    // Reset when dialog closes
    const handleOpenChange = (val: boolean) => {
        onOpenChange(val);
        if (!val) {
            setSelectedStudentId(null);
            setStudentSearch("");
        }
    };

    const query = studentSearch.toLowerCase();
    const filtered = availableStudents.filter(
        (s) => !query || s.name.toLowerCase().includes(query) || (s.matricula || "").toLowerCase().includes(query)
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <UserPlus className="h-3.5 w-3.5" /> Incluir Aluno
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="font-display">
                        {!selectedStudentId ? "Incluir Aluno na Aula" : "Quem está orientando?"}
                    </DialogTitle>
                </DialogHeader>

                {!selectedStudentId ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                placeholder="Buscar por nome ou matrícula..."
                                className="pl-9"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {filtered.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-4">
                                    {studentSearch ? "Nenhum aluno encontrado." : "Nenhum aluno disponível. Cadastre alunos primeiro."}
                                </p>
                            ) : (
                                filtered.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedStudentId(s.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden"
                                            style={{ backgroundColor: s.avatarUrl ? 'transparent' : s.avatarColor }}
                                        >
                                            {s.avatarUrl ? (
                                                <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                                            ) : (
                                                s.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{s.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {s.matricula && <span>#{s.matricula} · </span>}FCM: {s.fcm} | {s.weight}kg
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2">
                                <div className="text-xs font-bold text-muted-foreground">Aluno:</div>
                                <div className="text-xs font-bold text-primary">
                                    {availableStudents.find(s => s.id === selectedStudentId)?.name}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setSelectedStudentId(null)}>
                                <ChevronLeft className="h-3 w-3" /> Trocar
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">Selecione o professor que vai monitorar este aluno:</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {professors.length === 0 ? (
                                <p className="text-center py-4 text-sm text-muted-foreground">Nenhum professor cadastrado.</p>
                            ) : (
                                professors.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            if (selectedStudentId) {
                                                onAddStudent(selectedStudentId, p.id);
                                                handleOpenChange(false);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors text-left border border-border/50"
                                    >
                                        <span className="text-sm font-bold text-foreground">{p.name}</span>
                                        <div className="text-[10px] uppercase font-black tracking-tighter text-primary">Vincular</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
