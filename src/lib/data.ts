
import type { DailyChecklist, Vehicle, User, ChecklistItemOption, DeletionReport } from "@/types";
import { format } from "date-fns";
import { db, auth } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp, serverTimestamp } from "firebase/firestore";


// User Functions
export const getUsers = async (): Promise<User[]> => {
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(usersCollection);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUserById = async (id: string): Promise<User | undefined> => {
    const userDoc = doc(db, "users", id);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return undefined;
}

export const updateUserRole = async (userId: string, newRole: 'admin' | 'collaborator'): Promise<void> => {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { role: newRole });
};

export const deleteUser = async (userId: string, reason: string, adminId: string, adminName: string): Promise<void> => {
    if (!adminId) {
        throw new Error("Ação não autorizada. Administrador não está logado.");
    }
    
    const userToDeleteDoc = doc(db, "users", userId);
    const userToDeleteSnap = await getDoc(userToDeleteDoc);
    const userToDelete = userToDeleteSnap.data() as User;
    
    if (!userToDelete) throw new Error("Usuário não encontrado.");
    
    const report: Omit<DeletionReport, 'id' | 'timestamp'> & { timestamp: any } = {
        deletedUserId: userId,
        deletedUserName: userToDelete.name || 'N/A',
        adminId: adminId,
        adminName,
        reason,
        timestamp: serverTimestamp(),
    };
    
    const reportCollection = collection(db, "deletionReports");
    
    const batch = writeBatch(db);
    batch.delete(userToDeleteDoc);
    batch.set(doc(reportCollection), report);

    await batch.commit();
};

// Deletion Report Functions
export const getDeletionReports = async (): Promise<DeletionReport[]> => {
    const reportsCollection = collection(db, "deletionReports");
    const q = query(reportsCollection, orderBy("timestamp", "desc"));
    const reportSnapshot = await getDocs(q);
    return reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeletionReport));
}


export const deleteReport = async (reportId: string): Promise<void> => {
    const reportDoc = doc(db, "deletionReports", reportId);
    await deleteDoc(reportDoc);
}


// Vehicle Functions
export const getVehicles = async (): Promise<Vehicle[]> => {
  const vehiclesCollection = collection(db, "vehicles");
  const vehicleSnapshot = await getDocs(vehiclesCollection);
  return vehicleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
};

export const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
  const vehicleDoc = doc(db, "vehicles", id);
  const vehicleSnap = await getDoc(vehicleDoc);
  if (vehicleSnap.exists()) {
      return { id: vehicleSnap.id, ...vehicleSnap.data() } as Vehicle;
  }
  return undefined;
}

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
    const vehicleDoc = doc(db, "vehicles", id);
    await deleteDoc(vehicleDoc);
}

// Checklist Functions
export const getChecklists = async (): Promise<DailyChecklist[]> => {
    const checklistsCollection = collection(db, "checklists");
    const q = query(checklistsCollection, orderBy("departureTimestamp", "desc"));
    const checklistSnapshot = await getDocs(q);
    
    return checklistSnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            departureTimestamp: data.departureTimestamp,
            arrivalTimestamp: data.arrivalTimestamp || undefined,
        } as DailyChecklist;
    });
};


export const getChecklistById = async (id:string): Promise<DailyChecklist | undefined> => {
    const checklistDoc = doc(db, "checklists", id);
    const checklistSnap = await getDoc(checklistDoc);
     if (checklistSnap.exists()) {
      return { id: checklistSnap.id, ...checklistSnap.data() } as DailyChecklist;
    }
    return undefined;
}

export const deleteChecklist = async (id: string): Promise<void> => {
    const checklistDoc = doc(db, "checklists", id);
    await deleteDoc(checklistDoc);
}

export const getTodayChecklistForVehicle = async (vehicleId: string): Promise<DailyChecklist | undefined> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const checklistsRef = collection(db, "checklists");
  const q = query(checklistsRef, where("vehicleId", "==", vehicleId), where("date", "==", today));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
      return undefined;
  }
  const docData = querySnapshot.docs[0];
  return { id: docData.id, ...docData.data() } as DailyChecklist;
};

export const saveChecklist = async (checklistData: Omit<DailyChecklist, 'id'> & { id?: string }): Promise<any> => {
  const { id, ...dataToSave } = checklistData;

  if (!dataToSave.driverId) {
      throw new Error("ID do motorista não fornecido.");
  }

  // Convert JS Dates to Firestore Timestamps before saving
  const departureTimestamp = dataToSave.departureTimestamp instanceof Date
    ? Timestamp.fromDate(dataToSave.departureTimestamp)
    : dataToSave.departureTimestamp;
    
  const arrivalTimestamp = dataToSave.arrivalTimestamp instanceof Date
    ? Timestamp.fromDate(dataToSave.arrivalTimestamp)
    : dataToSave.arrivalTimestamp;

  const finalData = {
      ...dataToSave,
      departureTimestamp,
      arrivalTimestamp,
  };


  if (id) {
    const checklistDoc = doc(db, "checklists", id);
    await updateDoc(checklistDoc, finalData as any);

    if (finalData.arrivalMileage) {
        const vehicleDoc = doc(db, "vehicles", finalData.vehicleId);
        await updateDoc(vehicleDoc, { mileage: finalData.arrivalMileage });
    }

    return { id, ...checklistData };
  } 
  
  const docRef = await addDoc(collection(db, "checklists"), finalData as any);

  if (finalData.departureMileage) {
    const vehicleDoc = doc(db, "vehicles", finalData.vehicleId);
    await updateDoc(vehicleDoc, { mileage: finalData.departureMileage });
  }
  
  return { id: docRef.id, ...checklistData };
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
