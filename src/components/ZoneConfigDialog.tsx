import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Zone } from "@/types/pulse";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Plus, Trash2 } from "lucide-react";

const COLOR_OPTIONS = [
  { label: "Preto", value: "zone-rest", css: "hsl(0, 0%, 15%)" },
  { label: "Verde", value: "zone-warmup", css: "hsl(142, 70%, 45%)" },
  { label: "Azul", value: "zone-burn-start", css: "hsl(210, 100%, 55%)" },
  { label: "Laranja", value: "zone-burn-full", css: "hsl(25, 100%, 55%)" },
  { label: "Vermelho", value: "zone-performance", css: "hsl(0, 85%, 55%)" },
  { label: "Rosa", value: "hsl(330, 80%, 55%)", css: "hsl(330, 80%, 55%)" },
  { label: "Roxo", value: "hsl(280, 80%, 55%)", css: "hsl(280, 80%, 55%)" },
];

export default function ZoneConfigDialog() {
  const zones = useStore((s) => s.zones);
  const setZones = useStore((s) => s.setZones);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Zone[]>([]);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(zones.map((z) => ({ ...z })));
    setOpen(isOpen);
  };

  const updateDraft = (index: number, data: Partial<Zone>) => {
    setDraft((d) => d.map((z, i) => (i === index ? { ...z, ...data } : z)));
  };

  const addZone = () => {
    setDraft((d) => [
      ...d,
      {
        id: `z${Date.now()}`,
        name: "Nova Zona",
        color: "zone-rest",
        minPercent: 0,
        maxPercent: 100,
        pointsPerMinute: 0,
      },
    ]);
  };

  const removeZone = (index: number) => {
    if (draft.length <= 1) return;
    setDraft((d) => d.filter((_, i) => i !== index));
  };

  const save = () => {
    setZones(draft);
    setOpen(false);
  };

  const getColorCss = (color: string) => {
    const found = COLOR_OPTIONS.find((c) => c.value === color);
    return found ? found.css : color;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Configurar Zonas de Intensidade</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {draft.map((zone, i) => (
            <div
              key={zone.id}
              className="rounded-lg border border-border p-3 space-y-2"
              style={{ borderLeftColor: getColorCss(zone.color), borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={zone.name}
                  onChange={(e) => updateDraft(i, { name: e.target.value })}
                  className="h-8 text-sm flex-1"
                  placeholder="Nome da zona"
                />
                <button
                  onClick={() => removeZone(i)}
                  className="p-1.5 rounded hover:bg-destructive/20 transition-colors"
                  disabled={draft.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Min%</span>
                  <Input
                    type="number"
                    value={zone.minPercent}
                    onChange={(e) => updateDraft(i, { minPercent: Number(e.target.value) })}
                    className="h-7 w-16 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Max%</span>
                  <Input
                    type="number"
                    value={zone.maxPercent}
                    onChange={(e) => updateDraft(i, { maxPercent: Number(e.target.value) })}
                    className="h-7 w-16 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Pts/min</span>
                  <Input
                    type="number"
                    value={zone.pointsPerMinute}
                    onChange={(e) => updateDraft(i, { pointsPerMinute: Number(e.target.value) })}
                    className="h-7 w-16 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => updateDraft(i, { color: c.value })}
                    className="w-6 h-6 rounded-full border-2 transition-transform"
                    style={{
                      backgroundColor: c.css,
                      borderColor: zone.color === c.value ? "white" : "transparent",
                      transform: zone.color === c.value ? "scale(1.2)" : undefined,
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addZone} className="w-full gap-1">
          <Plus className="h-4 w-4" /> Adicionar Zona
        </Button>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
