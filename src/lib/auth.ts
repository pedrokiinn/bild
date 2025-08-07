// A mock auth.ts file to simulate user authentication
export interface User {
  id: string;
  name?: string | null;
  role: 'admin' | 'collaborator';
}

// Simulate a logged-in user
let currentUser: User | null = {
  id: '1',
  name: 'Admin User',
  role: 'admin',
};

export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(currentUser);
    }, 500);
  });
}

export function login(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentUser = {
        id: '1',
        name: 'Admin User',
        role: 'admin',
      };
      // In a real app, you'd redirect or reload. Here we just resolve.
      resolve();
    }, 500);
  });
}

export function logout(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentUser = null;
      // In a real app, you'd redirect or reload. Here we just resolve.
      resolve();
    }, 500);
  });
}
