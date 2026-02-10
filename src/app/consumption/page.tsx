
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DailyChecklist, Vehicle, User } from '@/types';
import { getChecklists, getVehicles } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Fuel, Car, Route, TrendingUp, DollarSign, Droplets, Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUser } from '@/context/UserContext';

interface Trip {
  id: string;
  vehicleInfo: string;
  driverName: string;
  startDate: Date;
  distance: number;
  liters: number;
  cost: number;
  efficiency: number | null;
}

const getEfficiencyBadge = (efficiency: number | null) => {
    if (efficiency === null || efficiency <= 0) {
        return <Badge variant="outline">N/A</Badge>;
    }
    if (efficiency > 12) {
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-300">Ótimo</Badge>;
    }
    if (efficiency > 8) {
        return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 border-sky-300">Bom</Badge>;
    }
    if (efficiency > 5) {
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300">Regular</Badge>;
    }
    return <Badge variant="destructive">Ruim</Badge>;
};

function ConsumptionContent() {
    const [checklists, setChecklists] = useState<DailyChecklist[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const user = useUser();

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [checklistData, vehicleData] = await Promise.all([getChecklists(user), getVehicles()]);
                setChecklists(checklistData);
                setVehicles(vehicleData);
            } catch (error) {
                console.error("Erro ao carregar dados de consumo:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

    const trips = useMemo((): Trip[] => {
        const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
        
        return checklists
            .filter(c => (c.status === 'completed' || c.status === 'problem') && c.arrivalMileage && c.departureMileage && c.arrivalTimestamp)
            .map(c => {
                const vehicle = vehicleMap.get(c.vehicleId);
                const distance = c.arrivalMileage! - c.departureMileage;
                const liters = c.refuelings?.reduce((sum, r) => sum + r.liters, 0) || 0;
                const cost = c.refuelings?.reduce((sum, r) => sum + r.amount, 0) || 0;
                const efficiency = liters > 0 && distance > 0 ? distance / liters : null;
                
                return {
                    id: c.id,
                    vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Veículo não encontrado',
                    driverName: c.driverName,
                    startDate: c.departureTimestamp.toDate(),
                    distance,
                    liters,
                    cost,
                    efficiency,
                };
            })
            .filter(t => t.distance > 0)
            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime()); // Sort by most recent trip
    }, [checklists, vehicles]);
    
    const renderSkeleton = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array(4).fill(0).map((_,i) => <Skeleton key={i} className="h-24" />)}
            </div>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                     <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-slate-900">
                                <Fuel className="w-6 h-6 text-primary" />
                                <Skeleton className="h-8 w-1/2" />
                            </CardTitle>
                            <CardDescription>
                                <Skeleton className="h-4 w-3/4" />
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    {renderSkeleton()}
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl text-slate-900">
                            <Fuel className="w-6 h-6 text-primary" />
                            Consumo por Viagem
                        </CardTitle>
                        <CardDescription>
                            Analise a eficiência de cada viagem com base nos checklists e abastecimentos.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {trips.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-slate-500">
                             <Fuel className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">Nenhuma viagem finalizada encontrada</h3>
                            <p className="text-sm mt-1">Viagens finalizadas com registro de abastecimento aparecerão aqui.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Viagens</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Veículo</TableHead>
                                        <TableHead>Motorista</TableHead>
                                        <TableHead className="text-right">Distância</TableHead>
                                        <TableHead className="text-right">Litros</TableHead>
                                        <TableHead className="text-right">Custo</TableHead>
                                        <TableHead className="text-center">Eficiência (km/L)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trips.map(trip => (
                                        <TableRow key={trip.id}>
                                            <TableCell>
                                                <div className="font-medium">{trip.vehicleInfo}</div>
                                                <div className="text-xs text-muted-foreground">{format(trip.startDate, 'dd/MM/yy')}</div>
                                            </TableCell>
                                            <TableCell>{trip.driverName}</TableCell>
                                            <TableCell className="text-right">{trip.distance.toFixed(1)} km</TableCell>
                                            <TableCell className="text-right">{trip.liters > 0 ? trip.liters.toFixed(2) + ' L' : '-'}</TableCell>
                                            <TableCell className="text-right">{trip.cost > 0 ? `R$ ${trip.cost.toFixed(2)}` : '-'}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span>{trip.efficiency ? trip.efficiency.toFixed(2) : '-'}</span>
                                                    {getEfficiencyBadge(trip.efficiency)}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}


export default function ConsumptionPage() {
    return <ConsumptionContent />;
}
