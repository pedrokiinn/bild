
'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown, Minus, ClipboardCheck, User as UserIcon, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    if (score >= 90) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (score >= 70) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
};

const getScoreIcon = (current: number, previous?: number) => {
    if (previous === undefined) return <Minus className="w-4 h-4 text-slate-300" />;
    if (current > previous) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <Minus className="w-4 h-4 text-slate-300" />;
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
            .sort((a,b) => b.departureTimestamp.toMillis() - a.departureTimestamp.toMillis());
        
        const currentIndex = vehicleChecklists.findIndex(c => c.id === currentChecklist.id);
        const previousChecklist = vehicleChecklists[currentIndex + 1];
        
        return previousChecklist ? getScore(previousChecklist) : undefined;
    }

    if (isLoading) {
        return (
            <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-slate-900">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                         <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24 rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }
  
  return (
    <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">Atividade Recente</CardTitle>
        <Link href="/history" className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            Ver tudo
            <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-1">
            {checklists.slice(0, 5).map(checklist => {
                const currentScore = getScore(checklist);
                const previousScore = getPreviousChecklistScore(checklist);
                const departureDate = checklist.departureTimestamp.toDate();

                return (
                    <div key={checklist.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all duration-200 group">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${currentScore >= 90 ? 'bg-emerald-50' : currentScore >= 70 ? 'bg-amber-50' : 'bg-rose-50'} transition-colors`}>
                                <ClipboardCheck className={`w-5 h-5 ${currentScore >= 90 ? 'text-emerald-500' : currentScore >= 70 ? 'text-amber-500' : 'text-rose-500'}`} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-base leading-tight group-hover:text-primary transition-colors">
                                    {getVehicleInfo(checklist.vehicleId)}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                        <UserIcon className="w-3 h-3" /> {checklist.driverName}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                        <Calendar className="w-3 h-3" /> {format(departureDate, "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <Badge variant="outline" className={`px-3 py-1 text-sm font-bold border-0 shadow-sm ${getScoreColor(currentScore)}`}>
                                {currentScore}%
                            </Badge>
                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                {getScoreIcon(currentScore, previousScore)}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
         {checklists.length === 0 && (
            <div className="text-center py-16 text-slate-400">
                <div className="mb-4 flex justify-center">
                    <ClipboardCheck className="w-12 h-12 opacity-20" />
                </div>
                <p className="text-sm font-medium">Nenhuma inspeção registrada recentemente.</p>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
