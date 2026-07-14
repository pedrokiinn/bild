import type { DailyChecklist, Vehicle, User, ChecklistItemOption } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, deleteField } from "firebase/firestore";

// User Functions
export const getUsers = async (): Promise<User[]> => {
    try {
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(usersCollection);
        return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error: any) {
        console.error("Erro ao buscar usuários:", error);
        throw new Error(error.message || "Erro ao carregar equipe.");
    }
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'collaborator'): Promise<void> => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
        throw new Error("Usuário não encontrado.");
    }
    
    if (userSnap.data().email === 'keennlemariem@gmail.com') {
        throw new Error("Não é possível alterar o administrador mestre.");
    }
    
    await updateDoc(userRef, { role: newRole });
};

// Vehicle Functions
export const getVehicles = async (): Promise<Vehicle[]> => {
  const vehiclesCollection = collection(db, "vehicles");
  const vehicleSnapshot = await getDocs(vehiclesCollection);
  return vehicleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
};

export const saveVehicle = async (vehicle: Omit<Vehicle, 'id'> & { id?: string }): Promise<Vehicle> => {
  if (vehicle.id) {
    const vehicleDoc = doc(db, "vehicles", vehicle.id);
    const snap = await getDoc(vehicleDoc);
    if (!snap.exists()) throw new Error("Veículo não encontrado para atualização.");
    await updateDoc(vehicleDoc, vehicle);
    return vehicle as Vehicle;
  }
  const docRef = await addDoc(collection(db, "vehicles"), vehicle);
  return { id: docRef.id, ...vehicle } as Vehicle;
};

export const deleteVehicle = async (id: string): Promise<void> => {
    const vehicleDoc = doc(db, "vehicles", id);
    await deleteDoc(vehicleDoc);
}

// Checklist Functions
export const getChecklists = async (user: User | null, date?: Date): Promise<DailyChecklist[]> => {
    if (!user) return [];
    const checklistsCollection = collection(db, "checklists");
    try {
        const conditions = [];
        if (user.role !== 'admin') {
            conditions.push(where("driverId", "==", user.id));
        }
        
        if (date) {
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            conditions.push(where("departureTimestamp", ">=", Timestamp.fromDate(start)));
            conditions.push(where("departureTimestamp", "<=", Timestamp.fromDate(end)));
        }

        const q = query(checklistsCollection, ...conditions);
        const snap = await getDocs(q);
        const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyChecklist));
        
        // Ordenação manual na memória para evitar a necessidade de índices compostos no Firestore
        return results.sort((a, b) => {
            const timeA = a.departureTimestamp?.toMillis() || 0;
            const timeB = b.departureTimestamp?.toMillis() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error("Erro ao buscar checklists:", error);
        return [];
    }
};

export const deleteChecklist = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "checklists", id));
}

export const saveChecklist = async (checklistData: Partial<DailyChecklist> & { id?: string }, userForCreate: User | null): Promise<any> => {
  const { id, ...dataToSave } = checklistData;
  let finalData: Record<string, any> = { ...dataToSave };

  if (!id) {
    if (!userForCreate) throw new Error("Usuário não autenticado.");
    finalData.driverId = userForCreate.id;
    finalData.driverName = userForCreate.name;
  }

  if (finalData.departureTimestamp instanceof Date) finalData.departureTimestamp = Timestamp.fromDate(finalData.departureTimestamp);
  if (finalData.arrivalTimestamp instanceof Date) finalData.arrivalTimestamp = Timestamp.fromDate(finalData.arrivalTimestamp);

  if (id) {
    const checklistDoc = doc(db, "checklists", id);
    const snap = await getDoc(checklistDoc);
    if (!snap.exists()) throw new Error("Checklist não encontrado.");

    if (checklistData.arrivalTimestamp === undefined) finalData.arrivalTimestamp = deleteField();
    await updateDoc(checklistDoc, finalData);
    
    if (finalData.arrivalMileage && finalData.vehicleId) {
        const vehicleDoc = doc(db, "vehicles", finalData.vehicleId);
        await updateDoc(vehicleDoc, { mileage: finalData.arrivalMileage });
    }
    return { id, ...checklistData };
  } 
  
  const docRef = await addDoc(collection(db, "checklists"), finalData);
  if (finalData.departureMileage && finalData.vehicleId) {
    const vehicleDoc = doc(db, "vehicles", finalData.vehicleId);
    await updateDoc(vehicleDoc, { mileage: finalData.departureMileage });
  }
  return { id: docRef.id, ...finalData };
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
];
