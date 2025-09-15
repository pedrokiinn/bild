
'use client';
import { useState } from 'react';
import { DailyChecklist, Vehicle } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car, Search, Printer, ArrowLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { checklistItemsOptions } from '@/lib/data';

interface MonthlyReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  checklists: (DailyChecklist & { vehicle?: Vehicle })[];
}

const getOptionLabel = (itemKey: string, value: string) => {
    const item = checklistItemsOptions.find(i => i.key === itemKey);
    if (!item) return value;
    const option = item.options.find(o => o.value === value);
    return option ? option.label : value;
};


const generateMonthlyPDF = (vehicle: Vehicle, monthlyChecklists: (DailyChecklist & { vehicle?: Vehicle })[]) => {
    if (!vehicle || monthlyChecklists.length === 0) return;

    const monthName = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

    const checklistsHTML = monthlyChecklists.map(c => {
        const problemItems = Object.entries(c.checklistValues ?? {})
            .filter(([key]) => checklistItemsOptions.find(opt => opt.key === key)?.isProblem(c.checklistValues?.[key] || ''))
            .map(([key, value]) => `<li>${checklistItemsOptions.find(opt => opt.key === key)?.title}: <strong>${getOptionLabel(key, value)}</strong></li>`)
            .join('');

        return `
            <div class="checklist-entry">
                <div class="checklist-header">
                    <h4>Checklist de ${format(c.departureTimestamp.toDate(), "dd/MM/yyyy 'às' HH:mm")}</h4>
                    <span>Motorista: ${c.driverName}</span>
                </div>
                ${problemItems.length > 0 ? `<p><strong>Problemas Encontrados:</strong></p><ul class="problems-list">${problemItems}</ul>` : '<p>Nenhum problema encontrado.</p>'}
                ${c.notes ? `<div class="notes"><strong>Observações:</strong> ${c.notes}</div>` : ''}
            </div>
        `;
    }).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Mensal - ${vehicle.brand} ${vehicle.model}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; }
                .container { max-width: 800px; margin: auto; padding: 20px; }
                .title { font-size: 28px; font-weight: bold; color: #333; text-align: center; }
                .subtitle { font-size: 18px; color: #555; text-align: center; margin-bottom: 20px; }
                .vehicle-info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .checklist-entry { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
                .checklist-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
                .problems-list { list-style-type: none; padding-left: 0; }
                .problems-list li { background: #fff5f5; color: #c53030; padding: 5px; border-radius: 4px; margin-bottom: 5px; }
                .notes { background: #fefcbf; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 14px; }
                footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="title">Relatório Mensal de Inspeções</h1>
                <h2 class="subtitle">${monthName}</h2>
                <div class="vehicle-info">
                    <h3>Veículo: ${vehicle.brand} ${vehicle.model}</h3>
                    <p>Placa: ${vehicle.license_plate} | Ano: ${vehicle.year}</p>
                </div>
                ${checklistsHTML}
                <footer>Relatório gerado por CarCheck em ${format(new Date(), "dd/MM/yyyy")}</footer>
            </div>
        </body>
        </html>
    `;

    const win = window.open('', '', 'height=800,width=800');
    if (win) {
        win.document.write(htmlContent);
        win.document.close();
        setTimeout(() => win.print(), 250);
    }
};

export default function MonthlyReportDialog({ isOpen, onClose, vehicles, checklists }: MonthlyReportDialogProps) {
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    const handleClose = () => {
        setSelectedVehicle(null);
        onClose();
    };

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const monthlyChecklists = selectedVehicle 
        ? checklists.filter(c => 
            c.vehicleId === selectedVehicle.id &&
            isWithinInterval(c.departureTimestamp.toDate(), { start: startOfCurrentMonth, end: endOfCurrentMonth })
          ).sort((a,b) => b.departureTimestamp.toMillis() - a.departureTimestamp.toMillis())
        : [];

    const totalProblems = monthlyChecklists.reduce((acc, c) => {
        return acc + (c.status === 'problem' ? 1 : 0);
    }, 0);


    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl" onInteractOutside={handleClose}>
                {!selectedVehicle ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Gerar Relatório Mensal</DialogTitle>
                            <DialogDescription>
                                Selecione um veículo para ver o relatório de inspeções do mês atual.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                             {vehicles.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {vehicles.map(vehicle => (
                                    <Button
                                        key={vehicle.id}
                                        variant="outline"
                                        className="h-auto p-4 flex items-center justify-start gap-4 text-left"
                                        onClick={() => setSelectedVehicle(vehicle)}
                                    >
                                        <Car className="w-5 h-5 text-primary flex-shrink-0"/>
                                        <div>
                                            <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                                            <p className="text-xs text-muted-foreground">{vehicle.license_plate}</p>
                                        </div>
                                    </Button>
                                ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Search className="w-12 h-12 mx-auto mb-4"/>
                                    <p>Nenhum veículo cadastrado para gerar relatórios.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                     <>
                        <DialogHeader>
                             <div className="flex items-center justify-between">
                                 <DialogTitle className="text-xl">
                                    Relatório de {format(now, "MMMM", { locale: ptBR })} - {selectedVehicle.brand} {selectedVehicle.model}
                                 </DialogTitle>
                                 <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}>
                                     <ArrowLeft className="w-4 h-4 mr-2" />
                                     Voltar
                                 </Button>
                             </div>
                            <DialogDescription>
                                Um resumo de todas as inspeções realizadas neste mês para o veículo selecionado.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                           <div className="flex flex-col">
                               <span className="text-sm font-semibold">{monthlyChecklists.length} inspeções no mês</span>
                               <span className={`text-sm font-semibold ${totalProblems > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{totalProblems} com problemas</span>
                           </div>
                           <Button onClick={() => generateMonthlyPDF(selectedVehicle, monthlyChecklists)} disabled={monthlyChecklists.length === 0}>
                               <Printer className="w-4 h-4 mr-2"/>
                               Salvar PDF
                           </Button>
                        </div>
                        <ScrollArea className="h-[50vh]">
                            <div className="space-y-4 pr-4">
                            {monthlyChecklists.length > 0 ? monthlyChecklists.map(c => (
                                <div key={c.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold text-sm">{format(c.departureTimestamp.toDate(), "dd/MM/yyyy 'às' HH:mm")}</p>
                                        <Badge variant={c.status === 'problem' ? 'destructive' : 'secondary'}>
                                            {c.status === 'problem' ? 'Com Problemas' : 'OK'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">Motorista: {c.driverName}</p>
                                    {c.status === 'problem' && c.checklistValues && (
                                        <div className="space-y-1 mt-2">
                                            {Object.entries(c.checklistValues).filter(([key, value]) => checklistItemsOptions.find(i => i.key === key)?.isProblem(value)).map(([key, value]) => {
                                                const itemConfig = checklistItemsOptions.find(i => i.key === key);
                                                return (
                                                    <p key={key} className="text-xs p-1.5 bg-red-50 text-red-800 rounded-md">
                                                        <strong>{itemConfig?.title}:</strong> {getOptionLabel(key, value)}
                                                    </p>
                                                )
                                            })}
                                        </div>
                                    )}
                                    {c.notes && <p className="text-xs mt-2 italic bg-slate-100 p-2 rounded-md">"{c.notes}"</p>}
                                </div>
                            )) : (
                                <div className="text-center py-16 text-muted-foreground">
                                    <Search className="w-12 h-12 mx-auto mb-4"/>
                                    <p>Nenhum checklist encontrado para este veículo no mês atual.</p>
                                </div>
                            )}
                            </div>
                        </ScrollArea>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
