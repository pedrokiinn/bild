
import { Timestamp } from 'firebase/firestore';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  color?: string;
  mileage?: number;
}

export type ChecklistStatus = 'completed' | 'pending_arrival' | 'problem';

export type FuelType = 'gasolina' | 'etanol' | 'diesel' | 'gnv';

export interface Refueling {
  amount: number;
  liters: number;
  type: FuelType;
}

export interface DailyChecklist {
  id: string;
  vehicleId: string;
  driverId: string; // Adicionado para rastrear o dono do checklist
  driverName: string;
  departureTimestamp: Timestamp;
  arrivalTimestamp?: Timestamp;
  departureMileage: number;
  arrivalMileage?: number;
  checklistItems: Record<string, 'ok' | 'problem'>;
  checklistValues?: Record<string, string>; // To store specific values like "full", "low", etc.
  photos?: {
    front?: string;
    rear?: string;
    left?: string;
    right?: string;
  };
  notes?: string;
  status: ChecklistStatus;
  date: string; // YYYY-MM-DD

  // New fields for refueling
  refuelings?: Refueling[];
}

export interface User {
  id: string; // Corresponderá ao UID do Firebase Auth
  name: string;
  email: string;
  role: 'admin' | 'collaborator';
}

export interface DeletionReport {
    id: string;
    deletedUserId: string;
    deletedUserName: string;
    adminId: string;
    adminName: string;
    reason: string;
    timestamp: Timestamp;
}

export interface ChecklistItemOption {
    key: string;
    title: string;
    description: string;
    options: {
        value: string;
        label: string;
        color: string;
    }[];
    isProblem: (value: string) => boolean;
}
