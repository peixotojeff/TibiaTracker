// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { createSupabaseClient } from '@/lib/supabase';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          // Verifica se o e-mail precisa ser confirmado
          if (data.user?.identities?.length === 0) {
            setMessage('✅ Conta criada! Por favor, verifique seu e-mail para confirmar.');
          } else {
            // Se autoconfirm estiver ativado (não recomendado)
            router.push('/');
          }
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Verifica se o erro é de "email not confirmed"
          if (error.message.includes('Email not confirmed')) {
            setMessage('⚠️ Por favor, confirme seu e-mail antes de fazer login.');
          } else {
            setMessage(error.message);
          }
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setMessage('Por favor, digite seu e-mail primeiro.');
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      setMessage('Erro ao reenviar e-mail: ' + error.message);
    } else {
      setMessage('✉️ E-mail de confirmação reenviado! Verifique sua caixa de entrada.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4" style={{
      backgroundImage: 'url(/images/bg-adventure.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-800/85 to-black/90"></div>
      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">⚡</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Tibia Tracker
          </h1>
          <p className="text-gray-400 mt-2">Acompanhe seu progresso no Tibia</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </h2>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
              message.includes('✅')
                ? 'bg-green-900/30 border border-green-700 text-green-300'
                : message.includes('⚠️')
                ? 'bg-yellow-900/30 border border-yellow-700 text-yellow-300'
                : 'bg-red-900/30 border border-red-700 text-red-300'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              {loading ? 'Aguarde...' : isSignUp ? 'Registrar' : 'Entrar'}
            </button>
          </form>

          {/* Botão para reenviar e-mail de confirmação */}
          {isSignUp && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              className="mt-4 w-full text-sm text-blue-400 hover:text-blue-300 transition font-medium"
            >
              Reenviar e-mail de confirmação
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-gray-400 hover:text-gray-300 transition text-sm"
            >
              {isSignUp ? (
                <>
                  Já tem conta?{' '}
                  <span className="text-blue-400 font-medium hover:text-blue-300">Entrar agora</span>
                </>
              ) : (
                <>
                  Não tem conta?{' '}
                  <span className="text-blue-400 font-medium hover:text-blue-300">Registrar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">© 2026 Tibia Tracker. Todos os direitos reservados.</p>
      </div>
      </div>
    </div>
  );
}