// src/app/api/characters/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 👇 Forma explícita: evita erros de sintaxe
  const userResponse = await supabase.auth.getUser();

  if (userResponse.error || !userResponse.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = userResponse.data.user;

  const { data: characters, error } = await supabase
    .from('characters')
    .select('id, name, world, vocation, category')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar personagens:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json(characters || []);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const userResponse = await supabase.auth.getUser();

  if (userResponse.error || !userResponse.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = userResponse.data.user;

  try {
    const body = await request.json();
    const { name, world, vocation, category } = body;

    if (!name || !world || !vocation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const capitalizedWorld = world.charAt(0).toUpperCase() + world.slice(1).toLowerCase();
    const capitalizedVocation = vocation.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

    const { data, error } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        name,
        world: capitalizedWorld,
        vocation: capitalizedVocation,
        category: category || 'main',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir personagem:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
