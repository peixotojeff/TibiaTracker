// src/contexts/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: any;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const getSession = async () => {
      // ✅ CORREÇÃO AQUI
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    getSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not initialized');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}