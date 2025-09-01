
'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown, Minus, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface RecentChecklistsProps {
  checklists: (DailyChecklist & { vehicle?: Vehicle })[];
  vehicles: Vehicle[];
  isLoading: boolean;
}

const getScore = (checklist: DailyChecklist) => {
    const totalItems = Object.keys(checklist.checklistItems).length;
    if (totalItems === 0) return 100;
    const okItems = Object.values(checklist.checklistItems).filter(status => status === 'ok').length;
    return Math.round((okItems / totalItems) * 100);
}

const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
};

const getScoreIcon = (current: number, previous?: number) => {
    if (previous === undefined) return <Minus className="w-3 h-3" />;
    if (current > previous) return <TrendingUp className="w-3 h-3 text-emerald-600" />;
    if (current < previous) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3" />;
};


export default function RecentChecklists({ checklists, vehicles, isLoading }: RecentChecklistsProps) {
  
    const getVehicleInfo = (vehicleId?: string) => {
        if (!vehicleId) return "Veículo não encontrado";
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? `${vehicle.brand} ${vehicle.model}` : "Veículo não encontrado";
    };

    const getPreviousChecklistScore = (currentChecklist: DailyChecklist) => {
        const vehicleChecklists = checklists
            .filter(c => c.vehicleId === currentChecklist.vehicleId)
            .sort((a,b) => (b.departureTimestamp as any) - (a.departureTimestamp as any));
        
        const currentIndex = vehicleChecklists.findIndex(c => c.id === currentChecklist.id);
        const previousChecklist = vehicleChecklists[currentIndex + 1];
        
        return previousChecklist ? getScore(previousChecklist) : undefined;
    }

    if (isLoading) {
        return (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        Inspeções Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                         <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                            <div className="space-y-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-bold text-slate-900">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            {checklists.slice(0, 5).map(checklist => {
                const currentScore = getScore(checklist);
                const previousScore = getPreviousChecklistScore(checklist);
                const departureDate = checklist.departureTimestamp instanceof Timestamp 
                                ? checklist.departureTimestamp.toDate() 
                                : new Date(checklist.departureTimestamp);

                return (
                    <div key={checklist.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
                        <div>
                            <p className="font-semibold text-sm text-slate-800">{getVehicleInfo(checklist.vehicleId)}</p>
                            <p className="text-xs text-slate-500">
                                {checklist.driverName} • {format(departureDate, "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge className={`border text-xs font-semibold ${getScoreColor(currentScore)}`}>
                                {currentScore}%
                            </Badge>
                            {getScoreIcon(currentScore, previousScore)}
                        </div>
                    </div>
                )
            })}
        </div>
        {!isLoading && checklists.length > 0 && (
          <div className="mt-4 text-right">
             <Link href="/history" className="text-sm font-medium text-primary hover:underline flex items-center justify-end gap-1">
                Ver Histórico Completo
                <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
         {!isLoading && checklists.length === 0 && (
            <div className="text-center py-10 text-slate-500">
                <p className="text-sm">Nenhuma inspeção recente encontrada.</p>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
