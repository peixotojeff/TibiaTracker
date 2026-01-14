// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { createSupabaseClient } from '@/lib/supabase';
import type { Character } from '@/types';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newChar, setNewChar] = useState({
    name: '',
    world: '',
    vocation: 'druid' as const,
  });

  // ✅ Estados para o botão "Testar"
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Carrega personagens do usuário
  useEffect(() => {
    if (user) {
      const fetchCharacters = async () => {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) {
          console.error('Erro ao carregar personagens:', error);
        } else {
          setCharacters(data || []);
        }
        setLoading(false);
      };

      fetchCharacters();
    }
  }, [user]);

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newChar.name.trim() || !newChar.world.trim()) {
      alert('Preencha todos os campos.');
      return;
    }

    const { error } = await supabase.from('characters').insert({
      user_id: user.id,
      name: newChar.name.trim(),
      world: newChar.world.trim(),
      vocation: newChar.vocation,
      category: 'experience',
      created_at: new Date().toISOString(), // ← evita erro de NOT NULL
    });

    if (error) {
      alert('Erro ao adicionar personagem: ' + error.message);
    } else {
      setNewChar({ name: '', world: '', vocation: 'druid' });
      setShowForm(false);
      // Recarrega a lista
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id);
      setCharacters(data || []);
    }
  };

  const handleTestCharacter = async (char: Character) => {
    setTestingId(char.id);
    setTestResults((prev) => ({ ...prev, [char.id]: null }));

    try {
      const response = await fetch('/api/test-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: char.name,
          world: char.world,
          vocation: char.vocation,
        }),
      });

      const result = await response.json();
      setTestResults((prev) => ({ ...prev, [char.id]: result }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [char.id]: { success: false, message: 'Erro na conexão com a API' },
      }));
    } finally {
      setTestingId(null);
    }
  };

  if (authLoading || loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tibia Tracker</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-red-500 text-sm"
        >
          Sair
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Meus Personagens</h2>
        {characters.length === 0 ? (
          <p className="text-gray-500">Nenhum personagem cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {characters.map((char) => (
              <li
                key={char.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="font-medium">{char.name}</div>
                <div className="text-sm text-gray-600 mb-2">
                  {char.vocation} • {char.world}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/character/${char.id}`)}
                    className="text-blue-500 text-sm underline"
                  >
                    Ver histórico
                  </button>
                  <button
                    onClick={() => handleTestCharacter(char)}
                    disabled={testingId === char.id}
                    className={`text-sm px-2 py-1 rounded ${
                      testingId === char.id
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {testingId === char.id ? 'Testando...' : 'Testar'}
                  </button>
                </div>
                {testResults[char.id] && (
                  <div
                    className={`mt-2 text-sm p-2 rounded ${
                      testResults[char.id].success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {testResults[char.id].success
                      ? `✅ Encontrado! Nível ${testResults[char.id].level}, ${testResults[char.id].xp.toLocaleString()} XP`
                      : `❌ Não encontrado: ${testResults[char.id].message}`}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="text-blue-500 underline mb-4"
      >
        {showForm ? 'Cancelar' : 'Adicionar novo personagem'}
      </button>

      {showForm && (
        <form onSubmit={handleAddCharacter} className="bg-gray-50 p-4 rounded-lg">
          <input
            type="text"
            placeholder="Nome do personagem"
            value={newChar.name}
            onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="text"
            placeholder="Mundo (ex: Calmera, Antica...)"
            value={newChar.world}
            onChange={(e) => setNewChar({ ...newChar, world: e.target.value })}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <select
            value={newChar.vocation}
            onChange={(e) => setNewChar({ ...newChar, vocation: e.target.value as any })}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="druids">Druid</option>
            <option value="knights">Knight</option>
            <option value="paladins">Paladin</option>
            <option value="sorcerers">Sorcerer</option>
          </select>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Salvar Personagem
          </button>
        </form>
      )}
    </div>
  );
}