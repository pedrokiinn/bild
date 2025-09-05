
'use client';

import React, { useState, useEffect } from 'react';
import { Vehicle } from '@/types';
import { getVehicles, checklistItemsOptions } from '@/lib/data';
import ChecklistForm from '@/components/checklist/ChecklistForm';
import { Skeleton } from '@/components/ui/skeleton';
import VehicleSelector from '@/components/checklist/VehicleSelector';

function ChecklistContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  if (isLoading) {
      return <ChecklistSkeleton />;
  }
  
  if (!selectedVehicle) {
      return (
        <div className="max-w-4xl mx-auto">
            <VehicleSelector vehicles={vehicles} onSelect={handleVehicleSelect} />
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ChecklistForm 
        vehicles={vehicles} 
        selectedVehicle={selectedVehicle}
        checklistItems={checklistItemsOptions} 
        onBack={() => setSelectedVehicle(null)}
      />
    </div>
  );
}

export default function Checklist() {
    return <ChecklistContent />
}


function ChecklistSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-24 w-full" />
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
}
