'use client';
import { useState, useEffect, useCallback } from 'react';
import type { DailyChecklist, Vehicle, User } from '@/types';
import { getChecklists, getVehicles } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Car, User as UserIcon, AlertTriangle, Trash2, Eye, Search, Clock } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import ChecklistViewer from '@/components/history/ChecklistViewer';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PdfGeneratorButton from '@/components/history/PdfGeneratorButton';
import { useToast } from '@/hooks/use-toast';
import { saveChecklist, deleteChecklist as deleteChecklistAction } from '@/lib/data';
import { ArrivalDialog } from '@/components/history/ArrivalDialog';

function HistoryContent() {
    const [checklists, setChecklists] = useState<(DailyChecklist & { vehicle?: Vehicle })[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('all');
    const [isArrivalDialogOpen, setIsArrivalDialogOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist & { vehicle?: Vehicle } | null>(null);
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [user, loadedChecklists, loadedVehicles] = await Promise.all([
                getCurrentUser(),
                getChecklists(),
                getVehicles(),
            ]);
            
            setCurrentUser(user);

            const checklistsWithVehicleData = loadedChecklists.map(checklist => {
                const vehicle = loadedVehicles.find(v => v.id === checklist.vehicleId);
                return { ...checklist, vehicle };
            });

            setVehicles(loadedVehicles);
            setChecklists(checklistsWithVehicleData);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar o histórico.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDelete = async (checklistId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.")) {
            try {
                await deleteChecklistAction(checklistId);
                toast({
                    title: "Checklist excluído!",
                    description: "O registro foi removido com sucesso."
                });
                loadData(); // Recarregar dados
            } catch (error) {
                console.error("Erro ao excluir checklist:", error);
                toast({
                    title: "Falha ao excluir",
                    description: "Não foi possível excluir o checklist. Tente novamente.",
                    variant: 'destructive',
                });
            }
        }
    };

    const handleArrivalSave = async (arrivalMileage: number) => {
        if (!selectedChecklist) return;

        try {
            const updatedChecklist = {
                ...selectedChecklist,
                arrivalTimestamp: new Date().getTime(),
                arrivalMileage: arrivalMileage,
                status: selectedChecklist.status === 'problem' ? 'problem' : 'completed' as const,
            };

            await saveChecklist(updatedChecklist);

            toast({
                title: "Chegada registrada!",
                description: "A chegada do veículo foi salva com sucesso."
            });
            setIsArrivalDialogOpen(false);
            setSelectedChecklist(null);
            loadData();
        } catch (error) {
            console.error("Erro ao salvar chegada:", error);
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível registrar a chegada.",
                variant: 'destructive',
            });
        }
    };
    
    const filteredChecklists = checklists.filter(c => {
        const searchMatch = searchTerm === '' ||
            c.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.vehicle?.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase());
        
        const vehicleMatch = selectedVehicle === 'all' || c.vehicleId === selectedVehicle;

        return searchMatch && vehicleMatch;
    });

    const hasProblems = (items: Record<string, 'ok' | 'problem'>) => {
        return Object.values(items).some(status => status === 'problem');
    };

    const renderSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between items-center pt-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <>
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl text-slate-900">
                            <Calendar className="w-7 h-7 text-primary" />
                            Histórico de Checklists
                        </CardTitle>
                        <p className="text-slate-600">
                            Veja, gerencie e exporte todos os checklists realizados.
                        </p>
                    </CardHeader>
                </Card>

                <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                         <Input 
                            placeholder="Buscar por motorista, placa ou modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                        <SelectTrigger className="w-full md:w-[250px]">
                            <SelectValue placeholder="Filtrar por veículo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os veículos</SelectItem>
                            {vehicles.map(v => (
                                <SelectItem key={v.id} value={v.id}>{`${v.brand} ${v.model} (${v.license_plate})`}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? renderSkeleton() : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredChecklists.map(checklist => {
                            const vehicle = checklist.vehicle;
                            return (
                                <Card key={checklist.id} className={`bg-white/80 backdrop-blur-sm shadow-lg border-0 transition-all hover:shadow-2xl ${hasProblems(checklist.checklistItems) ? 'border-l-4 border-amber-500' : ''}`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Car className="w-5 h-5 text-primary" />
                                            {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})` : "Veículo não encontrado"}
                                        </CardTitle>
                                        <p className="text-sm text-slate-500 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> {new Date(checklist.date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm mb-4">
                                            <p className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-slate-500" /> 
                                                <strong>Motorista:</strong> {checklist.driverName}
                                            </p>
                                            {hasProblems(checklist.checklistItems) && (
                                                <p className="flex items-center gap-2 text-amber-600 font-semibold p-2 bg-amber-50 rounded-md">
                                                    <AlertTriangle className="w-4 h-4" /> 
                                                    Atenção: Checklist com problemas!
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Ver Dados
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Detalhes do Checklist</DialogTitle>
                                                    </DialogHeader>
                                                    <ChecklistViewer checklist={checklist} vehicle={vehicle} />
                                                </DialogContent>
                                            </Dialog>

                                            <div className="flex items-center gap-2">
                                                 {checklist.status === 'pending_arrival' && (
                                                    <Button size="sm" onClick={() => { setSelectedChecklist(checklist); setIsArrivalDialogOpen(true); }}>
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        Registrar Chegada
                                                    </Button>
                                                )}
                                                <PdfGeneratorButton checklist={checklist} vehicle={vehicle} />
                                                {currentUser?.role === 'admin' && (
                                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(checklist.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
                {!isLoading && filteredChecklists.length === 0 && (
                     <div className="text-center py-16">
                        <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Nenhum checklist encontrado
                        </h3>
                        <p className="text-slate-600">
                           Ajuste os filtros ou crie um novo checklist.
                        </p>
                    </div>
                )}
            </div>
        </div>
        {selectedChecklist && (
            <ArrivalDialog
                isOpen={isArrivalDialogOpen}
                onClose={() => setIsArrivalDialogOpen(false)}
                onSave={handleArrivalSave}
                checklist={selectedChecklist}
            />
        )}
        </>
    );
}

export default function HistoryPage() {
    return (
        <HistoryContent />
    );
}
