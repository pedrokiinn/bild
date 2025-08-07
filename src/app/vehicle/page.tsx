'use client';
import { useEffect, useState } from 'react';
import type { Vehicle } from '@/types';
import { getVehicles } from '@/lib/data';
import VehicleClient from '@/components/vehicle/VehicleClient';

export default function VehiclePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchV = async () => {
      setIsLoading(true);
      const fetchedVehicles = await getVehicles();
      setVehicles(fetchedVehicles);
      setIsLoading(false);
    }
    fetchV();
  }, []);

  return (
      <VehicleClient initialVehicles={vehicles} isLoading={isLoading} />
  );
}
