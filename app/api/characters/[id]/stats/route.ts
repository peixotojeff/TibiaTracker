import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: userResponse } = await supabase.auth.getUser();

  if (!userResponse?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: char } = await supabase
    .from('characters')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', userResponse.user.id)
    .single();

  if (!char) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  // Fetch XP logs for the character
  const { data: logs, error: logError } = await supabase
    .from('xp_logs')
    .select('date, xp, level')
    .eq('character_id', id)
    .order('date', { ascending: true });

  if (logError) {
    console.error('Error fetching XP logs:', logError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({ error: 'No XP logs found' }, { status: 404 });
  }

  // Calculate statistics
  const lastLog = logs[logs.length - 1];
  let dailyAverage = 0;

  if (logs.length >= 2) {
    const recentLogs = logs.slice(-7);
    const xpGained = recentLogs[recentLogs.length - 1].xp - recentLogs[0].xp;
    dailyAverage = Math.round(xpGained / (recentLogs.length - 1));
  }

  const stats = {
    name: char.name || 'Unknown',
    level: lastLog.level,
    totalXP: lastLog.xp,
    dailyAverage,
    daysTracked: logs.length,
    xpLogs: logs,
  };

  return NextResponse.json(stats);
}
