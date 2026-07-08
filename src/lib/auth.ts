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
            throw new Error("Perfil de usuário não encontrado no sistema. Entre em contato com o administrador.");
        }
    } catch (error: any) {
        console.error("Erro no login:", error.code);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Email ou senha inválidos.");
        }
        throw new Error("Ocorreu um erro durante o login. Verifique sua conexão.");
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
        console.error("Erro no registro:", error.code, error.message);
        if (error.code === 'auth/email-already-in-use') {
             throw new Error("Este endereço de email já está em uso.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        throw new Error("Não foi possível completar o cadastro.");
    }
}

export async function sendPasswordReset(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Erro ao enviar email de redefinição:", error.code);
        throw new Error("Ocorreu um erro ao tentar enviar o email de recuperação.");
    }
}

export async function resetPasswordByAdmin(targetUserId: string, newPassword: string): Promise<void> {
    try {
        const resetFn = httpsCallable(functions, 'resetPasswordByAdmin');
        await resetFn({ targetUserId, newPassword });
    } catch (error: any) {
        console.error("Erro ao redefinir senha:", error);
        const errorCode = error.code || (error as any).status;
        if (errorCode === 'not-found' || errorCode === 'functions/not-found') {
            throw new Error("A função de redefinição não foi encontrada no servidor. Verifique se as Cloud Functions foram implantadas corretamente na região us-central1 através do comando 'firebase deploy --only functions'.");
        }
        throw new Error(error.message || "Falha ao redefinir a senha do usuário.");
    }
}

export async function deleteUser(targetUserId: string, reason: string): Promise<void> {
    try {
        const deleteFn = httpsCallable(functions, 'deleteUserByAdmin');
        await deleteFn({ targetUserId, reason });
    } catch (error: any) {
        console.error("Erro ao excluir usuário:", error);
        const errorCode = error.code || (error as any).status;
        if (errorCode === 'not-found' || errorCode === 'functions/not-found') {
            throw new Error("A função de exclusão não foi encontrada no servidor. Verifique se as Cloud Functions foram implantadas corretamente na região us-central1 através do comando 'firebase deploy --only functions'.");
        }
        throw new Error(error.message || "Falha ao excluir o usuário.");
    }
}