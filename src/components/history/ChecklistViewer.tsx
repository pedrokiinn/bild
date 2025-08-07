'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
        <div className="space-y-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{vehicle?.brand} {vehicle?.model} ({vehicle?.license_plate})</h3>
                    <p className="text-sm text-slate-500">
                        {checklist.driverName} - {format(new Date(checklist.departureTimestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                </div>
                 <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500">KM Saída</p>
                        <p className="font-semibold">{checklist.departureMileage?.toLocaleString('pt-BR')} km</p>
                    </div>
                    <div>
                        <p className="text-slate-500">KM Chegada</p>
                        <p className="font-semibold">{checklist.arrivalMileage?.toLocaleString('pt-BR') || 'N/A'} km</p>
                    </div>
                 </div>
            </div>

            {problemItems.length > 0 && (
                <div>
                    <h4 className="font-semibold text-amber-600 mb-2">Itens com Problema</h4>
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md space-y-2">
                        {problemItems.map(([item]) => (
                            <div key={item} className="flex items-center gap-2 text-amber-700">
                                <AlertCircle className="w-5 h-5" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                     {checklist.notes && (
                        <div className="mt-4">
                           <h4 className="font-semibold text-slate-700 mb-1">Observações:</h4>
                           <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-md">{checklist.notes}</p>
                        </div>
                    )}
                     {checklist.aiDiagnosis && (
                        <div className="mt-4">
                           <h4 className="font-semibold text-slate-700 mb-1">Diagnóstico (IA):</h4>
                           <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">{checklist.aiDiagnosis}</p>
                        </div>
                    )}
                </div>
            )}

            <div>
                <h4 className="font-semibold text-emerald-600 mb-2">Itens Verificados (OK)</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    {okItems.map(([item]) => (
                        <div key={item} className="flex items-center gap-2 text-slate-600">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
