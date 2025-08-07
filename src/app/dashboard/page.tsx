'use client';

import React, { useState, useEffect } from 'react';
import { DailyChecklist, Vehicle } from '@/types';
import { getChecklists, getVehicles } from '@/lib/data';
import { Car, ClipboardCheck, TrendingUp, AlertCircle } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentChecklists from '@/components/dashboard/RecentChecklists';
import VehicleStatus from '@/components/dashboard/VehicleStatus';
import { subDays, isSameDay } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState<{ checklists: (DailyChecklist & { vehicle?: Vehicle })[], vehicles: Vehicle[] }>({ checklists: [], vehicles: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [checklistsData, vehiclesData] = await Promise.all([getChecklists(), getVehicles()]);
      
      const checklistsWithVehicleData = checklistsData.map(checklist => {
          const vehicle = vehiclesData.find(v => v.id === checklist.vehicleId);
          return { ...checklist, vehicle };
      });

      setData({ checklists: checklistsWithVehicleData, vehicles: vehiclesData });
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const { checklists, vehicles } = data;

  const totalChecklistsThisMonth = checklists.filter(c => {
    const checklistDate = new Date(c.date);
    const today = new Date();
    return checklistDate.getMonth() === today.getMonth() && checklistDate.getFullYear() === today.getFullYear();
  }).length;

  const issuesLast30Days = checklists.filter(c => {
    const checklistDate = new Date(c.date);
    const thirtyDaysAgo = subDays(new Date(), 30);
    return checklistDate >= thirtyDaysAgo && c.status === 'problem';
  }).length;
  
  const inTransitCount = checklists.filter(c => c.status === 'pending_arrival' && isSameDay(new Date(c.departureTimestamp), new Date())).length;


  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do estado da sua frota.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Veículos Ativos"
          value={String(vehicles.length)}
          icon={Car}
          isLoading={isLoading}
        />
        <StatsCard
          title="Checklists (Mês)"
          value={String(totalChecklistsThisMonth)}
          icon={ClipboardCheck}
          isLoading={isLoading}
        />
        <StatsCard
          title="Veículos em Rota"
          value={String(inTransitCount)}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatsCard
          title="Alertas (30 dias)"
          value={String(issuesLast30Days)}
          icon={AlertCircle}
          isLoading={isLoading}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <RecentChecklists checklists={checklists} isLoading={isLoading} />
        <VehicleStatus vehicles={vehicles} checklists={checklists} isLoading={isLoading} />
      </div>
    </div>
  );
}
