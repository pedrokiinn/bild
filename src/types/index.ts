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

export interface DailyChecklist {
  id: string;
  vehicleId: string;
  driverName: string;
  departureTimestamp: Timestamp;
  arrivalTimestamp?: Timestamp;
  departureMileage: number;
  arrivalMileage?: number;
  checklistItems: Record<string, 'ok' | 'problem'>;
  checklistValues?: Record<string, string>; // To store specific values like "full", "low", etc.
  notes?: string;
  status: ChecklistStatus;
  date: string; // YYYY-MM-DD
  aiDiagnosis?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'collaborator';
  password?: string;
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
