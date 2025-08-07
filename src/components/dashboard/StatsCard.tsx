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
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                 <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="text-right">
                            <Skeleton className="h-8 w-16 mb-2" />
                        </div>
                    </div>
                    <div>
                        <Skeleton className="h-5 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-1/2" />
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
        >
            <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
                
                <CardContent className="p-6 relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-2xl md:text-3xl font-bold text-slate-900">
                                {value}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                        <p className="text-sm text-slate-600">{description}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
