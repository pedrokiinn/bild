import type { DailyChecklist, Vehicle, User, ChecklistItemOption } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, deleteField } from "firebase/firestore";

// Gerenciamento de Equipe
export const getUsers = async (): Promise<User[]> => {
    try {
        const usersCollection = collection(db, "users");
        const userSnapshot = await getDocs(usersCollection);
        return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error: any) {
        console.error("Erro ao buscar usuários:", error);
        throw new Error("Falha ao carregar lista de equipe.");
    }
};

export const updateUserRole = async (userId: string, newRole: 'admin' | 'collaborator'): Promise<void> => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("Usuário inexistente.");
    if (userSnap.data().email === 'keennlemariem@gmail.com') throw new Error("Admin mestre bloqueado.");
    await updateDoc(userRef, { role: newRole });
};

// Gerenciamento de Veículos
export const getVehicles = async (): Promise<Vehicle[]> => {
  const vehiclesCollection = collection(db, "vehicles");
  const vehicleSnapshot = await getDocs(vehiclesCollection);
  return vehicleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
};

export const saveVehicle = async (vehicle: Omit<Vehicle, 'id'> & { id?: string }): Promise<Vehicle> => {
  if (vehicle.id) {
    const vehicleDoc = doc(db, "vehicles", vehicle.id);
    await updateDoc(vehicleDoc, vehicle);
    return vehicle as Vehicle;
  }
  const docRef = await addDoc(collection(db, "vehicles"), vehicle);
  return { id: docRef.id, ...vehicle } as Vehicle;
};

export const deleteVehicle = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "vehicles", id));
}

// Checklists
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
        
        // Ordenação na memória para evitar erros de índice ausente no Firestore
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
    if (!userForCreate) throw new Error("Não autenticado.");
    finalData.driverId = userForCreate.id;
    finalData.driverName = userForCreate.name;
  }

  if (finalData.departureTimestamp instanceof Date) finalData.departureTimestamp = Timestamp.fromDate(finalData.departureTimestamp);
  if (finalData.arrivalTimestamp instanceof Date) finalData.arrivalTimestamp = Timestamp.fromDate(finalData.arrivalTimestamp);

  if (id) {
    const checklistDoc = doc(db, "checklists", id);
    if (checklistData.arrivalTimestamp === undefined) finalData.arrivalTimestamp = deleteField();
    await updateDoc(checklistDoc, finalData);
    
    if (finalData.arrivalMileage && finalData.vehicleId) {
        await updateDoc(doc(db, "vehicles", finalData.vehicleId), { mileage: finalData.arrivalMileage });
    }
    return { id, ...checklistData };
  } 
  
  const docRef = await addDoc(collection(db, "checklists"), finalData);
  if (finalData.departureMileage && finalData.vehicleId) {
    await updateDoc(doc(db, "vehicles", finalData.vehicleId), { mileage: finalData.departureMileage });
  }
  return { id: docRef.id, ...finalData };
}

export const checklistItemsOptions: ChecklistItemOption[] = [
    {
        key: "fuel_level",
        title: "Nível de Combustível",
        description: "Verifique o painel",
        options: [
            { value: "full", label: "Cheio", color: "green" },
            { value: "half", label: "1/2", color: "yellow" },
            { value: "empty", label: "Vazio", color: "red" },
        ],
        isProblem: (value: string) => value === 'empty',
    },
    {
        key: "tire_pressure",
        title: "Pneus",
        description: "Estado visual",
        options: [
            { value: "ok", label: "OK", color: "green" },
            { value: "bad", label: "Murcho/Gasto", color: "red" }
        ],
        isProblem: (value: string) => value === 'bad',
    },
];