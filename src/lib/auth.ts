
'use server';

import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth";
import { auth, db } from './firebase';
import { collection, doc, getDoc, query, getDocs, setDoc } from "firebase/firestore";
import type { User } from "@/types";

export async function login(email: string, password_raw: string): Promise<User> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password_raw);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return { id: userDocSnap.id, ...userDocSnap.data() } as User;
        } else {
            // This case is unlikely but good to handle.
            await signOut(auth);
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

export async function changePassword(currentPassword_raw: string, newPassword_raw: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
    }
    
    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword_raw);
        
        // Re-authenticate the user
        await reauthenticateWithCredential(user, credential);
        
        // Now update the password
        await updatePassword(user, newPassword_raw);
    
    } catch(error: any) {
        console.error("Erro ao alterar a senha:", error.code);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            throw new Error("A senha atual está incorreta.");
        }
        if (error.code === 'auth/weak-password') {
            throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
        }
        throw new Error("Ocorreu um erro ao tentar alterar a senha.");
    }
}
