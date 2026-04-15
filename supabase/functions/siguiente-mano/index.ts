import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Helper: Find the player position (0-3) who has the highest double
 * Returns { jugadorPosicion, fichaIndex } where fichaIndex is the index in that player's tiles
 */
function findPlayerWithHighestDouble(
  jugadores: any[],
  fichasPorJugador: Ficha[][],
) {
  let highestDouble = -1;
  let jugadorPosicion = 0;
  let fichaIndex = -1;

  for (let pos = 0; pos < jugadores.length; pos++) {
    const fichas = fichasPorJugador[pos];
    for (let i = 0; i < fichas.length; i++) {
      const f = fichas[i];
      // Check if it's a double
      if (f.valorA === f.valorB && f.valorA > highestDouble) {
        highestDouble = f.valorA;
        jugadorPosicion = pos;
        fichaIndex = i;
      }
    }
  }

  return { jugadorPosicion, fichaIndex, valorDoble: highestDouble };
}

interface Ficha {
  valorA: number;
  valorB: number;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response(null, { headers: CORS_HEADERS });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // JWT validation disabled for MVP
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader) throw new Error('No autorizado');

    // const token = authHeader.replace('Bearer ', '');
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabaseAdmin.auth.getUser(token);
    // if (authError || !user) throw new Error('Token inválido');

    const { partidaId } = await req.json();
    if (!partidaId) throw new Error('Se requiere partidaId');

    const { data: partida, error: pInfoError } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('id', partidaId)
      .single();
    if (pInfoError || !partida) throw new Error('Partida no encontrada');

    if (partida.estado !== 'esperando') {
      throw new Error('La partida no está esperando para empezar');
    }

    const { data: jugadores, error: jError } = await supabaseAdmin
      .from('jugadores')
      .select('*')
      .eq('partida_id', partidaId)
      .order('posicion', { ascending: true });
    if (jError || !jugadores || jugadores.length !== 4)
      throw new Error('No hay 4 jugadores');

    const nextMano = partida.mano_actual + 1;

    // Actualizar estado de partida
    await supabaseAdmin
      .from('partidas')
      .update({ estado: 'en_curso', mano_actual: nextMano })
      .eq('id', partidaId);

    // Crear nueva mano
    const { data: nuevaMano, error: mError } = await supabaseAdmin
      .from('manos')
      .insert({
        partida_id: partidaId,
        estado: 'repartiendo',
        turno_actual: (nextMano - 1) % 4, // El jugador (mano_actual - 1) sale
        sentido: 'horario',
      })
      .select()
      .single();

    if (mError || !nuevaMano) throw new Error('Error al crear la mano');

    // Generar fichas
    const fichas = [];
    for (let a = 0; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        fichas.push({ valorA: a, valorB: b });
      }
    }

    // Barajar
    for (let i = fichas.length - 1; i > 0; i--) {
      const arrayBuffer = new Uint32Array(1);
      crypto.getRandomValues(arrayBuffer);
      const randomFraction = arrayBuffer[0] / (0xffffffff + 1);
      const j = Math.floor(randomFraction * (i + 1));
      [fichas[i], fichas[j]] = [fichas[j], fichas[i]];
    }

    // Repartir 10 fichas por jugador y trackear qué fichas tiene cada uno
    const inserts = [];
    const fichasPorJugador: { valorA: number; valorB: number }[][] = [
      [],
      [],
      [],
      [],
    ];
    let index = 0;
    for (let pos = 0; pos < jugadores.length; pos++) {
      const jug = jugadores[pos];
      for (let i = 0; i < 10; i++) {
        const f = fichas[index++];
        inserts.push({
          mano_id: nuevaMano.id,
          jugador_id: jug.id,
          valor_a: f.valorA,
          valor_b: f.valorB,
        });
        fichasPorJugador[pos].push({ valorA: f.valorA, valorB: f.valorB });
      }
    }

    const { error: fError } = await supabaseAdmin
      .from('fichas_manos')
      .insert(inserts);
    if (fError) throw new Error('Error repartiendo las fichas');

    // Determinar quién tiene el doble más alto
    const { jugadorPosicion, valorDoble } = findPlayerWithHighestDouble(
      jugadores,
      fichasPorJugador,
    );

    // Si ningún jugador tiene dobles (muy raro pero posible), usar el jugador con la ficha más alta
    let turnoInicial = jugadorPosicion;
    if (valorDoble === -1) {
      // Buscar la ficha más alta (suma de valores)
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

    await supabaseAdmin
      .from('manos')
      .update({
        estado: 'en_curso',
        turno_actual: turnoInicial,
      })
      .eq('id', nuevaMano.id);

    const jugadorSalida = jugadores[turnoInicial];
    console.log(
      `Jugador ${jugadorSalida.nombre} (posición ${turnoInicial}) sale con doble ${valorDoble >= 0 ? valorDoble : 'ninguno, usa ficha más alta'}`,
    );

    // Activar al bot si le toca salir
    const { data: currentJugador } = await supabaseAdmin
      .from('jugadores')
      .select('*')
      .eq('partida_id', partidaId)
      .eq('posicion', turnoInicial)
      .single();
    if (currentJugador && currentJugador.user_id.startsWith('bot-')) {
      // Hacemos el llamado dummy a realizar-jugada o esperamos que el frontend actualice (es mejor dejar que un jugador de verdad llame a algo, pero aquí forzaremos un checkBot indirecto o fetch local).
      // Podemos hacer fetch al propio edge function de realizar-jugada con pasar para que intente procesar
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/realizar-jugada`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partidaId: partidaId,
          fichaId: '',
          lado: 'pasar',
        }),
      }).catch((err) => console.error('Error triggerizando auto bot:', err));
    }

    return new Response(JSON.stringify({ exito: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
