
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  mileage: number;
}

export type ChecklistStatus = 'completed' | 'pending_arrival' | 'problem';

export interface DailyChecklist {
  id: string;
  vehicleId: string;
  driverName: string;
  departureTimestamp: number;
  arrivalTimestamp?: number;
  departureMileage: number;
  arrivalMileage?: number;
  checklistItems: Record<string, 'ok' | 'problem'>;
  notes?: string;
  status: ChecklistStatus;
  date: string; // YYYY-MM-DD
  aiDiagnosis?: string;
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'admin' | 'collaborator';
}

export interface ChecklistItemOption {
    key: string;
    title: string;
    description: string;
    options: {
        value: string;
        label: string;
    }[];
    isProblem: (value: string) => boolean;
}
