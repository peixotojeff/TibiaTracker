// src/app/api/characters/[id]/logs/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verifica se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifica se o personagem pertence ao usuário
  const { data: char, error: charError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (charError || !char) {
    return Response.json({ error: 'Character not found' }, { status: 404 });
  }

  // Busca logs
  const { data: logs, error: logsError } = await supabase
    .from('xp_logs')
    .select('*')
    .eq('character_id', params.id)
    .order('date', { ascending: false });

  if (logsError) {
    return Response.json({ error: 'Failed to load logs' }, { status: 500 });
  }

  return Response.json({ logs });
}