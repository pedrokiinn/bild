
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  gradient?: string;
  isLoading?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, gradient, description, isLoading }: StatsCardProps) {
    if (isLoading) {
        return (
            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                 <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </CardContent>
            </Card>
        )
    }
  
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -4 }}
        >
            <Card className="relative overflow-hidden bg-white border-0 shadow-lg shadow-slate-200/50 rounded-2xl transition-all duration-300">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-full transform translate-x-12 -translate-y-12`} />
                
                <CardContent className="p-6 relative">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-current/10`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {value}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{description}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
