'use client';
import { DailyChecklist, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

interface PdfGeneratorButtonProps {
    checklist?: DailyChecklist & { vehicle?: Vehicle };
    vehicle?: Vehicle;
}

export default function PdfGeneratorButton({ checklist, vehicle }: PdfGeneratorButtonProps) {
    const handlePrint = () => {
        if (!checklist || !vehicle) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const problemItems = Object.entries(checklist.checklistItems).filter(([, status]) => status === 'problem');
            
            let htmlContent = `
                <html>
                <head>
                    <title>Relatório de Checklist - ${vehicle.brand} ${vehicle.model}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                        h1, h2, h3 { color: #2c3e50; }
                        h1 { text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                        .grid-item { background: #f9f9f9; padding: 15px; border-radius: 5px; }
                        .grid-item strong { display: block; margin-bottom: 5px; color: #555; }
                        .checklist-section { margin-top: 30px; }
                        .checklist-section h3 { border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                        .item { padding: 8px 0; border-bottom: 1px solid #eee; }
                        .item.problem { color: #c0392b; font-weight: bold; }
                        .item.ok { color: #27ae60; }
                        .notes { background: #ecf0f1; padding: 15px; border-radius: 5px; margin-top: 20px; }
                        .ai-diag { background: #e8f4fd; padding: 15px; border-radius: 5px; margin-top: 10px; border-left: 4px solid #3498db; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Relatório de Inspeção de Veículo</h1>
                        <h2>${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})</h2>
                        
                        <div class="grid">
                            <div class="grid-item">
                                <strong>Data:</strong> ${format(new Date(checklist.date), 'dd/MM/yyyy')}
                            </div>
                            <div class="grid-item">
                                <strong>Motorista:</strong> ${checklist.driverName}
                            </div>
                            <div class="grid-item">
                                <strong>KM Saída:</strong> ${checklist.departureMileage.toLocaleString('pt-BR')} km
                            </div>
                            <div class="grid-item">
                                <strong>KM Chegada:</strong> ${checklist.arrivalMileage?.toLocaleString('pt-BR') || 'N/A'} km
                            </div>
                        </div>

                        ${problemItems.length > 0 ? `
                        <div class="checklist-section">
                            <h3>Itens com Problemas</h3>
                            ${problemItems.map(([item]) => `<div class="item problem">${item}</div>`).join('')}
                        </div>
                        ` : ''}

                        <div class="checklist-section">
                            <h3>Todos os Itens Verificados</h3>
                            ${Object.entries(checklist.checklistItems).map(([item, status]) => `<div class="item ${status === 'ok' ? 'ok' : 'problem'}">${item} - ${status.toUpperCase()}</div>`).join('')}
                        </div>

                        ${checklist.notes ? `
                        <div class="notes">
                            <h3>Observações</h3>
                            <p>${checklist.notes}</p>
                        </div>
                        ` : ''}

                        ${checklist.aiDiagnosis ? `
                        <div class="ai-diag">
                            <h3>Diagnóstico (IA)</h3>
                            <p>${checklist.aiDiagnosis}</p>
                        </div>
                        ` : ''}
                    </div>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <Button onClick={handlePrint} size="icon" variant="ghost">
            <Printer className="w-4 h-4" />
        </Button>
    );
}
