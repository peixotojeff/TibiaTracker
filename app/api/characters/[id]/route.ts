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

  const { data: character, error } = await supabase
    .from('characters')
    .select('id, name, world, vocation, category')
    .eq('id', characterId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Erro ao buscar personagem:', error);
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  return NextResponse.json(character);
}

export async function DELETE(
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
    console.log('DELETE request for character ID:', characterId);

    // First, verify the character belongs to the user
    const { data: character, error: fetchError } = await supabase
      .from('characters')
      .select('user_id, name')
      .eq('id', characterId)
      .single();

    console.log('Fetch result:', { character, fetchError });

    if (fetchError || !character) {
      console.error('Character not found:', fetchError);
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    if (character.user_id !== user.id) {
      console.error('Unauthorized: character user_id', character.user_id, 'vs user.id', user.id);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the character
    const { data: deleteData, error: deleteError } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
      .select();

    console.log('Delete result:', { deleteData, deleteError });

    if (deleteError) {
      console.error('Erro ao excluir personagem:', deleteError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Character deleted successfully', deleted: deleteData });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
