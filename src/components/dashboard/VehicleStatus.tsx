'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Calendar, Car, CheckCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { isToday, format } from 'date-fns';
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
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Status do Dia</CardTitle>
        <CardDescription>{format(new Date(), "eeee, dd 'de' MMMM", { locale: ptBR })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {vehicles.length > 0 ? vehicles.map(vehicle => {
          const todaysChecklistForVehicle = todayChecklists.find(c => c.vehicleId === vehicle.id);
          const hasProblem = todaysChecklistForVehicle?.status === 'problem';

          return (
            <div key={vehicle.id} className="flex items-center">
              <Car className={`h-5 w-5 mr-3 ${hasProblem ? 'text-destructive' : 'text-primary'}`} />
              <div className="flex-1">
                <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
              </div>
              {todaysChecklistForVehicle ? (
                todaysChecklistForVehicle.status === 'pending_arrival' ? (
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Em Rota
                  </div>
                ) : (
                  <div className={`text-xs flex items-center gap-1 ${hasProblem ? 'text-destructive' : 'text-green-600'}`}>
                    {hasProblem ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    {hasProblem ? 'Problema' : 'OK'}
                  </div>
                )
              ) : (
                <Link href="/checklist">
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Checklist
                  </Button>
                </Link>
              )}
            </div>
          )
        }) : (
            <div className="text-center text-muted-foreground py-8">
                <p>Nenhum veículo cadastrado.</p>
                <Link href="/vehicle">
                    <Button size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Veículo
                    </Button>
                </Link>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
