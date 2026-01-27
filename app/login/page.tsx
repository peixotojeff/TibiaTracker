// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }

      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Um email de confirmação foi enviado para o seu endereço de email.');
      }
    } else {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
      } else {
        router.refresh();
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">{isSignUp ? 'Cadastro' : 'Login'}</h1>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {successMessage && <p className="text-green-400 mb-4">{successMessage}</p>}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
          required
        />
        {isSignUp && (
          <input
            type="password"
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mb-4 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            required
          />
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium mb-4"
        >
          {isSignUp ? 'Cadastrar' : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full bg-transparent border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white py-2 rounded font-medium text-sm transition-colors"
        >
          {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
        </button>
      </form>
    </div>
  );
}