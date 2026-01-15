// src/app/character/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';

type XPLog = {
  id: string;
  character_id: string;
  date: string;
  level: number;
  xp: number;
};

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<XPLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !id)) {
      router.push('/');
      return;
    }

    if (user && id) {
      const fetchLogs = async () => {
        const res = await fetch(`/api/characters/${id}/logs`);
        if (res.ok) {
          const { logs } = await res.json();
          setLogs(logs);
        } else {
          alert('Erro ao carregar logs');
          router.push('/');
        }
        setLoading(false);
      };

      fetchLogs();
    }
  }, [id, user, authLoading, router]);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="min-h-screen relative py-8" style={{
      backgroundImage: 'url(/images/bg-adventure.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="text-blue-400 hover:text-blue-300 mb-6 flex items-center gap-2 transition font-medium">
          ← Voltar
        </button>
        <h1 className="text-3xl font-bold mb-8 text-white">Meus Personagens</h1>
        {logs.length === 0 ? (
          <p>Nenhum registro encontrado.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="border p-3 rounded">
                <div>Lvl {log.level} – {log.xp.toLocaleString()} XP</div>
                <div className="text-sm text-gray-500">{log.date}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}