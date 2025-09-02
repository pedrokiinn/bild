
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, logout } from '@/lib/auth';
import { Car, ShieldAlert } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'collaborator';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário está logado no Firebase Auth. Busque o perfil no Firestore.
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userProfile = { id: userDocSnap.id, ...userDocSnap.data() } as User;
          setUser(userProfile);
          
          if (requiredRole) {
            const hasRequiredRole = userProfile.role === 'admin' || userProfile.role === requiredRole;
            setHasAccess(hasRequiredRole);
            if (!hasRequiredRole) {
              router.replace('/dashboard');
            }
          } else {
            setHasAccess(true);
          }
        } else {
          // Perfil não encontrado no Firestore, deslogar para evitar estado inconsistente.
          await logout();
          setUser(null);
          setHasAccess(false);
        }
      } else {
        // Usuário não está logado. O main-layout cuidará da tela de login.
        setUser(null);
        setHasAccess(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [requiredRole, router, auth]);

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

  // O main-layout renderizará a tela de login se não houver usuário.
  if (!user) {
    return null;
  }

  if (!hasAccess) {
    // Renderiza a tela de acesso negado se o usuário estiver logado mas não tiver a role necessária.
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
