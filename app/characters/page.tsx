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
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-500 mb-4">
        ← Voltar
      </button>
      <h1 className="text-2xl font-bold mb-4">Histórico de XP</h1>
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
  );
}