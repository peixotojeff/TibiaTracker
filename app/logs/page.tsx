// src/app/logs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import type { XPLog } from '@/types';

export default function LogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get('characterId');

  const [logs, setLogs] = useState<XPLog[]>([]);
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && characterId) {
      fetchCharacterAndLogs();
    } else if (!characterId) {
      // If no characterId, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, authLoading, characterId, router]);

  const fetchCharacterAndLogs = async () => {
    try {
      // Busca dados combinados (como no statistics)
      const dataRes = await fetch(`/api/characters/${characterId}/data`);
      if (dataRes.ok) {
        const data = await dataRes.json();
        setCharacter(data.character);
        setLogs((data.logs || []).sort((a: XPLog, b: XPLog) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        console.error('Erro ao buscar dados combinados');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative py-8" style={{
        backgroundImage: 'url(/images/bg-dungeon.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-700 rounded w-1/4"></div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !character) return null;

  return (
    <div className="min-h-screen relative py-8" style={{
      backgroundImage: 'url(/images/bg-dungeon.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2 transition font-medium"
          >
            ← Voltar ao Dashboard
          </button>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
            <p className="text-blue-100">
              {character.vocation.toUpperCase()} • {character.world}
            </p>
          </div>
        </div>

        {/* Logs Section */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-6">Histórico de XP</h2>

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Nenhum log de XP encontrado.</p>
              <p className="text-gray-500 text-sm mt-2">
                Os logs aparecerão aqui quando você registrar progresso do personagem.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                      Nível
                    </th>
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                      XP Total
                    </th>
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                      XP Ganho
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => {
                    const nextLog = idx < logs.length - 1 ? logs[idx + 1] : null;
                    const xpGained = nextLog ? log.xp - nextLog.xp : 0;

                    return (
                      <tr
                        key={log.id}
                        className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {new Date(log.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{log.level}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {log.xp.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {idx === logs.length - 1 ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            <span className={`font-medium ${
                              xpGained > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {xpGained > 0 ? '+' : ''}{xpGained.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {logs.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700 rounded-lg p-6">
              <p className="text-blue-200 text-sm mb-1">Total de Registros</p>
              <p className="text-3xl font-bold text-white">{logs.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700 rounded-lg p-6">
              <p className="text-green-200 text-sm mb-1">Nível Atual</p>
              <p className="text-3xl font-bold text-white">
                {logs[0]?.level || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700 rounded-lg p-6">
              <p className="text-purple-200 text-sm mb-1">XP Total</p>
              <p className="text-3xl font-bold text-white">
                {logs[0]?.xp.toLocaleString() || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
