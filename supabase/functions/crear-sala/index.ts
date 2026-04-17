import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response(null, { headers: CORS_HEADERS });
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // JWT validation - PRODUCTION READY
    const authHeader = req.headers.get('authorization');
    console.log('[crear-sala] Auth header:', authHeader ? 'Presente' : 'Ausente');

    if (!authHeader) {
      throw new Error('No autorizado - Falta header Authorization');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Token inválido - ' + (authError?.message || 'Usuario no encontrado'));
    }

    console.log('[crear-sala] JWT validado, userId:', user.id);

    const bodyText = await req.text();
    const { nombre, conBots } = bodyText
      ? JSON.parse(bodyText)
      : { nombre: 'Anfitrión', conBots: false };

    // El userId viene SIEMPRE del JWT, nunca del body
    const creatorUserId = user.id;

    // 1. Create partida (room)
    const { data: partida, error: pError } = await supabaseAdmin
      .from('partidas')
      .insert({
        estado: conBots ? 'en_curso' : 'esperando',
        puntos_equipo_0: 0,
        puntos_equipo_1: 0,
        mano_actual: 1,
      })
      .select()
      .single();

    if (pError || !partida)
      throw new Error(pError?.message || 'Error creando partida');

    // 1b. Fetch the generated codigo_sala
    const { data: partidaConCodigo, error: pcError } = await supabaseAdmin
      .from('partidas')
      .select('codigo_sala')
      .eq('id', partida.id)
      .single();

    if (pcError || !partidaConCodigo?.codigo_sala) {
      throw new Error(pcError?.message || 'Error generando código de sala');
    }

    // 2. Insert creator as jugador 0
    const todosJugadores = [];
    const { data: hostJugador, error: jError } = await supabaseAdmin
      .from('jugadores')
      .insert({
        partida_id: partida.id,
        user_id: creatorUserId,
        posicion: 0,
        equipo: 0,
        nombre: nombre || 'Anfitrión',
      })
      .select()
      .single();

    if (jError || !hostJugador)
      throw new Error(jError?.message || 'Error registrando jugador 1');

    todosJugadores.push(hostJugador);

    // Si se piden bots, agregar 3 bots y arrancar
    if (conBots) {
      for (let i = 1; i <= 3; i++) {
        const { data: bot } = await supabaseAdmin
          .from('jugadores')
          .insert({
            partida_id: partida.id,
            user_id: globalThis.crypto.randomUUID(),
            posicion: i,
            equipo: i % 2,
            nombre: `Bot ${i}`,
          })
          .select()
          .single();
        if (bot) todosJugadores.push(bot);
      }
      await iniciarJuego(supabaseAdmin, partida.id, todosJugadores);
    }

    return new Response(
      JSON.stringify({
        partidaId: partida.id,
        codigoSala: partidaConCodigo.codigo_sala,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || 'Server error' }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  }
});

async function iniciarJuego(
  supabaseAdmin: any,
  partidaId: string,
  todosJugadores: any[],
) {
  // 1. Update partida to 'en_curso'
  await supabaseAdmin
    .from('partidas')
    .update({ estado: 'en_curso' })
    .eq('id', partidaId);

  // 2. Create the first hand (mano)
  const { data: mano, error: manoErr } = await supabaseAdmin
    .from('manos')
    .insert({
      partida_id: partidaId,
      estado: 'repartiendo',
      turno_actual: 0,
      sentido: 'horario',
    })
    .select()
    .single();
  if (manoErr || !mano) throw new Error('Error al crear primera mano');

  // 3. Generate 55 tiles
  const fichas = [];
  for (let a = 0; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      fichas.push({ valorA: a, valorB: b });
    }
  }

  // 4. Shuffle (Fisher-Yates)
  for (let i = fichas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fichas[i], fichas[j]] = [fichas[j], fichas[i]];
  }

  // 5. Deal 10 tiles per player
  const inserts = [];
  let index = 0;
  for (const j of todosJugadores) {
    for (let i = 0; i < 10; i++) {
      const f = fichas[index++];
      inserts.push({
        mano_id: mano.id,
        jugador_id: j.id,
        valor_a: f.valorA,
        valor_b: f.valorB,
      });
    }
  }

  console.log(
    `Insertando ${inserts.length} fichas para ${todosJugadores.length} jugadores`,
  );
  console.log('Primera ficha:', inserts[0]);
  console.log('Última ficha:', inserts[inserts.length - 1]);

  const { error: fichasErr, data: fichasInsertadas } = await supabaseAdmin
    .from('fichas_manos')
    .insert(inserts)
    .select();

  if (fichasErr) {
    console.error('Error detallado al repartir fichas:', fichasErr);
    throw new Error(
      `Error repartiendo fichas: ${fichasErr.message || fichasErr.details || 'Unknown error'}`,
    );
  }

  console.log(
    `Fichas insertadas correctamente: ${fichasInsertadas?.length || 0}`,
  );

  // 6. Determinar turno inicial (Doble más alto)
  let highestDouble = -1;
  let turnoInicial = 0;

  for (const j of todosJugadores) {
    const fichas_jugador = inserts.filter(
      (ins: any) => ins.jugador_id === j.id,
    );
    for (const f of fichas_jugador) {
      if (f.valor_a === f.valor_b && f.valor_a > highestDouble) {
        highestDouble = f.valor_a;
        turnoInicial = j.posicion;
      }
    }
  }

  // Fallback si no hay dobles: mayor suma
  if (highestDouble === -1) {
    let maxSuma = -1;
    for (const j of todosJugadores) {
      const fichas_jugador = inserts.filter(
        (ins: any) => ins.jugador_id === j.id,
      );
      for (const f of fichas_jugador) {
        const suma = f.valor_a + f.valor_b;
        if (suma > maxSuma) {
          maxSuma = suma;
          turnoInicial = j.posicion;
        }
      }
    }
  }

  // 7. Update mano to 'en_curso' and assign turn
  const { error: updateErr } = await supabaseAdmin
    .from('manos')
    .update({
      estado: 'en_curso',
      turno_actual: turnoInicial,
    })
    .eq('id', mano.id);

  if (updateErr) {
    console.error('Error actualizando estado de mano:', updateErr);
    throw new Error('Error iniciando mano');
  }

  // Si el turno es de un bot, desencadenar su jugada
  const jugadorActual = todosJugadores.find(
    (j: any) => j.posicion === turnoInicial,
  );
  if (jugadorActual && jugadorActual.user_id.startsWith('bot-')) {
    console.log(
      '[crear-sala] Turno inicial asignado a un bot. Disparando trigger...',
    );
    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/realizar-jugada`;
    const auth =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
      Deno.env.get('SUPABASE_ANON_KEY') ||
      '';

    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify({
        isServerTrigger: true,
        partidaId: partidaId,
      }),
    }).catch((e) =>
      console.error('Error triggering bots after crear-sala:', e),
    );
  }

  console.log('Juego iniciado correctamente con mano:', mano.id);
}
