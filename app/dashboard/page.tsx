// src/app/dashboard/page.tsx
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
} from 'recharts';
import type { Character } from '@/types';

interface XPData {
  date: string;
  xp: number;
  level: number;
}

interface CharacterMetrics {
  level_real: number;
  media_recente: number;
  eta_str: string;
  streak_count: number;
  cor_delta: string;
  texto_delta: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'xp'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allMetrics, setAllMetrics] = useState<Record<string, CharacterMetrics>>({});

  // Filter and sort characters
  const filteredAndSortedCharacters = characters
    .filter(char => char.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'level') {
        const aLevel = allMetrics[a.id]?.level_real || 0;
        const bLevel = allMetrics[b.id]?.level_real || 0;
        return bLevel - aLevel; // Higher level first
      } else if (sortBy === 'xp') {
        const aXP = allMetrics[a.id]?.media_recente || 0;
        const bXP = allMetrics[b.id]?.media_recente || 0;
        return bXP - aXP; // Higher XP first
      }
      return 0;
    });

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este personagem?')) return;

    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCharacters(characters.filter(char => char.id !== id));
      } else {
        alert('Erro ao excluir personagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir personagem');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const fetchCharacters = async () => {
        const res = await fetch('/api/characters');
        if (res.ok) {
          const data = await res.json();
          setCharacters(data);

          // Fetch metrics for all characters
          const metricsPromises = data.map(async (char: Character) => {
            const metricsRes = await fetch(`/api/characters/${char.id}/metrics`);
            if (metricsRes.ok) {
              const metricsData = await metricsRes.json();
              return { id: char.id, metrics: metricsData };
            }
            return null;
          });

          const metricsResults = await Promise.all(metricsPromises);
          const metricsMap: Record<string, CharacterMetrics> = {};
          metricsResults.forEach(result => {
            if (result) {
              metricsMap[result.id] = result.metrics;
            }
          });
          setAllMetrics(metricsMap);
        }
        setLoading(false);
      };
      fetchCharacters();
    }
  }, [user, authLoading, router]);

  if (loading)
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-80 bg-gray-700 rounded"></div>
              <div className="h-80 bg-gray-700 rounded"></div>
              <div className="h-80 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen relative py-8" style={{
      backgroundImage: 'url(/images/bg-dungeon.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar personagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'level' | 'xp')}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="name">Ordenar por Nome</option>
              <option value="level">Ordenar por Nível</option>
              <option value="xp">Ordenar por XP/Dia</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              title="Visualização em Grade"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              title="Visualização em Lista"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 mb-4">Nenhum personagem cadastrado.</p>
            <button
              onClick={() => router.push('/characters')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
            >
              Cadastrar seu primeiro personagem
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredAndSortedCharacters.map((char) => (
              <CharacterCard key={char.id} character={char} onDelete={handleDeleteCharacter} viewMode={viewMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterCard({ character, onDelete, viewMode }: { character: Character; onDelete: (id: string) => void; viewMode: 'grid' | 'list' }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<CharacterMetrics | null>(null);
  const [chartData, setChartData] = useState<XPData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsRes = await fetch(`/api/characters/${character.id}/metrics`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        const logsRes = await fetch(`/api/characters/${character.id}/logs`);
        if (logsRes.ok) {
          const logs = await logsRes.json();
          setChartData(
            logs.logs
              .sort((a: XPData, b: XPData) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
              )
              .slice(-7)
          );
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [character.id]);

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden animate-pulse">
        <div className="p-6">
          <div className="h-6 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Calcular XP diário para o mini gráfico
  const dailyData = [];
  for (let i = 1; i < chartData.length; i++) {
    const prevXP = chartData[i - 1].xp;
    const currentXP = chartData[i].xp;
    const dailyGain = currentXP - prevXP;
    dailyData.push({
      date: new Date(chartData[i].date).toLocaleDateString('pt-BR', { day: '2-digit' }),
      xp: dailyGain > 0 ? dailyGain : 0,
    });
  }

  if (viewMode === 'list') {
    return (
      <div
        className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-600 cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-500/20"
        onClick={() => router.push(`/logs?characterId=${character.id}`)}
      >
        <div className="flex items-center p-4">
          {/* Character Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{character.name}</h3>
                <p className="text-gray-400 text-sm">
                  {character.vocation.toUpperCase()} • {character.world}
                </p>
              </div>
              {metrics && (
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-xs text-blue-300">Nível</p>
                    <p className="text-lg font-bold text-blue-400">{metrics.level_real}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-green-300">XP/Dia</p>
                    <p className="text-lg font-bold text-green-400">
                      {Math.round(metrics.media_recente).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Próximo nível</p>
                    <p className="text-sm font-semibold text-gray-200">{metrics.eta_str}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Streak</p>
                    <p
                      className={`font-semibold text-sm ${
                        metrics.cor_delta === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {metrics.streak_count}d
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(character.id);
              }}
              className="text-red-300 hover:text-red-100 transition p-2"
              title="Excluir personagem"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition">
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-600 cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-500/20"
      onClick={() => router.push(`/logs?characterId=${character.id}`)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(character.id);
          }}
          className="absolute top-2 right-2 text-red-300 hover:text-red-100 transition"
          title="Excluir personagem"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">{character.name}</h2>
        <p className="text-blue-100 text-sm">
          {character.vocation.toUpperCase()} • {character.world}
        </p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="p-6 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-900/30 border border-blue-700/30 rounded p-3">
              <p className="text-xs text-blue-300">Nível</p>
              <p className="text-2xl font-bold text-blue-400">{metrics.level_real}</p>
            </div>
            <div className="bg-green-900/30 border border-green-700/30 rounded p-3">
              <p className="text-xs text-green-300">XP/Dia (30d)</p>
              <p className="text-lg font-bold text-green-400">
                {Math.round(metrics.media_recente).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Mini Chart */}
          {dailyData.length > 0 && (
            <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
              <p className="text-xs text-gray-300 font-medium mb-2">XP Últimos 7 dias</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#4b5563"
                    horizontal={false}
                  />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} hide={true} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number | undefined) => [
                      value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
                      'XP',
                    ]}
                  />
                  <Bar dataKey="xp" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div>
              <p className="text-xs text-gray-400">Próximo nível</p>
              <p className="text-lg font-semibold text-gray-200">{metrics.eta_str}</p>
            </div>
            <div className={`text-right`}>
              <p className="text-xs text-gray-400">Status</p>
              <p
                className={`font-semibold text-sm ${
                  metrics.cor_delta === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {metrics.streak_count}d streak
              </p>
            </div>
          </div>

          {/* View Details Button */}
          <button className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition">
            Ver Detalhes Completos
          </button>
        </div>
      )}
    </div>
  );
}
