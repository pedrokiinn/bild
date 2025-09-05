
'use server';

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
} from "firebase/auth";
import { auth, db } from './firebase';
import { collection, doc, getDoc, query, where, getDocs, setDoc } from "firebase/firestore";
import type { User } from "@/types";

export async function getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.uid) {
        return null;
    }

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return { id: userDocSnap.id, ...userDocSnap.data() } as User;
    }

    return null;
}

export async function login(email: string, password_raw: string): Promise<User> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password_raw);
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
            throw new Error("Email ou senha inválidos.");
        }
        throw new Error("Ocorreu um erro durante o login.");
    }
}

export async function logout(): Promise<void> {
    await signOut(auth);
}

export async function register(name: string, email: string, password_raw: string): Promise<User> {
    try {
        //  Criar o usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password_raw);
        const firebaseUser = userCredential.user;

        // Verificar se é o primeiro usuário para definir como admin
        const usersRef = collection(db, "users");
        const allUsersSnapshot = await getDocs(query(usersRef));
        const isFirstUser = allUsersSnapshot.size === 0; // A verificação deve ser antes de adicionar o novo
        const isAdminByEmail = email.toLowerCase() === 'keennlemariem@gmail.com';

        // Criar o documento do perfil do usuário no Firestore
        const newUser: Omit<User, 'id'> = {
            name: name,
            email: email,
            role: isFirstUser || isAdminByEmail ? 'admin' : 'collaborator',
        };

        // Usar o UID do Firebase Auth como ID do documento no Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        
        return { id: firebaseUser.uid, ...newUser };

    } catch (error: any) {
        console.error("Erro no registro:", error.code, error.message);
        if (error.code === 'auth/email-already-in-use') {
             throw new Error("Este endereço de email já está em uso.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
         if (error.code === 'auth/invalid-email') {
            throw new Error("O formato do email é inválido.");
        }
        throw new Error("Não foi possível completar o cadastro.");
    }
}
