// src/app/api/test-character/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, world, vocation } = await request.json();

    if (!name || !world || !vocation) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ✅ Mantém a vocação NO PLURAL (como "druids")
    const vocationSlug = vocation.toLowerCase(); // ex: "druid" → "druid", mas seu select já envia "druids"
    
    // ✅ Mundo em minúsculo e sem espaços
    const worldSlug = world.trim().toLowerCase();
    
    const nameNormalized = name.trim();

    // Busca nas páginas 1 a 20
    for (let page = 1; page <= 20; page++) {
      // ✅ Usa dev.tibiadata.com + vocação no plural
      const url = `https://dev.tibiadata.com/v4/highscores/${worldSlug}/experience/${vocationSlug}/${page}`;

      try {
        const res = await fetch(url, { timeout: 8000 });
        
        // Aceita 200 ou 404 (404 = página inexistente, pula)
        if (res.status === 404) {
          console.log(`Page ${page} not found, stopping.`);
          break; // páginas são sequenciais; se 404, não há mais
        }
        
        if (!res.ok) {
          console.warn(`Page ${page} returned ${res.status}`);
          continue;
        }

        const data = await res.json();
        const list = data.highscores?.highscore_list || [];

        if (!Array.isArray(list)) {
          console.warn(`Page ${page}: invalid format`);
          continue;
        }

        const found = list.find(
          (entry: any) => entry.name.toLowerCase() === nameNormalized.toLowerCase()
        );

        if (found) {
          return Response.json({
            success: true,
            level: found.level,
            xp: found.value,
            page,
          });
        }
      } catch (err: any) {
        console.error(`Error on page ${page}:`, err.message);
        continue;
      }
    }

    return Response.json({ 
      success: false, 
      message: 'Character not found in pages 1-20.' 
    });
  } catch (error: any) {
    console.error('Test character error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}