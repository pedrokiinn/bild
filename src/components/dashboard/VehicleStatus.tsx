
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
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl border border-white/20">
            <CardHeader className="p-0 mb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4 p-0">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl border border-white/20">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg md:text-xl font-bold text-slate-900">Status do Dia</CardTitle>
        <CardDescription className="text-sm">{format(new Date(), "eeee, dd 'de' MMMM", { locale: ptBR })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {vehicles.length > 0 ? vehicles.map(vehicle => {
          const todaysChecklistForVehicle = todayChecklists.find(c => c.vehicleId === vehicle.id);
          const hasProblem = todaysChecklistForVehicle?.status === 'problem';
          const status = todaysChecklistForVehicle?.status;

          return (
            <div key={vehicle.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`p-2 rounded-full ${hasProblem ? 'bg-red-100' : 'bg-primary/10'}`}>
                <Car className={`h-4 w-4 ${hasProblem ? 'text-red-600' : 'text-primary'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{vehicle.brand} {vehicle.model}</p>
                <p className="text-xs text-muted-foreground">{vehicle.license_plate}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                  {status === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                  {status === 'problem' && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                  {status === 'pending_arrival' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                  <span className={
                      status === 'completed' ? 'text-primary' :
                      status === 'problem' ? 'text-red-600' :
                      status === 'pending_arrival' ? 'text-amber-600' :
                      'text-slate-500'
                  }>
                      {
                          status === 'completed' ? 'Finalizado' :
                          status === 'problem' ? 'Problema' :
                          status === 'pending_arrival' ? 'Em Rota' :
                          'Pendente'
                      }
                  </span>
              </div>
            </div>
          )
        }) : (
            <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">Nenhum veículo cadastrado.</p>
                <Link href="/vehicle">
                    <Button size="sm" variant="outline" className="mt-2 text-xs">
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Adicionar Veículo
                    </Button>
                </Link>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
