'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';

interface CharacterRanking {
  id: string;
  name: string;
  world: string;
  vocation: string;
  streak_count: number;
  level_real: number;
  media_recente: number;
  user_email: string;
}

interface RankingsData {
  global: CharacterRanking[];
  worlds: Record<string, CharacterRanking[]>;
  vocations: Record<string, CharacterRanking[]>;
  allVocations: string[];
}

const VOCATION_OPTIONS = [
  'Elite Knight',
  'Royal Paladin',
  'Elder Druid',
  'Master Sorcerer',
  'Exalted Monk'
];

export default function RankingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'world' | 'vocation'>('global');
  const [selectedWorld, setSelectedWorld] = useState<string>('');
  const [selectedVocation, setSelectedVocation] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchRankings();
    }
  }, [user, authLoading, router]);

  const fetchRankings = async () => {
    try {
      const res = await fetch('/api/rankings');
      if (res.ok) {
        const data = await res.json();
        setRankings(data);

        // Set default selections
        if (data.worlds && Object.keys(data.worlds).length > 0) {
          setSelectedWorld(Object.keys(data.worlds)[0]);
        }
        if (data.vocations && Object.keys(data.vocations).length > 0) {
          setSelectedVocation(Object.keys(data.vocations)[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-700 rounded w-1/4"></div>
            <div className="h-80 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderRankingTable = (characters: CharacterRanking[], title: string) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-blue-100 text-sm">Ranking baseado na streak dos últimos 7 dias</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuário</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Personagem</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Mundo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Classe</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nível</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">XP/Dia</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {characters.map((char, index) => (
              <tr key={char.id} className="hover:bg-gray-700/50 transition">
                <td className="px-4 py-3 text-sm font-medium text-white">{index + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{char.user_email.split('@')[0]}</td>
                <td className="px-4 py-3 text-sm text-white font-medium">{char.name}</td>
                <td className="px-4 py-3 text-sm text-blue-400">{char.world}</td>
                <td className="px-4 py-3 text-sm text-green-400 capitalize">{char.vocation}</td>
                <td className="px-4 py-3 text-sm text-yellow-400">{char.level_real}</td>
                <td className="px-4 py-3 text-sm text-purple-400">
                  {Math.round(char.media_recente).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                    {char.streak_count} dias
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {characters.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-400">Nenhum personagem encontrado com streak ativa nos últimos 7 dias.</p>
        </div>
      )}
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Rankings</h1>
          <p className="text-xl text-gray-300">Top jogadores por streak de atividade</p>
          <p className="text-sm text-gray-400 mt-2">Ranking resetado a cada 7 dias • Apenas streaks ativas são exibidas</p>
          <p className="text-sm text-gray-400 mt-2">Streak é quantos dias está acima da média experiência dos últimos 30 dias</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 p-1 rounded-lg border border-gray-700">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'global'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setActiveTab('world')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'world'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Por Mundo
            </button>
            <button
              onClick={() => setActiveTab('vocation')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                activeTab === 'vocation'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Por Classe
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'global' && rankings && (
            renderRankingTable(rankings.global, 'Ranking Global')
          )}

          {activeTab === 'world' && rankings && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <select
                  value={selectedWorld}
                  onChange={(e) => setSelectedWorld(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(rankings.worlds).map(world => (
                    <option key={world} value={world}>{world}</option>
                  ))}
                </select>
              </div>
              {selectedWorld && renderRankingTable(rankings.worlds[selectedWorld] || [], `Ranking - Mundo ${selectedWorld}`)}
            </div>
          )}

          {activeTab === 'vocation' && rankings && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <select
                  value={selectedVocation}
                  onChange={(e) => setSelectedVocation(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {rankings.allVocations.map(vocation => (
                    <option key={vocation} value={vocation}>{vocation}</option>
                  ))}
                </select>
              </div>
              {selectedVocation && renderRankingTable(rankings.vocations[selectedVocation] || [], `Ranking - Classe ${selectedVocation.charAt(0).toUpperCase() + selectedVocation.slice(1)}`)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
