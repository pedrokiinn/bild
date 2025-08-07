'use client';
import { useState, useEffect } from "react";
import type { Vehicle } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Save, Plus, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getVehicles, saveVehicle, deleteVehicle } from "@/lib/data";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function VehicleContent() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>({
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        license_plate: "",
        color: "",
        mileage: 0
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        setIsLoading(true);
        try {
            const fetchedVehicles = await getVehicles();
            setVehicles(fetchedVehicles);
        } catch (error) {
            console.error("Erro ao carregar veículos:", error);
            toast({ title: "Erro", description: "Falha ao carregar veículos.", variant: "destructive" });
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const vehicleToSave: Partial<Vehicle> = editingVehicle ? { ...formData, id: editingVehicle.id } : formData;
            
            // Remove optional fields if they are empty
            if (vehicleToSave.color === "") delete vehicleToSave.color;
            if (vehicleToSave.mileage === 0) delete vehicleToSave.mileage;
            
            await saveVehicle(vehicleToSave as any);
            toast({ title: "Sucesso", description: `Veículo ${formData.brand} ${formData.model} salvo.` });
            
            resetForm();
            loadVehicles();
        } catch (error) {
            console.error("Erro ao salvar veículo:", error);
            toast({ title: "Erro", description: "Falha ao salvar veículo.", variant: "destructive" });
        }
        
        setIsSaving(false);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            color: vehicle.color || "",
            mileage: vehicle.mileage || 0
        });
        setShowForm(true);
    };

    const handleDelete = async (vehicleId: string) => {
        if (confirm("Tem certeza que deseja excluir este veículo?")) {
            try {
                await deleteVehicle(vehicleId);
                toast({ title: "Sucesso", description: "Veículo excluído." });
                loadVehicles();
            } catch (error) {
                console.error("Erro ao excluir veículo:", error);
                toast({ title: "Erro", description: "Falha ao excluir veículo.", variant: "destructive" });
            }
        }
    };

    const resetForm = () => {
        setFormData({
            brand: "",
            model: "",
            year: new Date().getFullYear(),
            license_plate: "",
            color: "",
            mileage: 0
        });
        setEditingVehicle(null);
        setShowForm(false);
    };

    return (
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            Meus Veículos
                        </h1>
                        <p className="text-slate-600">
                            Gerencie as informações dos seus veículos
                        </p>
                    </div>
                    
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        {showForm ? "Cancelar" : "Novo Veículo"}
                    </Button>
                </div>

                {/* Form */}
                {showForm && (
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Car className="w-6 h-6 text-primary" />
                                {editingVehicle ? "Editar Veículo" : "Novo Veículo"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="brand">Marca *</Label>
                                        <Input
                                            id="brand"
                                            value={formData.brand}
                                            onChange={(e) => setFormData(prev => ({...prev, brand: e.target.value}))}
                                            placeholder="Ex: Toyota, Honda, Chevrolet"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="model">Modelo *</Label>
                                        <Input
                                            id="model"
                                            value={formData.model}
                                            onChange={(e) => setFormData(prev => ({...prev, model: e.target.value}))}
                                            placeholder="Ex: Corolla, Civic, Onix"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Ano *</Label>
                                        <Input
                                            id="year"
                                            type="number"
                                            min="1980"
                                            max={new Date().getFullYear() + 1}
                                            value={formData.year}
                                            onChange={(e) => setFormData(prev => ({...prev, year: parseInt(e.target.value)}))}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="license_plate">Placa *</Label>
                                        <Input
                                            id="license_plate"
                                            value={formData.license_plate}
                                            onChange={(e) => setFormData(prev => ({...prev, license_plate: e.target.value.toUpperCase()}))}
                                            placeholder="ABC-1234"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="color">Cor</Label>
                                        <Input
                                            id="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData(prev => ({...prev, color: e.target.value}))}
                                            placeholder="Ex: Branco, Preto, Prata"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="mileage">Quilometragem Atual</Label>
                                        <Input
                                            id="mileage"
                                            type="number"
                                            min="0"
                                            value={formData.mileage}
                                            onChange={(e) => setFormData(prev => ({...prev, mileage: parseInt(e.target.value) || 0}))}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetForm}
                                        disabled={isSaving}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-gradient-to-r from-primary to-primary/90"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                {editingVehicle ? "Atualizar" : "Salvar"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Vehicles List */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-slate-900">
                            Veículos Cadastrados ({vehicles.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array(3).fill(0).map((_, i) => (
                                    <Card key={i} className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-5 w-48" />
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <div className="flex gap-2">
                                                <Skeleton className="h-8 w-8" />
                                                <Skeleton className="h-8 w-8" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : vehicles.length === 0 ? (
                            <div className="text-center py-12">
                                <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                    Nenhum veículo cadastrado
                                </h3>
                                <p className="text-slate-600 mb-6">
                                    Adicione seu primeiro veículo para começar
                                </p>
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="bg-gradient-to-r from-primary to-primary/90"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Cadastrar Veículo
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {vehicles.map((vehicle) => (
                                    <Card key={vehicle.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                                                    <Car className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                                                        {vehicle.brand} {vehicle.model}
                                                    </h3>
                                                    <div className="space-y-1 text-slate-600">
                                                        <p>Ano: <span className="font-medium">{vehicle.year}</span></p>
                                                        <p>Placa: <span className="font-medium">{vehicle.license_plate}</span></p>
                                                        {vehicle.color && (
                                                            <p>Cor: <span className="font-medium">{vehicle.color}</span></p>
                                                        )}
                                                        <p>Quilometragem: <span className="font-medium">{vehicle.mileage?.toLocaleString() || 0} km</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleEdit(vehicle)}
                                                    className="hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleDelete(vehicle.id)}
                                                    className="hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function VehiclePage() {
    return (
        <ProtectedRoute requiredRole="admin">
            <VehicleContent />
        </ProtectedRoute>
    );
}
