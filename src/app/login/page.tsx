
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para o dashboard, o MainLayout cuidará da tela de login centralizada
    router.replace('/dashboard');
  }, [router]);

  return null;
}
