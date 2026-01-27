// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        router.push('/dashboard'); // ✅ Só afeta a RAIZ (/)
      } else {
        router.push('/login');
      }
    }
  }, [user, authLoading, router]);

  return <div>Carregando...</div>;
}