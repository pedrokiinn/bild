
'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { checklistItemsOptions } from '@/lib/data';

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

        const itemsHTML = Object.entries(checklist.checklistItems)
            .map(([title, status]) => {
                const itemKey = checklistItemsOptions.find(opt => opt.title === title)?.key;
                const value = itemKey ? checklist.checklistValues?.[itemKey] : undefined;
                const valueLabel = itemKey && value ? getOptionLabel(itemKey, value) : status;
                
                return `
                    <div class="checklist-item ${status === 'problem' ? 'problem' : ''}">
                        <div class="item-title">${title}</div>
                        <div class="item-value">${status === 'ok' ? `✅ ${valueLabel}` : `❌ ${valueLabel}`}</div>
                    </div>
                `
            }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Checklist Diário - ${new Date(checklist.departureTimestamp).toLocaleDateString('pt-BR')}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                    body { font-family: 'Inter', sans-serif; margin: 20px; color: #333; background-color: #f9fafb; }
                    .container { max-width: 800px; margin: auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
                    .logo { font-size: 28px; font-weight: 700; color: #10b981; margin-bottom: 10px; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .info-section { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                    .info-title { font-weight: 700; color: #475569; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; font-size: 16px; }
                    .info-item { margin: 8px 0; font-size: 14px; }
                    .info-label { font-weight: 600; color: #64748b; }
                    .checklist-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 30px; }
                    .checklist-item { background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981; display: flex; justify-content: space-between; align-items: center;}
                    .checklist-item.problem { border-left-color: #be123c; }
                    .item-title { font-weight: 600; color: #334155; }
                    .item-value { color: #15803d; font-weight: 600;}
                    .checklist-item.problem .item-value { color: #be123c; }
                    .notes-section { background: #fffbeb; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #fde68a; }
                    .notes-title { font-weight: 700; color: #b45309; margin-bottom: 10px; }
                    .ai-diag { background: #e8f4fd; padding: 15px; border-radius: 5px; margin-top: 10px; border-left: 4px solid #3498db; }
                    .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .container { box-shadow: none; border: 1px solid #e2e8f0; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🚗 FleetCheck Pro</div>
                        <h2>Relatório de Inspeção Veicular</h2>
                        <p>Data: ${format(new Date(checklist.departureTimestamp), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    </div>

                    <div class="info-grid">
                        <div class="info-section">
                            <div class="info-title">Informações do Veículo</div>
                            <div class="info-item"><span class="info-label">Veículo:</span> ${vehicle?.brand} ${vehicle?.model}</div>
                            <div class="info-item"><span class="info-label">Placa:</span> ${vehicle?.license_plate}</div>
                            <div class="info-item"><span class="info-label">Ano:</span> ${vehicle?.year}</div>
                        </div>
                        <div class="info-section">
                            <div class="info-title">Detalhes da Viagem</div>
                            <div class="info-item"><span class="info-label">Motorista:</span> ${checklist.driverName}</div>
                            <div class="info-item"><span class="info-label">KM Saída:</span> ${checklist.departureMileage?.toLocaleString('pt-BR')}</div>
                            <div class="info-item"><span class="info-label">KM Chegada:</span> ${checklist.arrivalMileage?.toLocaleString('pt-BR') || 'N/A'}</div>
                        </div>
                    </div>

                    <h3 style="color: #334155; margin-bottom: 15px;">Itens Verificados</h3>
                    <div class="checklist-grid">${itemsHTML}</div>

                    ${checklist.notes ? `
                    <div class="notes-section">
                        <div class="notes-title">Observações do Motorista</div>
                        <p>${checklist.notes}</p>
                    </div>
                    ` : ''}
                    
                    ${checklist.aiDiagnosis ? `
                    <div class="ai-diag">
                        <h3>Diagnóstico (IA)</h3>
                        <p>${checklist.aiDiagnosis}</p>
                    </div>
                    ` : ''}
                    
                    <div class="footer">
                        Relatório gerado por FleetCheck Pro em ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    const handleGeneratePDF = () => {
        const htmlContent = generateHTMLForPDF();
        if(!htmlContent) return;
        
        const win = window.open('', '', 'height=700,width=900');
        if (win) {
            win.document.write(htmlContent);
            win.document.close();
            setTimeout(() => {
                win.print();
            }, 500);
        }
    };

    return (
        <Button variant="ghost" size="icon" onClick={handleGeneratePDF}>
            <Printer className="w-4 h-4" />
        </Button>
    );
};
