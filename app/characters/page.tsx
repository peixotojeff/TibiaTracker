// src/app/character/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { Character, XPLog } from '@/types';

export default function CharacterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [logs, setLogs] = useState<XPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Redireciona se não autenticado ou sem ID
  useEffect(() => {
    if (!authLoading && (!user || !id)) {
      router.push('/');
      return;
    }

    if (user && id) {
      fetchCharacterAndLogs();
    }
  }, [id, user, authLoading, router]);

  const fetchCharacterAndLogs = async () => {
    setLoading(true);

    // Busca o personagem e verifica se pertence ao usuário
    const { data: charData, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (charError || !charData) {
      alert('Personagem não encontrado ou acesso negado.');
      router.push('/');
      setLoading(false);
      return;
    }

    setCharacter(charData);

    // Busca logs de XP
    const { data: logsData, error: logsError } = await supabase
      .from('xp_logs')
      .select('*')
      .eq('character_id', id)
      .order('date', { ascending: false });

    if (logsError) {
      console.error('Erro ao carregar logs:', logsError);
    } else {
      setLogs(logsData || []);
    }

    setLoading(false);
  };

  const handleTestAndSave = async () => {
    if (!character) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: character.name,
          world: character.world,
          vocation: character.vocation,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Salva o log no banco
        const today = new Date().toISOString().split('T')[0];
        const { error: insertError } = await supabase.from('xp_logs').insert({
          character_id: character.id,
          date: today,
          level: result.level,
          xp: result.xp,
        });

        if (insertError) {
          setTestResult({ success: false, message: 'Erro ao salvar: ' + insertError.message });
        } else {
          setTestResult({ success: true, message: `✅ Registrado: Nível ${result.level}, ${result.xp.toLocaleString()} XP` });
          // Atualiza a lista de logs
          fetchCharacterAndLogs();
        }
      } else {
        setTestResult({ success: false, message: `❌ Não encontrado: ${result.message}` });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Erro na conexão com a API' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!character) {
    return <div className="p-6">Personagem não disponível.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-500 mb-4">
        ← Voltar
      </button>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{character.name}</h1>
          <p className="text-gray-600">{character.vocation} • {character.world}</p>
        </div>
        <button
          onClick={handleTestAndSave}
          disabled={testing}
          className={`px-3 py-1 rounded text-sm ${
            testing
              ? 'bg-gray-300 text-gray-500'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {testing ? 'Testando...' : 'Registrar XP agora'}
        </button>
      </div>

      {testResult && (
        <div className={`mb-4 p-2 rounded text-sm ${
          testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {testResult.message}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-3">Histórico de XP</h2>

      {logs.length === 0 ? (
        <p className="text-gray-500">Nenhum registro encontrado. Clique em "Registrar XP agora" para adicionar o primeiro.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="border p-3 rounded">
              <div className="font-medium">Nível {log.level}</div>
              <div>{log.xp.toLocaleString()} XP</div>
              <div className="text-sm text-gray-500">{log.date}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}