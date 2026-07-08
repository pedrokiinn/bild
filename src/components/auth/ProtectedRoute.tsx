
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'collaborator';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const user = useUser();
  const router = useRouter();

  // Se o MainLayout ainda está carregando o usuário, ele lida com o loading global.
  // Se chegamos aqui e não há usuário, o MainLayout deveria ter mostrado a tela de login.
  if (!user) {
    return null;
  }

  const hasAccess = !requiredRole || user.role === 'admin' || user.role === requiredRole;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Acesso Negado</h2>
          <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
          <button 
            onClick={() => router.replace('/dashboard')}
            className="text-primary font-semibold hover:underline"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
