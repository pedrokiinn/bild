
'use client';
import { DailyChecklist, Vehicle, ChecklistItemOption } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, Sparkles, User, Car as CarIcon, Calendar, Gauge, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { checklistItemsOptions } from '@/lib/data';

interface ChecklistViewerProps {
    checklist?: DailyChecklist & { vehicle?: Vehicle };
    vehicle?: Vehicle;
}

const getOptionLabel = (itemKey: string, value: string) => {
    const item = checklistItemsOptions.find(i => i.key === itemKey);
    if (!item) return value;
    const option = item.options.find(o => o.value === value);
    return option ? option.label : value;
};

const getOptionColor = (itemKey: string, value: string) => {
    const item = checklistItemsOptions.find(i => i.key === itemKey);
    if (!item) return "bg-gray-100 text-gray-800";
    const option = item.options.find(o => o.value === value);
    if (!option) return "bg-gray-100 text-gray-800";

    const colorClasses = {
        green: "bg-emerald-100 text-emerald-800",
        blue: "bg-blue-100 text-blue-800",
        yellow: "bg-yellow-100 text-yellow-800",
        orange: "bg-orange-100 text-orange-800",
        red: "bg-red-100 text-red-800"
    };

    return colorClasses[option.color as keyof typeof colorClasses] || "bg-gray-100 text-gray-800";
};


export default function ChecklistViewer({ checklist, vehicle }: ChecklistViewerProps) {
    if (!checklist) {
        return <p>Carregando dados do checklist...</p>;
    }

    return (
        <div className="space-y-6 p-1">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
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
                        <span className="font-medium text-muted-foreground">Data Saída:</span>
                        <span className="font-semibold">{format(new Date(checklist.departureTimestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                     {checklist.arrivalTimestamp && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">Data Chegada:</span>
                            <span className="font-semibold">{format(new Date(checklist.arrivalTimestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                        <CheckCircle2 className="w-5 h-5" />
                        Itens Verificados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {checklist.checklistValues && Object.entries(checklist.checklistValues).map(([key, value]) => {
                            const itemConfig = checklistItemsOptions.find(i => i.key === key);
                            return (
                                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">
                                        {itemConfig?.title || key}
                                    </span>
                                    <Badge className={getOptionColor(key, value)}>
                                        {getOptionLabel(key, value)}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {(checklist.notes || checklist.aiDiagnosis) && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                             <AlertCircle className="w-5 h-5" />
                             Anotações e Diagnósticos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {checklist.notes && (
                            <div>
                               <h4 className="font-semibold text-slate-700 mb-2">Observações do Motorista:</h4>
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
        </div>
    );
}
