'use client';

import React, { useState, useEffect } from 'react';
import { Vehicle } from '@/types';
import { getVehicles, checklistItemsOptions } from '@/lib/data';
import ChecklistForm from '@/components/checklist/ChecklistForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VehicleSelector from '@/components/checklist/VehicleSelector';

function ChecklistContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'select_item' | 'form'>('select_item');
  const [selectedItem, setSelectedItem] = useState<Vehicle | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const v = await getVehicles();
      setVehicles(v);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (step === 'select_item') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <VehicleSelector 
          vehicles={vehicles} 
          onSelect={(vehicle) => {
            setSelectedItem(vehicle);
            setStep('form');
          }} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ChecklistForm 
        type="vehicle"
        item={selectedItem!}
        checklistItems={checklistItemsOptions}
        onBack={() => setStep('select_item')}
      />
    </div>
  );
}

export default function Checklist() {
    return <ChecklistContent />
}