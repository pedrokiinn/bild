'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { ArrowRight } from 'lucide-react';

interface RecentChecklistsProps {
  checklists: (DailyChecklist & { vehicle?: Vehicle })[];
  isLoading: boolean;
}

const statusMap: Record<DailyChecklist['status'], { text: string, variant: 'default' | 'destructive' | 'secondary' }> = {
  completed: { text: 'Concluído', variant: 'default' },
  problem: { text: 'Problema', variant: 'destructive' },
  pending_arrival: { text: 'Pendente', variant: 'secondary' },
};

export default function RecentChecklists({ checklists, isLoading }: RecentChecklistsProps) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Checklists Recentes</CardTitle>
        <CardDescription>Veja os últimos 5 checklists realizados.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead className="hidden sm:table-cell">Motorista</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : checklists.length > 0 ? (
              checklists.slice(0, 5).map((checklist) => (
                <TableRow key={checklist.id}>
                  <TableCell>
                    <div className="font-medium">{checklist.vehicle?.brand} {checklist.vehicle?.model}</div>
                    <div className="text-sm text-muted-foreground">{checklist.vehicle?.license_plate}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{checklist.driverName}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDistanceToNow(new Date(checklist.departureTimestamp), { addSuffix: true, locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[checklist.status].variant}>
                      {statusMap[checklist.status].text}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        Nenhum checklist encontrado.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        {!isLoading && checklists.length > 0 && (
          <div className="mt-4 text-right">
             <Link href="/history" className="text-sm font-medium text-primary hover:underline flex items-center justify-end gap-1">
                Ver Histórico Completo
                <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
