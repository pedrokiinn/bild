import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  isLoading?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-6" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-24" />
            </CardContent>
        </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
