
'use client';
import { useState, useEffect } from "react";
import type { Carreta } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Save, Plus, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getCarretas, saveCarreta, deleteCarreta } from "@/lib/data";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function CarretasContent() {
    const [carretas, setCarretas] = useState<Carreta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCarreta, setEditingCarreta] = useState<Carreta | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<Omit<Carreta, 'id'>>({
        code: "",
        license_plate: "",
        model: "",
        year: new Date().getFullYear(),
        type: "",
        status: "available"
    });

    useEffect(() => {
        loadCarretas();
    }, []);

    const loadCarretas = async () => {
        setIsLoading(true);
        try {
            const fetched = await getCarretas();
            setCarretas(fetched);
        } catch (error) {
            console.error("Erro ao carregar carretas:", error);
            toast({ title: "Erro", description: "Falha ao carregar carretas.", variant: "destructive" });
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const toSave = editingCarreta ? { ...formData, id: editingCarreta.id } : formData;
            await saveCarreta(toSave as any);
            toast({ title: "Sucesso", description: `Carreta ${formData.code} salva.` });
            resetForm();
            loadCarretas();
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao salvar carreta.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    const handleEdit = (carreta: Carreta) => {
        setEditingCarreta(carreta);
        setFormData({
            code: carreta.code,
            license_plate: carreta.license_plate,
            model: carreta.model,
            year: carreta.year,
            type: carreta.type,
            status: carreta.status
        });
        setShowForm(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteCarreta(itemToDelete);
            toast({ title: "Sucesso", description: "Carreta excluída." });
            loadCarretas();
        } finally {
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const resetForm = () => {
        setFormData({ code: "", license_plate: "", model: "", year: new Date().getFullYear(), type: "", status: "available" });
        setEditingCarreta(null);
        setShowForm(false);
    };

    return (
        <ProtectedRoute requiredRole="admin">
            <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-slate-900">Gerenciar Carretas</h1>
                        <Button onClick={() => setShowForm(!showForm)}>
                            <Plus className="w-4 h-4 mr-2" />
                            {showForm ? "Cancelar" : "Nova Carreta"}
                        </Button>
                    </div>

                    {showForm && (
                        <Card>
                            <CardHeader><CardTitle>Informações da Carreta</CardTitle></CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Código Interno</Label>
                                            <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Ex: CAR-01" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Placa</Label>
                                            <Input value={formData.license_plate} onChange={e => setFormData({...formData, license_plate: e.target.value.toUpperCase()})} placeholder="ABC-1234" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Modelo</Label>
                                            <Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="Ex: Baú Furgão" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ano</Label>
                                            <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} required />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={isSaving}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {isSaving ? "Salvando..." : "Salvar Carreta"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-4">
                        {isLoading ? <Skeleton className="h-20 w-full" /> : carretas.map(carreta => (
                            <Card key={carreta.id} className="p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <Truck className="w-8 h-8 text-primary" />
                                        <div>
                                            <h3 className="font-bold">{carreta.code} - {carreta.model}</h3>
                                            <p className="text-sm text-slate-500">Placa: {carreta.license_plate} | Ano: {carreta.year}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(carreta)}><Edit className="w-4 h-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => {setItemToDelete(carreta.id); setIsDeleteDialogOpen(true);}}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
                <ConfirmationDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleDelete} title="Excluir Carreta" description="Tem certeza que deseja remover esta carreta?" />
            </div>
        </ProtectedRoute>
    );
}

export default function CarretasPage() {
    return <CarretasContent />;
}
