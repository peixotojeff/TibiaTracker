// src/app/api/characters/[id]/stats/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {{user}} = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {  char } = await supabase
    .from('characters')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!char) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  const {  logs } = await supabase
    .from('xp_logs')
    .select('date, xp, level')
    .eq('character_id', id)
    .order('date', { ascending: true });

  if (!logs || logs.length === 0) {
    return NextResponse.json({
      level_real: 0,
      xp_total: 0,
      media_recente: 0,
      dias_rastreados: 0,
    });
  }

  const lastLog = logs[logs.length - 1];
  let media_recente = 0;

  if (logs.length >= 2) {
    const recent = logs.slice(-7);
    const gain = recent[recent.length - 1].xp - recent[0].xp;
    media_recente = Math.round(gain / (recent.length - 1));
  }

  return NextResponse.json({
    level_real: lastLog.level,
    xp_total: lastLog.xp,
    media_recente,
    dias_rastreados: logs.length,
  });
}