'use client';
import { useEffect, useState } from "react";
import { DailyChecklist, Vehicle } from "@/types";
import { getChecklists, getVehicles } from "@/lib/data";
import HistoryView from "@/components/history/HistoryView";

export default function HistoryPage() {
  const [data, setData] = useState<{ checklists: (DailyChecklist & { vehicle?: Vehicle })[], vehicles: Vehicle[] }>({ checklists: [], vehicles: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [checklistsData, vehiclesData] = await Promise.all([getChecklists(), getVehicles()]);
      
      const checklistsWithVehicleData = checklistsData.map(checklist => {
        const vehicle = vehiclesData.find(v => v.id === checklist.vehicleId);
        return { ...checklist, vehicle };
      });

      setData({ checklists: checklistsWithVehicleData, vehicles: vehiclesData });
      setIsLoading(false);
    };

    fetchData();
  }, []);

  return (
    <HistoryView 
      initialChecklists={data.checklists}
      vehicles={data.vehicles}
      isLoading={isLoading}
    />
  );
}
