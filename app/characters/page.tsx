// src/app/characters/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';

export default function AddCharacterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    world: '',
    vocation: 'knight' as 'druid' | 'knight' | 'paladin' | 'sorcerer',
    category: 'main',
  });
  const [loading, setLoading] = useState(false);

  if (authLoading) return <div className="p-6">Carregando...</div>;
  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        alert('Erro ao adicionar personagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar personagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative py-8" style={{
      backgroundImage: 'url(/images/bg-adventure.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.push('/dashboard')} className="text-blue-400 hover:text-blue-300 mb-6 flex items-center gap-2 transition font-medium">
          ← Voltar ao Dashboard
        </button>
        <h1 className="text-3xl font-bold mb-8 text-white text-center">Adicionar Personagem</h1>

        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Personagem</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mundo</label>
            <input
              type="text"
              value={formData.world}
              onChange={(e) => setFormData({ ...formData, world: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o mundo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vocação</label>
            <select
              value={formData.vocation}
              onChange={(e) => setFormData({ ...formData, vocation: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="knight">Knight</option>
              <option value="paladin">Paladin</option>
              <option value="druid">Druid</option>
              <option value="sorcerer">Sorcerer</option>
            </select>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {loading ? 'Adicionando...' : 'Adicionar Personagem'}
          </button>
        </form>
      </div>
    </div>
  );
}
