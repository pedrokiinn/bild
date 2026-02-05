
'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyChecklist, Vehicle, FuelType, Refueling } from "@/types";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ArrivalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (arrivalMileage: number, refuelings: Refueling[]) => Promise<void>;
  checklist: DailyChecklist & { vehicle?: Vehicle };
}

type RefuelingInput = {
    pricePerLiter: string;
    liters: string;
    type: FuelType | '';
}

export function ArrivalDialog({ isOpen, onClose, onSave, checklist }: ArrivalDialogProps) {
  const [arrivalMileage, setArrivalMileage] = useState("");
  const [refuelings, setRefuelings] = useState<RefuelingInput[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const isEditing = !!checklist?.arrivalMileage;

  useEffect(() => {
    if (isOpen && checklist) {
      setArrivalMileage(checklist.arrivalMileage?.toString() || "");
      
      if (checklist.refuelings && checklist.refuelings.length > 0) {
        setRefuelings(checklist.refuelings.map(r => {
            const pricePerLiter = (r.liters > 0) ? (r.amount / r.liters).toFixed(2) : '0';
            return {
                pricePerLiter: String(pricePerLiter).replace('.',','),
                liters: String(r.liters),
                type: r.type,
            }
        }));
      } else {
        setRefuelings([]);
      }

      setError("");
      setIsSaving(false);
    }
  }, [isOpen, checklist]);
  
  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setArrivalMileage(value);
      if (Number(value) < checklist.departureMileage) {
        setError(`A quilometragem de chegada não pode ser menor que a de saída (${checklist.departureMileage} km).`);
      } else {
        setError("");
      }
    }
  };

  const handleAddRefueling = () => {
    setRefuelings([...refuelings, { pricePerLiter: '', liters: '', type: '' }]);
  };

  const handleRemoveRefueling = (index: number) => {
    const newRefuelings = refuelings.filter((_, i) => i !== index);
    setRefuelings(newRefuelings);
  };

  const handleRefuelingChange = (index: number, field: keyof RefuelingInput, value: string) => {
    const newRefuelings = [...refuelings];
    newRefuelings[index][field] = value as any; // any to bypass strict type on FuelType | ''
    setRefuelings(newRefuelings);
  };
  
  const handleSave = async () => {
    if (error || (!isEditing && !arrivalMileage)) {
        setError("A quilometragem de chegada é obrigatória.");
        return;
    }

    const numericRefuelings: Refueling[] = [];
    for (const r of refuelings) {
        if (!r.pricePerLiter && !r.liters && !r.type) {
            continue; // Skip empty entries
        }

        const price = parseFloat(r.pricePerLiter.replace(',', '.')) || 0;
        const liters = parseFloat(r.liters.replace(',', '.')) || 0;

        if (!price || !liters || !r.type) {
             setError("Preencha todos os campos de cada abastecimento ou remova os abastecimentos incompletos.");
             return;
        }
        numericRefuelings.push({
            amount: price * liters,
            liters: liters,
            type: r.type,
        });
    }

    setError("");

    setIsSaving(true);
    try {
      await onSave(Number(arrivalMileage), numericRefuelings);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Abastecimento' : 'Registrar Chegada'}</DialogTitle>
          <DialogDescription>
             {isEditing 
                ? 'Adicione ou edite as informações de abastecimento desta viagem.' 
                : 'Confirme a quilometragem e o abastecimento (se houver) na chegada do veículo.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle" className="text-right">
                Veículo
              </Label>
              <div id="vehicle" className="col-span-3 font-semibold">
                {checklist.vehicle?.brand} {checklist.vehicle?.model} ({checklist.vehicle?.license_plate})
              </div>
            </div>
            {!isEditing && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="arrival-time" className="text-right">
                  Horário
                </Label>
                <Input id="arrival-time" value={new Date().toLocaleTimeString('pt-BR')} disabled className="col-span-3" />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrival-mileage" className="text-right">
                KM Chegada
              </Label>
              <Input
                id="arrival-mileage"
                value={arrivalMileage}
                onChange={handleMileageChange}
                className="col-span-3"
                placeholder={`Maior que ${checklist.departureMileage}`}
                disabled={isSaving || isEditing}
              />
            </div>
          </div>
          
          <div className="space-y-4 rounded-md border p-4">
             <div className="flex items-center justify-between">
                <Label className="font-semibold text-slate-900">
                    Abastecimentos
                </Label>
                <Button variant="outline" size="sm" onClick={handleAddRefueling} disabled={isSaving}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
            </div>
            
            {refuelings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum abastecimento registrado.</p>
            )}

            {refuelings.map((refueling, index) => {
                const price = parseFloat(refueling.pricePerLiter.replace(',', '.')) || 0;
                const liters = parseFloat(refueling.liters.replace(',', '.')) || 0;
                const total = price * liters;

                return (
                    <div key={index} className="space-y-4 p-4 border rounded-lg relative bg-slate-50/50">
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:bg-red-100 hover:text-destructive" onClick={() => handleRemoveRefueling(index)}>
                            <Trash2 className="w-4 h-4"/>
                        </Button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`refueling-price-${index}`}>Preço / Litro (R$)</Label>
                                <Input id={`refueling-price-${index}`} value={refueling.pricePerLiter} onChange={(e) => handleRefuelingChange(index, 'pricePerLiter', e.target.value.replace(/[^0-9,.]/g, ''))} placeholder="Ex: 5,50" type="text" inputMode="decimal" disabled={isSaving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`refueling-liters-${index}`}>Litros</Label>
                                <Input id={`refueling-liters-${index}`} value={refueling.liters} onChange={(e) => handleRefuelingChange(index, 'liters', e.target.value.replace(/[^0-9,.]/g, ''))} placeholder="Ex: 30,5" type="text" inputMode="decimal" disabled={isSaving} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`fuel-type-${index}`}>Tipo de Combustível</Label>
                                <Select value={refueling.type} onValueChange={(value: FuelType) => handleRefuelingChange(index, 'type', value)} disabled={isSaving}>
                                <SelectTrigger id={`fuel-type-${index}`}>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gasolina">Gasolina</SelectItem>
                                    <SelectItem value="diesel">Óleo Diesel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="mt-4 p-3 bg-slate-100 rounded-md text-right">
                            <span className="text-sm text-muted-foreground">Valor Total: </span>
                            <span className="font-bold text-lg text-slate-800">
                                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                );
            })}
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || (!isEditing && !arrivalMileage)}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
