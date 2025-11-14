
'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, User, Car as CarIcon, Calendar, Gauge, FileText, Clock, Camera } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { checklistItemsOptions } from '@/lib/data';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import Image from 'next/image';

interface ChecklistViewerProps {
    checklist?: DailyChecklist & { vehicle?: Vehicle };
    vehicle?: Vehicle;
    onArrivalClick?: () => void;
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

const photoLabels: Record<string, string> = {
    front: "Frente",
    rear: "Traseira",
    left: "Lateral Esquerda",
    right: "Lateral Direita"
};


export default function ChecklistViewer({ checklist, vehicle, onArrivalClick }: ChecklistViewerProps) {
    if (!checklist) {
        return <p>Carregando dados do checklist...</p>;
    }
    
    const departureDate = checklist.departureTimestamp.toDate();
        
    const arrivalDate = checklist.arrivalTimestamp
        ? checklist.arrivalTimestamp.toDate()
        : null;

    const isPendingArrival = checklist.status === 'pending_arrival';

    return (
        <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6 p-1">
                {isPendingArrival && onArrivalClick && (
                    <Card className='bg-amber-50 border-amber-200'>
                        <CardContent className='pt-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <h3 className='font-bold text-amber-800'>Ação Necessária</h3>
                                    <p className='text-sm text-amber-700'>Este veículo ainda está em rota. Registre a chegada.</p>
                                </div>
                                <Button onClick={onArrivalClick} className='bg-amber-500 hover:bg-amber-600'>
                                    <Clock className='w-4 h-4 mr-2'/>
                                    Registrar Chegada
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
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
                            <span className="font-semibold">{format(departureDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                         {arrivalDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-muted-foreground">Data Chegada:</span>
                                <span className="font-semibold">{format(arrivalDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {checklist.photos && Object.keys(checklist.photos).length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                <Camera className="w-5 h-5" />
                                Fotos do Veículo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(checklist.photos).map(([key, url]) => (
                               <div key={key}>
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        <div className="relative aspect-video group">
                                            <Image src={url} alt={photoLabels[key] || 'Foto do veículo'} layout="fill" objectFit="cover" className="rounded-lg"/>
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                <span className="text-white text-sm font-semibold">{photoLabels[key]}</span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}


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

                {checklist.notes && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                                 <AlertCircle className="w-5 h-5" />
                                 Anotações do Motorista
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-md border border-slate-200">{checklist.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ScrollArea>
    );
}
