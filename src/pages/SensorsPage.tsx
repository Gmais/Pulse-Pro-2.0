import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Plus, Pencil, Trash2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function SensorsPage() {
    const { sensors, students, addSensor, updateSensor, deleteSensor } = useStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSensor, setEditingSensor] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        friendlyId: "",
        antId: "",
        name: "",
    });

    const handleOpenAdd = () => {
        setEditingSensor(null);
        setFormData({ friendlyId: "", antId: "", name: "" });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (sensor: any) => {
        setEditingSensor(sensor.id);
        setFormData({
            friendlyId: sensor.friendlyId,
            antId: sensor.antId,
            name: sensor.name || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.friendlyId || !formData.antId) {
            toast.error("Preencha o ID Amigável e o ID ANT+");
            return;
        }

        // Check if friendlyId already exists (for new sensors)
        if (!editingSensor && sensors.some(s => s.friendlyId === formData.friendlyId)) {
            toast.error("Este ID Amigável já está em uso");
            return;
        }

        if (editingSensor) {
            updateSensor(editingSensor, formData);
            toast.success("Sensor atualizado!");
        } else {
            addSensor(formData.friendlyId, formData.antId, formData.name);
            toast.success("Sensor adicionado!");
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este sensor?")) {
            deleteSensor(id);
            toast.info("Sensor excluído");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Gerenciar Sensores</h1>
                    <p className="text-muted-foreground mt-1">Mapeie IDs amigáveis para seus sensores ANT+.</p>
                </div>
                <Button onClick={handleOpenAdd} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Sensor
                </Button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">ID Amigável</TableHead>
                            <TableHead>ID Real (ANT+)</TableHead>
                            <TableHead>Nome/Descrição</TableHead>
                            <TableHead>Histórico (Últimos Alunos)</TableHead>
                            <TableHead className="text-right w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sensors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    Nenhum sensor cadastrado. Clique em "Novo Sensor" para começar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sensors.map((sensor) => {
                                // Match strictly by formatting both as trimmed lowercased strings
                                const sensorAntIdStr = String(sensor.antId || "").trim().toLowerCase();
                                const linkedStudents = students.filter(s => {
                                    const sAntIdStr = String(s.antId || "").trim().toLowerCase();
                                    return sAntIdStr !== "" && sAntIdStr === sensorAntIdStr;
                                });
                                
                                const historyStudentNames = (sensor.lastStudentIds || [])
                                    .map(sid => students.find(s => s.id === sid)?.name)
                                    .filter(Boolean) as string[];
                                
                                const historyText = historyStudentNames.length > 0 
                                    ? historyStudentNames.join(", ") 
                                    : (linkedStudents.length > 0 ? linkedStudents.map(s => s.name).join(", ") : "-");

                                return (
                                    <TableRow key={sensor.id}>
                                        <TableCell className="font-bold text-primary">
                                            <div className="flex items-center gap-2">
                                                <Radio className="h-3 w-3" />
                                                {sensor.friendlyId}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{sensor.antId}</TableCell>
                                        <TableCell>{sensor.name || "-"}</TableCell>
                                        <TableCell className="text-muted-foreground font-medium">{historyText}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(sensor)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(sensor.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingSensor ? "Editar Sensor" : "Novo Sensor"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">ID Amigável (ex: 1, 2, A, B)</label>
                                <Input
                                    placeholder="Ex: 1"
                                    value={formData.friendlyId}
                                    onChange={(e) => setFormData({ ...formData, friendlyId: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">ID Real do Sensor (ANT+)</label>
                                <Input
                                    placeholder="Ex: 60413"
                                    value={formData.antId}
                                    onChange={(e) => setFormData({ ...formData, antId: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Nome Opcional</label>
                                <Input
                                    placeholder="Ex: Sensor do Pedro"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
