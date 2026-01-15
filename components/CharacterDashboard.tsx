'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
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

interface DashboardData {
  logs: XPData[];
  metrics: CharacterMetrics;
}

export function CharacterDashboard({ character }: { character: Character }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/characters/${character.id}/logs`);
        if (res.ok) {
          const logs = await res.json();
          
          const metricsRes = await fetch(`/api/characters/${character.id}/metrics`);
          const metrics = metricsRes.ok ? await metricsRes.json() : null;
          
          setData({
            logs: logs as XPData[],
            metrics: metrics || {
              level_real: 0,
              media_recente: 0,
              eta_str: 'N/A',
              streak_count: 0,
              cor_delta: 'neutral',
              texto_delta: 'Sem dados',
            },
          });
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
      <div className="space-y-6 animate-pulse">
        <div className="h-80 bg-gray-700 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 bg-gray-700 rounded-lg"></div>
          <div className="h-40 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Sem dados de XP para este personagem</p>
      </div>
    );
  }

  const chartData = data.logs
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('pt-BR'),
      xp: log.xp,
      level: log.level,
      displayDate: log.date,
    }));

  // Calcular XP diário
  const dailyXPData = [];
  for (let i = 1; i < chartData.length; i++) {
    const prevXP = chartData[i - 1].xp;
    const currentXP = chartData[i].xp;
    const dailyGain = currentXP - prevXP;
    
    dailyXPData.push({
      date: chartData[i].date,
      dailyXP: dailyGain > 0 ? dailyGain : 0,
      level: chartData[i].level,
    });
  }

  // Últimos 30 dias
  const last30Days = dailyXPData.slice(-30);

  return (
    <div className="space-y-8 pb-8">
      {/* Header com Info Rápida */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Nível Atual</p>
            <p className="text-3xl font-bold text-blue-400">{data.metrics.level_real}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">XP/Dia (30d)</p>
            <p className="text-3xl font-bold text-green-400">
              {data.metrics.media_recente.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Streak</p>
            <p className="text-3xl font-bold text-purple-400">{data.metrics.streak_count}d</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Próximo nível</p>
            <p className="text-2xl font-bold text-indigo-400">{data.metrics.eta_str}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de XP Total */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white">Evolução de XP Total</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number | undefined) => [
                value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
                'XP Total',
              ]}
            />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorXP)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de XP Diário (últimos 30 dias) */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white">XP Diário (Últimos 30 dias)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={last30Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => (value / 1000).toFixed(0) + 'k'}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              formatter={(value: number | undefined) => [
                value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
                'XP Ganho',
              ]}
            />
            <Bar dataKey="dailyXP" fill="#4ade80" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Nível vs XP */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white">Nível ao longo do tempo</h3>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Line
              type="monotone"
              dataKey="level"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              name="Nível"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white">Estatísticas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBox
            label="Total de registros"
            value={chartData.length.toString()}
            color="blue"
          />
          <StatBox
            label="XP Total"
            value={chartData[chartData.length - 1]?.xp.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            }) || '0'}
            color="green"
          />
          <StatBox
            label="Ganho Médio"
            value={data.metrics.media_recente.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorMap = {
    blue: 'from-blue-900/40 to-blue-800/40 border-blue-700 text-blue-200',
    green: 'from-green-900/40 to-green-800/40 border-green-700 text-green-200',
    purple: 'from-purple-900/40 to-purple-800/40 border-purple-700 text-purple-200',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-lg p-4 border`}>
      <p className="text-sm text-gray-300 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
