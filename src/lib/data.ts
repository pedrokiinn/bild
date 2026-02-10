
import type { DailyChecklist, Vehicle, User, ChecklistItemOption, DeletionReport } from "@/types";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp, serverTimestamp, deleteField } from "firebase/firestore";

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
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists() && userSnap.data().email === 'keennlemariem@gmail.com') {
        throw new Error("A função deste usuário administrador não pode ser alterada.");
    }
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { role: newRole });
};

export const deleteUser = async (userId: string, reason: string, adminUser: User | null): Promise<void> => {
    if (!adminUser || adminUser.role !== 'admin') {
        throw new Error("Ação não autorizada. Apenas administradores podem excluir usuários.");
    }
    
    const userToDeleteDoc = doc(db, "users", userId);
    const userToDeleteSnap = await getDoc(userToDeleteDoc);
    const userToDelete = userToDeleteSnap.data() as User;
    
    if (!userToDelete) throw new Error("Usuário não encontrado.");
    
    if (userToDelete.email === 'keennlemariem@gmail.com') {
        throw new Error("Este usuário administrador principal não pode ser excluído.");
    }

    // We need to call a function to delete the user from auth, this will be handled by a cloud function trigger.
    // For now we just create the report and delete the firestore user document.

    const report: Omit<DeletionReport, 'id' | 'timestamp'> & { timestamp: any } = {
        deletedUserId: userId,
        deletedUserName: userToDelete.name || 'N/A',
        adminId: adminUser.id,
        adminName: adminUser.name,
        reason,
        timestamp: serverTimestamp(),
    };
    
    const reportCollection = collection(db, "deletionReports");
    
    const batch = writeBatch(db);
    batch.delete(userToDeleteDoc); // This will trigger the onUserDeleted cloud function
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

export const deleteAllReports = async (): Promise<void> => {
    const reportsCollection = collection(db, "deletionReports");
    const reportSnapshot = await getDocs(reportsCollection);
    
    if (reportSnapshot.empty) {
        return;
    }
    
    const batch = writeBatch(db);
    reportSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
};


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
export const getChecklists = async (user: User | null, date?: Date): Promise<DailyChecklist[]> => {
    if (!user) return [];

    const checklistsCollection = collection(db, "checklists");
    let q;
    let checklistSnapshot;

    if (user.role === 'admin') {
        // For admins, query by date range and order. This is efficient.
        const conditions = [];
        if (date) {
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            conditions.push(where("departureTimestamp", ">=", Timestamp.fromDate(start)));
            conditions.push(where("departureTimestamp", "<=", Timestamp.fromDate(end)));
        }
        q = query(checklistsCollection, ...conditions, orderBy("departureTimestamp", "desc"));
        checklistSnapshot = await getDocs(q);
        return checklistSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyChecklist));

    } else { // For collaborators
        // For collaborators, query just by their ID to avoid complex index requirements.
        q = query(checklistsCollection, where("driverId", "==", user.id));
        checklistSnapshot = await getDocs(q);
        
        let checklistsData = checklistSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as DailyChecklist));

        // Then, filter by date in JavaScript.
        if (date) {
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            checklistsData = checklistsData.filter(c => {
                if (!c.departureTimestamp) return false;
                const checkDate = c.departureTimestamp.toDate();
                return checkDate >= start && checkDate <= end;
            });
        }
        
        // And sort by date in JavaScript.
        checklistsData.sort((a, b) => {
            if (!a.departureTimestamp || !b.departureTimestamp) return 0;
            return b.departureTimestamp.toMillis() - a.departureTimestamp.toMillis();
        });

        return checklistsData;
    }
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

export const saveChecklist = async (checklistData: Partial<DailyChecklist> & { id?: string }, userForCreate: User | null): Promise<any> => {
  const { id, ...dataToSave } = checklistData;
  let finalData: Record<string, any>;

  if (id) {
    // UPDATE: The user ID is already associated, so we don't need to re-assign it.
    // The original driver info is preserved.
    finalData = { ...dataToSave };
  } else {
    // CREATE: Securely set driver info from the provided user context.
    if (!userForCreate) {
      throw new Error("Usuário não autenticado. A criação do checklist falhou.");
    }
    finalData = {
      ...dataToSave,
      driverId: userForCreate.id,
      driverName: userForCreate.name,
    };
  }

  // Convert JS Dates to Firestore Timestamps for portability
  if (finalData.departureTimestamp instanceof Date) {
    finalData.departureTimestamp = Timestamp.fromDate(finalData.departureTimestamp);
  }
  if (finalData.arrivalTimestamp instanceof Date) {
    finalData.arrivalTimestamp = Timestamp.fromDate(finalData.arrivalTimestamp);
  } else if (finalData.arrivalTimestamp === undefined) {
    // Ensure undefined doesn't get sent, which can cause issues.
    // For updates, we may need to delete the field.
    delete finalData.arrivalTimestamp;
  }

  if (id) {
    const checklistDoc = doc(db, "checklists", id);
    // If arrivalTimestamp is explicitly being set to undefined on an update, we should delete it.
    if (checklistData.arrivalTimestamp === undefined) {
        finalData.arrivalTimestamp = deleteField();
    }
    await updateDoc(checklistDoc, finalData);

    // Update vehicle mileage on arrival
    if (finalData.arrivalMileage) {
        const vehicleDoc = doc(db, "vehicles", finalData.vehicleId);
        await updateDoc(vehicleDoc, { mileage: finalData.arrivalMileage });
    }
    return { id, ...checklistData };
  } 
  
  // Logic for creating a new checklist
  const docRef = await addDoc(collection(db, "checklists"), finalData);

  // Update vehicle mileage on departure
  if (finalData.departureMileage) {
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
        key: "oil_validity",
        title: "Validade do Óleo",
        description: "Verifique a etiqueta. A troca é recomendada a cada 5.000 km.",
        options: [
            { value: "ok", label: "Em dia", color: "green" },
            { value: "near_due", label: "Próximo ao vencimento", color: "orange" },
            { value: "due", label: "Vencido", color: "red" }
        ],
        isProblem: (value: string) => ['near_due', 'due'].includes(value),
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
