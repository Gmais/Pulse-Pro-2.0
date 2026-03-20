import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Activity, Lock, Mail, GraduationCap, Building2 } from "lucide-react";
import { loginAcademy, loginStudent } from "@/services/dataService";
import { useStore } from "@/store/useStore";

export default function UserLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loginType, setLoginType] = useState<"academy" | "student">("academy");
    const navigate = useNavigate();
    const initializeTenant = useStore((s) => s.initializeTenant);
    const initializeStudentSession = useStore((s) => s.initializeStudentSession);

    // Redirect if already authenticated
    useEffect(() => {
        if (localStorage.getItem("academy_auth") === "true") {
            navigate("/");
        } else if (localStorage.getItem("student_auth") === "true") {
            navigate("/student/dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (loginType === "academy") {
                const tenant = await loginAcademy(email, password);
                if (tenant) {
                    localStorage.setItem("academy_auth", "true");
                    localStorage.setItem("current_tenant_id", tenant.id);
                    await initializeTenant();
                    toast.success(`Bem-vindo, ${tenant.name}!`);
                    window.location.href = "/";
                } else {
                    toast.error("E-mail ou senha da academia incorretos.");
                }
            } else {
                const student = await loginStudent(email, password); // password field used for matricula
                if (student) {
                    localStorage.setItem("student_auth", "true");
                    localStorage.setItem("current_student_id", student.id);
                    localStorage.setItem("current_tenant_id", student.tenantId);
                    await initializeStudentSession();
                    toast.success(`Olá, ${student.name}!`);
                    window.location.href = "/student/dashboard";
                } else {
                    toast.error("E-mail ou matrícula não encontrados.");
                }
            }
        } catch (error: any) {
            console.error("Login error:", error);
            toast.error("Erro ao realizar login.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/20 rounded-xl">
                            <Activity className="h-8 w-8 text-primary animate-pulse-glow" />
                        </div>
                        <span className="text-3xl font-display font-bold text-white tracking-tight">
                            Pulse<span className="text-primary">Monitor</span>
                        </span>
                    </div>
                </div>

                <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-white text-center">Entrar no Sistema</CardTitle>
                        <CardDescription className="text-zinc-400 text-center">
                            Escolha seu tipo de acesso abaixo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Tabs defaultValue="academy" className="w-full" onValueChange={(v) => setLoginType(v as any)}>
                            <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 border border-zinc-700 h-11 p-1 mb-6">
                                <TabsTrigger value="academy" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Building2 className="h-4 w-4" />
                                    Academia
                                </TabsTrigger>
                                <TabsTrigger value="student" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <GraduationCap className="h-4 w-4" />
                                    Aluno
                                </TabsTrigger>
                            </TabsList>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-300 ml-1">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-zinc-800/50 border-zinc-700 text-white focus:ring-primary pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-zinc-300 ml-1">
                                        {loginType === "academy" ? "Senha" : "Nº Matrícula"}
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="password"
                                            type={loginType === "academy" ? "password" : "text"}
                                            placeholder={loginType === "academy" ? "••••••••" : "Ex: 12345"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-zinc-800/50 border-zinc-700 text-white focus:ring-primary pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-base transition-all active:scale-[0.98] mt-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Autenticando..." : "Entrar"}
                                </Button>
                            </form>
                        </Tabs>
                    </CardContent>
                </Card>

                <p className="mt-8 text-center text-sm text-zinc-500">
                    Problemas de acesso? <span className="text-primary hover:underline cursor-pointer">Suporte Técnico</span>
                </p>
                <p className="mt-2 text-center text-[10px] text-zinc-700 uppercase tracking-widest">Build v1.0.3 - STUDENT_PORTAL</p>
            </div>
        </div>
    );
}
