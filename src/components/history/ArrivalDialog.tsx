
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
import { DailyChecklist, Vehicle, FuelType } from "@/types";
import { Loader2 } from "lucide-react";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ArrivalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (arrivalMileage: number, fuelingData?: { amount: number; liters: number; type: FuelType }) => Promise<void>;
  checklist: DailyChecklist & { vehicle?: Vehicle };
}

export function ArrivalDialog({ isOpen, onClose, onSave, checklist }: ArrivalDialogProps) {
  const [arrivalMileage, setArrivalMileage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fueling state
  const [wasRefueled, setWasRefueled] = useState(false);
  const [refuelingAmount, setRefuelingAmount] = useState('');
  const [refuelingLiters, setRefuelingLiters] = useState('');
  const [fuelType, setFuelType] = useState<FuelType | ''>('');


  useEffect(() => {
    if (isOpen) {
      setArrivalMileage("");
      setError("");
      setIsSaving(false);
      setWasRefueled(false);
      setRefuelingAmount('');
      setRefuelingLiters('');
      setFuelType('');
    }
  }, [isOpen]);
  
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
  
  const handleSave = async () => {
    if (error || !arrivalMileage) {
        return;
    }

    let fuelingData: { amount: number; liters: number; type: FuelType } | undefined = undefined;
    if (wasRefueled) {
        if (!refuelingAmount || !refuelingLiters || !fuelType) {
            setError("Preencha todos os campos de abastecimento ou desative a opção.");
            return;
        }
        fuelingData = {
            amount: parseFloat(refuelingAmount.replace(',', '.')),
            liters: parseFloat(refuelingLiters.replace(',', '.')),
            type: fuelType
        };
    }
    setError("");

    setIsSaving(true);
    try {
      await onSave(Number(arrivalMileage), fuelingData);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Chegada</DialogTitle>
          <DialogDescription>
            Confirme a quilometragem e o abastecimento (se houver) na chegada do veículo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle" className="text-right">
                Veículo
              </Label>
              <div id="vehicle" className="col-span-3 font-semibold">
                {checklist.vehicle?.brand} {checklist.vehicle?.model} ({checklist.vehicle?.license_plate})
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arrival-time" className="text-right">
                Horário
              </Label>
              <Input id="arrival-time" value={new Date().toLocaleTimeString('pt-BR')} disabled className="col-span-3" />
            </div>
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
              />
            </div>
          </div>
          
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="was-refueled" className="font-semibold text-slate-900">
                    Houve abastecimento na chegada?
                </Label>
                <Switch
                    id="was-refueled"
                    checked={wasRefueled}
                    onCheckedChange={setWasRefueled}
                    disabled={isSaving}
                />
            </div>

            {wasRefueled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                   <div className="space-y-2">
                       <Label htmlFor="refueling-amount">Valor (R$)</Label>
                       <Input id="refueling-amount" value={refuelingAmount} onChange={(e) => setRefuelingAmount(e.target.value.replace(/[^0-9,.]/g, ''))} placeholder="Ex: 150,00" type="text" inputMode="decimal" disabled={isSaving} />
                   </div>
                   <div className="space-y-2">
                       <Label htmlFor="refueling-liters">Litros</Label>
                       <Input id="refueling-liters" value={refuelingLiters} onChange={(e) => setRefuelingLiters(e.target.value.replace(/[^0-9,.]/g, ''))} placeholder="Ex: 30,5" type="text" inputMode="decimal" disabled={isSaving} />
                   </div>
                   <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="fuel-type">Tipo de Combustível</Label>
                         <Select value={fuelType} onValueChange={(value: FuelType) => setFuelType(value)} disabled={isSaving}>
                            <SelectTrigger id="fuel-type">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gasolina">Gasolina</SelectItem>
                                <SelectItem value="etanol">Etanol</SelectItem>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="gnv">GNV</SelectItem>
                            </SelectContent>
                        </Select>
                   </div>
                </div>
            )}
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!!error && !wasRefueled || !arrivalMileage || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Salvando..." : "Salvar Chegada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
