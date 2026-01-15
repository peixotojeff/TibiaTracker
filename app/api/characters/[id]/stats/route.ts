// src/app/api/characters/[id]/stats/route.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify character belongs to user
    const { data: char, error: charError } = await supabase
      .from('characters')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (charError || !char) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Fetch all logs ordered by date
    const { data: logs, error: logsError } = await supabase
      .from('xp_logs')
      .select('date, xp, level')
      .eq('character_id', id)
      .order('date', { ascending: true });

    if (logsError || !logs || logs.length === 0) {
      return NextResponse.json({ logs: [], stats: null });
    }

    // Calculate statistics
    const totalDays = logs.length;
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];

    // Average daily XP (last 7 days)
    const last7Days = logs.slice(-7);
    const xpGainedLast7 = last7Days[last7Days.length - 1].xp - last7Days[0].xp;
    const avgDailyXP = last7Days.length > 1
      ? Math.round(xpGainedLast7 / (last7Days.length - 1))
      : 0;

    // ETA for next level (using simplified calculation)
    const currentLevel = lastLog.level;
    const currentXP = lastLog.xp;
    
    // Approximate: next level needs 10M XP (this should be based on real Tibia data)
    const xpPerLevel = 10000000;
    const xpNeeded = xpPerLevel;
    const etaDays = avgDailyXP > 0 ? Math.ceil(xpNeeded / avgDailyXP) : null;

    const stats = {
      totalLogs: totalDays,
      currentLevel,
      currentXP,
      avgDailyXP,
      xpNeeded,
      etaDays,
      firstDate: firstLog.date,
      lastDate: lastLog.date,
    };

    return NextResponse.json({ logs, stats });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}