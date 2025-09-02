
'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { checklistItemsOptions } from '@/lib/data';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PdfGeneratorButtonProps {
    checklist?: DailyChecklist & { vehicle?: Vehicle };
    vehicle?: Vehicle;
}

const getOptionLabel = (itemKey: string, value: string) => {
    const item = checklistItemsOptions.find(i => i.key === itemKey);
    if (!item) return value;
    const option = item.options.find(o => o.value === value);
    return option ? option.label : value;
};

export default function PdfGeneratorButton({ checklist, vehicle }: PdfGeneratorButtonProps) {
    const generateHTMLForPDF = () => {
        if (!checklist || !vehicle) return "";

        const departureDate = checklist.departureTimestamp.toDate();

        const itemsComProblema = Object.entries(checklist.checklistValues || {})
            .filter(([key]) => {
                const itemConfig = checklistItemsOptions.find(opt => opt.key === key);
                return itemConfig?.isProblem(checklist.checklistValues?.[key] || '');
            })
            .map(([key, value]) => {
                 const itemConfig = checklistItemsOptions.find(opt => opt.key === key);
                 return `
                    <div class="list-item problem">
                       <span>${itemConfig?.title}</span>
                       <span>${getOptionLabel(key, value)}</span>
                    </div>
                `;
            })
            .join('');

        const todosOsItens = checklistItemsOptions
            .map(itemConfig => {
                const value = checklist.checklistValues?.[itemConfig.key];
                const isProblem = value ? itemConfig.isProblem(value) : false;
                 return `
                    <div class="list-item">
                       <span>${itemConfig.title}</span>
                       <span class="${isProblem ? 'problem-text' : 'ok-text'}">${isProblem ? 'PROBLEMA' : 'OK'}</span>
                    </div>
                `;
            })
            .join('');

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Inspeção - ${vehicle.license_plate}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #fff; }
                    .container { max-width: 800px; margin: auto; }
                    .header { padding-bottom: 10px; }
                    .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
                    .subtitle { font-size: 14px; color: #64748b; margin-top: -5px; }
                    .divider { border-bottom: 2px solid #3b82f6; margin-top: 10px; margin-bottom: 20px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    .section { font-size: 14px; }
                    .section-title { font-weight: bold; color: #1e3a8a; margin-bottom: 8px; }
                    .info-item { display: flex; justify-content: space-between; padding: 4px 0; }
                    .info-item span:first-child { color: #4b5563; }
                    .info-item span:last-child { font-weight: bold; }
                    .section-block { margin-top: 20px; }
                    .list-item { display: flex; justify-content: space-between; padding: 8px; border-radius: 4px; margin-bottom: 5px; background-color: #f3f4f6; }
                    .list-item.problem { background-color: #fee2e2; }
                    .ok-text { color: #16a34a; font-weight: bold; }
                    .problem-text { color: #dc2626; font-weight: bold; }
                    .notes { background-color: #fefce8; border: 1px solid #fde047; padding: 10px; border-radius: 4px; margin-top: 20px; font-size: 13px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="title">Relatório de Inspeção Veicular</div>
                        <div class="subtitle">${format(departureDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                    </div>
                    <div class="divider"></div>

                    <div class="grid">
                        <div class="section">
                            <div class="section-title">Veículo</div>
                            <div class="info-item"><span>Marca/Modelo</span> <span>${vehicle.brand} ${vehicle.model}</span></div>
                            <div class="info-item"><span>Placa</span> <span>${vehicle.license_plate}</span></div>
                            <div class="info-item"><span>Ano</span> <span>${vehicle.year}</span></div>
                        </div>
                        <div class="section">
                            <div class="section-title">Viagem</div>
                             <div class="info-item"><span>Motorista</span> <span>${checklist.driverName}</span></div>
                             <div class="info-item"><span>KM Saída</span> <span>${checklist.departureMileage?.toLocaleString('pt-BR')} km</span></div>
                             <div class="info-item"><span>KM Chegada</span> <span>${checklist.arrivalMileage?.toLocaleString('pt-BR') || 'N/A'}</span></div>
                        </div>
                    </div>

                    ${itemsComProblema.length > 0 ? `
                    <div class="section-block">
                        <div class="section-title">Itens com Problemas</div>
                        ${itemsComProblema}
                    </div>
                    ` : ''}

                    <div class="section-block">
                        <div class="section-title">Todos os Itens Verificados</div>
                        ${todosOsItens}
                    </div>

                    ${checklist.notes ? `
                    <div class="section-block">
                         <div class="section-title">Observações do Motorista</div>
                         <div class="notes">${checklist.notes}</div>
                    </div>
                    ` : ''}

                     ${checklist.aiDiagnosis ? `
                    <div class="section-block">
                         <div class="section-title">Diagnóstico (IA)</div>
                         <div class="notes" style="background-color: #eff6ff; border-color: #93c5fd;">${checklist.aiDiagnosis}</div>
                    </div>
                    ` : ''}

                    <div class="footer">
                        Relatório gerado por CarCheck em ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleGeneratePDF = () => {
        const htmlContent = generateHTMLForPDF();
        if(!htmlContent) return;
        
        const win = window.open('', '', 'height=800,width=800');
        if (win) {
            win.document.write(htmlContent);
            win.document.close();
            setTimeout(() => {
                win.print();
            }, 250);
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" onClick={handleGeneratePDF}>
                    <Printer className="w-4 h-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Imprimir / Salvar PDF</p>
            </TooltipContent>
        </Tooltip>
    );
};
