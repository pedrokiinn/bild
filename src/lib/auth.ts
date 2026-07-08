
'use server';

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db, functions } from './firebase';
import { collection, doc, getDoc, query, getDocs, setDoc } from "firebase/firestore";
import type { User } from "@/types";
import { httpsCallable } from "firebase/functions";

export async function login(email: string, password_raw: string): Promise<User> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password_raw);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return { id: userDocSnap.id, ...userDocSnap.data() } as User;
        } else {
            await signOut(auth);
            throw new Error("Perfil de usuário não encontrado.");
        }
    } catch (error: any) {
        if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
            throw new Error("Email ou senha inválidos.");
        }
        throw new Error("Erro ao entrar. Verifique sua conexão.");
    }
}

export async function logout(): Promise<void> {
    await signOut(auth);
}

export async function register(name: string, email: string, password_raw: string): Promise<User> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password_raw);
        const firebaseUser = userCredential.user;

        const usersRef = collection(db, "users");
        const allUsersSnapshot = await getDocs(query(usersRef));
        const isFirstUser = allUsersSnapshot.size === 0;
        const isAdminByEmail = email.toLowerCase() === 'keennlemariem@gmail.com';

        const newUser: Omit<User, 'id'> = {
            name: name,
            email: email,
            role: isFirstUser || isAdminByEmail ? 'admin' : 'collaborator',
        };

        await setDoc(doc(db, "users", firebaseUser.uid), newUser);
        return { id: firebaseUser.uid, ...newUser };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') throw new Error("Email já cadastrado.");
        throw new Error("Falha no cadastro.");
    }
}

export async function sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}

export async function resetPasswordByAdmin(targetUserId: string, newPassword: string): Promise<void> {
    try {
        const resetFn = httpsCallable(functions, 'resetPasswordByAdmin');
        await resetFn({ targetUserId, newPassword });
    } catch (error: any) {
        const errorCode = error.code || (error as any).status;
        if (errorCode === 'not-found' || errorCode === 'functions/not-found') {
            throw new Error("A função não foi encontrada no servidor. Certifique-se de rodar 'firebase deploy --only functions' na região us-central1 para ativar este recurso.");
        }
        throw new Error(error.message || "Erro ao redefinir senha.");
    }
}

export async function deleteUser(targetUserId: string, reason: string): Promise<void> {
    try {
        const deleteFn = httpsCallable(functions, 'deleteUserByAdmin');
        await deleteFn({ targetUserId, reason });
    } catch (error: any) {
        const errorCode = error.code || (error as any).status;
        if (errorCode === 'not-found' || errorCode === 'functions/not-found') {
            throw new Error("A função não foi encontrada no servidor. Certifique-se de rodar 'firebase deploy --only functions' na região us-central1 para ativar este recurso.");
        }
        throw new Error(error.message || "Erro ao excluir usuário.");
    }
}
