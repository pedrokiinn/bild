import type { DailyChecklist, Vehicle } from "@/types";
import { format } from "date-fns";

// Mock data
let vehicles: Vehicle[] = [
  { id: '1', brand: 'Fiat', model: 'Toro', year: 2023, license_plate: 'BRA2E19', color: 'Branco', mileage: 15000 },
  { id: '2', brand: 'Chevrolet', model: 'S10', year: 2022, license_plate: 'MER1C0S', color: 'Prata', mileage: 45000 },
  { id: '3', brand: 'Ford', model: 'Ranger', year: 2024, license_plate: 'FOR4D00', color: 'Azul', mileage: 2500 },
];

let checklists: DailyChecklist[] = [
  {
    id: 'c1',
    vehicleId: '1',
    driverName: 'João Silva',
    departureTimestamp: new Date('2024-07-22T08:00:00').getTime(),
    arrivalTimestamp: new Date('2024-07-22T18:00:00').getTime(),
    departureMileage: 14800,
    arrivalMileage: 15000,
    checklistItems: { 'Nível do Óleo': 'ok', 'Pneus': 'ok', 'Freios': 'ok' },
    notes: 'Tudo certo.',
    status: 'completed',
    date: '2024-07-22',
  },
  {
    id: 'c2',
    vehicleId: '2',
    driverName: 'Maria Oliveira',
    departureTimestamp: new Date('2024-07-22T09:00:00').getTime(),
    arrivalTimestamp: new Date('2024-07-22T19:00:00').getTime(),
    departureMileage: 44800,
    arrivalMileage: 45000,
    checklistItems: { 'Nível do Óleo': 'ok', 'Pneus': 'problem', 'Freios': 'ok' },
    notes: 'Pneu dianteiro direito parece baixo.',
    status: 'problem',
    date: '2024-07-22',
    aiDiagnosis: "A anomalia no pneu pode indicar um furo lento ou problema na válvula. Recomenda-se verificação da pressão e inspeção visual por um profissional."
  },
  {
    id: 'c3',
    vehicleId: '1',
    driverName: 'João Silva',
    departureTimestamp: new Date().setHours(8, 0, 0, 0),
    departureMileage: 15000,
    checklistItems: { 'Nível do Óleo': 'ok', 'Pneus': 'ok', 'Freios': 'ok' },
    status: 'pending_arrival',
    date: format(new Date(), 'yyyy-MM-dd'),
  },
];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Vehicle Functions
export const getVehicles = async (): Promise<Vehicle[]> => {
  await delay(500);
  return [...vehicles];
};

export const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
  await delay(300);
  return vehicles.find(v => v.id === id);
}

export const saveVehicle = async (vehicle: Omit<Vehicle, 'id'> & { id?: string }): Promise<Vehicle> => {
  await delay(1000);
  if (vehicle.id) {
    const index = vehicles.findIndex(v => v.id === vehicle.id);
    if (index !== -1) {
      vehicles[index] = { ...vehicles[index], ...vehicle };
      return vehicles[index];
    }
  }
  const newVehicle: Vehicle = { ...vehicle, id: String(Date.now()) };
  vehicles.push(newVehicle);
  return newVehicle;
};

export const deleteVehicle = async (id: string): Promise<void> => {
    await delay(1000);
    vehicles = vehicles.filter(v => v.id !== id);
}

// Checklist Functions
export const getChecklists = async (): Promise<DailyChecklist[]> => {
  await delay(500);
  return [...checklists].sort((a, b) => b.departureTimestamp - a.departureTimestamp);
};

export const getChecklistById = async (id:string): Promise<DailyChecklist | undefined> => {
    await delay(300);
    return checklists.find(c => c.id === id);
}

export const getTodayChecklistForVehicle = async (vehicleId: string): Promise<DailyChecklist | undefined> => {
  await delay(300);
  const today = format(new Date(), 'yyyy-MM-dd');
  return checklists.find(c => c.vehicleId === vehicleId && c.date === today);
};

export const saveChecklist = async (checklist: Omit<DailyChecklist, 'id'> & { id?: string }): Promise<DailyChecklist> => {
  await delay(1500);
   if (checklist.id) {
    const index = checklists.findIndex(c => c.id === checklist.id);
    if (index !== -1) {
      checklists[index] = { ...checklists[index], ...checklist };
      // Also update vehicle mileage
      const vehicleIndex = vehicles.findIndex(v => v.id === checklists[index].vehicleId);
      if(vehicleIndex !== -1 && checklist.arrivalMileage) {
          vehicles[vehicleIndex].mileage = checklist.arrivalMileage;
      }
      return checklists[index];
    }
  }
  const newChecklist: DailyChecklist = { ...checklist, id: String(Date.now()) };
  checklists.push(newChecklist);
  
  // Also update vehicle mileage
  const vehicleIndex = vehicles.findIndex(v => v.id === newChecklist.vehicleId);
  if(vehicleIndex !== -1) {
      vehicles[vehicleIndex].mileage = newChecklist.departureMileage;
  }
  
  return newChecklist;
}

export const checklistItemsOptions = [
    "Nível do Óleo",
    "Nível da Água",
    "Calibragem dos Pneus",
    "Estepe",
    "Freios",
    "Faróis e Lanternas",
    "Limpeza",
    "Documentação",
];
