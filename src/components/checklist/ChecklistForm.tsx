
'use client';
import { useState, useEffect } from 'react';
import type { Vehicle, DailyChecklist } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Car, Check, Loader2, X, ArrowLeft } from 'lucide-react';
import { format, getHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { saveChecklist } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { diagnoseVehicleProblems } from '@/ai/flows/diagnose-vehicle-problems';
import type { ChecklistItemOption } from '@/types';
import ChecklistItem from './ChecklistItem';

interface ChecklistFormProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle;
  checklistItems: ChecklistItemOption[];
  onBack: () => void;
}

export default function ChecklistForm({ vehicles, selectedVehicle, checklistItems, onBack }: ChecklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [driverName, setDriverName] = useState('');
  const [departureMileage, setDepartureMileage] = useState<string>(selectedVehicle?.mileage?.toString() || '');
  const [itemStates, setItemStates] = useState<Record<string, 'ok' | 'problem'>>({});
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDepartureMileage(selectedVehicle?.mileage?.toString() || '');
    // Set initial values for checklist items
    const initialItemValues: Record<string, string> = {};
    const initialItemStates: Record<string, 'ok' | 'problem'> = {};
    checklistItems.forEach(item => {
        const defaultValue = item.options[0].value;
        initialItemValues[item.key] = defaultValue;
        initialItemStates[item.title] = item.isProblem(defaultValue) ? 'problem' : 'ok';
    });
    setItemValues(initialItemValues);
    setItemStates(initialItemStates);
  }, [selectedVehicle, checklistItems]);

  const isAfterCutoff = getHours(new Date()) >= 22;

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setDepartureMileage(value);
    }
  };

  const handleItemChange = (itemKey: string, value: string) => {
    const itemConfig = checklistItems.find(item => item.key === itemKey);
    if(itemConfig) {
        setItemStates(prev => ({...prev, [itemConfig.title]: itemConfig.isProblem(value) ? 'problem' : 'ok'}));
        setItemValues(prev => ({...prev, [itemKey]: value}));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle?.id || !driverName || !departureMileage) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o veículo, nome do motorista e quilometragem.',
        variant: 'destructive',
      });
      return;
    }
    if(Number(departureMileage) < (selectedVehicle?.mileage ?? 0)) {
        toast({
            title: 'Quilometragem inválida',
            description: `A quilometragem de saída (${departureMileage} km) não pode ser menor que a última registrada (${selectedVehicle?.mileage} km).`,
            variant: 'destructive',
        });
        return;
    }
    
    setIsSaving(true);
    try {
        const hasProblem = Object.values(itemStates).includes('problem');
        const problemNotes = Object.entries(itemStates)
            .filter(([, state]) => state === 'problem')
            .map(([item]) => item)
            .join(', ');

        let fullNotes = notes;
        if(problemNotes){
            fullNotes = `Itens com problema: ${problemNotes}. ${notes}`;
        }

        let aiDiagnosisResult = '';
        if (hasProblem) {
            const diagnosis = await diagnoseVehicleProblems({
                vehicleInfo: `${selectedVehicle?.brand} ${selectedVehicle?.model} ${selectedVehicle?.year}`,
                checklistResponses: fullNotes,
            });
            aiDiagnosisResult = diagnosis.potentialProblems;
        }

        const checklistItemsToSave = checklistItems.reduce((acc, item) => {
            acc[item.title] = itemStates[item.title] || 'ok';
            return acc;
        }, {} as Record<string, 'ok' | 'problem'>);


        const newChecklist: Omit<DailyChecklist, 'id'> = {
            vehicleId: selectedVehicle.id,
            driverName,
            departureTimestamp: new Date().getTime(),
            departureMileage: Number(departureMileage),
            checklistItems: checklistItemsToSave,
            notes: notes,
            status: hasProblem ? 'problem' : 'pending_arrival',
            date: format(new Date(), 'yyyy-MM-dd'),
            aiDiagnosis: aiDiagnosisResult,
        };

        await saveChecklist(newChecklist);

        toast({
            title: 'Checklist salvo!',
            description: 'O checklist de saída foi registrado com sucesso.',
        });
        router.push('/history');
    } catch (error) {
        toast({
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar o checklist. Tente novamente.',
            variant: 'destructive',
        });
        setIsSaving(false);
    }
  };

  if (isAfterCutoff) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Prazo Excedido</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fora do horário</AlertTitle>
                <AlertDescription>
                    Não é possível criar novos checklists após as 22:00.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registro de Saída</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Trocar Veículo
            </Button>
          </div>
          <CardDescription>
            Veículo: <span className="font-semibold text-primary">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.license_plate})</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driverName">Nome do Motorista</Label>
              <Input id="driverName" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Seu nome completo" disabled={isSaving}/>
            </div>
            <div>
              <Label htmlFor="departureMileage">Quilometragem de Saída (km)</Label>
              <Input id="departureMileage" value={departureMileage} onChange={handleMileageChange} placeholder="Ex: 15000" disabled={isSaving} />
            </div>
          </div>
          <div>
            <Label>Itens do Checklist</Label>
            <div className="space-y-8 rounded-md border p-6">
              {checklistItems.map(item => (
                <ChecklistItem
                  key={item.key}
                  item={item}
                  value={itemValues[item.key]}
                  onChange={(value) => handleItemChange(item.key, value)}
                  disabled={isSaving}
                />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação adicional? Descreva aqui." disabled={isSaving}/>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full md:w-auto ml-auto" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Salvando...' : 'Registrar Saída'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
