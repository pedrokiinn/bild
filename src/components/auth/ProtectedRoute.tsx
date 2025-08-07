'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, getCurrentUser } from '@/lib/auth';
import { Car, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'collaborator';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (!currentUser) {
          setHasAccess(false);
          router.push('/');
        } else if (requiredRole) {
          const hasRequiredRole = currentUser.role === requiredRole;
          setHasAccess(hasRequiredRole);
          if(!hasRequiredRole) {
            router.push('/dashboard');
          }
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        setUser(null);
        setHasAccess(false);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // This will be briefly displayed before redirection kicks in
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <p>Redirecionando para o login...</p>
        </div>
    );
  }

  if (!hasAccess) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Acesso Negado</h2>
                <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
            </div>
        </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
