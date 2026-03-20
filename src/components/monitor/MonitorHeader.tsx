import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity, Play, Square, Volume2, VolumeX, Maximize, Heart, Monitor, User, Target, Shield, Eye, Laptop, Cpu, ShieldAlert, StopCircle } from "lucide-react";
import { Turma, Professor } from "@/types/pulse";
import { useStore } from "@/store/useStore";

interface Props {
    isFullscreen: boolean;
    logoUrl?: string | null;
    tenantName?: string;
    classRunning: boolean;
    classElapsed: number;
    classTurmaId: string;
    turmas: Turma[];
    professors: Professor[];
    soundAlert: boolean;
    displayMetric: "fcm" | "bpm" | "cal";
    onStartClass: () => void;
    onStopClass: () => void;
    onFinishClass: () => void;
    onSetClassTurmaId: (id: string) => void;
    onToggleSound: () => void;
    onSetDisplayMetric: (metric: "fcm" | "bpm" | "cal") => void;
    onHandleFullscreen: () => void;
    antBridgeConnected: boolean;
    isMonitorMode: boolean;
    onSetMonitorMode: (val: boolean) => void;
    machineId: string | null;
    currentMasterId: string | null;
    children?: React.ReactNode;
}

export default function MonitorHeader({
    isFullscreen,
    logoUrl,
    tenantName,
    classRunning,
    classElapsed,
    classTurmaId,
    turmas,
    professors,
    soundAlert,
    displayMetric,
    onStartClass,
    onStopClass,
    onFinishClass,
    onSetClassTurmaId,
    onToggleSound,
    onSetDisplayMetric,
    onHandleFullscreen,
    antBridgeConnected,
    isMonitorMode,
    onSetMonitorMode,
    machineId,
    currentMasterId,
    children
}: Props) {
    const currentTenant = useStore((s) => s.currentTenant);
    const isAdminAuthorized = useStore((s) => s.isAdminAuthorized);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50 flex-wrap">
            {isFullscreen && (
                <div className="flex items-center gap-2 mr-4">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain max-w-[240px]" />
                    ) : (
                        <>
                            <Activity className="h-5 w-5 text-primary animate-pulse-glow" />
                            <span className="text-base font-display font-bold text-foreground tracking-tight">
                                {tenantName || (
                                    <>Pulse<span className="text-primary">Monitor</span></>
                                )}
                            </span>
                        </>
                    )}
                </div>
            )}

            {!isFullscreen && (
                <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 mr-auto">
                    <Heart className={`h-4 w-4 ${antBridgeConnected ? "text-red-500 animate-pulse-glow" : "text-muted-foreground opacity-30"}`} fill={antBridgeConnected ? "currentColor" : "none"} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ponte ANT+</span>
                </div>
            )}

            {!isFullscreen && (
                <div className={`flex items-center gap-3 bg-secondary/50 border rounded-lg px-3 py-1.5 mr-2 transition-colors ${
                    isMonitorMode 
                        ? (currentMasterId && currentMasterId !== machineId ? "border-orange-500/50 bg-orange-500/5" : "border-primary/50 bg-primary/5") 
                        : "border-border/50"
                }`}>
                    <div className="flex items-center gap-2">
                        {isMonitorMode ? (
                            <Shield className={`h-4 w-4 ${currentMasterId && currentMasterId !== machineId ? "text-orange-500" : "text-primary"}`} />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground opacity-50" />
                        )}
                        <div className="flex flex-col">
                            <Label htmlFor="monitor-mode" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer leading-none">
                                {isMonitorMode ? "Controle Mestre" : "Modo Visualizador"}
                            </Label>
                            <span className="text-[8px] opacity-60 leading-none mt-0.5">
                                {currentMasterId && currentMasterId !== machineId && isMonitorMode 
                                    ? "CONFLITO: Outra máquina ativa" 
                                    : (machineId ? `ID: ${machineId}` : "ID: Local")}
                            </span>
                        </div>
                    </div>
                    <Switch
                        id="monitor-mode"
                        checked={isMonitorMode}
                        onCheckedChange={onSetMonitorMode}
                    />
                </div>
            )}

            <div className="flex items-center gap-2">
                {/* Status Badge e Controle de Registro de Mestre */}
                {!currentTenant?.masterMachineId ? (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 animate-pulse-glow"
                        onClick={() => useStore.getState().registerMachineAsMaster()}
                    >
                        <Cpu className="h-4 w-4 mr-2" />
                        Tornar este o computador Mestre
                    </Button>
                ) : (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                        isAdminAuthorized 
                            ? "bg-primary/10 border-primary/20 text-primary" 
                            : "bg-muted border-border text-muted-foreground"
                    }`}>
                        {isAdminAuthorized ? (
                            <>
                                <Activity className="h-3 w-3" />
                                Mestre Autorizado
                            </>
                        ) : (
                            <>
                                <ShieldAlert className="h-3 w-3" />
                                Modo Visualizador
                            </>
                        )}
                    </div>
                )}

                {/* Somente exibe controles de aula se for o Mestre Autorizado */}
                {isAdminAuthorized && (
                    <div className="flex items-center gap-3 border-l pl-3 ml-1 border-border">
                        <div className="flex flex-col items-center min-w-[50px]">
                            <span className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Tempo</span>
                            <span className={`text-sm font-mono font-bold leading-none ${classRunning ? "text-primary animate-pulse" : "text-muted-foreground"}`}>
                                {formatTime(classElapsed)}
                            </span>
                        </div>
                        {classRunning ? (
                            <Button variant="outline" size="sm" onClick={onFinishClass} className="text-red-500 border-red-200 hover:bg-red-50 h-8">
                                <StopCircle className="h-4 w-4 mr-2" />
                                Parar Aula
                            </Button>
                        ) : (
                            <Button variant="default" size="sm" onClick={onStartClass} className="h-8">
                                <Play className="h-4 w-4 mr-2" />
                                Iniciar Aula
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {children}

            <Button size="sm" variant="ghost" onClick={onToggleSound} className="h-8 w-8 p-0">
                {soundAlert ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>

            {!isFullscreen && (
                <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
                    {([
                        { key: "fcm" as const, label: "%FCM" },
                        { key: "bpm" as const, label: "BPM" },
                        { key: "cal" as const, label: "CAL" },
                    ]).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => onSetDisplayMetric(key)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${displayMetric === key
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            <Button size="sm" variant="ghost" onClick={onHandleFullscreen} className="h-8 w-8 p-0">
                <Maximize className="h-4 w-4" />
            </Button>

            <div className="flex-1" />
        </div>
    );
}
