import type { DailyChecklist, Vehicle, User, ChecklistItemOption } from "@/types";
import { startOfMonth, endOfMonth } from "date-fns";
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, deleteField } from "firebase/firestore";

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
    if (userSnap.data().email === 'keennlemariem@gmail.com') throw new Error("Ação bloqueada para admin mestre.");
    await updateDoc(userRef, { role: newRole });
};

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
        description: "Verifique o ponteiro no painel do veículo.",
        options: [
            { value: "full", label: "Cheio", color: "green" },
            { value: "75", label: "3/4", color: "blue" },
            { value: "50", label: "1/2", color: "yellow" },
            { value: "25", label: "1/4", color: "orange" },
            { value: "reserve", label: "Reserva", color: "red" },
        ],
        isProblem: (value: string) => value === 'reserve',
    },
    {
        key: "tires_status",
        title: "Pneus e Estepe",
        description: "Avalie o desgaste e a calibragem dos 4 pneus + estepe.",
        options: [
            { value: "ok", label: "Todos OK", color: "green" },
            { value: "low_pressure", label: "Calibrar", color: "yellow" },
            { value: "worn", label: "Desgastados", color: "red" },
            { value: "no_spare", label: "Sem Estepe", color: "red" },
        ],
        isProblem: (value: string) => value !== 'ok',
    },
    {
        key: "bodywork",
        title: "Lataria e Pintura",
        description: "Verifique se há novos amassados, riscos ou avarias na pintura.",
        options: [
            { value: "ok", label: "Sem Avarias", color: "green" },
            { value: "scratched", label: "Riscos", color: "yellow" },
            { value: "dented", label: "Amassados", color: "orange" },
            { value: "damaged", label: "Avarias Graves", color: "red" },
        ],
        isProblem: (value: string) => value === 'dented' || value === 'damaged',
    },
    {
        key: "lighting",
        title: "Sistema de Iluminação",
        description: "Teste faróis (alto/baixo), setas, luz de freio e ré.",
        options: [
            { value: "ok", label: "Funcionando", color: "green" },
            { value: "burned_out", label: "Lâmpada Queimada", color: "orange" },
            { value: "broken_lens", label: "Lente Quebrada", color: "red" },
        ],
        isProblem: (value: string) => value !== 'ok',
    },
    {
        key: "glass_mirrors",
        title: "Vidros e Retrovisores",
        description: "Inspecione o parabrisa (trincas) e todos os espelhos.",
        options: [
            { value: "ok", label: "Íntegros", color: "green" },
            { value: "cracked", label: "Trincado/Quebrado", color: "red" },
            { value: "dirty", label: "Muito Sujo", color: "yellow" },
        ],
        isProblem: (value: string) => value === 'cracked',
    },
    {
        key: "fluids",
        title: "Fluidos (Óleo/Água)",
        description: "Níveis de óleo do motor e líquido de arrefecimento.",
        options: [
            { value: "ok", label: "Níveis OK", color: "green" },
            { value: "low", label: "Nível Baixo", color: "orange" },
            { value: "leak", label: "Vazamento", color: "red" },
        ],
        isProblem: (value: string) => value !== 'ok',
    },
    {
        key: "safety_kit",
        title: "Kit de Segurança",
        description: "Triângulo, macaco, chave de roda e extintor.",
        options: [
            { value: "complete", label: "Completo", color: "green" },
            { value: "missing_item", label: "Faltando Item", color: "orange" },
            { value: "expired_extinguisher", label: "Extintor Vencido", color: "red" },
        ],
        isProblem: (value: string) => value !== 'complete',
    },
    {
        key: "documentation",
        title: "Documentação (CRLV)",
        description: "O documento do veículo está presente e em dia?",
        options: [
            { value: "ok", label: "No Veículo", color: "green" },
            { value: "missing", label: "Ausente", color: "red" },
        ],
        isProblem: (value: string) => value === 'missing',
    },
    {
        key: "hygiene",
        title: "Limpeza e Higiene",
        description: "Estado de conservação interna (bancos) e externa.",
        options: [
            { value: "clean", label: "Limpo", color: "green" },
            { value: "dirty_internal", label: "Interior Sujo", color: "yellow" },
            { value: "needs_washing", label: "Lavar Externo", color: "orange" },
        ],
        isProblem: (value: string) => value === 'needs_washing',
    }
];