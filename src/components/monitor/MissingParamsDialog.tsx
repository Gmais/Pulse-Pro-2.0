import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MissingParams {
    age: number;
    weight: number;
    sex: "M" | "F";
}

interface Props {
    studentId: string | null;
    onClose: () => void;
    params: MissingParams;
    onParamsChange: (params: MissingParams) => void;
    onSave: () => void;
}

export default function MissingParamsDialog({ studentId, onClose, params, onParamsChange, onSave }: Props) {
    return (
        <Dialog open={!!studentId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="font-display">Informações Necessárias</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <p className="text-sm text-muted-foreground">
                        Para calcular as calorias corretamente, precisamos completar o cadastro deste aluno.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Idade (anos)</label>
                            <Input
                                type="number"
                                value={params.age || ""}
                                onChange={(e) => onParamsChange({ ...params, age: Number(e.target.value) })}
                                placeholder="Ex: 25"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Peso (kg)</label>
                            <Input
                                type="number"
                                value={params.weight || ""}
                                onChange={(e) => onParamsChange({ ...params, weight: Number(e.target.value) })}
                                placeholder="Ex: 70"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Sexo</label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={params.sex === 'M' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => onParamsChange({ ...params, sex: 'M' })}
                            >
                                Masculino
                            </Button>
                            <Button
                                type="button"
                                variant={params.sex === 'F' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => onParamsChange({ ...params, sex: 'F' })}
                            >
                                Feminino
                            </Button>
                        </div>
                    </div>
                    <Button className="w-full mt-2" onClick={onSave}>
                        Salvar e Adicionar Aluno
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
