import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tenant } from "@/types/pulse";
import { createTenant, updateTenant, uploadLogo } from "@/services/dataService";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";

interface Props {
    tenantToEdit?: Tenant;
    onSuccess: (tenant: Tenant) => void;
    onCancel: () => void;
}

export default function AcademyRegistrationForm({ tenantToEdit, onSuccess, onCancel }: Props) {
    const [name, setName] = useState(tenantToEdit?.name || "");
    const [logoUrl, setLogoUrl] = useState(tenantToEdit?.logoUrl || "");
    const [planTier, setPlanTier] = useState(tenantToEdit?.planTier || "trial");
    const [loginEmail, setLoginEmail] = useState(tenantToEdit?.loginEmail || "");
    const [loginPassword, setLoginPassword] = useState(tenantToEdit?.loginPassword || "");
    const [masterMachineId, setMasterMachineId] = useState(tenantToEdit?.masterMachineId || "");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(tenantToEdit?.logoUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setPreviewUrl(tenantToEdit?.logoUrl || null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Por favor, insira o nome da academia.");
            return;
        }

        setIsLoading(true);
        try {
            let finalLogoUrl = logoUrl;

            // Handle file upload if a new file is selected
            if (selectedFile) {
                try {
                    finalLogoUrl = await uploadLogo(selectedFile);
                } catch (err: any) {
                    console.error("Upload error:", err);
                    toast.error("Erro ao fazer upload da logo: " + err.message);
                    setIsLoading(false);
                    return;
                }
            }

            // Calculate trial expiration if plan is trial (30 days from now)
            let trialExpiresAt: string | undefined = tenantToEdit?.trialExpiresAt;
            if (planTier === "trial" && !trialExpiresAt) {
                const expires = new Date();
                expires.setDate(expires.getDate() + 30);
                trialExpiresAt = expires.toISOString();
            }

            const tenantData = {
                name,
                logoUrl: finalLogoUrl || undefined,
                planTier,
                trialExpiresAt,
                loginEmail: loginEmail || undefined,
                loginPassword: loginPassword || undefined,
                masterMachineId: masterMachineId || undefined,
            };

            let result: Tenant;
            if (tenantToEdit) {
                result = await updateTenant(tenantToEdit.id, tenantData);
                toast.success("Academia atualizada com sucesso!");
            } else {
                result = await createTenant(tenantData);
                toast.success("Academia cadastrada com sucesso!");
            }

            onSuccess(result);
        } catch (error: any) {
            console.error("Error saving academy:", error);
            toast.error("Erro ao salvar academia: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name" className="text-zinc-300">Nome da Academia</Label>
                    <Input
                        id="name"
                        placeholder="Ex: Pulse Tribe Pro"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-zinc-900/50 border-zinc-800 text-white focus:ring-primary"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="grid gap-2">
                    <Label className="text-zinc-300">Logo da Academia</Label>
                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="h-20 w-20 rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-zinc-800/50 transition-all overflow-hidden group relative"
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-5 w-5 text-white" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="h-6 w-6 text-zinc-500 group-hover:text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500 mt-1">Upload</span>
                                </>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                                disabled={isLoading}
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-8 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    disabled={isLoading}
                                >
                                    Selecionar Arquivo
                                </Button>
                                {selectedFile && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearSelection}
                                        className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400"
                                        disabled={isLoading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                                {selectedFile ? selectedFile.name : logoUrl ? "Logo atual vinculada por link" : "Formatos aceitos: PNG, JPG ou SVG. Máx. 2MB."}
                            </p>
                        </div>
                    </div>
                    {!selectedFile && (
                        <div className="mt-2">
                            <Label htmlFor="logoUrl" className="text-[11px] text-zinc-500 mb-1 block">Ou use um link externo:</Label>
                            <Input
                                id="logoUrl"
                                placeholder="https://exemplo.com/logo.png"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="h-8 bg-zinc-900/30 border-zinc-800 text-[12px] text-zinc-400 focus:ring-primary"
                                disabled={isLoading || !!selectedFile}
                            />
                        </div>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="plan" className="text-zinc-300">Plano</Label>
                    <Select
                        value={planTier}
                        onValueChange={setPlanTier}
                        disabled={isLoading}
                    >
                        <SelectTrigger id="plan" className="bg-zinc-900/50 border-zinc-800 text-white focus:ring-primary">
                            <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="trial">Teste Grátis (30 dias)</SelectItem>
                            <SelectItem value="basic">Plano Básico</SelectItem>
                            <SelectItem value="advanced">Plano Avançado</SelectItem>
                            <SelectItem value="black">Plano Black</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-medium mb-4 text-zinc-100">Credenciais de Acesso</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="loginEmail" className="text-zinc-300">E-mail de Login</Label>
                            <Input
                                id="loginEmail"
                                type="email"
                                placeholder="academia@exemplo.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="bg-zinc-900/50 border-zinc-800 text-white focus:ring-primary"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="loginPassword" className="text-zinc-300">Senha</Label>
                            <Input
                                id="loginPassword"
                                type="password"
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="bg-zinc-900/50 border-zinc-800 text-white focus:ring-primary"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                            Controle de Máquina Mestra
                        </h3>
                        <div className="text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded border border-zinc-700">
                            Sua máquina: <span className="text-primary font-mono">{useStore.getState().machineId || "Não identificada"}</span>
                        </div>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="masterMachineId" className="text-zinc-300">ID da Máquina Mestra (IP/MAC/Hostname)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="masterMachineId"
                                placeholder="Ex: pc-fitness-01"
                                value={masterMachineId}
                                onChange={(e) => setMasterMachineId(e.target.value)}
                                className="bg-zinc-900/50 border-zinc-800 text-white focus:ring-primary font-mono text-sm"
                                disabled={isLoading}
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                    const mid = useStore.getState().machineId;
                                    if (mid) {
                                        setMasterMachineId(mid);
                                        toast.success("ID da sua máquina copiado para o campo!");
                                    }
                                }}
                                className="border-zinc-800 text-zinc-400 hover:text-white shrink-0"
                            >
                                Usar Esta Máquina
                            </Button>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                            Apenas a máquina com este identificador terá acesso total (Monitor, Sensores, etc). 
                            Se vazio, qualquer máquina poderá se registrar como mestre na tela Monitor.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-[120px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        tenantToEdit ? "Salvar Alterações" : "Cadastrar Academia"
                    )}
                </Button>
            </div>
        </form>
    );
}
