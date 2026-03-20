import { useStore } from "@/store/useStore";
import { Bluetooth, Radio, Wifi } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function ConnectionMethodSelector() {
    const connectionMethod = useStore((s) => s.connectionMethod);
    const setConnectionMethod = useStore((s) => s.setConnectionMethod);

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-full border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Conexão</span>
                <ToggleGroup
                    type="single"
                    value={connectionMethod}
                    onValueChange={(value) => {
                        if (value) setConnectionMethod(value as "both" | "ble" | "ant");
                    }}
                    className="gap-1"
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="ble"
                                aria-label="Apenas Bluetooth"
                                className={cn(
                                    "h-7 w-8 p-0 rounded-full transition-all duration-200",
                                    connectionMethod === "ble"
                                        ? "data-[state=on]:bg-emerald-600 data-[state=on]:text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]"
                                        : "hover:bg-emerald-500/10"
                                )}
                            >
                                <Bluetooth className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Bluetooth (BLE)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="ant"
                                aria-label="Apenas ANT+"
                                className={cn(
                                    "h-7 w-8 p-0 rounded-full transition-all duration-200",
                                    connectionMethod === "ant"
                                        ? "data-[state=on]:bg-emerald-600 data-[state=on]:text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]"
                                        : "hover:bg-emerald-500/10"
                                )}
                            >
                                <Radio className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>ANT+</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem
                                value="both"
                                aria-label="Ambos (BLE + ANT+)"
                                className={cn(
                                    "h-7 w-8 p-0 rounded-full transition-all duration-200",
                                    connectionMethod === "both"
                                        ? "data-[state=on]:bg-emerald-600 data-[state=on]:text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]"
                                        : "hover:bg-emerald-500/10"
                                )}
                            >
                                <Wifi className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Ambos (BLE + ANT+)</TooltipContent>
                    </Tooltip>
                </ToggleGroup>
            </div>
        </TooltipProvider>
    );
}
