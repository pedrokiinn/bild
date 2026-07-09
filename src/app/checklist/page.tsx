
'use client';

import React, { useState, useEffect } from 'react';
import { Vehicle } from '@/types';
import { getVehicles, checklistItemsOptions } from '@/lib/data';
import ChecklistForm from '@/components/checklist/ChecklistForm';
import { Skeleton } from '@/components/ui/skeleton';
import VehicleSelector from '@/components/checklist/VehicleSelector';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function ChecklistContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const v = await getVehicles();
      setVehicles(v);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="max-w-4xl mx-auto p-6"><Skeleton className="h-64 w-full" /></div>;

  if (step === 'select') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <VehicleSelector 
          vehicles={vehicles} 
          onSelect={(vehicle) => {
            setSelectedVehicle(vehicle);
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
        item={selectedVehicle!}
        checklistItems={checklistItemsOptions}
        onBack={() => setStep('select')}
      />
    </div>
  );
}

export default function Checklist() {
    return <ChecklistContent />
}
