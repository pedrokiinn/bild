'use client';
import { useState } from "react";
import type { Vehicle } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, X, Loader2, Car } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { saveVehicle, deleteVehicle as deleteVehicleAction } from "@/lib/data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface VehicleClientProps {
    initialVehicles: Vehicle[];
    isLoading: boolean;
}

const emptyForm = { brand: "", model: "", year: new Date().getFullYear(), license_plate: "", color: "", mileage: 0 };

export default function VehicleClient({ initialVehicles, isLoading: initialIsLoading }: VehicleClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isLoading, setIsLoading] = useState(initialIsLoading);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>(emptyForm);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumberField = name === 'year' || name === 'mileage';
    setFormData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingVehicle(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const saved = await saveVehicle({ ...formData, id: editingVehicle?.id });
        if(editingVehicle) {
            setVehicles(vehicles.map(v => v.id === saved.id ? saved : v));
        } else {
            setVehicles([...vehicles, saved]);
        }
        toast({
            title: "Veículo salvo!",
            description: `O veículo ${saved.brand} ${saved.model} foi salvo com sucesso.`
        });
        handleCancel();
    } catch (error) {
        toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar os dados do veículo.",
            variant: "destructive"
        })
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteVehicleAction(id);
        setVehicles(vehicles.filter(v => v.id !== id));
        toast({
            title: "Veículo excluído!",
            description: "O veículo foi removido com sucesso."
        });
    } catch(error) {
         toast({
            title: "Erro ao excluir",
            description: "Não foi possível remover o veículo.",
            variant: "destructive"
        })
    }
  }

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({length: 3}).map((_, i) => (
                    <Card key={i}><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meus Veículos</h1>
                    <p className="text-muted-foreground">Gerencie os veículos da sua frota.</p>
                </div>
                <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Adicionar Veículo</Button>
            </div>
            {vehicles.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map(vehicle => (
                    <Card key={vehicle.id}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Car className="w-8 h-8 text-primary"/>
                        <div>
                            <CardTitle>{vehicle.brand} {vehicle.model} ({vehicle.year})</CardTitle>
                            <CardDescription>{vehicle.license_plate}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <p><strong>Cor:</strong> {vehicle.color}</p>
                       <p><strong>KM:</strong> {vehicle.mileage.toLocaleString('pt-BR')} km</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(vehicle)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o veículo e todos os seus checklists associados.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(vehicle.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </CardFooter>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Car className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhum veículo encontrado</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Comece adicionando um novo veículo à sua frota.</p>
                    <Button className="mt-6" onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Veículo
                    </Button>
                </div>
            )}
        </>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{editingVehicle ? "Editar Veículo" : "Adicionar Novo Veículo"}</CardTitle>
                        <CardDescription>Preencha as informações do veículo.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input id="brand" name="brand" value={formData.brand} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" name="model" value={formData.model} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input id="year" name="year" type="number" value={formData.year} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="license_plate">Placa</Label>
                    <Input id="license_plate" name="license_plate" value={formData.license_plate} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input id="color" name="color" value={formData.color} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="mileage">Quilometragem</Label>
                    <Input id="mileage" name="mileage" type="number" value={formData.mileage} onChange={handleInputChange} required />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="ml-auto" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? "Salvando..." : "Salvar Veículo"}
                </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}
