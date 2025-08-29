'use client';

import React, { useState, useEffect } from 'react';
import { DailyChecklist, Vehicle } from '@/types';
import { getChecklists, getVehicles } from '@/lib/data';
import { Car, ClipboardCheck, TrendingUp, AlertCircle, Plus, Calendar } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentChecklists from '@/components/dashboard/RecentChecklists';
import VehicleStatus from '@/components/dashboard/VehicleStatus';
import { subDays, format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function DashboardContent() {
    const [data, setData] = useState<{ checklists: (DailyChecklist & { vehicle?: Vehicle })[], vehicles: Vehicle[] }>({ checklists: [], vehicles: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [todayChecklist, setTodayChecklist] = useState<DailyChecklist | null | undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [checklistsData, vehiclesData] = await Promise.all([getChecklists(), getVehicles()]);
                
                const checklistsWithVehicleData = checklistsData.map(checklist => {
                    const vehicle = vehiclesData.find(v => v.id === checklist.vehicleId);
                    return { ...checklist, vehicle };
                });

                setData({ checklists: checklistsWithVehicleData, vehicles: vehiclesData });

                const today = format(new Date(), 'yyyy-MM-dd');
                const todaysCheck = checklistsWithVehicleData.find(checklist => checklist.date === today);
                setTodayChecklist(todaysCheck);

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const { checklists, vehicles } = data;

    const getWeeklyAverage = () => {
        const lastWeek = checklists.filter(checklist => {
            const checkDate = new Date(checklist.date);
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
    
    const todayChecklistsDone = checklists.filter(c => c.date === format(new Date(), 'yyyy-MM-dd')).length > 0;

    return (
        <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                            Olá! 👋
                        </h1>
                        <p className="text-slate-600 text-base">
                            {todayChecklistsDone
                                ? "Checklist de hoje já realizado!" 
                                : "Ainda há checklists pendentes para hoje."
                            }
                        </p>
                    </div>
                    
                    {!todayChecklistsDone && (
                        <Link href="/checklist" className="w-full md:w-auto">
                            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Fazer Checklist
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                        description="Pontuação média"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Dias Consecutivos"
                        value={String(getConsecutiveDays())}
                        icon={Calendar}
                        gradient="from-purple-500 to-pink-600"
                        description="Sem faltar checklist"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Veículos"
                        value={String(vehicles.length)}
                        icon={Car}
                        gradient="from-orange-500 to-red-600"
                        description="Cadastrados"
                        isLoading={isLoading}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <RecentChecklists 
                            checklists={checklists}
                            vehicles={vehicles}
                            isLoading={isLoading}
                        />
                    </div>

                    <div className="space-y-6">
                        <VehicleStatus 
                            vehicles={vehicles}
                            checklists={checklists}
                            isLoading={isLoading}
                        />
                        
                        {/* Quick Actions */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl border border-white/20">
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Ações Rápidas</h3>
                            <div className="space-y-3">
                                <Link href="/checklist" className="block">
                                    <Button variant="outline" className="w-full justify-start text-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all duration-300">
                                        <ClipboardCheck className="w-4 h-4 mr-3" />
                                        Novo Checklist
                                    </Button>
                                </Link>
                                <Link href="/vehicle" className="block">
                                    <Button variant="outline" className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all duration-300">
                                        <Car className="w-4 h-4 mr-3" />
                                        Gerenciar Veículo
                                    </Button>
                                </Link>
                                <Link href="/history" className="block">
                                    <Button variant="outline" className="w-full justify-start text-sm hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all duration-300">
                                        <Calendar className="w-4 h-4 mr-3" />
                                        Ver Histórico
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
