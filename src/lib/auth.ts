// A mock auth.ts file to simulate user authentication
import { getUserByName, users } from "./data";

export interface User {
  id: string;
  name?: string | null;
  role: 'admin' | 'collaborator';
  password?: string;
}

// Simulate a logged-in user
let currentUser: User | null = null;

export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if(typeof window !== 'undefined'){
          const userId = localStorage.getItem('currentUser');
          if (userId) {
              const user = users.find(u => u.id === userId);
              currentUser = user || null;
          } else {
              currentUser = null;
          }
      }
      resolve(currentUser);
    }, 100);
  });
}

export function login(username: string, password_raw: string): Promise<User | null> {
    return new Promise(async (resolve, reject) => {
        await new Promise(res => setTimeout(res, 500));
        const user = await getUserByName(username);

        if (user && user.password === password_raw) {
            currentUser = user;
            if(typeof window !== 'undefined'){
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
    setTimeout(() => {
      currentUser = null;
      if(typeof window !== 'undefined'){
        localStorage.removeItem('currentUser');
      }
      resolve();
    }, 100);
  });
}

export function register(username: string, password_raw: string): Promise<User> {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            const existingUser = await getUserByName(username);
            if (existingUser) {
                return reject(new Error("Este nome de usuário já está em uso."));
            }

            const isFirstUser = users.length === 0;
            const newUser: User = {
                id: String(Date.now()),
                name: username,
                role: isFirstUser ? 'admin' : 'collaborator',
                password: password_raw
            };
            users.push(newUser);
            resolve(newUser);
        }, 500);
    });
}
