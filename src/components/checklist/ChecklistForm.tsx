'use client';
import { useState } from 'react';
import type { Vehicle, DailyChecklist } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Car, Check, Loader2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getHours } from 'date-ns';
import { useToast } from '@/hooks/use-toast';
import { saveChecklist } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { diagnoseVehicleProblems } from '@/ai/flows/diagnose-vehicle-problems';

interface ChecklistFormProps {
  vehicles: Vehicle[];
  checklistItems: string[];
}

export default function ChecklistForm({ vehicles, checklistItems }: ChecklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [driverName, setDriverName] = useState('');
  const [departureMileage, setDepartureMileage] = useState<string>('');
  const [itemStates, setItemStates] = useState<Record<string, 'ok' | 'problem' | 'na'>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const isAfterCutoff = getHours(new Date()) >= 22;

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setDepartureMileage(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !driverName || !departureMileage) {
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


        const newChecklist: Omit<DailyChecklist, 'id'> = {
            vehicleId: selectedVehicleId,
            driverName,
            departureTimestamp: new Date().getTime(),
            departureMileage: Number(departureMileage),
            checklistItems: itemStates,
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
          <CardTitle>Registro de Saída</CardTitle>
          <CardDescription>Preencha os detalhes do veículo e motorista antes de iniciar a rota.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle">Veículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={isSaving}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} - {vehicle.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedVehicle && (
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <Car className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                        Quilometragem Atual
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {selectedVehicle.mileage.toLocaleString('pt-BR')} km
                    </p>
                </div>
            </div>
            )}
          </div>
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
            <div className="space-y-4 rounded-md border p-4">
              {checklistItems.map(item => (
                <div key={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor={item} className="mb-2 sm:mb-0">{item}</Label>
                  <RadioGroup
                    id={item}
                    defaultValue="na"
                    onValueChange={(value: 'ok' | 'problem' | 'na') => setItemStates(prev => ({...prev, [item]: value}))}
                    className="flex items-center space-x-4"
                    disabled={isSaving}
                  >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ok" id={`${item}-ok`} className="text-green-500 border-green-500"/>
                        <Label htmlFor={`${item}-ok`} className="text-green-700">OK</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="problem" id={`${item}-problem`} className="text-destructive border-destructive" />
                        <Label htmlFor={`${item}-problem`} className="text-destructive">Problema</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="na" id={`${item}-na`} />
                        <Label htmlFor={`${item}-na`}>N/A</Label>
                    </div>
                  </RadioGroup>
                </div>
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
