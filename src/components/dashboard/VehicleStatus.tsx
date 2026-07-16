
'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, Plus, Car } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '../ui/skeleton';

interface VehicleStatusProps {
  vehicles: Vehicle[];
  checklists: DailyChecklist[];
  isLoading: boolean;
}

export default function VehicleStatus({ vehicles, checklists, isLoading }: VehicleStatusProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayChecklists = checklists.filter(c => c.date === today);

  if (isLoading) {
    return (
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden p-6">
            <CardHeader className="p-0 mb-6">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4 p-0">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden p-6 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="p-0 mb-6">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl font-bold text-slate-900">Status do Dia</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500 mt-1 first-letter:capitalize">
                    {format(new Date(), "eeee, dd 'de' MMMM", { locale: ptBR })}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {vehicles.length > 0 ? vehicles.map(vehicle => {
          const todaysChecklistForVehicle = todayChecklists.find(c => c.vehicleId === vehicle.id);
          const hasProblem = todaysChecklistForVehicle?.status === 'problem';
          const status = todaysChecklistForVehicle?.status;

          return (
            <div key={vehicle.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all duration-200 group border border-transparent hover:border-slate-100">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                  status === 'completed' ? 'bg-emerald-50 group-hover:bg-emerald-100' : 
                  status === 'problem' ? 'bg-rose-50 group-hover:bg-rose-100' : 
                  status === 'pending_arrival' ? 'bg-amber-50 group-hover:bg-amber-100' : 
                  'bg-slate-50 group-hover:bg-slate-100'
              }`}>
                <Car className={`h-5 w-5 ${
                    status === 'completed' ? 'text-emerald-500' : 
                    status === 'problem' ? 'text-rose-500' : 
                    status === 'pending_arrival' ? 'text-amber-500' : 
                    'text-slate-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{vehicle.brand} {vehicle.model}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">{vehicle.license_plate}</p>
              </div>
              <div className="flex items-center gap-1.5">
                  {status === 'completed' && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-full">Finalizado</Badge>
                  )}
                  {status === 'problem' && (
                      <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-full">Problema</Badge>
                  )}
                  {status === 'pending_arrival' && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-full">Em Rota</Badge>
                  )}
                  {!status && (
                      <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Pendente</Badge>
                  )}
              </div>
            </div>
          )
        }) : (
            <div className="text-center text-slate-400 py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <Car className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-wider mb-4">Frota Vazia</p>
                <Link href="/vehicle">
                    <Button size="sm" variant="outline" className="text-[11px] font-bold h-8 rounded-lg">
                        <Plus className="h-3 w-3 mr-1.5" />
                        Adicionar Veículo
                    </Button>
                </Link>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
