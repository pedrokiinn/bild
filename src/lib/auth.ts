// A mock auth.ts file to simulate user authentication
import { getUserByName, getUsers } from "./data";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface User {
  id: string;
  name?: string | null;
  role: 'admin' | 'collaborator';
  password?: string;
}

// Simulate a logged-in user
let currentUser: User | null = null;

export function getCurrentUser(): Promise<User | null> {
  return new Promise(async (resolve) => {
    // In a real app, you might use session cookies or JWTs.
    // For this simulation, we'll keep it in memory and localStorage.
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('currentUser');
      if (userId) {
        // This is not ideal as it fetches all users. In a real app, you'd fetch a single user by ID.
        const allUsers = await getUsers();
        const user = allUsers.find(u => u.id === userId);
        currentUser = user || null;
      } else {
        currentUser = null;
      }
    }
    resolve(currentUser);
  });
}

export function login(username: string, password_raw: string): Promise<User | null> {
    return new Promise(async (resolve, reject) => {
        const user = await getUserByName(username);

        if (user && user.password === password_raw) {
            currentUser = user;
            if (typeof window !== 'undefined') {
                localStorage.setItem('currentUser', user.id);
            }
            resolve(user);
        } else {
            reject(new Error("Usuário ou senha inválidos."));
        }
    });
}

export function logout(): Promise<void> {
  return new Promise((resolve) => {
    currentUser = null;
    if(typeof window !== 'undefined'){
      localStorage.removeItem('currentUser');
    }
    resolve();
  });
}

export function register(username: string, password_raw: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
        const existingUser = await getUserByName(username);
        if (existingUser) {
            return reject(new Error("Este nome de usuário já está em uso."));
        }

        const allUsers = await getUsers();
        const isFirstUser = allUsers.length === 0;

        const newUser: Omit<User, 'id'> = {
            name: username,
            role: isFirstUser ? 'admin' : 'collaborator',
            password: password_raw
        };
        
        const usersCollection = collection(db, "users");
        const docRef = await addDoc(usersCollection, newUser);

        resolve({ id: docRef.id, ...newUser });
    });
}
