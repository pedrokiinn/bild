
'use client';

import React, { useState, useEffect } from 'react';
import { DailyChecklist, Vehicle } from '@/types';
import { getChecklists, getVehicles } from '@/lib/data';
import { Car, ClipboardCheck, TrendingUp, Plus, Calendar } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentChecklists from '@/components/dashboard/RecentChecklists';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';

export default function DashboardContent() {
    const [data, setData] = useState<{ checklists: (DailyChecklist & { vehicle?: Vehicle })[], vehicles: Vehicle[] }>({ checklists: [], vehicles: [] });
    const [isLoading, setIsLoading] = useState(true);
    const user = useUser();

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [checklistsData, vehiclesData] = await Promise.all([
                    getChecklists(user), 
                    getVehicles()
                ]);
                
                const checklistsWithVehicleData = checklistsData.map(checklist => {
                    const vehicle = vehiclesData.find(v => v.id === checklist.vehicleId);
                    return { ...checklist, vehicle };
                });

                setData({ checklists: checklistsWithVehicleData, vehicles: vehiclesData });

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const { checklists, vehicles } = data;

    const getWeeklyAverage = () => {
        const lastWeek = checklists.filter(checklist => {
            if (!checklist.departureTimestamp) return false;
            const checkDate = checklist.departureTimestamp.toDate();
            const weekAgo = subDays(new Date(), 7);
            return checkDate >= weekAgo;
        });
        
        if (lastWeek.length === 0) return 0;
        
        const completedLastWeek = lastWeek.filter(c => c.status === 'completed' || c.status === 'problem');
        if(completedLastWeek.length === 0) return 0;

        const totalItems = completedLastWeek.reduce((sum, check) => sum + Object.keys(check.checklistItems).length, 0);
        const okItems = completedLastWeek.reduce((sum, check) => {
            return sum + Object.values(check.checklistItems).filter(status => status === 'ok').length;
        }, 0);

        return totalItems === 0 ? 100 : Math.round((okItems / totalItems) * 100);
    };

    const getConsecutiveDays = () => {
        let consecutive = 0;
        const today = new Date();
        const checklistDates = new Set(checklists.map(c => c.date));
        
        for (let i = 0; i < 30; i++) {
            const checkDate = format(subDays(today, i), "yyyy-MM-dd");
            if (checklistDates.has(checkDate)) {
                consecutive++;
            } else {
                break;
            }
        }
        
        return consecutive;
    };
    
    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Página Inicial
                        </h1>
                        <p className="text-slate-500 text-lg mt-1 font-medium">
                            Bem-vindo! Veja um resumo detalhado das atividades da frota.
                        </p>
                    </div>
                    
                    <Link href="/checklist" className="w-full md:w-auto">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="w-5 h-5 mr-2" />
                            Fazer Checklist
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total de Inspeções"
                        value={String(checklists.length)}
                        icon={ClipboardCheck}
                        gradient="from-blue-500 to-indigo-600"
                        description="Checklists realizados"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Média Semanal"
                        value={`${getWeeklyAverage()}%`}
                        icon={TrendingUp}
                        gradient="from-emerald-500 to-teal-600"
                        description="Pontuação de conformidade"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Dias Consecutivos"
                        value={String(getConsecutiveDays())}
                        icon={Calendar}
                        gradient="from-purple-500 to-pink-600"
                        description="Engajamento contínuo"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Frota Ativa"
                        value={String(vehicles.length)}
                        icon={Car}
                        gradient="from-orange-500 to-amber-600"
                        description="Veículos cadastrados"
                        isLoading={isLoading}
                    />
                </div>

                <div className="w-full">
                    <RecentChecklists 
                        checklists={checklists}
                        vehicles={vehicles}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
