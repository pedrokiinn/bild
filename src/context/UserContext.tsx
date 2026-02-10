
'use client';
import { createContext, useContext, ReactNode } from 'react';
import type { User } from '@/types';

const UserContext = createContext<User | null>(null);

export const UserProvider = ({ children, user }: { children: ReactNode; user: User | null }) => {
    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
