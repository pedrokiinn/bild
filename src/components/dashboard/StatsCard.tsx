import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  gradient?: string;
  isLoading?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, description, gradient, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-32 mt-2" />
      </Card>
    )
  }
  
  return (
    <Card className={cn("text-white shadow-lg border-0", gradient)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{value}</div>
        <p className="text-xs text-white/80">{description}</p>
      </CardContent>
    </Card>
  );
}
