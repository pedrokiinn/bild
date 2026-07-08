
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

export interface Carreta {
  id: string;
  code: string; // Identificador da carreta (ex: CAR-01)
  license_plate: string;
  model: string;
  year: number;
  type: string; // Ex: Baú, Sider, Grade Baixa
  status: 'available' | 'maintenance' | 'irregular';
}

export type ChecklistStatus = 'completed' | 'pending_arrival' | 'problem';

export type FuelType = 'gasolina' | 'diesel';

export interface Refueling {
  amount: number;
  liters: number;
  type: FuelType;
}

export interface DailyChecklist {
  id: string;
  vehicleId: string;
  carretaId?: string; // ID da carreta se for um checklist de carreta
  driverId: string;
  driverName: string;
  departureTimestamp: Timestamp;
  arrivalTimestamp?: Timestamp;
  departureMileage?: number;
  arrivalMileage?: number;
  checklistItems: Record<string, 'ok' | 'problem'>;
  checklistValues?: Record<string, string>;
  photos?: {
    front?: string;
    rear?: string;
    left?: string;
    right?: string;
    carreta_left?: string;
    carreta_right?: string;
  };
  notes?: string;
  status: ChecklistStatus;
  date: string; // YYYY-MM-DD
  refuelings?: Refueling[];
  type: 'vehicle' | 'carreta';
}

export interface User {
  id: string;
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
