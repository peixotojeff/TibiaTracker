// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Exporta SEMPRE um cliente
// Se as variáveis estiverem ausentes no client, lança erro
if (typeof window !== 'undefined') {
  // Estamos no navegador (client)
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    );
  }
}

// Cria o cliente (no server, as vars podem ser undefined, mas não usamos lá)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');