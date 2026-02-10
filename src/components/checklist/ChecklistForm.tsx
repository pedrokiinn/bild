
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Vehicle, DailyChecklist, User, FuelType, Refueling } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, Loader2, Camera, Trash2, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { saveChecklist } from '@/lib/data';
import { useRouter } from 'next/navigation';
import type { ChecklistItemOption } from '@/types';
import ChecklistItem from './ChecklistItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useUser } from '@/context/UserContext';

interface ChecklistFormProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle;
  checklistItems: ChecklistItemOption[];
  onBack: () => void;
}

type PhotoType = 'front' | 'rear' | 'left' | 'right';
const photoLabels: Record<PhotoType, string> = {
    front: "Frente",
    rear: "Traseira",
    left: "Lateral Esquerda",
    right: "Lateral Direita"
};

type RefuelingInput = {
    pricePerLiter: string;
    liters: string;
    type: FuelType | '';
}

export default function ChecklistForm({ vehicles, selectedVehicle, checklistItems, onBack }: ChecklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const user = useUser();
  const [departureMileage, setDepartureMileage] = useState<string>(selectedVehicle?.mileage?.toString() || '');
  const [itemStates, setItemStates] = useState<Record<string, 'ok' | 'problem'>>({});
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [refuelings, setRefuelings] = useState<RefuelingInput[]>([]);

  useEffect(() => {
    setDepartureMileage(selectedVehicle?.mileage?.toString() || '');
    const initialItemValues: Record<string, string> = {};
    const initialItemStates: Record<string, 'ok' | 'problem'> = {};
    checklistItems.forEach(item => {
        const defaultValue = item.options[0].value;
        initialItemValues[item.key] = defaultValue;
        initialItemStates[item.title] = item.isProblem(defaultValue) ? 'problem' : 'ok';
    });
    setItemValues(initialItemValues);
    setItemStates(initialItemStates);
    setPhotos({}); // Reset photos on vehicle change
    setRefuelings([]); // Reset refuelings on vehicle change
  }, [selectedVehicle, checklistItems]);

  const startCamera = async (type: PhotoType) => {
      setCurrentPhotoType(type);
      setIsCameraOpen(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (error) {
          console.error("Error accessing camera:", error);
          toast({
              title: "Câmera não acessível",
              description: "Por favor, permita o acesso à câmera no seu navegador.",
              variant: "destructive",
          });
          setIsCameraOpen(false);
      }
  };

  const stopCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      setIsCameraOpen(false);
      setCurrentPhotoType(null);
  };
  
  const takePicture = () => {
    if (videoRef.current && canvasRef.current && currentPhotoType) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => ({ ...prev, [currentPhotoType]: dataUrl }));
        stopCamera();
    }
  };
  
  const removePicture = (type: PhotoType) => {
    setPhotos(prev => {
        const newPhotos = {...prev};
        delete newPhotos[type];
        return newPhotos;
    });
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicle?.id || !departureMileage) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha a quilometragem.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    if(Number(departureMileage) < (selectedVehicle?.mileage ?? 0)) {
        toast({
            title: 'Quilometragem inválida',
            description: `A quilometragem de saída (${departureMileage} km) não pode ser menor que a última registrada (${selectedVehicle?.mileage} km).`,
            variant: 'destructive',
        });
        setIsSaving(false);
        return;
    }
    
    try {
        const checklistItemsToSave = checklistItems.reduce((acc, item) => {
            acc[item.title] = itemStates[item.title] || 'ok';
            return acc;
        }, {} as Record<string, 'ok' | 'problem'>);

        const numericRefuelings: Refueling[] = [];
        for (const r of refuelings) {
            if (!r.pricePerLiter && !r.liters && !r.type) {
                continue;
            }
            
            const price = parseFloat(r.pricePerLiter.replace(',', '.')) || 0;
            const liters = parseFloat(r.liters.replace(',', '.')) || 0;

            if (!price || !liters || !r.type) {
                toast({
                    title: 'Abastecimento incompleto',
                    description: "Preencha todos os campos de cada abastecimento ou remova os registros em branco.",
                    variant: 'destructive',
                });
                setIsSaving(false);
                return;
            }
            numericRefuelings.push({
                amount: price * liters,
                liters: liters,
                type: r.type,
            });
        }

        const newChecklist: Omit<DailyChecklist, 'id' | 'driverId' | 'driverName'> = {
            vehicleId: selectedVehicle.id,
            departureTimestamp: new Date(),
            departureMileage: Number(departureMileage),
            checklistItems: checklistItemsToSave,
            checklistValues: itemValues,
            photos: photos,
            notes: notes,
            status: 'pending_arrival',
            date: format(new Date(), 'yyyy-MM-dd'),
            refuelings: numericRefuelings
        };

        await saveChecklist(newChecklist, user);

        toast({
            title: 'Checklist salvo!',
            description: 'O checklist de saída foi registrado com sucesso.',
        });
        router.push('/history');
    } catch (error: any) {
        console.error("Erro ao salvar o checklist:", error);
        toast({
            title: 'Erro ao salvar',
            description: error.message || 'Não foi possível salvar o checklist. Tente novamente.',
            variant: 'destructive',
        });
        setIsSaving(false);
    }
  };

  const isFormDisabled = isSaving;

  return (
    <>
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
                <Label>Fotos do Veículo</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {(Object.keys(photoLabels) as PhotoType[]).map((type) => (
                        <div key={type}>
                            {photos[type] ? (
                                <div className="relative group aspect-video">
                                    <Image src={photos[type]} alt={`Foto da ${photoLabels[type]}`} layout="fill" objectFit="cover" className="rounded-lg" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removePicture(type)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full aspect-video flex flex-col items-center justify-center gap-2"
                                    onClick={() => startCamera(type)}
                                >
                                    <Camera className="w-6 h-6" />
                                    <span className="text-xs">{photoLabels[type]}</span>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div>
              <Label>Abastecimentos na Saída</Label>
              <div className="space-y-4 rounded-md border p-4 mt-2">
                <div className="flex items-center justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddRefueling} disabled={isSaving}>
                        <Plus className="w-4 h-4 mr-2" /> Adicionar
                    </Button>
                </div>
                
                {refuelings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum abastecimento registrado na saída.</p>
                )}

                {refuelings.map((refueling, index) => {
                    const price = parseFloat(refueling.pricePerLiter.replace(',', '.')) || 0;
                    const liters = parseFloat(refueling.liters.replace(',', '.')) || 0;
                    const total = price * liters;

                    return (
                        <div key={index} className="space-y-4 p-4 border rounded-lg relative bg-slate-50/50">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:bg-red-100 hover:text-destructive" onClick={() => handleRemoveRefueling(index)}>
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
              {isSaving ? 'Salvando...' : 'Registrar Saída'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
          <DialogContent className="max-w-3xl p-0" onInteractOutside={stopCamera}>
              <DialogHeader className="p-4">
                  <DialogTitle>Tirar foto da {photoLabels[currentPhotoType!]}</DialogTitle>
              </DialogHeader>
              <div className="relative">
                  <video ref={videoRef} className="w-full h-auto" autoPlay playsInline muted />
                   <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-center p-4 bg-background/80">
                  <Button onClick={takePicture} size="lg" className="rounded-full w-16 h-16">
                      <Camera className="w-8 h-8"/>
                  </Button>
              </div>
          </DialogContent>
      </Dialog>
    </>
  );
}
