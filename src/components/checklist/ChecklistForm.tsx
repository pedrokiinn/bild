
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Vehicle, DailyChecklist, FuelType, Refueling } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Camera, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { saveChecklist } from '@/lib/data';
import { useRouter } from 'next/navigation';
import type { ChecklistItemOption } from '@/types';
import ChecklistItem from './ChecklistItem';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';

interface ChecklistFormProps {
  item: Vehicle;
  checklistItems: ChecklistItemOption[];
  onBack: () => void;
}

type PhotoType = 'front' | 'rear' | 'left' | 'right';

export default function ChecklistForm({ item, checklistItems, onBack }: ChecklistFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const user = useUser();
  
  const [departureMileage, setDepartureMileage] = useState<string>(item.mileage?.toString() || '');
  const [itemStates, setItemStates] = useState<Record<string, 'ok' | 'problem'>>({});
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const photoLabels: Record<PhotoType, string> = {
      front: "Frente",
      rear: "Traseira",
      left: "Lateral Esquerda",
      right: "Lateral Direita"
  };

  useEffect(() => {
    const initialItemValues: Record<string, string> = {};
    const initialItemStates: Record<string, 'ok' | 'problem'> = {};
    checklistItems.forEach(i => {
        const defaultValue = i.options[0].value;
        initialItemValues[i.key] = defaultValue;
        initialItemStates[i.title] = i.isProblem(defaultValue) ? 'problem' : 'ok';
    });
    setItemValues(initialItemValues);
    setItemStates(initialItemStates);
  }, [checklistItems]);

  const startCamera = async (photoType: PhotoType) => {
      setCurrentPhotoType(photoType);
      setIsCameraOpen(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
          });
          if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
          toast({ title: "Erro na Câmera", description: "Permita o acesso à câmera.", variant: "destructive" });
          setIsCameraOpen(false);
      }
  };

  const stopCamera = () => {
      if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      setIsCameraOpen(false);
      setCurrentPhotoType(null);
  };
  
  const takePicture = () => {
    if (videoRef.current && canvasRef.current && currentPhotoType) {
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        setPhotos(prev => ({ ...prev, [currentPhotoType]: canvas.toDataURL('image/jpeg', 0.8) }));
        stopCamera();
    }
  };

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
        const checklistItemsToSave = checklistItems.reduce((acc, i) => {
            acc[i.title] = itemStates[i.title] || 'ok';
            return acc;
        }, {} as Record<string, 'ok' | 'problem'>);

        const newChecklist: Omit<DailyChecklist, 'id' | 'driverId' | 'driverName'> = {
            vehicleId: item.id,
            departureTimestamp: new Date() as any,
            departureMileage: Number(departureMileage),
            checklistItems: checklistItemsToSave,
            checklistValues: itemValues,
            photos: photos,
            notes: notes,
            status: 'pending_arrival',
            date: format(new Date(), 'yyyy-MM-dd'),
            refuelings: []
        };

        await saveChecklist(newChecklist as any, user);
        toast({ title: 'Checklist salvo!', description: 'Registro concluído.' });
        router.push('/history');
    } catch (error: any) {
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
              <CardTitle>Checklist de Saída</CardTitle>
              <Button variant="ghost" size="sm" onClick={onBack} type="button">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </div>
            <CardDescription className="text-primary font-bold">
              {item.brand} {item.model} ({item.license_plate})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="departureMileage">Quilometragem de Saída (km)</Label>
              <Input id="departureMileage" value={departureMileage} onChange={e => setDepartureMileage(e.target.value.replace(/\D/g, ''))} required />
            </div>

            <div className="space-y-4">
              <Label>Fotos do Veículo</Label>
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(photoLabels) as PhotoType[]).map((type) => (
                  <div key={type}>
                    {photos[type] ? (
                      <div className="relative aspect-video">
                        <Image src={photos[type]} alt={photoLabels[type]} layout="fill" objectFit="cover" className="rounded-lg" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1" onClick={() => setPhotos(p => { const n = {...p}; delete n[type]; return n; })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="w-full aspect-video flex flex-col gap-2" onClick={() => startCamera(type)}>
                        <Camera className="w-6 h-6" />
                        <span className="text-xs">{photoLabels[type]}</span>
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
                  <ChecklistItem key={i.key} item={i} value={itemValues[i.key]} onChange={(val) => handleItemChange(i.key, val)} disabled={isSaving} />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Descreva qualquer irregularidade..." />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : 'Finalizar Checklist'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4"><DialogTitle>Capturar Foto - {currentPhotoType && photoLabels[currentPhotoType]}</DialogTitle></DialogHeader>
          <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
            <video ref={videoRef} className="w-full h-auto" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex justify-center p-6"><Button onClick={takePicture} size="lg" className="rounded-full w-16 h-16"><Camera className="w-8 h-8"/></Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
