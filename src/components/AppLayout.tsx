import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Users, Trophy, BarChart3, Target, Radio, BookOpen } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import ConnectionMethodSelector from "@/components/ConnectionMethodSelector";

const navItems = [
  { path: "/", label: "Monitor", icon: Activity },
  { path: "/students", label: "Alunos", icon: Users },
  { path: "/professores", label: "Professores", icon: BookOpen },
  { path: "/turmas", label: "Turmas", icon: Target },
  { path: "/ranking", label: "Ranking", icon: Trophy },
  { path: "/sensors", label: "Sensores", icon: Radio },
  { path: "/reports", label: "Relatórios", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentTenant = useStore((s) => s.currentTenant);
  const isAdminAuthorized = useStore((s) => s.isAdminAuthorized);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isFullscreen && (
        <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center h-14 px-4 gap-1">
            <div className="flex items-center gap-2 mr-6">
              {currentTenant?.logoUrl ? (
                <img src={currentTenant.logoUrl} alt={currentTenant.name} className="h-10 w-auto object-contain max-w-[200px]" title={currentTenant.name} />
              ) : (
                <>
                  <Activity className="h-6 w-6 text-primary animate-pulse-glow" />
                  <span className="text-lg font-display font-bold text-foreground tracking-tight">
                    {currentTenant?.name || (
                      <>
                        Pulse<span className="text-primary">Monitor</span>
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
            {navItems
              .filter(item => {
                if (!isAdminAuthorized) {
                  return item.path === "/ranking" || item.path === "/reports";
                }
                return true;
              })
              .map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}

            <div className="ml-auto flex items-center gap-4">
              <ConnectionMethodSelector />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  localStorage.removeItem("academy_auth");
                  localStorage.removeItem("current_tenant_id");
                  window.location.href = "/login";
                }}
              >
                Sair
              </Button>
            </div>
          </div>
        </nav>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
}
