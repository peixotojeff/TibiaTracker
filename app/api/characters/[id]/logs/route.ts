// src/app/api/characters/[id]/logs/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const {  { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {  char } = await supabase
    .from('characters')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!char) {
    return Response.json({ error: 'Character not found' }, { status: 404 });
  }

  const {  logs } = await supabase
    .from('xp_logs')
    .select('*')
    .eq('character_id', params.id)
    .order('date', { ascending: false });

  return Response.json({ logs });
}