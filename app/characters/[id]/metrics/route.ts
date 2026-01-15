// src/app/api/characters/[id]/metrics/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Tabela de XP do Tibia (exemplo simplificado)
const XP_TABLE: Record<number, number> = {
  8: 4200,
  9: 5400,
  10: 6800,
  // ... adicione todos os níveis até 1000
  // Você pode gerar isso com um script depois
};

function findLevelForExp(totalExp: number): number {
  let level = 8;
  while (XP_TABLE[level + 1] <= totalExp) {
    level++;
    if (level >= 1000) break;
  }
  return level;
}

function calculateMetrics(logs: any[], targetLevel = 1000) {
  if (logs.length === 0) return null;

  // Ordena por data
  logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calcula daily_exp
  const enrichedLogs = logs.map((log, i) => {
    if (i === 0) return { ...log, daily_exp: 0 };
    const prevXp = logs[i - 1].xp;
    return { ...log, daily_exp: log.xp - prevXp };
  });

  const xpConsolidada = enrichedLogs[enrichedLogs.length - 1].xp;
  const levelReal = findLevelForExp(xpConsolidada);
  const xpObjetivo = XP_TABLE[targetLevel] || XP_TABLE[1000];
  const xpFaltante = Math.max(0, xpObjetivo - xpConsolidada);

  // Médias
  const positiveHunts = enrichedLogs.filter(l => l.daily_exp > 0);
  const mediaGeral = positiveHunts.length > 0 
    ? positiveHunts.reduce((sum, l) => sum + l.daily_exp, 0) / positiveHunts.length 
    : 0;

  const recentLogs = enrichedLogs.slice(-30);
  const recentPositive = recentLogs.filter(l => l.daily_exp > 0);
  const mediaRecente = recentPositive.length > 0
    ? recentPositive.reduce((sum, l) => sum + l.daily_exp, 0) / recentPositive.length
    : mediaGeral;

  // ETA
  let etaStr = "N/A", xpMetaDiaria = 0, diasRestantes = 0;
  if (mediaRecente > 0) {
    diasRestantes = Math.max(1, Math.ceil(xpFaltante / mediaRecente));
    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + diasRestantes);
    etaStr = etaDate.toLocaleDateString('pt-BR');
    xpMetaDiaria = xpFaltante / diasRestantes;
  }

  // Streak
  let streakCount = 0;
  if (xpMetaDiaria > 0) {
    for (let i = enrichedLogs.length - 1; i >= 0; i--) {
      if (enrichedLogs[i].daily_exp >= xpMetaDiaria) {
        streakCount++;
      } else {
        break;
      }
    }
  }

  // Melhor dia
  let melhorDiaXp = 0, melhorDiaData = "";
  enrichedLogs.forEach(log => {
    if (log.daily_exp > melhorDiaXp) {
      melhorDiaXp = log.daily_exp;
      melhorDiaData = new Date(log.date).toLocaleDateString('pt-BR');
    }
  });

  // Tendência
  let tendenciaStatus = "ESTÁVEL", corTendencia = "info";
  if (mediaRecente > mediaGeral * 1.05) {
    tendenciaStatus = "↑";
    corTendencia = "success";
  } else if (mediaRecente < mediaGeral * 0.95) {
    tendenciaStatus = "↓";
    corTendencia = "danger";
  }

  // Performance hoje
  const xpHoje = enrichedLogs[enrichedLogs.length - 1]?.daily_exp || 0;
  const deltaMeta = xpHoje - xpMetaDiaria;
  const corDelta = deltaMeta >= 0 ? "success" : "danger";
  const textoDelta = `${deltaMeta >= 0 ? '+' : ''}${(deltaMeta / 1e6).toFixed(1)}M vs Meta`;

  return {
    level_real: levelReal,
    xp_consolidada: xpConsolidada,
    xp_faltante: xpFaltante,
    media_geral: mediaGeral,
    media_recente: mediaRecente,
    xp_meta_diaria: xpMetaDiaria,
    eta_str: etaStr,
    dias_restantes: diasRestantes,
    streak_count: streakCount,
    melhor_dia_xp: melhorDiaXp,
    melhor_dia_data: melhorDiaData,
    tendencia_status: tendenciaStatus,
    cor_tendencia: corTendencia,
    texto_delta: textoDelta,
    cor_delta: corDelta,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifica se o personagem pertence ao usuário
  const { data: char } = await supabase
    .from('characters')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!char) {
    return Response.json({ error: 'Character not found' }, { status: 404 });
  }

  // Busca logs
  const { data: logs } = await supabase
    .from('xp_logs')
    .select('date, xp')
    .eq('character_id', id)
    .order('date', { ascending: true });

  if (!logs || logs.length === 0) {
    return Response.json({});
  }

  const metrics = calculateMetrics(logs);
  return Response.json(metrics || {});
}