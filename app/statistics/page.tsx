'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Character } from '@/types';

interface CharacterStats {
  name: string;
  level: number;
  totalXP: number;
  dailyAverage: number;
  daysTracked: number;
}

export default function StatisticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stats, setStats] = useState<CharacterStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const fetchData = async () => {
        try {
          const res = await fetch('/api/characters');
          if (res.ok) {
            const data = await res.json();
            setCharacters(data);

            // Calcular estatísticas para cada personagem
            const characterStats: CharacterStats[] = [];
            for (const character of data) {
              const statsRes = await fetch(
                `/api/characters/${character.id}/stats`
              );
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                characterStats.push({
                  name: character.name,
                  level: statsData.level_real || 0,
                  totalXP: statsData.xp_total || 0,
                  dailyAverage: statsData.media_recente || 0,
                  daysTracked: statsData.dias_rastreados || 0,
                });
              }
            }
            setStats(characterStats);
          }
        } catch (error) {
          console.error('Erro ao buscar estatísticas:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
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
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Estatísticas</h1>
          <p className="text-gray-400">
            Visualize as estatísticas dos seus personagens
          </p>
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
