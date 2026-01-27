import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface CharacterStats {
  name: string;
  level: number;
  totalXP: number;
  dailyAverage: number;
  daysTracked: number;
  vocation: string;
  world: string;
  xpLogs: { date: string; xp: number; level: number }[];
  huntHeatmap: number[][];
  dailyXPData: { date: string; dailyXP: number; movingAvg7: number; movingAvg30: number }[];
  milestoneDates: { [key: number]: string | null };
  estimatedDateToNext100Levels: string | null;
}

// Function to calculate total XP needed to reach a specific level
function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level * level + 50 * level + 100) * 50;
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const userResponse = await supabase.auth.getUser();

  if (userResponse.error || !userResponse.data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = userResponse.data.user;

  try {
    // Busca personagens do usuário
    const { data: characters, error: charError } = await supabase
      .from('characters')
      .select('id, name, world, vocation')
      .eq('user_id', user.id);

    if (charError) {
      console.error('Erro ao buscar personagens:', charError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!characters || characters.length === 0) {
      return NextResponse.json([]);
    }

    // Busca estatísticas para cada personagem
    const characterStats: CharacterStats[] = [];
    for (const character of characters) {
      const { data: logs, error: logError } = await supabase
        .from('xp_logs')
        .select('date, xp, level')
        .eq('character_id', character.id)
        .order('date', { ascending: true });

      if (logError) {
        console.error('Erro ao buscar logs para personagem', character.name, ':', logError);
        continue;
      }

      if (!logs || logs.length === 0) continue;

      const lastLog = logs[logs.length - 1];
      let dailyAverage = 0;

      if (logs.length >= 2) {
        const recentLogs = logs.slice(-7);
        const xpGained = recentLogs[recentLogs.length - 1].xp - recentLogs[0].xp;
        dailyAverage = Math.round(xpGained / (recentLogs.length - 1));
      }

      // Generate hunt heatmap (52 weeks x 7 days)
      const huntHeatmap: number[][] = Array(52).fill(null).map(() => Array(7).fill(0));
      const count: number[][] = Array(52).fill(null).map(() => Array(7).fill(0));

      logs.forEach((log, index) => {
        const logDate = new Date(log.date);
        const startOfYear = new Date(logDate.getFullYear(), 0, 1);
        const weekNumber = Math.min(51, Math.floor((logDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        const dayOfWeek = logDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        let activity = 0;

        if (index > 0) {
          const prevLog = logs[index - 1];
          const timeDiff = (logDate.getTime() - new Date(prevLog.date).getTime()) / (1000 * 60 * 60); // hours
          const xpDiff = log.xp - prevLog.xp;
          activity = timeDiff > 0 ? xpDiff / timeDiff : 0; // XP per hour
        }

        huntHeatmap[weekNumber][dayOfWeek] += activity;
        count[weekNumber][dayOfWeek] += 1;
      });

      // Average the activities per week/day
      for (let week = 0; week < 52; week++) {
        for (let day = 0; day < 7; day++) {
          if (count[week][day] > 0) {
            huntHeatmap[week][day] /= count[week][day];
          }
        }
      }

      // Calculate milestone dates
      const milestones = [200, 400, 600, 800, 900, 1000];
      const milestoneDates: { [key: number]: string | null } = {};

      milestones.forEach(milestone => {
        const milestoneLog = logs.find(log => log.level >= milestone);
        if (milestoneLog) {
          milestoneDates[milestone] = new Date(milestoneLog.date).toLocaleDateString('pt-BR');
        } else {
          milestoneDates[milestone] = null;
        }
      });

      // Calculate daily XP and moving averages
      const dailyXPData: { date: string; dailyXP: number; movingAvg7: number; movingAvg30: number }[] = [];

      for (let i = 1; i < logs.length; i++) {
        const currentLog = logs[i];
        const previousLog = logs[i - 1];
        const dailyXP = currentLog.xp - previousLog.xp;

        // Calculate 7-day moving average
        const start7 = Math.max(0, i - 6);
        const window7 = logs.slice(start7, i + 1);
        const movingAvg7 = window7.length > 1
          ? (window7[window7.length - 1].xp - window7[0].xp) / (window7.length - 1)
          : dailyXP;

        // Calculate 30-day moving average
        const start30 = Math.max(0, i - 29);
        const window30 = logs.slice(start30, i + 1);
        const movingAvg30 = window30.length > 1
          ? (window30[window30.length - 1].xp - window30[0].xp) / (window30.length - 1)
          : dailyXP;

        dailyXPData.push({
          date: new Date(currentLog.date).toISOString().split('T')[0],
          dailyXP,
          movingAvg7: Math.round(movingAvg7),
          movingAvg30: Math.round(movingAvg30),
        });
      }

      // Calculate estimated date to next 100 levels
      let estimatedDateToNext100Levels: string | null = null;
      const targetLevel = lastLog.level + 100;
      const xpNeeded = getXPForLevel(targetLevel) - lastLog.xp;
      let last30DayAvg = dailyXPData.length > 0 ? dailyXPData[dailyXPData.length - 1].movingAvg30 : dailyAverage;
      if (last30DayAvg <= 0) {
        last30DayAvg = 1000; // Fallback average if no data
      }
      let daysNeeded = Math.ceil(xpNeeded / last30DayAvg);
      if (daysNeeded <= 0) {
        daysNeeded = 1; // At least 1 day in the future
      }
      const estimatedDate = new Date(); // Use current date as starting point
      estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
      estimatedDateToNext100Levels = estimatedDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

      characterStats.push({
        name: character.name,
        level: lastLog.level,
        totalXP: lastLog.xp,
        dailyAverage,
        daysTracked: logs.length,
        vocation: character.vocation,
        world: character.world,
        xpLogs: logs,
        huntHeatmap,
        dailyXPData,
        milestoneDates,
        estimatedDateToNext100Levels,
      });
    }

    return NextResponse.json(characterStats);
  } catch (error) {
    console.error('Erro ao processar estatísticas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
