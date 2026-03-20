import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tenant } from "@/types/pulse";
import { fetchAllTenants, deleteTenant } from "@/services/dataService";
import AcademyRegistrationForm from "@/components/AcademyRegistrationForm";
import { Activity, Plus, LayoutDashboard, LogOut, Loader2, Building2, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        // Basic auth check
        const isAuth = localStorage.getItem("admin_auth") === "true";
        if (!isAuth) {
            navigate("/admin/login");
            return;
        }

        loadTenants();
    }, [navigate]);

    async function loadTenants() {
        setIsLoading(true);
        try {
            const data = await fetchAllTenants();
            setTenants(data);
        } catch (error: any) {
            console.error("Error loading tenants:", error);
            toast.error("Erro ao carregar academias.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("admin_auth");
        navigate("/admin/login");
    };

    const handleDeleteTenant = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a academia "${name}"? Todos os dados vinculados serão perdidos.`)) {
            return;
        }

        try {
            await deleteTenant(id);
            setTenants(tenants.filter(t => t.id !== id));
            toast.success("Academia excluída com sucesso.");
        } catch (error: any) {
            console.error("Error deleting academy:", error);
            toast.error("Erro ao excluir academia.");
        }
    };

    const getPlanBadge = (plan: string) => {
        switch (plan.toLowerCase()) {
            case "trial":
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Teste (30 dias)</Badge>;
            case "basic":
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Básico</Badge>;
            case "advanced":
                return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Avançado</Badge>;
            case "black":
                return <Badge variant="outline" className="bg-zinc-800 text-zinc-100 border-zinc-700">Black</Badge>;
            default:
                return <Badge variant="outline">{plan}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-primary/30">
            {/* Admin Navbar */}
            <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        <span className="text-xl font-display font-bold tracking-tight">
                            Pulse<span className="text-primary">Admin</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Painel do Gilson
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Gerenciar Academias</h1>
                        <p className="text-zinc-400 mt-1">Visualize, edite e cadastre múltiplas academias parceiras.</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingTenant(undefined);
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setEditingTenant(undefined);
                                setIsDialogOpen(true);
                            }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Academia
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">
                                    {editingTenant ? `Editar Academia: ${editingTenant.name}` : "Cadastrar Nova Academia"}
                                </DialogTitle>
                            </DialogHeader>
                            <AcademyRegistrationForm
                                tenantToEdit={editingTenant}
                                onSuccess={(tenant) => {
                                    if (editingTenant) {
                                        setTenants(prev => prev.map(t => t.id === tenant.id ? tenant : t));
                                    } else {
                                        setTenants(prev => [tenant, ...prev]);
                                    }
                                    setIsDialogOpen(false);
                                    setEditingTenant(undefined);
                                }}
                                onCancel={() => {
                                    setIsDialogOpen(false);
                                    setEditingTenant(undefined);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <p className="text-sm text-zinc-500">Buscando academias no servidor...</p>
                            </div>
                        ) : tenants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-4 text-center px-4">
                                <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
                                    <Building2 className="h-8 w-8 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-white">Nenhuma academia encontrada</p>
                                    <p className="text-sm text-zinc-500 mt-1 max-w-xs">Parece que você ainda não cadastrou nenhuma academia parceira.</p>
                                </div>
                                <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    Cadastrar Primeira Academia
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800/50 pointer-events-none">
                                        <TableHead className="w-[350px] text-zinc-400 py-4 font-semibold">Nome da Academia</TableHead>
                                        <TableHead className="text-zinc-400 font-semibold">Plano Atual</TableHead>
                                        <TableHead className="text-zinc-400 font-semibold">Expira (Teste)</TableHead>
                                        <TableHead className="text-right text-zinc-400 font-semibold pr-8">Gerenciar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenants.map((tenant) => (
                                        <TableRow key={tenant.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors group">
                                            <TableCell className="font-medium py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 shadow-inner group-hover:border-zinc-600 transition-colors">
                                                        {tenant.logoUrl ? (
                                                            <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-contain" />
                                                        ) : (
                                                            <Building2 className="h-5 w-5 text-zinc-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-zinc-100 font-bold group-hover:text-primary transition-colors">{tenant.name}</span>
                                                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">ID: {tenant.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">{getPlanBadge(tenant.planTier)}</TableCell>
                                            <TableCell className="text-zinc-400 py-5">
                                                {tenant.trialExpiresAt
                                                    ? new Date(tenant.trialExpiresAt).toLocaleDateString("pt-BR")
                                                    : <span className="text-zinc-600 italic">Vitalício</span>}
                                            </TableCell>
                                            <TableCell className="text-right py-5 pr-8">
                                                <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingTenant(tenant);
                                                            setIsDialogOpen(true);
                                                        }}
                                                        className="h-9 px-4 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
                                                    >
                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                                        className="h-9 w-9 p-0 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                                        title="Excluir Academia"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
