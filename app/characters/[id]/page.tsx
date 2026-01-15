// src/app/character/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import type { Character } from '@/types';
import { CharacterDashboard } from '@/components/CharacterDashboard';

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !id)) {
      router.push('/');
      return;
    }

    if (user && id) {
      const fetchCharacter = async () => {
        try {
          const res = await fetch(`/api/characters/${id}`);
          if (res.ok) {
            const data = await res.json();
            setCharacter(data);
          } else {
            alert('Erro ao carregar personagem');
            router.push('/');
          }
        } catch (error) {
          console.error('Erro:', error);
          router.push('/');
        } finally {
          setLoading(false);
        }
      };

      fetchCharacter();
    }
  }, [id, user, authLoading, router]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4 w-1/4"></div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">Personagem não encontrado</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700 transition"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-8" style={{
      backgroundImage: 'url(/images/bg-dungeon.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 px-4 py-2 text-gray-300 hover:text-white font-medium flex items-center gap-2 transition"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white">{character.name}</h1>
          <p className="text-lg text-gray-300 mt-1">
            {character.vocation.toUpperCase()} • {character.world}
          </p>
        </div>

        {/* Dashboard com Gráficos */}
        <CharacterDashboard character={character} />
      </div>
    </div>
  );
}