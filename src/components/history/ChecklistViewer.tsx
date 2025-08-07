'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, Sparkles, User, Car as CarIcon, Calendar, Gauge } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface ChecklistViewerProps {
    checklist?: DailyChecklist & { vehicle?: Vehicle };
    vehicle?: Vehicle;
}

export default function ChecklistViewer({ checklist, vehicle }: ChecklistViewerProps) {
    if (!checklist) {
        return <p>Carregando dados do checklist...</p>;
    }

    const problemItems = Object.entries(checklist.checklistItems).filter(([, status]) => status === 'problem');
    const okItems = Object.entries(checklist.checklistItems).filter(([, status]) => status === 'ok');

    return (
        <div className="space-y-6 p-1">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Informações Gerais
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <CarIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Veículo:</span>
                        <span className="font-semibold">{vehicle?.brand} {vehicle?.model} ({vehicle?.license_plate})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Motorista:</span>
                        <span className="font-semibold">{checklist.driverName}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">KM Saída:</span>
                        <span className="font-semibold">{checklist.departureMileage?.toLocaleString('pt-BR')} km</span>
                    </div>
                    {checklist.arrivalMileage && (
                        <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">KM Chegada:</span>
                            <span className="font-semibold">{checklist.arrivalMileage?.toLocaleString('pt-BR')} km</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Data:</span>
                        <span className="font-semibold">{format(new Date(checklist.departureTimestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                </CardContent>
            </Card>


            {problemItems.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                             <AlertCircle className="w-5 h-5" />
                             Itens com Problema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md space-y-2">
                            {problemItems.map(([item]) => (
                                <div key={item} className="flex items-center gap-2 text-amber-800">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                         {checklist.notes && (
                            <div>
                               <h4 className="font-semibold text-slate-700 mb-2">Observações:</h4>
                               <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-md border border-slate-200">{checklist.notes}</p>
                            </div>
                        )}
                         {checklist.aiDiagnosis && (
                            <div>
                               <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                   <Sparkles className="w-5 h-5 text-blue-500"/>
                                   Diagnóstico (IA):
                                </h4>
                               <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">{checklist.aiDiagnosis}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                        Itens Verificados (OK)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                        {okItems.map(([item]) => (
                            <div key={item} className="flex items-center gap-2 text-slate-700">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
