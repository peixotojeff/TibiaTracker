import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface CharacterRanking {
  id: string;
  name: string;
  world: string;
  vocation: string;
  streak_count: number;
  level_real: number;
  media_recente: number;
  user_email: string;
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all characters
    const { data: characters, error: charError } = await supabase
      .from('characters')
      .select('id, name, world, vocation, user_id');

    if (charError) {
      console.error('Erro ao buscar personagens:', charError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!characters || characters.length === 0) {
      return NextResponse.json({ global: [], worlds: {}, vocations: {} });
    }

    // Create user email map (placeholder since users table may not exist)
    const userEmailMap: Record<string, string> = {};
    // For now, set empty email; you may need to create a users table or use auth data

    // Fetch XP logs for the last 7 days for all characters
    const characterIds = characters.map(char => char.id);
    const { data: recentLogs, error: logsError } = await supabase
      .from('xp_logs')
      .select('character_id, date, xp, level')
      .in('character_id', characterIds)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('character_id', { ascending: true })
      .order('date', { ascending: true });

    if (logsError) {
      console.error('Erro ao buscar logs recentes:', logsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Group logs by character
    const logsByCharacter: Record<string, any[]> = {};
    recentLogs?.forEach(log => {
      if (!logsByCharacter[log.character_id]) {
        logsByCharacter[log.character_id] = [];
      }
      logsByCharacter[log.character_id].push(log);
    });

    // Calculate rankings for all characters
    const characterRankings: CharacterRanking[] = [];
    characters.forEach(character => {
      const logs = logsByCharacter[character.id] || [];

      if (logs.length === 0) {
        // Include characters without recent activity with default values
        characterRankings.push({
          id: character.id,
          name: character.name,
          world: character.world,
          vocation: character.vocation,
          streak_count: 0,
          level_real: 0,
          media_recente: 0,
          user_email: userEmailMap[character.user_id] || '',
        });
        return;
      }

      // Calculate streak (consecutive days with logs in the last 7 days)
      let streakCount = 0;
      const today = new Date();
      const logDates = logs.map(log => new Date(log.date).toDateString());

      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toDateString();

        if (logDates.includes(dateString)) {
          streakCount++;
        } else {
          break; // Streak broken
        }
      }

      // Get latest level and calculate average XP
      const latestLog = logs[logs.length - 1];
      let mediaRecente = 0;
      if (logs.length > 1) {
        const totalGain = latestLog.xp - logs[0].xp;
        const daysDiff = logs.length - 1;
        mediaRecente = daysDiff > 0 ? totalGain / daysDiff : 0;
      }

      characterRankings.push({
        id: character.id,
        name: character.name,
        world: character.world,
        vocation: character.vocation,
        streak_count: streakCount,
        level_real: latestLog.level,
        media_recente: mediaRecente,
        user_email: userEmailMap[character.user_id] || '',
      });
    });

    // Sort global rankings by streak_count descending
    const globalRankings = [...characterRankings].sort((a, b) => b.streak_count - a.streak_count);

    // Get all unique worlds from characters
    const allWorlds = [...new Set(characters.map(char => char.world))];

    // Group by world and sort by streak_count descending
    const worlds: Record<string, CharacterRanking[]> = {};
    allWorlds.forEach(world => {
      worlds[world] = [];
    });

    characterRankings.forEach(char => {
      if (worlds[char.world]) {
        worlds[char.world].push(char);
      }
    });

    Object.keys(worlds).forEach(world => {
      worlds[world].sort((a, b) => b.streak_count - a.streak_count);
    });

    // Group by vocation and sort by streak_count descending
    const vocations: Record<string, CharacterRanking[]> = {};
    characterRankings.forEach(char => {
      // Normalize vocation name to match frontend options
      const normalizedVocation = char.vocation.charAt(0).toUpperCase() + char.vocation.slice(1).toLowerCase();
      if (!vocations[normalizedVocation]) {
        vocations[normalizedVocation] = [];
      }
      vocations[normalizedVocation].push(char);
    });

    Object.keys(vocations).forEach(vocation => {
      vocations[vocation].sort((a, b) => b.streak_count - a.streak_count);
    });

    // Get all unique vocations from characters
    const allVocations = [...new Set(characters.map(char => char.vocation))];

    return NextResponse.json({ global: globalRankings, worlds, vocations, allVocations });
  } catch (error) {
    console.error('Erro ao processar rankings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
