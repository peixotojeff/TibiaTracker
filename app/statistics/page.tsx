// src/app/statistics/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
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
  AreaChart,
  Area,
  LabelList,
} from 'recharts';
import { useAuth } from '@/contexts/AuthProvider';

interface CharacterStats {
  name: string;
  level: number;
  totalXP: number;
  dailyAverage: number;
  daysTracked: number;
  vocation: string;
  world: string;
  xpLogs: { date: string; xp: number; level: number }[];
  huntHeatmap: number[][];
  dailyXPData: { date: string; dailyXP: number; movingAvg7: number; movingAvg30: number }[];
  milestoneDates: { [key: number]: string | null };
  estimatedDateToNext100Levels: string | null;
}

// Function to calculate total XP needed to reach a specific level
function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let totalXP = 0;
  for (let l = 1; l < level; l++) {
    totalXP += (l * l + 50 * l + 100) * 50;
  }
  return totalXP;
}

export default function StatisticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<CharacterStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const router = useRouter();

  // Função para buscar dados dos personagens
  const fetchCharacterData = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/statistics');
      if (response.ok) {
        const characterStats = await response.json();
        setStats(characterStats);
      } else {
        console.error('Erro ao buscar estatísticas:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Redireciona se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Busca dados quando o usuário estiver definido
  useEffect(() => {
    if (user) {
      fetchCharacterData();
    }
  }, [user]);

  // Define o personagem selecionado quando os dados são carregados
  useEffect(() => {
    if (stats.length > 0 && !selectedCharacter) {
      setSelectedCharacter(stats[0].name);
    }
  }, [stats, selectedCharacter]);

  // Encontra o personagem selecionado
  const selectedChar = stats.find(stat => stat.name === selectedCharacter) || stats[0];

  // Calculated statistics
  const calculatedStats = useMemo(() => {
    if (!stats.length) return { streak: 0, bestDay: { xp: 0, date: '' }, consistency: 0 };

    const firstChar = stats[0];

    if (!firstChar.dailyXPData || !firstChar.xpLogs) return { streak: 0, bestDay: { xp: 0, date: '' }, consistency: 0 };

    // 🔥 Streak: Consecutive days with dailyXP > 30-day average (from most recent)
    let streak = 0;
    for (let i = firstChar.dailyXPData.length - 1; i >= 0; i--) {
      const data = firstChar.dailyXPData[i];
      if (data.dailyXP > data.movingAvg30) {
        streak++;
      } else {
        break;
      }
    }

    // 🏆 Melhor Dia: Highest dailyXP and its date
    let bestDay = { xp: 0, date: '' };
    for (const data of firstChar.dailyXPData) {
      if (data.dailyXP > bestDay.xp) {
        bestDay = { xp: data.dailyXP, date: data.date };
      }
    }

    // 📅 Consistência: Percentage of days played in the current year
    const currentYear = new Date().getFullYear();
    const daysPlayed = new Set(
      firstChar.xpLogs
        .filter(log => new Date(log.date).getFullYear() === currentYear)
        .map(log => log.date)
    ).size;
    const daysSoFar = Math.ceil(
      (new Date().getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)
    );
    const consistency = daysSoFar > 0 ? (daysPlayed / daysSoFar) * 100 : 0;

    return { streak, bestDay, consistency: Math.round(consistency) };
  }, [stats]);

  // Função para atualizar dados
  const handleRefresh = () => {
    if (user) {
      fetchCharacterData();
    }
  };

  // Estado de carregamento
  if (loading && !stats.length) {
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

  if (!user) return null;

  const levelData = stats.map((s) => ({
    name: s.name,
    level: s.level,
  }));

  const xpData = stats.map((s) => ({
    name: s.name,
    'XP Total': Math.round(s.totalXP / 1000000),
  }));

  // Data for vocation pie chart
  const vocationCounts = stats.reduce((acc, stat) => {
    acc[stat.vocation] = (acc[stat.vocation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vocationData = Object.entries(vocationCounts).map(([vocation, count]) => ({
    name: vocation,
    value: count,
  }));

  const vocationColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Data for daily average bar chart
  const dailyAverageData = stats.map((s) => ({
    name: s.name,
    'Média Diária': s.dailyAverage,
  }));

  // Data for XP over time line chart (using selected character's logs)
  const xpOverTimeData = selectedChar?.xpLogs.map((log) => ({
    date: new Date(log.date).toLocaleDateString('pt-BR'),
    xp: log.xp / 1000000, // in millions
  })) || [];

  // Data for daily XP with moving averages (using selected character's data, last 30 days)
  const dailyXPChartData = selectedChar?.dailyXPData.slice(-30).map((data) => ({
    date: new Date(data.date).toLocaleDateString('pt-BR'),
    'XP Diário': data.dailyXP / 1000000, // in millions
    'Média 7D': data.movingAvg7 / 1000000, // in millions
    'Média 30D': data.movingAvg30 / 1000000, // in millions
  })) || [];

  // Data for ETA Scenarios Analysis
  const etaData = (() => {
    if (!selectedChar) return [];

    const char = selectedChar;
    const currentLevel = char.level;
    const currentXP = char.totalXP;
    const targetLevel = currentLevel + 100;
    const xpNeeded = getXPForLevel(targetLevel) - currentXP;

    // General average (last 7 days)
    const generalAvg = char.dailyAverage;
    const daysGeneral = generalAvg > 0 ? Math.ceil(xpNeeded / generalAvg) : null;

    // 30-day average
    const last30Avg = char.dailyXPData.length > 0 ? char.dailyXPData[char.dailyXPData.length - 1].movingAvg30 : generalAvg;
    const days30 = last30Avg > 0 ? Math.ceil(xpNeeded / last30Avg) : null;

    // Best day
    const bestDayXP = calculatedStats.bestDay.xp;
    const daysBest = bestDayXP > 0 ? Math.ceil(xpNeeded / bestDayXP) : null;

    return [
      { scenario: 'Média Geral', days: daysGeneral },
      { scenario: 'Média 30 Dias', days: days30 },
      { scenario: 'Melhor Dia', days: daysBest },
    ].filter(item => item.days !== null);
  })();

  return (
    <div className="min-h-screen relative p-4 md:p-8" style={{
      backgroundImage: 'url(/images/bg-dungeon.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-6xl mx-auto">
        {/* Cabeçalho com seletor de personagem e botão */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Estatísticas</h1>
            <p className="text-gray-400">
              Visualize as estatísticas dos seus personagens
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {stats.length > 0 && (
              <div className="flex flex-col">
                <label htmlFor="character-select" className="text-sm text-gray-300 mb-1">
                  Selecionar Personagem:
                </label>
                <select
                  id="character-select"
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                >
                  {stats.map((stat) => (
                    <option key={stat.name} value={stat.name}>
                      {stat.name} (Lv. {stat.level})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition self-end ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              } text-white shadow-md`}
            >
              {loading ? 'Atualizando...' : '🔄 Atualizar Dados'}
            </button>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                stats.reduce((acc, s) => acc + s.dailyAverage, 0) / (stats.length || 1)
              ).toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 border border-indigo-700 rounded-lg p-6">
            <p className="text-indigo-200 text-sm mb-1">Data Estimada para +100 Níveis</p>
            <p className="text-3xl font-bold text-white">
              {stats.length > 0 && stats[0].estimatedDateToNext100Levels !== null
                ? stats[0].estimatedDateToNext100Levels
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Estatísticas de Desempenho */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-700 rounded-lg p-6">
            <p className="text-red-200 text-sm mb-1">🔥 Streak</p>
            <p className="text-3xl font-bold text-white">{calculatedStats.streak} dias</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border border-yellow-700 rounded-lg p-6">
            <p className="text-yellow-200 text-sm mb-1">🏆 Melhor Dia</p>
            <p className="text-3xl font-bold text-white">
              {calculatedStats.bestDay.xp > 0 ? calculatedStats.bestDay.xp.toLocaleString() : '0'}
            </p>
            <p className="text-yellow-300 text-xs mt-1">
              {calculatedStats.bestDay.date ? new Date(calculatedStats.bestDay.date).toLocaleDateString('pt-BR') : ''}
            </p>
          </div>
          <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/40 border border-cyan-700 rounded-lg p-6">
            <p className="text-cyan-200 text-sm mb-1">📅 Consistência</p>
            <p className="text-3xl font-bold text-white">{calculatedStats.consistency}%</p>
          </div>
        </div>

        {/* Gráfico de Tendência de Desempenho - Largura Total */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Tendência de Desempenho - {selectedChar?.name}</h2>
            {selectedChar?.xpLogs && selectedChar.xpLogs.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={(() => {
                  const logs = selectedChar.xpLogs;
                  const data = logs.map((log, index) => ({
                    date: new Date(log.date).toLocaleDateString('pt-BR'),
                    level: log.level,
                    days: index,
                  }));

                  // Calculate linear regression
                  const n = data.length;
                  const sumX = data.reduce((sum, point) => sum + point.days, 0);
                  const sumY = data.reduce((sum, point) => sum + point.level, 0);
                  const sumXY = data.reduce((sum, point) => sum + point.days * point.level, 0);
                  const sumXX = data.reduce((sum, point) => sum + point.days * point.days, 0);

                  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                  const intercept = (sumY - slope * sumX) / n;

                  // Add trend line points
                  const trendData = data.map(point => ({
                    ...point,
                    trend: slope * point.days + intercept,
                  }));

                  return trendData;
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="level"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Nível Atual"
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Tendência Linear"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhum dado de desempenho encontrado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráficos de Largura Total */}
        <div className="space-y-8 mb-8">
          {/* Gráfico de Taxa de Progressão de Nível */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Taxa de Progressão de Nível - {selectedChar?.name}</h2>
            {selectedChar?.xpLogs && selectedChar.xpLogs.length > 1 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={(() => {
                  const logs = selectedChar.xpLogs;
                  const data = [];

                  for (let i = 1; i < logs.length; i++) {
                    const currentLog = logs[i];
                    const previousLog = logs[i - 1];
                    const daysDiff = (new Date(currentLog.date).getTime() - new Date(previousLog.date).getTime()) / (1000 * 60 * 60 * 24);
                    const levelDiff = currentLog.level - previousLog.level;

                    if (daysDiff > 0) {
                      data.push({
                        date: new Date(currentLog.date).toLocaleDateString('pt-BR'),
                        levelsPerDay: levelDiff / daysDiff,
                        cumulativeLevels: currentLog.level,
                      });
                    }
                  }

                  // Limit to last 60 days
                  return data.slice(-60);
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                    formatter={(value: number | undefined) => [value ? value.toFixed(2) + ' níveis/dia' : '0.00 níveis/dia', 'Taxa de Progressão']}
                  />
                  <Line
                    type="monotone"
                    dataKey="levelsPerDay"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Níveis por Dia"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Dados insuficientes para calcular taxa de progressão.</p>
                <p className="text-gray-500 text-sm mt-2">
                  São necessários pelo menos 2 registros de XP para calcular a taxa.
                </p>
              </div>
            )}
          </div>

          {/* Gráfico de Eficiência de XP */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Eficiência de XP Diária - {selectedChar?.name}</h2>
            {selectedChar?.dailyXPData && selectedChar.dailyXPData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={selectedChar.dailyXPData.slice(-14).map((data) => ({
                  date: new Date(data.date).toLocaleDateString('pt-BR'),
                  xpDiario: data.dailyXP,
                  media7d: data.movingAvg7,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                    formatter={(value: number | undefined, name: string | undefined) => [
                      (value || 0).toLocaleString() + ' XP',
                      name === 'xpDiario' ? 'XP Diário' : 'Média 7 Dias'
                    ]}
                  />
                  <Bar dataKey="xpDiario" fill="#3b82f6" radius={[2, 2, 0, 0]} name="xpDiario" />
                  <Line
                    type="monotone"
                    dataKey="media7d"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Média 7 Dias"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhum dado de XP diário encontrado.</p>
                <p className="text-gray-500 text-sm mt-2">
                  Os dados aparecerão aqui quando houver mais registros de XP.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Progressão de XP ao Longo do Tempo */}
        {xpOverTimeData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Progressão de XP - {selectedChar?.name}</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={xpOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Area type="monotone" dataKey="xp" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de XP Diário com Médias Móveis */}
        {stats.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">XP Diário com Médias Móveis - {selectedChar?.name}</h2>
            {dailyXPChartData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhum dado de XP diário encontrado.</p>
                <p className="text-gray-500 text-sm mt-2">
                  Os dados aparecerão aqui quando houver mais registros de XP.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyXPChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6',
                    }}
                  />
                  <Line type="monotone" dataKey="XP Diário" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Média 7D" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Média 30D" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Heatmap de Intensidade de Hunts */}
        {stats.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Intensidade de Hunts (52 Semanas do Ano)</h2>
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Header with week numbers */}
                <div className="flex mb-2">
                  <div className="w-12"></div>
                  {Array.from({ length: 52 }, (_, weekIndex) => (
                    <div key={weekIndex} className="w-6 text-center text-xs text-gray-400">
                      {weekIndex + 1}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, dayIndex) => (
                  <div key={day} className="flex items-center mb-1">
                    <div className="w-12 text-sm text-gray-300 font-medium">{day}</div>
                    {Array.from({ length: 52 }, (_, weekIndex) => {
                      const activity = selectedChar?.huntHeatmap?.[weekIndex]?.[dayIndex] || 0;
                      const intensity = activity > 0 ? Math.min(activity / 10000, 1) : 0; // Assuming max activity is 10000 XP/h

                      let bgColor = 'bg-gray-700';
                      if (intensity > 0.8) bgColor = 'bg-red-500';
                      else if (intensity > 0.6) bgColor = 'bg-orange-500';
                      else if (intensity > 0.4) bgColor = 'bg-yellow-500';
                      else if (intensity > 0.2) bgColor = 'bg-green-500';
                      else if (intensity > 0) bgColor = 'bg-green-700';

                      return (
                        <div
                          key={weekIndex}
                          className={`w-6 h-6 ${bgColor} border border-gray-600 rounded-sm`}
                          title={`${day}, Semana ${weekIndex + 1} - ${activity.toFixed(0)} XP/h`}
                        ></div>
                      );
                    })}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-center mt-4 space-x-2">
                  <span className="text-sm text-gray-400">Menos</span>
                  <div className="flex space-x-1">
                    <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-700 border border-gray-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-green-500 border border-gray-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-yellow-500 border border-gray-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-orange-500 border border-gray-600 rounded-sm"></div>
                    <div className="w-4 h-4 bg-red-500 border border-gray-600 rounded-sm"></div>
                  </div>
                  <span className="text-sm text-gray-400">Mais</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTÓRICO DE MARCOS ATINGIDOS */}
        {stats.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">HISTÓRICO DE MARCOS ATINGIDOS - {selectedChar?.name}</h2>
            <div className="space-y-2">
              {[200, 400, 600, 800, 900, 1000].map(milestone => (
                <div key={milestone} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <span className="text-gray-300 font-medium">Level {milestone} atingido em:</span>
                  <span className="text-white font-semibold">
                    {selectedChar?.milestoneDates?.[milestone] || 'Ainda não alcançado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANÁLISE DE CENÁRIOS (ETA) */}
        {etaData.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">ANÁLISE DE CENÁRIOS (ETA) - {selectedChar?.name}</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={etaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="scenario" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value: number | undefined) => [value ? value.toLocaleString() + ' dias' : 'N/A', 'Dias Estimados']}
                />
                <Bar dataKey="days" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="days" position="top" style={{ fontSize: '12px', fill: '#9ca3af' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

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
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                    Data Estimada para +100 Níveis
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
                    <td className="px-4 py-3 text-gray-300">
                      {stat.estimatedDateToNext100Levels !== null ? stat.estimatedDateToNext100Levels : 'N/A'}
                    </td>
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