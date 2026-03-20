import { useState } from "react";
import { useStore } from "@/store/useStore";
import { AVATAR_COLORS } from "@/types/pulse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus, Pencil, Trash2, Users, Search, Check, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, turmas, resetStudentPoints } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetDate, setResetDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.matricula && s.matricula.toLowerCase().includes(term))
    );
  });

  const [form, setForm] = useState({
    matricula: "",
    name: "",
    email: "",
    age: 30,
    sex: "M" as "M" | "F",
    weight: 70,
    fcm: 190,
    avatarColor: AVATAR_COLORS[0],
    active: true,
    turmaId: turmas[0]?.id || "00000000-0000-0000-0000-000000000001",
    antId: "",
    avatarUrl: "",
  });

  const resetForm = () => {
    setForm({
      matricula: "",
      name: "",
      email: "",
      age: 30,
      sex: "M",
      weight: 70,
      fcm: 190,
      avatarColor: AVATAR_COLORS[0],
      active: true,
      turmaId: turmas[0]?.id || "00000000-0000-0000-0000-000000000001",
      antId: "",
      avatarUrl: "",
    });
    setEditingId(null);
  };

  const handleAgeChange = (age: number) => {
    setForm((f) => ({ ...f, age, fcm: 220 - age }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("O nome é obrigatório.");
      return;
    }
    if (!form.matricula.trim()) {
      toast.error("A matrícula é obrigatória.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("O email é inválido ou está ausente.");
      return;
    }

    try {
      if (editingId) {
        updateStudent(editingId, form);
        toast.success("Aluno atualizado com sucesso!");
      } else {
        addStudent(form);
        toast.success("Aluno cadastrado com sucesso!");
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao salvar aluno:", err);
      toast.error("Erro ao salvar os dados do aluno.");
    }
  };

  const handleEdit = (id: string) => {
    const s = students.find((st) => st.id === id);
    if (!s) return;
    setForm({
      matricula: s.matricula,
      name: s.name,
      email: s.email,
      age: s.age,
      sex: s.sex,
      weight: s.weight,
      fcm: s.fcm,
      avatarColor: s.avatarColor,
      active: s.active,
      turmaId: s.turmaId || "00000000-0000-0000-0000-000000000001",
      antId: s.antId || "",
      avatarUrl: s.avatarUrl || "",
    });
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleResetPoints = async (id: string, name: string) => {
    if (confirm(`Atenção: Isso zerará TODOS os pontos e calorias de ${name} no dia ${resetDate}. Esta ação é irreversível. Deseja continuar?`)) {
      await resetStudentPoints(id, resetDate);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Cadastro de Alunos</h1>
            <p className="text-sm text-muted-foreground">{filteredStudents.length} de {students.length} alunos</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou matrícula..."
              className="pl-9 bg-secondary/50 border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingId ? "Editar Aluno" : "Novo Aluno"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Matrícula *</Label>
                  <Input value={form.matricula} onChange={(e) => setForm((f) => ({ ...f, matricula: e.target.value }))} />
                </div>
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Idade</Label>
                  <Input type="number" value={form.age} onChange={(e) => handleAgeChange(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Sexo</Label>
                  <Select value={form.sex} onValueChange={(v) => {
                    const newSex = v as "M" | "F";
                    setForm((f) => ({ ...f, sex: newSex, avatarUrl: "" }));
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Peso (kg)</Label>
                  <Input type="number" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>FCM (220 - idade)</Label>
                  <Input type="number" value={form.fcm} onChange={(e) => setForm((f) => ({ ...f, fcm: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Turma</Label>
                  <Select value={form.turmaId} onValueChange={(v) => setForm((f) => ({ ...f, turmaId: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {turmas.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={form.active} onCheckedChange={(c) => setForm((f) => ({ ...f, active: c }))} />
                  <span className="text-sm text-foreground">{form.active ? "Ativo" : "Inativo"}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Label className="text-sm font-bold text-primary">Avatar do Aluno</Label>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {[1, 2, 3, 4, 5].map((idx) => {
                    const url = `/avatars/${form.sex === "M" ? "male" : "female"}/${idx}.png`;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, avatarUrl: url }))}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${form.avatarUrl === url ? "border-primary scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                        {form.avatarUrl === url && (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <div className="bg-primary text-white rounded-full p-0.5">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))}
                    className={`rounded-xl border-2 transition-all flex items-center justify-center text-[10px] leading-tight font-bold aspect-square ${!form.avatarUrl ? "border-primary bg-secondary/30 scale-105" : "border-dashed border-border text-muted-foreground opacity-60 hover:opacity-100"
                      }`}
                  >
                    Sem Foto
                  </button>
                </div>
              </div>

              {!form.avatarUrl && (
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">Cor Padrão (Sem Foto)</Label>
                  <div className="flex gap-2 mt-1">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${form.avatarColor === c ? "border-foreground scale-110" : "border-transparent"
                          }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
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
              {["Nome", "Idade", "Sexo", "Peso", "FCM", "Status", ""].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden border border-border/50 shadow-sm"
                        style={{ backgroundColor: s.avatarUrl ? 'transparent' : s.avatarColor }}
                      >
                        {s.avatarUrl ? (
                          <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          s.name.charAt(0)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{s.matricula}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.age}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.sex === "M" ? "Masc" : "Fem"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.weight}kg</td>
                  <td className="px-4 py-3 text-sm text-foreground font-mono">{s.fcm}</td>

                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${s.active ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"
                      }`}>
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(s.id)} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        <Input 
                          type="date" 
                          className="h-8 w-28 text-[10px] py-0 px-2" 
                          value={resetDate} 
                          onChange={(e) => setResetDate(e.target.value)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResetPoints(s.id, s.name)}
                          className="h-8 w-8 p-0 hover:text-amber-500"
                          title="Zerar pontos do dia selecionado"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Excluir ${s.name}?`)) deleteStudent(s.id);
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
    </div>
  );
}
