import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Ficha {
  valorA: number;
  valorB: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const body = await req.json();
    const { partida_id } = body;

    if (!partida_id) {
      return new Response(JSON.stringify({ error: 'Se requiere partida_id' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 1. GET PARTIDA
    const { data: partida, error: partidaError } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('id', partida_id)
      .single();

    if (partidaError || !partida) {
      throw new Error(`Error obteniendo partida: ${partidaError?.message || 'No encontrada'}`);
    }

    if (partida.estado !== 'esperando') {
        throw new Error('La partida ya ha iniciado o ha finalizado');
    }

    // 2. GET JUGADORES
    const { data: jugadores, error: jugadoresError } = await supabaseAdmin
      .from('jugadores')
      .select('*')
      .eq('partida_id', partida_id)
      .order('posicion', { ascending: true });

    if (jugadoresError) {
      throw new Error(`Error obteniendo jugadores: ${jugadoresError.message}`);
    }

    if (!jugadores || jugadores.length !== 4) {
      throw new Error('Debe haber exactamente 4 jugadores en la sala para iniciar');
    }

    // 3. UPDATE PARTIDA
    const { error: updatePartidaError } = await supabaseAdmin
      .from('partidas')
      .update({
        estado: 'en_curso',
        mano_actual: 1,
        salida_inicial: true,
      })
      .eq('id', partida_id);

    if (updatePartidaError) {
      throw new Error(`Error actualizando partida: ${updatePartidaError.message}`);
    }

    // 4. CREATE MANO
    const { data: mano, error: manoError } = await supabaseAdmin
      .from('manos')
      .insert({
        partida_id,
        estado: 'repartiendo',
        turno_actual: 0,
        sentido: 'horario',
      })
      .select()
      .single();

    if (manoError) {
      throw new Error(`Error creando mano: ${manoError.message}`);
    }

    // 5. GENERATE 55 TILES
    const todasFichas: Ficha[] = [];
    for (let a = 0; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        todasFichas.push({ valorA: a, valorB: b });
      }
    }

    if (todasFichas.length !== 55) {
      throw new Error(`Error: se esperaban 55 fichas, se generaron ${todasFichas.length}`);
    }

    // 6. SHUFFLE
    const fichasBarajadas = shuffleArray(todasFichas);

    // 7. DEAL 10 TILES TO EACH PLAYER
    const fichasManoInsert: any[] = [];
    const fichasPorJugador: Ficha[][] = [[], [], [], []];
    let fichaIndex = 0;

    for (let pos = 0; pos < jugadores.length; pos++) {
      const jugador = jugadores[pos];
      for (let i = 0; i < 10; i++) {
        const ficha = fichasBarajadas[fichaIndex++];
        fichasManoInsert.push({
          mano_id: mano.id,
          jugador_id: jugador.id,
          valor_a: ficha.valorA,
          valor_b: ficha.valorB,
        });
        fichasPorJugador[pos].push(ficha);
      }
    }

    const { error: fichasError } = await supabaseAdmin
      .from('fichas_manos')
      .insert(fichasManoInsert);

    if (fichasError) {
      throw new Error(`Error repartiendo fichas: ${fichasError.message}`);
    }

    // 8. DETERMINE JUGADOR SALIDA
    let highestDouble = -1;
    let jugadorPosicion = 0;

    for (let pos = 0; pos < jugadores.length; pos++) {
      for (const f of fichasPorJugador[pos]) {
        if (f.valorA === f.valorB && f.valorA > highestDouble) {
          highestDouble = f.valorA;
          jugadorPosicion = pos;
        }
      }
    }

    let turnoInicial = jugadorPosicion;
    if (highestDouble === -1) {
      let maxSuma = -1;
      for (let pos = 0; pos < jugadores.length; pos++) {
        for (const f of fichasPorJugador[pos]) {
          const suma = f.valorA + f.valorB;
          if (suma > maxSuma) {
            maxSuma = suma;
            turnoInicial = pos;
          }
        }
      }
    }

    // Update mano
    await supabaseAdmin
      .from('manos')
      .update({
        estado: 'en_curso',
        turno_actual: turnoInicial,
      })
      .eq('id', mano.id);

    return new Response(JSON.stringify({ partidaId: partida_id, manoId: mano.id }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in iniciar-partida:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const arrayBuffer = new Uint32Array(1);
    crypto.getRandomValues(arrayBuffer);
    const randomFraction = arrayBuffer[0] / (0xffffffff + 1);
    const j = Math.floor(randomFraction * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
