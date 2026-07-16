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
import { DailyChecklist, Vehicle, User } from "@/types";
import { Loader2 } from "lucide-react";
import { useUser } from "@/context/UserContext";

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
  const user = useUser();
  
  const isEditing = !!checklist?.arrivalMileage;

  useEffect(() => {
    if (isOpen && checklist) {
      setArrivalMileage(checklist.arrivalMileage?.toString() || "");
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

  const handleSave = async () => {
    if (error || (!isEditing && !arrivalMileage)) {
        setError("A quilometragem de chegada é obrigatória.");
        return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave(Number(arrivalMileage));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Chegada' : 'Registrar Chegada'}</DialogTitle>
          <DialogDescription>
             {isEditing 
                ? 'Edite as informações de chegada desta viagem.' 
                : 'Confirme a quilometragem na chegada do veículo.'
            }
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
                disabled={isSaving || (isEditing && user?.role !== 'admin')}
              />
            </div>
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving || !!error || (!isEditing && !arrivalMileage)}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
