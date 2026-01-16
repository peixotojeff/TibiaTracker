// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase'; // ✅ Importação correta
import type { Character } from '@/types';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const fetchCharacters = async () => {
        try {
          // 👇 Use diretamente `supabase`, não `createSupabaseClient()`
          const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', user.id);

          if (error) throw error;
          setCharacters(data || []);
        } catch (err) {
          console.error('Erro ao buscar personagens:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchCharacters();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Meus Personagens</h1>
      {/* Seu JSX aqui */}
    </div>
  );
}