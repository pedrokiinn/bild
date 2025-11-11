
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
import { DailyChecklist, Vehicle } from "@/types";
import { Loader2 } from "lucide-react";

interface ArrivalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (arrivalMileage: number) => Promise<void>;
  checklist: DailyChecklist & { vehicle?: Vehicle };
}

export function ArrivalDialog({ isOpen, onClose, onSave, checklist }: ArrivalDialogProps) {
  const [arrivalMileage, setArrivalMileage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setArrivalMileage("");
      setError("");
      setIsSaving(false);
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
    setIsSaving(true);
    try {
      await onSave(Number(arrivalMileage));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Chegada</DialogTitle>
          <DialogDescription>
            Confirme o horário e a quilometragem de chegada do veículo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
          {error && <p className="col-span-4 text-center text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!!error || !arrivalMileage || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Salvando..." : "Salvar Chegada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
