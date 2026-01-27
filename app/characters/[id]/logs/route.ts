import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const userResponse = await supabase.auth.getUser();

  if (userResponse.error || !userResponse.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = userResponse.data.user;
  const { id } = await params;

  // Verifica se o personagem pertence ao usuário
  const { data: char, error: charError } = await supabase
    .from('characters')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (charError || !char) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  // Busca os logs ordenados por data
  const { data: logs, error: logsError } = await supabase
    .from('xp_logs')
    .select('id, character_id, date, level, xp')
    .eq('character_id', id)
    .order('date', { ascending: true });

  if (logsError) {
    console.error('Erro ao buscar logs:', logsError);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }

  return NextResponse.json({ logs: logs || [] });
}
