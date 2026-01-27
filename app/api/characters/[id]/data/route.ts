import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const userResponse = await supabase.auth.getUser();

  if (userResponse.error || !userResponse.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = userResponse.data.user;
  const { id: characterId } = await params;

  try {
    // Busca informações do personagem
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('id, name, world, vocation, category')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single();

    if (charError || !character) {
      console.error('Erro ao buscar personagem:', charError);
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Busca os logs do personagem (usando a mesma lógica do statistics)
    const { data: logs, error: logError } = await supabase
      .from('xp_logs')
      .select('id, date, xp, level, created_at')
      .eq('character_id', characterId)
      .order('date', { ascending: true });

    if (logError) {
      console.error('Erro ao buscar logs:', logError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Retorna dados combinados como no statistics
    return NextResponse.json({
      character,
      logs: logs || []
    });
  } catch (error) {
    console.error('Erro ao processar dados:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
