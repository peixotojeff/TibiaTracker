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
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isSignUp ? 'Criar Conta' : 'Entrar'}
      </h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          {loading ? 'Aguarde...' : isSignUp ? 'Registrar' : 'Entrar'}
        </button>
      </form>

      {/* Botão para reenviar e-mail de confirmação */}
      {isSignUp && (
        <button
          type="button"
          onClick={handleResendConfirmation}
          className="mt-3 text-sm text-blue-500 underline w-full"
        >
          Reenviar e-mail de confirmação
        </button>
      )}

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-4 text-blue-500"
      >
        {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Registrar'}
      </button>
    </div>
  );
}