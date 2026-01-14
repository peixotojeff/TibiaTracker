// scripts/fetch-xp-daily.mjs
import { createClient } from '@supabase/supabase-js';

// ⚠️ Use SERVICE_ROLE_KEY (não a ANON key!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

async function fetchXPFromTibiaData(character) {
  const worldSlug = character.world.trim().toLowerCase();
  const vocationSlug = character.vocation.toLowerCase(); // mantém plural!
  const nameNormalized = character.name.trim().toLowerCase();

  console.log(`🔍 Procurando ${character.name} (${worldSlug}, ${vocationSlug})...`);

  for (let page = 1; page <= 20; page++) {
    const url = `https://dev.tibiadata.com/v4/highscores/${worldSlug}/experience/${vocationSlug}/${page}`;

    try {
      const res = await fetch(url, { timeout: 8000 });
      
      if (res.status === 404) {
        console.log(`🛑 Página ${page} não existe. Parando busca.`);
        break;
      }

      if (!res.ok) {
        console.warn(`⚠️ Página ${page} retornou ${res.status}. Continuando...`);
        continue;
      }

      const data = await res.json();
      const list = data?.highscores?.highscore_list;

      if (!Array.isArray(list)) {
        console.warn(`⚠️ Página ${page}: formato inválido.`);
        continue;
      }

      const found = list.find(entry => 
        entry?.name?.toLowerCase() === nameNormalized
      );

      if (found) {
        console.log(`✅ Encontrado na página ${page}: Lvl ${found.level}, ${found.value} XP`);
        return { level: found.level, xp: found.value };
      }
    } catch (err) {
      console.error(`❌ Erro na página ${page}:`, err.message);
      continue;
    }
  }

  console.log(`❌ ${character.name} não encontrado nas páginas 1–20.`);
  return null;
}

async function run() {
  console.log('\n🚀 Iniciando coleta diária de XP...\n');

  const today = new Date().toISOString().split('T')[0]; // "2026-01-15"

  // Busca todos os personagens
  const { data: characters, error } = await supabase
    .from('characters')
    .select('id, name, world, vocation');

  if (error) {
    console.error('❌ Falha ao buscar personagens:', error.message);
    process.exit(1);
  }

  if (characters.length === 0) {
    console.log('ℹ️ Nenhum personagem cadastrado.');
    return;
  }

  console.log(`📊 Total de personagens: ${characters.length}`);

  for (const char of characters) {
    // Verifica se já existe log hoje
    const {  existing } = await supabase
      .from('xp_logs')
      .select('id')
      .eq('character_id', char.id)
      .eq('date', today)
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️ ${char.name} já registrado hoje. Pulando.`);
      continue;
    }

    // Busca XP atual
    const stats = await fetchXPFromTibiaData(char);
    if (!stats) continue;

    // Insere no banco
    const { error: insertError } = await supabase
      .from('xp_logs')
      .insert({
        character_id: char.id,
        date: today,
        level: stats.level,
        xp: stats.xp,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error(`❌ Falha ao salvar ${char.name}:`, insertError.message);
    } else {
      console.log(`💾 Registrado com sucesso para ${char.name}`);
    }
  }

  console.log('\n✅ Coleta diária concluída!');
}

// Executa o script
run().catch((err) => {
  console.error('💥 Erro crítico:', err);
  process.exit(1);
});