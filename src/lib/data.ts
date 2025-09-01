
import type { DailyChecklist, Vehicle, User, ChecklistItemOption, DeletionReport } from "@/types";
import { format } from "date-fns";

// Mock data
export let users: User[] = [
    { id: '0', name: 'PedroNobre', role: 'admin', password: 'Pedro234567' },
];

export let deletionReports: DeletionReport[] = [];


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
    checklistItems: { 'Nível de Combustível': 'ok', 'Pressão dos Pneus': 'ok', 'Condição dos Pneus': 'ok', 'Luzes e Sinalização': 'ok', 'Níveis de Fluidos': 'ok', 'Documentação': 'ok' },
    checklistValues: { 'fuel_level': 'full', 'tire_pressure': 'ok', 'tire_condition': 'excellent', 'lights_status': 'all_working', 'fluid_levels': 'ok', 'documentation': 'ok' },
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
    checklistItems: { 'Nível de Combustível': 'ok', 'Pressão dos Pneus': 'problem', 'Condição dos Pneus': 'ok', 'Luzes e Sinalização': 'ok', 'Níveis de Fluidos': 'ok', 'Documentação': 'ok' },
    checklistValues: { 'fuel_level': 'half', 'tire_pressure': 'low', 'tire_condition': 'good', 'lights_status': 'all_working', 'fluid_levels': 'ok', 'documentation': 'ok' },
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
    checklistItems: { 'Nível de Combustível': 'ok', 'Pressão dos Pneus': 'ok', 'Condição dos Pneus': 'ok', 'Luzes e Sinalização': 'ok', 'Níveis de Fluidos': 'ok', 'Documentação': 'ok' },
    checklistValues: { 'fuel_level': 'three_quarter', 'tire_pressure': 'ok', 'tire_condition': 'good', 'lights_status': 'all_working', 'fluid_levels': 'ok', 'documentation': 'ok' },
    status: 'pending_arrival',
    date: format(new Date(), 'yyyy-MM-dd'),
  },
];

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// User Functions
export const getUsers = async (): Promise<User[]> => {
    await delay(500);
    return [...users];
};

export const getUserByName = async (name: string): Promise<User | undefined> => {
    await delay(100);
    return users.find(u => u.name?.toLowerCase() === name.toLowerCase());
}

export const updateUserRole = async (userId: string, newRole: 'admin' | 'collaborator'): Promise<User> => {
    await delay(500);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].role = newRole;
        return users[userIndex];
    }
    throw new Error("User not found");
};

export const deleteUser = async (userId: string, reason: string, adminName: string): Promise<void> => {
    await delay(500);
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) throw new Error("Usuário não encontrado.");

    const report: DeletionReport = {
        id: String(Date.now()),
        deletedUserId: userToDelete.id,
        deletedUserName: userToDelete.name || 'N/A',
        adminId: users.find(u => u.name === adminName)?.id || 'N/A',
        adminName,
        reason,
        timestamp: new Date().getTime(),
    };
    deletionReports.push(report);
    users = users.filter(u => u.id !== userId);
};

// Deletion Report Functions
export const getDeletionReports = async (): Promise<DeletionReport[]> => {
    await delay(500);
    return [...deletionReports].sort((a,b) => b.timestamp - a.timestamp);
}

export const deleteReport = async (reportId: string): Promise<void> => {
    await delay(500);
    deletionReports = deletionReports.filter(r => r.id !== reportId);
}


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

export const deleteChecklist = async (id: string): Promise<void> => {
    await delay(500);
    checklists = checklists.filter(c => c.id !== id);
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

export const checklistItemsOptions: ChecklistItemOption[] = [
    {
        key: "fuel_level",
        title: "Nível de Combustível",
        description: "Verifique o indicador no painel",
        options: [
            { value: "full", label: "Cheio", color: "green" },
            { value: "three_quarter", label: "3/4", color: "blue" },
            { value: "half", label: "1/2", color: "yellow" },
            { value: "quarter", label: "1/4", color: "orange" },
            { value: "empty", label: "Vazio", color: "red" },
        ],
        isProblem: (value: string) => ['empty', 'quarter'].includes(value),
    },
    {
        key: "tire_pressure",
        title: "Pressão dos Pneus",
        description: "Verifique visualmente se algum pneu está murcho",
        options: [
            { value: "ok", label: "OK", color: "green" },
            { value: "low", label: "Baixa", color: "orange" },
            { value: "needs_check", label: "Verificar", color: "red" }
        ],
        isProblem: (value: string) => ['low', 'needs_check'].includes(value),
    },
    {
        key: "tire_condition",
        title: "Condição dos Pneus",
        description: "Estado geral dos pneus",
        options: [
            { value: "excellent", label: "Excelente", color: "green" },
            { value: "good", label: "Bom", color: "blue" },
            { value: "worn", label: "Desgastado", color: "orange" },
            { value: "needs_replacement", label: "Trocar", color: "red" }
        ],
        isProblem: (value: string) => ['worn', 'needs_replacement'].includes(value),
    },
    {
        key: "lights_status",
        title: "Luzes e Sinalização",
        description: "Faróis, lanternas, setas e freio",
        options: [
            { value: "all_working", label: "Todas OK", color: "green" },
            { value: "some_issues", label: "Com Problemas", color: "orange" },
            { value: "major_issues", label: "Problemas Graves", color: "red" }
        ],
        isProblem: (value: string) => ['some_issues', 'major_issues'].includes(value),
    },
    {
        key: "fluid_levels",
        title: "Níveis de Fluidos",
        description: "Óleo, água, freio (quando possível verificar)",
        options: [
            { value: "ok", label: "OK", color: "green" },
            { value: "low", label: "Baixo", color: "orange" },
            { value: "needs_refill", label: "Repor", color: "red" }
        ],
        isProblem: (value: string) => ['low', 'needs_refill'].includes(value),
    },
    {
        key: "documentation",
        title: "Documentação",
        description: "Documento do veículo e CNH",
        options: [
            { value: "ok", label: "OK", color: "green" },
            { value: "missing", label: "Faltando", color: "red" }
        ],
        isProblem: (value: string) => value === 'missing',
    },
];
