
'use server';

import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { app, db } from './firebase';
import { collection, addDoc, doc, getDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import type { User } from "@/types";

const auth = getAuth(app);

// Helper para converter um nome de usuário em um email falso para o Firebase Auth
const toEmail = (username: string) => `${username.toLowerCase().replace(/\s+/g, '')}@carcheck.app`;

export async function getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.uid) {
        return null;
    }

    // Após obter o usuário do Auth, buscamos o perfil dele no Firestore para obter a role.
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return { id: userDocSnap.id, ...userDocSnap.data() } as User;
    }

    return null;
}

export async function login(username: string, password_raw: string): Promise<User> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, toEmail(username), password_raw);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return { id: userDocSnap.id, ...userDocSnap.data() } as User;
        } else {
            throw new Error("Perfil de usuário não encontrado no Firestore.");
        }
    } catch (error: any) {
        console.error("Erro no login:", error.code);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Usuário ou senha inválidos.");
        }
        throw new Error("Ocorreu um erro durante o login.");
    }
}

export async function logout(): Promise<void> {
    await signOut(auth);
}

export async function register(username: string, password_raw: string): Promise<User> {
    const email = toEmail(username);

    // 1. Verificar se o nome de usuário já existe na coleção 'users'
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("name", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw new Error("Este nome de usuário já está em uso.");
    }

    try {
        // 2. Criar o usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password_raw);
        const firebaseUser = userCredential.user;

        // 3. Verificar se é o primeiro usuário para definir como admin
        const allUsersSnapshot = await getDocs(usersRef);
        const isFirstUser = allUsersSnapshot.empty;

        // 4. Criar o documento do perfil do usuário no Firestore
        const newUser: Omit<User, 'id'> = {
            name: username,
            role: isFirstUser ? 'admin' : 'collaborator',
        };

        // Usar o UID do Firebase Auth como ID do documento no Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        
        return { id: firebaseUser.uid, ...newUser };

    } catch (error: any) {
        console.error("Erro no registro:", error.code, error.message);
        if (error.code === 'auth/email-already-in-use') {
             throw new Error("Este nome de usuário já está em uso.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        throw new Error("Não foi possível completar o cadastro.");
    }
}
