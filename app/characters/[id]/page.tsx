// src/app/character/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import type { Character, XPLog } from '@/types';

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [logs, setLogs] = useState<XPLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !id)) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      // Verifica se o personagem pertence ao usuário
      const { data: charData, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (charError || !charData) {
        alert('Personagem não encontrado ou acesso negado.');
        router.push('/');
        return;
      }

      setCharacter(charData);

      // Carrega logs
      const { data: logsData } = await supabase
        .from('xp_logs')
        .select('*')
        .eq('character_id', id)
        .order('date', { ascending: false });

      setLogs(logsData || []);
      setLoading(false);
    };

    fetchData();
  }, [id, user, authLoading, router]);

  if (loading || !character) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-500 mb-4">
        ← Voltar
      </button>
      <h1 className="text-2xl font-bold mb-2">{character.name}</h1>
      <p className="text-gray-600 mb-6">
        {character.vocation} • {character.world}
      </p>

      <h2 className="text-xl font-semibold mb-3">Histórico de XP</h2>
      {logs.length === 0 ? (
        <p className="text-gray-500">Nenhum log registrado ainda.</p>
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