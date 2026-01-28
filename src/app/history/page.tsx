
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DailyChecklist, Vehicle, FuelType } from '@/types';
import { getChecklists, getVehicles, saveChecklist } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Car, AlertTriangle, Trash2, Eye, Search, CheckCircle2, Clock, FileText, User } from 'lucide-react';
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
import { deleteChecklist as deleteChecklistAction } from '@/lib/data';
import { ArrivalDialog } from '@/components/history/ArrivalDialog';
import { Badge } from '@/components/ui/badge';
import ConfirmationDialog from '@/components/shared/ConfirmationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MonthlyReportDialog from '@/components/history/MonthlyReportDialog';

function HistoryContent() {
    const [checklists, setChecklists] = useState<(DailyChecklist & { vehicle?: Vehicle })[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('all');
    const [selectedDriver, setSelectedDriver] = useState('all');
    const [isArrivalDialogOpen, setIsArrivalDialogOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist & { vehicle?: Vehicle } | null>(null);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [loadedChecklists, loadedVehicles] = await Promise.all([
                getChecklists(),
                getVehicles(),
            ]);

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
    
    const drivers = useMemo(() => {
        const driverMap = new Map<string, string>();
        checklists.forEach(c => {
            if (c.driverId && c.driverName) {
                driverMap.set(c.driverId, c.driverName);
            }
        });
        return Array.from(driverMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }, [checklists]);

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteChecklistAction(itemToDelete);
            toast({
                title: "Checklist excluído!",
                description: "O registro foi removido com sucesso."
            });
            loadData(); 
        } catch (error) {
            console.error("Erro ao excluir checklist:", error);
            toast({
                title: "Falha ao excluir",
                description: "Não foi possível excluir o checklist. Tente novamente.",
                variant: 'destructive',
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };
    
    const openDeleteDialog = (checklistId: string) => {
        setItemToDelete(checklistId);
        setIsDeleteDialogOpen(true);
    };

    const handleArrivalClick = (checklist: DailyChecklist & { vehicle?: Vehicle }) => {
        setSelectedChecklist(checklist);
        setIsArrivalDialogOpen(true);
    };

    const handleArrivalSave = async (arrivalMileage: number, fuelingData?: { amount: number; liters: number; type: FuelType }) => {
        if (!selectedChecklist) return;

        try {
            const hasProblem = Object.values(selectedChecklist.checklistItems).includes('problem');
            const updatedChecklistData: any = {
                ...selectedChecklist,
                arrivalTimestamp: new Date(),
                arrivalMileage: arrivalMileage,
                status: hasProblem ? 'problem' : 'completed',
            };
            
            if (fuelingData) {
                updatedChecklistData.refuelingAmount = fuelingData.amount;
                updatedChecklistData.refuelingLiters = fuelingData.liters;
                updatedChecklistData.fuelType = fuelingData.type;
            }

            await saveChecklist(updatedChecklistData);

            toast({
                title: "Chegada registrada!",
                description: "A chegada do veículo foi salva com sucesso."
            });
            setIsArrivalDialogOpen(false);
            setSelectedChecklist(null);
            loadData();
        } catch (error: any) {
            console.error("Erro ao salvar chegada:", error);
            toast({
                title: "Erro ao salvar",
                description: error.message || "Não foi possível registrar a chegada.",
                variant: 'destructive',
            });
        }
    };
    
    const filteredChecklists = checklists
      .filter(c => !!c.departureTimestamp) // <-- FIX: Ensure checklist has a departure timestamp
      .filter(c => {
        const searchMatch = searchTerm === '' ||
            c.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.vehicle?.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase());
        
        const vehicleMatch = selectedVehicle === 'all' || c.vehicleId === selectedVehicle;
        const driverMatch = selectedDriver === 'all' || c.driverId === selectedDriver;

        return searchMatch && vehicleMatch && driverMatch;
    });

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

    const getStatusBadge = (status: DailyChecklist['status']) => {
        switch (status) {
            case 'completed':
                return <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10"><CheckCircle2 className="w-3 h-3 mr-1.5" />Finalizado</Badge>;
            case 'problem':
                return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1.5" />Problemas</Badge>;
            case 'pending_arrival':
                return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50"><Clock className="w-3 h-3 mr-1.5" />Em Rota</Badge>;
            default:
                return <Badge variant="secondary">Pendente</Badge>;
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-6">
                     <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-slate-900">
                                <Calendar className="w-6 h-6 text-primary" />
                                Histórico de Checklists
                            </CardTitle>
                            <p className="text-slate-600 text-sm md:text-base mt-1">
                                Veja, gerencie e exporte todos os checklists realizados.
                            </p>
                        </div>
                        <Button onClick={() => setIsReportDialogOpen(true)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Gerar Relatório Mensal
                        </Button>
                    </CardHeader>
                </Card>

                <div className="bg-white p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row gap-2 md:gap-4 items-center">
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar por placa ou modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>
                     <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger className="w-full md:w-[250px] text-sm">
                            <SelectValue placeholder="Filtrar por motorista" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os motoristas</SelectItem>
                            {drivers.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                        <SelectTrigger className="w-full md:w-[250px] text-sm">
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
                            const departureDate = checklist.departureTimestamp.toDate();
                            const isPending = checklist.status === 'pending_arrival';
                            const hasProblems = Object.values(checklist.checklistItems).includes('problem');

                            return (
                                <Card key={checklist.id} className={`bg-white/80 backdrop-blur-sm shadow-lg border-0 transition-all hover:shadow-2xl flex flex-col ${checklist.status === 'problem' ? 'border-l-4 border-destructive' : ''}`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                                            <Car className="w-5 h-5 text-primary" />
                                            {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})` : "Veículo não encontrado"}
                                        </CardTitle>
                                        <p className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                                            <Calendar className="w-3 h-3" /> {departureDate.toLocaleDateString('pt-BR')}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-between">
                                        <div className="space-y-3 text-sm mb-4">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <User className="w-4 h-4 text-muted-foreground" /> 
                                                <span className="font-medium">Motorista:</span> {checklist.driverName}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-medium text-slate-700">Status:</span> 
                                                {isPending ? (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50"><Clock className="w-3 h-3 mr-1.5" />Em Rota</Badge>
                                                ) : hasProblems ? (
                                                    <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1.5" />Problemas</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10"><CheckCircle2 className="w-3 h-3 mr-1.5" />Finalizado</Badge>
                                                )}
                                            </div>
                                            {hasProblems && !isPending && (
                                                <p className="flex items-center gap-2 text-destructive font-semibold p-2 bg-destructive/10 rounded-md text-xs">
                                                    <AlertTriangle className="w-4 h-4" /> 
                                                    Checklist finalizado com problemas!
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex justify-end items-center pt-4 border-t border-slate-200/60 gap-1">
                                            <Dialog>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="icon">
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Ver Dados</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <DialogContent className="sm:max-w-2xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Detalhes do Checklist</DialogTitle>
                                                    </DialogHeader>
                                                    <ChecklistViewer 
                                                        checklist={checklist} 
                                                        vehicle={vehicle} 
                                                        onArrivalClick={() => handleArrivalClick(checklist)}
                                                    />
                                                </DialogContent>
                                            </Dialog>

                                            {isPending && (
                                                <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" onClick={() => handleArrivalClick(checklist)}>
                                                            <Clock className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Registrar Chegada</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                </TooltipProvider>
                                            )}

                                            <PdfGeneratorButton checklist={checklist} vehicle={vehicle} />
                                             <TooltipProvider>
                                             <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(checklist.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Excluir Checklist</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
                {!isLoading && filteredChecklists.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Nenhum checklist encontrado
                        </h3>
                        <p className="text-slate-600 text-sm">
                        Ajuste os filtros ou crie um novo checklist.
                        </p>
                    </div>
                )}
            </div>
        {selectedChecklist && (
            <ArrivalDialog
                isOpen={isArrivalDialogOpen}
                onClose={() => setIsArrivalDialogOpen(false)}
                onSave={handleArrivalSave}
                checklist={selectedChecklist}
            />
        )}
        <MonthlyReportDialog
            isOpen={isReportDialogOpen}
            onClose={() => setIsReportDialogOpen(false)}
            vehicles={vehicles}
            checklists={checklists}
        />
        <ConfirmationDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDelete}
            title="Tem certeza que deseja excluir este checklist?"
            description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
        />
    </div>
    );
}

export default function HistoryPage() {
    return <HistoryContent />;
}

    
