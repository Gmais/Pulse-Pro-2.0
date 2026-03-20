import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Users, Plus, Trash2, Target, Flame, Trophy, Zap, UserPlus, BookOpen, Search, X,
} from "lucide-react";

export default function TurmasDesafiosPage() {
  const {
    turmas, addTurma, deleteTurma,
    students, updateStudent, classHistory,
    challenges, addChallenge, deleteChallenge, updateChallenge,
  } = useStore();

  // Student search per turma
  const [searchByTurma, setSearchByTurma] = useState<Record<string, string>>({});

  // Turma dialog
  const [turmaDialogOpen, setTurmaDialogOpen] = useState(false);
  const [newTurmaName, setNewTurmaName] = useState("");
  const [newTurmaColor, setNewTurmaColor] = useState("hsl(210, 100%, 55%)");

  // Challenge dialog
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    name: "",
    description: "",
    type: "points" as "points" | "calories",
    scope: "individual" as "team" | "individual" | "collective",
    targetValue: 100,
    turmaId: "",
    studentIds: [] as string[],
    active: true,
  });

  const TURMA_COLORS = [
    "hsl(210, 100%, 55%)",
    "hsl(14, 100%, 55%)",
    "hsl(45, 100%, 55%)",
    "hsl(150, 80%, 45%)",
    "hsl(280, 80%, 55%)",
    "hsl(340, 80%, 55%)",
  ];

  const handleAddTurma = () => {
    if (!newTurmaName.trim()) return;
    addTurma(newTurmaName.trim(), newTurmaColor);
    setNewTurmaName("");
    setTurmaDialogOpen(false);
  };

  const handleAddChallenge = () => {
    if (!challengeForm.name.trim()) return;
    addChallenge(challengeForm);
    setChallengeForm({ name: "", description: "", type: "points", scope: "individual", targetValue: 100, turmaId: "", studentIds: [], active: true });
    setChallengeDialogOpen(false);
  };

  const getStudentsByTurma = (turmaId: string) =>
    students.filter((s) => s.turmaId === turmaId);

  const getClassesByTurma = (turmaId: string) =>
    classHistory.filter((c) => c.turmaId === turmaId);

  const getChallengeProgress = (challenge: typeof challenges[0]) => {
    const turmaStudents = challenge.turmaId
      ? students.filter((s) => s.turmaId === challenge.turmaId)
      : students;

    if (challenge.scope === "team") {
      const total = turmaStudents.reduce(
        (sum, s) => sum + (challenge.type === "points" ? s.totalPoints : s.totalCalories),
        0
      );
      return Math.min((total / challenge.targetValue) * 100, 100);
    } else if (challenge.scope === "collective") {
      const members = students.filter(s => challenge.studentIds?.includes(s.id));
      const total = members.reduce(
        (sum, s) => sum + (challenge.type === "points" ? s.totalPoints : s.totalCalories),
        0
      );
      return Math.min((total / challenge.targetValue) * 100, 100);
    } else {
      // Individual: best performer
      const best = turmaStudents.reduce(
        (max, s) => Math.max(max, challenge.type === "points" ? s.totalPoints : s.totalCalories),
        0
      );
      return Math.min((best / challenge.targetValue) * 100, 100);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Turmas & Desafios</h1>
          <p className="text-sm text-muted-foreground">
            {turmas.length} turmas · {challenges.length} desafios
          </p>
        </div>
      </div>

      <Tabs defaultValue="turmas">
        <TabsList className="bg-secondary">
          <TabsTrigger value="turmas" className="gap-2">
            <Users className="h-4 w-4" /> Turmas
          </TabsTrigger>
          <TabsTrigger value="desafios" className="gap-2">
            <Target className="h-4 w-4" /> Desafios
          </TabsTrigger>
        </TabsList>

        {/* ---- TURMAS TAB ---- */}
        <TabsContent value="turmas" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTurmaDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Nova Turma
            </Button>
          </div>

          {turmas.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma turma cadastrada</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {turmas.map((turma) => {
                const turmaStudents = getStudentsByTurma(turma.id);
                const turmaClasses = getClassesByTurma(turma.id);
                return (
                  <Card key={turma.id} className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: turma.color }} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: turma.color }} />
                          {turma.name}
                        </CardTitle>
                        {turma.id !== "00000000-0000-0000-0000-000000000001" && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => deleteTurma(turma.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>{turmaStudents.length} alunos</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{turmaClasses.length} aulas</span>
                        </div>
                      </div>

                      {/* Enrolled students with remove */}
                      {turmaStudents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {turmaStudents.map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs gap-1 pr-1">
                              {s.name.split(" ")[0]}
                              <button
                                onClick={() => updateStudent(s.id, { turmaId: "00000000-0000-0000-0000-000000000001" })}
                                className="ml-0.5 hover:text-destructive transition-colors"
                                title="Remover da turma"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Search to add students - only for non-default turmas */}
                      {turma.id !== "00000000-0000-0000-0000-000000000001" && (() => {
                        const query = (searchByTurma[turma.id] || "").toLowerCase();
                        const availableStudents = students.filter(
                          (s) => s.turmaId !== turma.id && s.active &&
                            (query.length >= 1 && (
                              s.name.toLowerCase().includes(query) ||
                              (s.matricula || "").toLowerCase().includes(query)
                            ))
                        );
                        return (
                          <div className="space-y-1.5">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                value={searchByTurma[turma.id] || ""}
                                onChange={(e) => setSearchByTurma((prev) => ({ ...prev, [turma.id]: e.target.value }))}
                                placeholder="Buscar aluno (nome ou matrícula)..."
                                className="h-8 pl-8 text-xs"
                              />
                            </div>
                            {availableStudents.length > 0 && (
                              <div className="border border-border rounded-md max-h-32 overflow-y-auto">
                                {availableStudents.slice(0, 6).map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => {
                                      updateStudent(s.id, { turmaId: turma.id });
                                      setSearchByTurma((prev) => ({ ...prev, [turma.id]: "" }));
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary transition-colors text-xs"
                                  >
                                    <div
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                                      style={{ backgroundColor: s.avatarColor }}
                                    >
                                      {s.name.charAt(0)}
                                    </div>
                                    <span className="text-foreground">{s.name}</span>
                                    {s.matricula && <span className="text-muted-foreground">#{s.matricula}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ---- DESAFIOS TAB ---- */}
        <TabsContent value="desafios" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setChallengeDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Novo Desafio
            </Button>
          </div>

          {challenges.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum desafio criado</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {challenges.map((challenge) => {
                const progress = getChallengeProgress(challenge);
                const turmaName = challenge.turmaId
                  ? turmas.find((t) => t.id === challenge.turmaId)?.name || "—"
                  : "Todas";
                return (
                  <Card key={challenge.id} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {challenge.type === "points" ? (
                            <Zap className="h-5 w-5 text-primary" />
                          ) : (
                            <Flame className="h-5 w-5 text-zone-burn-full" />
                          )}
                          {challenge.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={challenge.active}
                            onCheckedChange={(c) => updateChallenge(challenge.id, { active: c })}
                          />
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => deleteChallenge(challenge.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {challenge.description && (
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      )}

                      <div className="flex gap-3">
                        <Badge variant="outline" className="text-xs">
                          {challenge.type === "points" ? "Pontos" : "Calorias"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {challenge.scope === "team" ? (
                            <><Users className="h-3 w-3 mr-1" /> Turma</>
                          ) : challenge.scope === "collective" ? (
                            <><Users className="h-3 w-3 mr-1" /> Coletivo</>
                          ) : (
                            <><Trophy className="h-3 w-3 mr-1" /> Individual</>
                          )}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {turmaName}
                        </Badge>
                      </div>

                      {challenge.scope === "collective" && challenge.studentIds && challenge.studentIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {challenge.studentIds.map(id => {
                            const s = students.find(st => st.id === id);
                            if (!s) return null;
                            return (
                              <Badge key={id} variant="secondary" className="px-1.5 py-0 text-[10px] h-5">
                                {s.name.split(" ")[0]}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progresso</span>
                          <span>{Math.round(progress)}% de {challenge.targetValue.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: challenge.type === "points"
                                ? "hsl(var(--primary))"
                                : "hsl(var(--zone-burn-full))",
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ---- TURMA DIALOG ---- */}
      <Dialog open={turmaDialogOpen} onOpenChange={setTurmaDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Nova Turma</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Nome da Turma *</Label>
              <Input
                value={newTurmaName}
                onChange={(e) => setNewTurmaName(e.target.value)}
                placeholder="Ex: Spinning Manhã"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex gap-2 mt-1">
                {TURMA_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTurmaColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newTurmaColor === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTurmaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddTurma}>Criar Turma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- CHALLENGE DIALOG ---- */}
      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Desafio</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Nome do Desafio *</Label>
              <Input
                value={challengeForm.name}
                onChange={(e) => setChallengeForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Maratona de Calorias"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={challengeForm.description}
                onChange={(e) => setChallengeForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional do desafio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <RadioGroup
                  value={challengeForm.type}
                  onValueChange={(v) => setChallengeForm((f) => ({ ...f, type: v as "points" | "calories" }))}
                  className="mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="points" id="type-points" />
                    <Label htmlFor="type-points" className="font-normal flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-primary" /> Pontos
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="calories" id="type-calories" />
                    <Label htmlFor="type-calories" className="font-normal flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-zone-burn-full" /> Calorias
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Pontuação</Label>
                <RadioGroup
                  value={challengeForm.scope}
                  onValueChange={(v) => setChallengeForm((f) => ({ ...f, scope: v as "team" | "individual" }))}
                  className="mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="team" id="scope-team" />
                    <Label htmlFor="scope-team" className="font-normal flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Turma
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="individual" id="scope-individual" />
                    <Label htmlFor="scope-individual" className="font-normal flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> Individual
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="collective" id="scope-collective" />
                    <Label htmlFor="scope-collective" className="font-normal flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Coletivo
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {challengeForm.scope === "collective" && (
              <div className="space-y-2 border border-border rounded-lg p-3 bg-secondary/20">
                <Label className="text-xs font-semibold">Alunos no Grupo</Label>
                
                {/* Search for group members */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno por nome ou matrícula..."
                    className="h-8 pl-8 text-xs bg-card"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      const results = query.length >= 2 
                        ? students.filter(s => 
                            s.active && 
                            !challengeForm.studentIds.includes(s.id) &&
                            (s.name.toLowerCase().includes(query) || (s.matricula || "").toLowerCase().includes(query))
                          )
                        : [];
                      // Using a temporary local state for search results would be cleaner, but for brevity 
                      // we can just use a data attribute or similar if needed. 
                      // Actually, let's just use the existing search state pattern.
                      setSearchByTurma(prev => ({ ...prev, "challenge-search": e.target.value }));
                    }}
                    value={searchByTurma["challenge-search"] || ""}
                  />
                </div>

                {/* Search Results */}
                {(() => {
                  const query = (searchByTurma["challenge-search"] || "").toLowerCase();
                  const results = query.length >= 2 
                    ? students.filter(s => 
                        s.active && 
                        !challengeForm.studentIds.includes(s.id) &&
                        (s.name.toLowerCase().includes(query) || (s.matricula || "").toLowerCase().includes(query))
                      ).slice(0, 5)
                    : [];
                  
                  if (results.length === 0) return null;
                  return (
                    <div className="border border-border rounded-md bg-card overflow-hidden mt-1 shadow-sm">
                      {results.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setChallengeForm(f => ({ ...f, studentIds: [...f.studentIds, s.id] }));
                            setSearchByTurma(prev => ({ ...prev, "challenge-search": "" }));
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary text-xs"
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground" style={{ backgroundColor: s.avatarColor }}>
                            {s.name.charAt(0)}
                          </div>
                          <span className="flex-1 truncate">{s.name}</span>
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Selected Members */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {challengeForm.studentIds.map(id => {
                    const s = students.find(st => st.id === id);
                    if (!s) return null;
                    return (
                      <Badge key={id} variant="secondary" className="pr-1 gap-1 text-[10px]">
                        {s.name.split(" ")[0]}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => setChallengeForm(f => ({ ...f, studentIds: f.studentIds.filter(sid => sid !== id) }))}
                        />
                      </Badge>
                    );
                  })}
                  {challengeForm.studentIds.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic">Nenhum aluno selecionado</p>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta ({challengeForm.type === "points" ? "pontos" : "kcal"})</Label>
                <Input
                  type="number"
                  value={challengeForm.targetValue}
                  onChange={(e) => setChallengeForm((f) => ({ ...f, targetValue: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Turma</Label>
                <Select
                  value={challengeForm.turmaId || "all"}
                  onValueChange={(v) => setChallengeForm((f) => ({ ...f, turmaId: v === "all" ? "" : v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Turmas</SelectItem>
                    {turmas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChallengeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddChallenge}>Criar Desafio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
