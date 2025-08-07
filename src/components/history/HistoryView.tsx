'use client';
import { useState, useMemo } from 'react';
import type { DailyChecklist, Vehicle } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Printer, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parseISO, isWithinInterval, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrivalDialog } from './ArrivalDialog';
import { useToast } from '@/hooks/use-toast';
import { saveChecklist } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

interface HistoryViewProps {
  initialChecklists: (DailyChecklist & { vehicle?: Vehicle })[];
  vehicles: Vehicle[];
  isLoading: boolean;
}

const statusMap: Record<DailyChecklist['status'], { text: string, variant: 'default' | 'destructive' | 'secondary' }> = {
  completed: { text: 'Concluído', variant: 'default' },
  problem: { text: 'Problema', variant: 'destructive' },
  pending_arrival: { text: 'Pendente', variant: 'secondary' },
};

export default function HistoryView({ initialChecklists, vehicles, isLoading }: HistoryViewProps) {
  const [checklists, setChecklists] = useState(initialChecklists);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedChecklist, setSelectedChecklist] = useState<DailyChecklist & { vehicle?: Vehicle } | null>(null);

  const { toast } = useToast();

  const handleArrivalSave = async (arrivalMileage: number) => {
    if (!selectedChecklist) return;

    const updatedChecklist = {
      ...selectedChecklist,
      arrivalTimestamp: new Date().getTime(),
      arrivalMileage,
      status: selectedChecklist.status === 'problem' ? 'problem' : 'completed'
    };

    try {
      const saved = await saveChecklist(updatedChecklist);
      const updatedChecklists = checklists.map(c => c.id === saved.id ? {...c, ...saved, vehicle: c.vehicle} : c);
      setChecklists(updatedChecklists);
      toast({
        title: "Chegada registrada!",
        description: "A chegada do veículo foi salva com sucesso."
      });
      setSelectedChecklist(null);
    } catch(error) {
       toast({
        title: "Erro ao salvar",
        description: "Não foi possível registrar a chegada.",
        variant: 'destructive'
      });
    }
  };
  
  const filteredChecklists = useMemo(() => {
    const now = new Date();
    let dateFiltered = checklists;

    if (selectedPeriod !== 'all') {
      let interval: Interval;
      if (selectedPeriod === 'last7') {
        interval = { start: subDays(now, 7), end: now };
      } else if (selectedPeriod === 'thisMonth') {
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
      } else { // 'lastMonth'
        const lastMonth = subDays(now, 30);
        interval = { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
      dateFiltered = checklists.filter(c => isWithinInterval(parseISO(c.date), interval));
    }

    const vehicleFiltered = selectedVehicle === 'all'
      ? dateFiltered
      : dateFiltered.filter(c => c.vehicleId === selectedVehicle);

    return vehicleFiltered.filter(c =>
      c.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehicle?.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedVehicle, selectedPeriod, checklists]);

  const isAfterCutoff = getHours(new Date()) >= 22;

  const handlePrint = () => {
    const problemChecklists = filteredChecklists.filter(c => c.status === 'problem');
    if (problemChecklists.length === 0) {
      toast({
        title: "Nenhum problema encontrado",
        description: "Não há relatórios de problemas para imprimir nos filtros selecionados.",
        variant: "destructive"
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Relatório de Problemas</title>');
      printWindow.document.write('<style>body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } h1 { text-align: center; } .ai-diag { background-color: #fffbe6; border-left: 3px solid #facc15; padding: 8px; margin-top: 4px; font-size: 0.9em; }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h1>Relatório de Problemas da Frota</h1>`);
      printWindow.document.write(`<p>Período do relatório: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>`);
      printWindow.document.write('<table>');
      printWindow.document.write('<thead><tr><th>Data</th><th>Veículo</th><th>Placa</th><th>Motorista</th><th>Problemas</th><th>Diagnóstico IA</th></tr></thead>');
      printWindow.document.write('<tbody>');
      problemChecklists.forEach(c => {
        const problems = Object.entries(c.checklistItems)
            .filter(([, status]) => status === 'problem')
            .map(([item]) => item).join(', ');

        printWindow.document.write(`<tr>
          <td>${format(parseISO(c.date), 'dd/MM/yyyy')}</td>
          <td>${c.vehicle?.brand} ${c.vehicle?.model}</td>
          <td>${c.vehicle?.license_plate}</td>
          <td>${c.driverName}</td>
          <td>${problems}<br/><small>${c.notes || ''}</small></td>
          <td>${c.aiDiagnosis ? `<div class="ai-diag">${c.aiDiagnosis}</div>` : 'Nenhum'}</td>
        </tr>`);
      });
      printWindow.document.write('</tbody></table></body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };


  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Checklists</h1>
        <p className="text-muted-foreground">Consulte, filtre e gerencie todos os checklists realizados.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine sua busca por checklists.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por motorista ou placa..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por veículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os veículos</SelectItem>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer data</SelectItem>
                <SelectItem value="last7">Últimos 7 dias</SelectItem>
                <SelectItem value="thisMonth">Este mês</SelectItem>
                <SelectItem value="lastMonth">Mês passado</SelectItem>
              </SelectContent>
            </Select>
             <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Baixar Relatório (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead className="hidden sm:table-cell">Motorista</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden lg:table-cell">Horários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={6}>
                            <Skeleton className="h-8 w-full"/>
                        </TableCell>
                    </TableRow>
                ))
            ) : filteredChecklists.length > 0 ? (
                filteredChecklists.map((c) => (
                    <TableRow key={c.id}>
                        <TableCell>
                            <div className="font-medium">{c.vehicle?.brand} {c.vehicle?.model}</div>
                            <div className="text-sm text-muted-foreground">{c.vehicle?.license_plate}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{c.driverName}</TableCell>
                        <TableCell className="hidden md:table-cell">{format(parseISO(c.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(c.departureTimestamp), 'HH:mm')}
                              {c.arrivalTimestamp ? ` - ${format(new Date(c.arrivalTimestamp), 'HH:mm')}` : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={statusMap[c.status]?.variant || 'default'}>
                                {statusMap[c.status]?.text || 'N/A'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        {c.status === 'pending_arrival' ? (
                            <Button size="sm" onClick={() => setSelectedChecklist(c)} disabled={isAfterCutoff} title={isAfterCutoff ? "Registro de chegada encerrado às 22:00" : ""}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Registrar Chegada
                            </Button>
                        ) : (c.status === 'problem' ? 
                            <AlertTriangle className="h-5 w-5 text-destructive inline-block" /> : 
                            <CheckCircle className="h-5 w-5 text-green-600 inline-block" />
                        )}
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum checklist encontrado para os filtros selecionados.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedChecklist && (
        <ArrivalDialog
          isOpen={!!selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
          onSave={handleArrivalSave}
          checklist={selectedChecklist}
        />
      )}
    </div>
  );
}
