'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, getCurrentUser } from '@/lib/auth';
import { Car, ShieldAlert } from 'lucide-react';
import { MainLayout } from '../layout/main-layout';

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
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (!currentUser) {
          // The main-layout will handle showing the login screen.
          setHasAccess(false);
      } else if (requiredRole) {
        // Admin has access to everything
        const hasRequiredRole = currentUser.role === 'admin' || currentUser.role === requiredRole;
        setHasAccess(hasRequiredRole);
        if(!hasRequiredRole) {
          // This should ideally not happen if navigation is controlled, but as a fallback:
          router.push('/dashboard'); 
        }
      } else {
        setHasAccess(true);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [requiredRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // The login UI is now handled by MainLayout, so if there's no user,
  // MainLayout will render the login form, and we shouldn't render anything here.
  // The check for `hasAccess` is for role-based protection after login.
  if (!user) {
    return null; // MainLayout will render the login screen
  }

  if (!hasAccess) {
    return (
        // This will be shown inside the MainLayout if the user is logged in but lacks permissions
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
