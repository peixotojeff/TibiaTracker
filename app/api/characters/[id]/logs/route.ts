// src/app/api/characters/[id]/logs/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Pass `cookies` as a function returning the cookies (cast to satisfy the expected sync type)
  const supabase = createRouteHandlerClient({ cookies: () => cookies() as any });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: char, error: charError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (charError || !char) {
    return Response.json({ error: 'Character not found' }, { status: 404 });
  }

  const { data: logs, error: logsError } = await supabase
    .from('xp_logs')
    .select('*')
    .eq('character_id', id)
    .order('date', { ascending: false });

  if (logsError) {
    return Response.json({ error: 'Failed to load logs' }, { status: 500 });
  }

  return Response.json({ logs });
}