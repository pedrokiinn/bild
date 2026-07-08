
'use client';

import React, { useState, useEffect } from 'react';
import { Vehicle, Carreta } from '@/types';
import { getVehicles, getCarretas, checklistItemsOptions, carretaChecklistItems } from '@/lib/data';
import ChecklistForm from '@/components/checklist/ChecklistForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Truck } from 'lucide-react';

function ChecklistContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [carretas, setCarretas] = useState<Carreta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'select_type' | 'select_item' | 'form'>('select_type');
  const [type, setType] = useState<'vehicle' | 'carreta' | null>(null);
  const [selectedItem, setSelectedItem] = useState<Vehicle | Carreta | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [v, c] = await Promise.all([getVehicles(), getCarretas()]);
      setVehicles(v);
      setCarretas(c);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (step === 'select_type') {
    return (
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <Card className="hover:border-primary cursor-pointer transition-all" onClick={() => { setType('vehicle'); setStep('select_item'); }}>
          <CardHeader className="text-center">
            <Car className="w-12 h-12 mx-auto text-primary" />
            <CardTitle>Caminhão / Cavalo</CardTitle>
          </CardHeader>
        </Card>
        <Card className="hover:border-primary cursor-pointer transition-all" onClick={() => { setType('carreta'); setStep('select_item'); }}>
          <CardHeader className="text-center">
            <Truck className="w-12 h-12 mx-auto text-primary" />
            <CardTitle>Carreta</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === 'select_item') {
    const list = type === 'vehicle' ? vehicles : carretas;
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-6">
        <Button variant="ghost" onClick={() => setStep('select_type')}>Voltar</Button>
        <h2 className="text-xl font-bold">Selecione o {type === 'vehicle' ? 'Veículo' : 'Equipamento'}</h2>
        {list.map((item: any) => (
          <Card key={item.id} className="p-4 cursor-pointer hover:bg-slate-50" onClick={() => { setSelectedItem(item); setStep('form'); }}>
            <p className="font-bold">{type === 'vehicle' ? `${item.brand} ${item.model}` : item.code}</p>
            <p className="text-sm text-slate-500">Placa: {item.license_plate}</p>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ChecklistForm 
        type={type!}
        item={selectedItem!}
        checklistItems={type === 'vehicle' ? checklistItemsOptions : carretaChecklistItems}
        onBack={() => setStep('select_item')}
      />
    </div>
  );
}

export default function Checklist() {
    return <ChecklistContent />
}
