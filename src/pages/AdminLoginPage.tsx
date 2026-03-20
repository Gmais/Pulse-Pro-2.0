import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Activity } from "lucide-react";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Hardcoded credentials as requested
        if (username === "Gilson" && password === "Gil559744@") {
            localStorage.setItem("admin_auth", "true");
            toast.success("Login realizado com sucesso!");
            navigate("/admin/dashboard");
        } else {
            toast.error("Usuário ou senha incorretos.");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary animate-pulse-glow" />
                        <span className="text-2xl font-display font-bold text-white tracking-tight">
                            Pulse<span className="text-primary">Admin</span>
                        </span>
                    </div>
                </div>

                <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-white">Login Administrativo</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Entre com suas credenciais de administrador mestre.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-zinc-300">Usuário</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Seu login"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-zinc-800/50 border-zinc-700 text-white focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-zinc-800/50 border-zinc-700 text-white focus:ring-primary"
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11"
                                disabled={isLoading}
                            >
                                {isLoading ? "Acessando..." : "Entrar no Painel"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
