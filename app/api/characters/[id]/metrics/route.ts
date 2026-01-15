// src/app/api/characters/[id]/metrics/route.ts
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface XPLog {
  date: string;
  xp: number;
  level: number;
}

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

    // Fetch logs
    const { data: logs, error: logsError } = await supabase
      .from('xp_logs')
      .select('*')
      .eq('character_id', id)
      .order('date', { ascending: true });

    if (logsError || !logs || logs.length === 0) {
      return NextResponse.json({
        level_real: 0,
        media_recente: 0,
        eta_str: 'N/A',
        streak_count: 0,
        cor_delta: 'neutral',
        texto_delta: 'Sem dados',
      });
    }

    const sortedLogs = logs as XPLog[];
    const lastLog = sortedLogs[sortedLogs.length - 1];

    // Calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const logsLast30Days = sortedLogs.filter(
      (log) => new Date(log.date) >= thirtyDaysAgo
    );

    let mediaRecente = 0;
    if (logsLast30Days.length > 1) {
      const firstXP = logsLast30Days[0].xp;
      const lastXP = logsLast30Days[logsLast30Days.length - 1].xp;
      const totalGain = lastXP - firstXP;
      const days = logsLast30Days.length - 1 || 1;
      mediaRecente = totalGain / days;
    }

    // Calculate streak
    let streakCount = 0;
    const today = new Date();
    for (let i = sortedLogs.length - 1; i >= 0; i--) {
      const logDate = new Date(sortedLogs[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streakCount);

      if (
        logDate.getFullYear() === expectedDate.getFullYear() &&
        logDate.getMonth() === expectedDate.getMonth() &&
        logDate.getDate() === expectedDate.getDate()
      ) {
        streakCount++;
      } else {
        break;
      }
    }

    // Calculate ETA (simplified)
    let etaStr = 'N/A';
    if (mediaRecente > 0) {
      // Assuming 10M per level (this should be adjusted based on actual Tibia data)
      const etaDays = Math.ceil(10000000 / mediaRecente);
      if (etaDays < 365) {
        etaStr = `${etaDays}d`;
      } else {
        const months = Math.ceil(etaDays / 30);
        etaStr = `${months}m`;
      }
    }

    // Calculate delta (comparison with previous period)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const logsLast60Days = sortedLogs.filter(
      (log) => new Date(log.date) >= sixtyDaysAgo
    );

    let texto_delta = '';
    let cor_delta = 'neutral';

    if (logsLast60Days.length > 15) {
      const midpoint = Math.floor(logsLast60Days.length / 2);
      const firstHalf = logsLast60Days[0].xp;
      const midpoint_xp = logsLast60Days[midpoint].xp;
      const lastHalf = logsLast60Days[logsLast60Days.length - 1].xp;

      const mediaFirst = (midpoint_xp - firstHalf) / midpoint;
      const mediaSecond = (lastHalf - midpoint_xp) / (logsLast60Days.length - midpoint);

      const delta = ((mediaSecond - mediaFirst) / mediaFirst) * 100;

      if (delta > 10) {
        texto_delta = `↑ +${delta.toFixed(1)}%`;
        cor_delta = 'success';
      } else if (delta < -10) {
        texto_delta = `↓ ${delta.toFixed(1)}%`;
        cor_delta = 'danger';
      } else {
        texto_delta = '→ Estável';
        cor_delta = 'neutral';
      }
    }

    return NextResponse.json({
      level_real: lastLog.level,
      media_recente: mediaRecente,
      eta_str: etaStr,
      streak_count: streakCount,
      cor_delta: cor_delta,
      texto_delta: texto_delta || 'Sem dados',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
