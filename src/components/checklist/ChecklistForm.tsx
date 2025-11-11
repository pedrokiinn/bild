
'use client';
import { useState, useEffect } from 'react';
import type { Vehicle, DailyChecklist, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { saveChecklist } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { ChecklistItemOption } from '@/types';
import ChecklistItem from './ChecklistItem';
import { getCurrentUser } from '@/lib/auth';

interface ChecklistFormProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle;
  checklistItems: ChecklistItemOption[];
  onBack: () => void;
}

export default function ChecklistForm({ vehicles, selectedVehicle, checklistItems, onBack }: ChecklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [departureMileage, setDepartureMileage] = useState<string>(selectedVehicle?.mileage?.toString() || '');
  const [itemStates, setItemStates] = useState<Record<string, 'ok' | 'problem'>>({});
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
        setIsUserLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsUserLoading(false);
    };
    fetchUser();
  }, []);

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
    if (!user) {
        toast({
            title: 'Erro de Autenticação',
            description: 'Não foi possível identificar o usuário. Por favor, faça login novamente.',
            variant: 'destructive',
        });
        return;
    }

    if (!selectedVehicle?.id || !departureMileage) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha a quilometragem.',
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
        const checklistItemsToSave = checklistItems.reduce((acc, item) => {
            acc[item.title] = itemStates[item.title] || 'ok';
            return acc;
        }, {} as Record<string, 'ok' | 'problem'>);


        const newChecklist: Omit<DailyChecklist, 'id'> = {
            vehicleId: selectedVehicle.id,
            driverId: user.id,
            driverName: user.name,
            departureTimestamp: new Date(),
            departureMileage: Number(departureMileage),
            checklistItems: checklistItemsToSave,
            checklistValues: itemValues,
            notes: notes,
            status: 'pending_arrival',
            date: format(new Date(), 'yyyy-MM-dd'),
        };

        await saveChecklist(newChecklist);

        toast({
            title: 'Checklist salvo!',
            description: 'O checklist de saída foi registrado com sucesso.',
        });
        router.push('/history');
    } catch (error) {
        console.error("Erro ao salvar o checklist:", error)
        toast({
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar o checklist. Tente novamente.',
            variant: 'destructive',
        });
        setIsSaving(false);
    }
  };

  const isFormDisabled = isSaving || isUserLoading;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registro de Saída</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack} disabled={isFormDisabled}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Trocar Veículo
            </Button>
          </div>
          <CardDescription>
            Veículo: <span className="font-semibold text-primary">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.license_plate})</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="departureMileage">Quilometragem de Saída (km)</Label>
              <Input id="departureMileage" value={departureMileage} onChange={handleMileageChange} placeholder="Ex: 15000" disabled={isFormDisabled} />
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
                  disabled={isFormDisabled}
                />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação adicional? Descreva aqui." disabled={isFormDisabled}/>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full md:w-auto ml-auto" disabled={isFormDisabled}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUserLoading ? 'Carregando usuário...' : isSaving ? 'Salvando...' : 'Registrar Saída'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
