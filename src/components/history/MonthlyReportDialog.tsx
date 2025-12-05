
'use client';
import { useState, useMemo } from 'react';
import { DailyChecklist, Vehicle } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car, Search, Printer, ArrowLeft, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { checklistItemsOptions } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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


const generateMonthlyPDF = (vehicle: Vehicle, monthlyChecklists: (DailyChecklist & { vehicle?: Vehicle })[], selectedDate: Date) => {
    if (!vehicle || monthlyChecklists.length === 0) return;

    const monthName = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    const photoLabels: Record<string, string> = {
      front: "Frente",
      rear: "Traseira",
      left: "Lateral Esquerda",
      right: "Lateral Direita"
    };

    const checklistsHTML = monthlyChecklists.map(c => {
        const problemItemsHTML = Object.entries(c.checklistValues ?? {})
            .filter(([key, value]) => checklistItemsOptions.find(opt => opt.key === key)?.isProblem(value))
            .map(([key, value]) => `<li>${checklistItemsOptions.find(opt => opt.key === key)?.title}: <strong>${getOptionLabel(key, value)}</strong></li>`)
            .join('');
        
        const allItemsHTML = checklistItemsOptions.map(itemConfig => {
            const value = c.checklistValues?.[itemConfig.key];
            const isProblem = value ? itemConfig.isProblem(value) : false;
            return `
                <div class="list-item">
                    <span>${itemConfig.title}</span>
                    <span class="${isProblem ? 'problem-text' : 'ok-text'}">${isProblem ? 'PROBLEMA' : 'OK'}</span>
                </div>
            `;
        }).join('');

        const photosHTML = c.photos && Object.keys(c.photos).length > 0 ? `
            <div class="section-block">
                <div class="section-title">Fotos</div>
                <div class="photos-grid">
                    ${Object.entries(c.photos).map(([key, url]) => `
                        <div class="photo-item">
                            <img src="${url}" alt="${photoLabels[key] || key}" />
                            <span>${photoLabels[key] || key}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        return `
            <div class="checklist-entry">
                <div class="section-block">
                    <div class="section-title">Viagem</div>
                    <div class="info-grid">
                        <div class="info-item"><span>Motorista:</span> <span>${c.driverName}</span></div>
                        <div class="info-item"><span>Data:</span> <span>${format(c.departureTimestamp.toDate(), "dd/MM/yyyy")}</span></div>
                        <div class="info-item"><span>Saída:</span> <span>${format(c.departureTimestamp.toDate(), "HH:mm")}</span></div>
                        <div class="info-item"><span>Chegada:</span> <span>${c.arrivalTimestamp ? format(c.arrivalTimestamp.toDate(), "HH:mm") : 'Em Rota'}</span></div>
                        <div class="info-item"><span>KM Saída:</span> <span>${c.departureMileage?.toLocaleString('pt-BR')} km</span></div>
                        <div class="info-item"><span>KM Chegada:</span> <span>${c.arrivalMileage?.toLocaleString('pt-BR') || 'N/A'}</span></div>
                    </div>
                </div>

                ${problemItemsHTML.length > 0 ? `
                <div class="section-block">
                    <div class="section-title">Problemas Encontrados</div>
                    <ul class="problems-list">${problemItemsHTML}</ul>
                </div>` : ''}

                <div class="section-block">
                    <div class="section-title">Itens Verificados</div>
                    ${allItemsHTML}
                </div>
                
                ${c.notes ? `
                <div class="section-block">
                    <div class="section-title">Observações do Motorista</div>
                    <div class="notes">${c.notes}</div>
                </div>
                ` : ''}

                ${photosHTML}
            </div>
        `;
    }).join('<div class="page-break"></div>');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Mensal - ${vehicle.brand} ${vehicle.model}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; color: #333; }
                .container { max-width: 800px; margin: auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .title { font-size: 24px; font-weight: bold; color: #333; }
                .subtitle { font-size: 16px; color: #555; }
                .vehicle-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                .checklist-entry { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .section-block { margin-bottom: 20px; }
                .section-title { font-size: 14px; font-weight: 600; color: #1e3a8a; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 13px; }
                .info-item { display: flex; justify-content: space-between; }
                .info-item span:first-child { color: #6b7280; }
                .info-item span:last-child { font-weight: 600; }
                .problems-list { list-style-type: none; padding-left: 0; margin: 0; }
                .problems-list li { background: #fee2e2; color: #b91c1c; padding: 6px 10px; border-radius: 4px; margin-bottom: 5px; font-size: 13px; }
                .list-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
                .list-item:last-child { border-bottom: none; }
                .ok-text { color: #16a34a; font-weight: bold; }
                .problem-text { color: #dc2626; font-weight: bold; }
                .notes { background: #fefce8; border-left: 3px solid #facc15; padding: 10px; border-radius: 4px; font-size: 13px; }
                .photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .photo-item { text-align: center; }
                .photo-item img { width: 100%; border-radius: 6px; border: 1px solid #e5e7eb; }
                .photo-item span { font-size: 12px; color: #6b7280; margin-top: 5px; display: block; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
                .page-break { page-break-before: always; }
                @media print {
                  .page-break { page-break-before: always; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="title">Relatório Mensal de Inspeções</h1>
                    <h2 class="subtitle">${monthName}</h2>
                </div>
                <div class="vehicle-info">
                    <h3>${vehicle.brand} ${vehicle.model}</h3>
                    <p>Placa: ${vehicle.license_plate} | Ano: ${vehicle.year}</p>
                </div>
                ${checklistsHTML}
                <div class="footer">Relatório gerado por G3 Checklist em ${format(new Date(), "dd/MM/yyyy")}</div>
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
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleClose = () => {
        setSelectedVehicle(null);
        setSelectedDate(new Date());
        onClose();
    };

    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM', { locale: ptBR }) }));
    const currentYear = getYear(new Date());
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const startOfSelectedMonth = startOfMonth(selectedDate);
    const endOfSelectedMonth = endOfMonth(selectedDate);

    const monthlyChecklists = selectedVehicle 
        ? checklists.filter(c => 
            c.vehicleId === selectedVehicle.id &&
            isWithinInterval(c.departureTimestamp.toDate(), { start: startOfSelectedMonth, end: endOfSelectedMonth })
          ).sort((a,b) => b.departureTimestamp.toMillis() - a.departureTimestamp.toMillis())
        : [];

    const totalProblems = monthlyChecklists.reduce((acc, c) => {
        return acc + (c.status === 'problem' ? 1 : 0);
    }, 0);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-3xl" onInteractOutside={handleClose}>
                {!selectedVehicle ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Gerar Relatório Mensal</DialogTitle>
                            <DialogDescription>
                                Selecione o período e o veículo para gerar o relatório de inspeções.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium">Mês</label>
                                    <Select
                                        value={String(getMonth(selectedDate))}
                                        onValueChange={(value) => setSelectedDate(prev => setMonth(prev, Number(value)))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium">Ano</label>
                                    <Select
                                        value={String(getYear(selectedDate))}
                                        onValueChange={(value) => setSelectedDate(prev => setYear(prev, Number(value)))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                 <h3 className="text-base font-medium mb-2">Selecione o Veículo</h3>
                                 {vehicles.length > 0 ? (
                                    <ScrollArea className="h-[40vh]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
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
                                    </ScrollArea>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Search className="w-12 h-12 mx-auto mb-4"/>
                                        <p>Nenhum veículo cadastrado para gerar relatórios.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                     <>
                        <DialogHeader>
                             <div className="flex items-center justify-between">
                                 <DialogTitle className="text-xl">
                                    Relatório de {format(selectedDate, "MMMM", { locale: ptBR })} - {selectedVehicle.brand} {selectedVehicle.model}
                                 </DialogTitle>
                                 <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}>
                                     <ArrowLeft className="w-4 h-4 mr-2" />
                                     Voltar
                                 </Button>
                             </div>
                            <DialogDescription>
                                Um resumo de todas as inspeções realizadas no período selecionado para o veículo.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                           <div className="flex flex-col">
                               <span className="text-sm font-semibold">{monthlyChecklists.length} inspeções no mês</span>
                               <span className={`text-sm font-semibold ${totalProblems > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{totalProblems} com problemas</span>
                           </div>
                           <Button onClick={() => generateMonthlyPDF(selectedVehicle, monthlyChecklists, selectedDate)} disabled={monthlyChecklists.length === 0}>
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
                                    <p>Nenhum checklist encontrado para este veículo no período selecionado.</p>
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
