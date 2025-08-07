'use client';
import { useState, useEffect, useCallback } from 'react';
import type { DailyChecklist, Vehicle, User } from '@/types';
import { getChecklists, getVehicles } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Car, AlertTriangle, Trash2, Eye, Search, Clock, CheckCircle2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Badge } from '@/components/ui/badge';

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

    const renderSkeleton = () => (
         <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Veículo</TableHead>
                            <TableHead>Motorista</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array(5).fill(0).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const getStatusBadge = (status: DailyChecklist['status']) => {
        switch (status) {
            case 'completed':
                return <Badge variant="outline" className="text-emerald-600 border-emerald-300"><CheckCircle2 className="w-4 h-4 mr-2" />Finalizado</Badge>;
            case 'problem':
                return <Badge variant="destructive"><AlertTriangle className="w-4 h-4 mr-2" />Com Problemas</Badge>;
            case 'pending_arrival':
                return <Badge variant="outline" className="text-amber-600 border-amber-300"><Clock className="w-4 h-4 mr-2" />Em Rota</Badge>;
            default:
                return <Badge variant="secondary">Pendente</Badge>;
        }
    };

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
                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                        <CardContent className="p-4">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Veículo</TableHead>
                                        <TableHead>Motorista</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredChecklists.map(checklist => {
                                        const vehicle = checklist.vehicle;
                                        return (
                                            <TableRow key={checklist.id}>
                                                <TableCell>
                                                    <div className="font-medium">{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A'}</div>
                                                    <div className="text-sm text-muted-foreground">{vehicle?.license_plate}</div>
                                                </TableCell>
                                                <TableCell>{checklist.driverName}</TableCell>
                                                <TableCell>{new Date(checklist.date).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell>{getStatusBadge(checklist.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {checklist.status === 'pending_arrival' && (
                                                            <Button size="sm" onClick={() => { setSelectedChecklist(checklist); setIsArrivalDialogOpen(true); }}>
                                                                <Clock className="w-4 h-4 mr-2" />
                                                                Chegada
                                                            </Button>
                                                        )}
                                                         <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" size="icon">
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-2xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>Detalhes do Checklist</DialogTitle>
                                                                </DialogHeader>
                                                                <ChecklistViewer checklist={checklist} vehicle={vehicle} />
                                                            </DialogContent>
                                                        </Dialog>
                                                        <PdfGeneratorButton checklist={checklist} vehicle={vehicle} />
                                                        {currentUser?.role === 'admin' && (
                                                            <Button variant="destructive" size="icon" onClick={() => handleDelete(checklist.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
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
