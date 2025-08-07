'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, getCurrentUser } from '@/lib/auth';
import { Car } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'collaborator';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (!currentUser) {
          router.push('/'); // Redirect to login if not authenticated
        } else if (requiredRole && currentUser.role !== requiredRole) {
          router.push('/dashboard'); // Redirect to dashboard if not authorized
        }
      } catch (error) {
        setUser(null);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Car className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    // This will be briefly displayed before redirection kicks in
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <p>Redirecionando...</p>
        </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
