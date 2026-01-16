// src/app/statistics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient();
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!user) return null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Estatísticas</h1>
          </div>
          <div className="bg-gray-800 rounded-lg p-8 h-96 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const levelData = stats.map((s) => ({
    name: s.name,
    level: s.level,
  }));

  const xpData = stats.map((s) => ({
    name: s.name,
    'XP Total': Math.round(s.totalXP / 1000000),
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen relative p-4 md:p-8" style={{
      backgroundImage: 'url(/images/bg-dungeon.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-6xl mx-auto">
        {/* Cabeçalho com botão */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Estatísticas</h1>
            <p className="text-gray-400">
              Visualize as estatísticas dos seus personagens
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            } text-white shadow-md`}
          >
            {loading ? 'Atualizando...' : '🔄 Atualizar Dados'}
          </button>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700 rounded-lg p-6">
            <p className="text-blue-200 text-sm mb-1">Total de Personagens</p>
            <p className="text-3xl font-bold text-white">{stats.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700 rounded-lg p-6">
            <p className="text-green-200 text-sm mb-1">Nível Máximo</p>
            <p className="text-3xl font-bold text-white">
              {Math.max(...stats.map((s) => s.level), 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-700 rounded-lg p-6">
            <p className="text-purple-200 text-sm mb-1">XP Total</p>
            <p className="text-3xl font-bold text-white">
              {(
                stats.reduce((acc, s) => acc + s.totalXP, 0) / 1000000
              ).toFixed(1)}
              M
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border border-amber-700 rounded-lg p-6">
            <p className="text-amber-200 text-sm mb-1">Média Diária</p>
            <p className="text-3xl font-bold text-white">
              {Math.round(
                stats.reduce((acc, s) => acc + s.dailyAverage, 0) / stats.length
              ).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Níveis */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Níveis dos Personagens</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={levelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Bar dataKey="level" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de XP Total */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">XP Total (em Milhões)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={xpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Bar dataKey="XP Total" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Detalhes */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Detalhes por Personagem</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                    Personagem
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                    Nível
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                    XP Total
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                    Média Diária
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                    Dias Rastreados
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                  >
                    <td className="px-4 py-3 text-white font-medium">{stat.name}</td>
                    <td className="px-4 py-3 text-gray-300">{stat.level}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {(stat.totalXP / 1000000).toFixed(2)}M
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {stat.dailyAverage.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{stat.daysTracked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}