import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { Activity, LogOut } from "lucide-react";

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
    const currentTenant = useStore((s) => s.currentTenant);
    const currentStudent = useStore((s) => s.currentStudent);

    const handleLogout = () => {
        localStorage.removeItem("student_auth");
        localStorage.removeItem("current_student_id");
        localStorage.removeItem("current_tenant_id");
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex items-center h-16 px-4 gap-4">
                    <div className="flex items-center gap-3">
                        {currentTenant?.logoUrl ? (
                            <img
                                src={currentTenant.logoUrl}
                                alt={currentTenant.name}
                                className="h-10 w-auto object-contain max-w-[150px]"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Activity className="h-6 w-6 text-primary animate-pulse-glow" />
                                <span className="text-lg font-display font-bold text-foreground tracking-tight">
                                    Pulse<span className="text-primary">Monitor</span>
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-foreground">{currentStudent?.name}</p>
                            <p className="text-xs text-muted-foreground">{currentTenant?.name}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Sair"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </nav>
            <main className="flex-1 bg-zinc-950/30">
                {children}
            </main>
            <footer className="border-t border-border py-6 px-4">
                <div className="max-w-6xl mx-auto flex flex-col items-center gap-2">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">PulseMonitor Student Portal v1.0.3</p>
                </div>
            </footer>
        </div>
    );
}
