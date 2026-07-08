
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Vehicle, Carreta, DailyChecklist, User, FuelType, Refueling } from '@/types';
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
  type: 'vehicle' | 'carreta';
  item: Vehicle | Carreta;
  checklistItems: ChecklistItemOption[];
  onBack: () => void;
}

type PhotoType = 'front' | 'rear' | 'left' | 'right' | 'carreta_left' | 'carreta_right';

export default function ChecklistForm({ type, item, checklistItems, onBack }: ChecklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const user = useUser();
  
  const [departureMileage, setDepartureMileage] = useState<string>(
    type === 'vehicle' ? (item as Vehicle).mileage?.toString() || '' : ''
  );
  
  const [itemStates, setItemStates] = useState<Record<string, 'ok' | 'problem'>>({});
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [refuelings, setRefuelings] = useState<{ pricePerLiter: string; liters: string; type: FuelType | '' }[]>([]);

  const photoLabels: Partial<Record<PhotoType, string>> = type === 'vehicle' ? {
      front: "Frente",
      rear: "Traseira",
      left: "Lateral Esquerda",
      right: "Lateral Direita"
  } : {
      carreta_left: "Lateral Esquerda",
      carreta_right: "Lateral Direita"
  };

  useEffect(() => {
    const initialItemValues: Record<string, string> = {};
    const initialItemStates: Record<string, 'ok' | 'problem'> = {};
    checklistItems.forEach(item => {
        const defaultValue = item.options[0].value;
        initialItemValues[item.key] = defaultValue;
        initialItemStates[item.title] = item.isProblem(defaultValue) ? 'problem' : 'ok';
    });
    setItemValues(initialItemValues);
    setItemStates(initialItemStates);
  }, [checklistItems]);

  const startCamera = async (photoType: PhotoType) => {
      setCurrentPhotoType(photoType);
      setIsCameraOpen(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
          });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (error) {
          console.error("Erro ao acessar câmera:", error);
          toast({
              title: "Câmera não acessível",
              description: "Por favor, permita o acesso à câmera.",
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
  
  const removePicture = (photoType: PhotoType) => {
    setPhotos(prev => {
        const newPhotos = {...prev};
        delete newPhotos[photoType];
        return newPhotos;
    });
  }

  const handleItemChange = (itemKey: string, value: string) => {
    const itemConfig = checklistItems.find(i => i.key === itemKey);
    if(itemConfig) {
        setItemStates(prev => ({...prev, [itemConfig.title]: itemConfig.isProblem(value) ? 'problem' : 'ok'}));
        setItemValues(prev => ({...prev, [itemKey]: value}));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        const numericRefuelings: Refueling[] = refuelings
            .filter(r => r.pricePerLiter && r.liters && r.type)
            .map(r => ({
                amount: (parseFloat(r.pricePerLiter.replace(',', '.')) || 0) * (parseFloat(r.liters.replace(',', '.')) || 0),
                liters: parseFloat(r.liters.replace(',', '.')) || 0,
                type: r.type as FuelType
            }));

        const checklistItemsToSave = checklistItems.reduce((acc, item) => {
            acc[item.title] = itemStates[item.title] || 'ok';
            return acc;
        }, {} as Record<string, 'ok' | 'problem'>);

        const newChecklist: Omit<DailyChecklist, 'id' | 'driverId' | 'driverName'> = {
            vehicleId: type === 'vehicle' ? item.id : '',
            carretaId: type === 'carreta' ? item.id : '',
            type: type,
            departureTimestamp: new Date() as any,
            departureMileage: type === 'vehicle' ? Number(departureMileage) : undefined,
            checklistItems: checklistItemsToSave,
            checklistValues: itemValues,
            photos: photos,
            notes: notes,
            status: 'pending_arrival',
            date: format(new Date(), 'yyyy-MM-dd'),
            refuelings: numericRefuelings
        };

        await saveChecklist(newChecklist as any, user);
        toast({ title: 'Checklist salvo!', description: 'Registro concluído com sucesso.' });
        router.push('/history');
    } catch (error: any) {
        console.error("Erro ao salvar:", error);
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Checklist de Saída - {type === 'vehicle' ? 'Veículo' : 'Carreta'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={onBack} type="button">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </div>
            <CardDescription className="text-primary font-bold">
              {type === 'vehicle' 
                ? `${(item as Vehicle).brand} ${(item as Vehicle).model} (${(item as Vehicle).license_plate})`
                : `${(item as Carreta).code} - ${(item as Carreta).model} (${(item as Carreta).license_plate})`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {type === 'vehicle' && (
              <div>
                <Label htmlFor="departureMileage">Quilometragem de Saída (km)</Label>
                <Input id="departureMileage" value={departureMileage} onChange={e => setDepartureMileage(e.target.value.replace(/\D/g, ''))} required />
              </div>
            )}

            <div>
              <Label>Fotos (Resolução 1080p)</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {(Object.keys(photoLabels) as PhotoType[]).map((photoType) => (
                  <div key={photoType}>
                    {photos[photoType] ? (
                      <div className="relative group aspect-video">
                        <Image src={photos[photoType]} alt={photoLabels[photoType]!} layout="fill" objectFit="cover" className="rounded-lg" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1" onClick={() => removePicture(photoType)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="w-full aspect-video flex flex-col gap-2" onClick={() => startCamera(photoType)}>
                        <Camera className="w-6 h-6" />
                        <span className="text-xs">{photoLabels[photoType]}</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Label className="text-lg font-bold">Itens de Inspeção</Label>
              <div className="grid gap-6 p-4 border rounded-xl bg-slate-50/50">
                {checklistItems.map(i => (
                  <ChecklistItem
                    key={i.key}
                    item={i}
                    value={itemValues[i.key]}
                    onChange={(val) => handleItemChange(i.key, val)}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Descreva qualquer irregularidade..." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Finalizar Checklist'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-4"><DialogTitle>Capturar Foto - 1080p</DialogTitle></DialogHeader>
          <div className="relative bg-black aspect-video flex items-center justify-center">
            <video ref={videoRef} className="w-full h-auto" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center p-6"><Button onClick={takePicture} size="lg" className="rounded-full w-16 h-16"><Camera className="w-8 h-8"/></Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
