import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Sistema de puntuación Cubano
const PUNTOS_PEGADA = 40;
const PUNTOS_SALIDA_INICIAL = 20;
const META_PUNTOS = 200;

interface JugadaRequest {
  partidaId: string;
  fichaId: string;
  lado: 'izquierda' | 'derecha' | 'pasar';
}

interface Ficha {
  id: string;
  valor_a: number;
  valor_b: number;
  jugador_id: string;
}

interface Jugador {
  id: string;
  user_id: string;
  posicion: number;
  equipo: 0 | 1;
  nombre: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // JWT validation disabled for MVP
    // const authHeader = req.headers.get('authorization');
    // if (!authHeader) throw new Error('No autorizado');
    // const token = authHeader.replace('Bearer ', '');
    // const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    // if (authError || !user) throw new Error('Token inválido');
    
    console.log('[realizar-jugada] JWT validation skipped for MVP');

    const { partidaId, fichaId, lado, userId } = await req.json();
    
    // Use provided userId or a default for MVP
    const requestingUserId = userId || 'mvp_user';

    const res = await processJugada(supabaseAdmin, requestingUserId, partidaId, fichaId, lado);

    // Si la jugada fue exitosa y la mano no terminó, procesar bots
    if (res.exito && !res.manoFinalizada && !res.partidaFinalizada) {
      await processBots(supabaseAdmin, partidaId);
    }

    return new Response(JSON.stringify(res), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error in realizar-jugada:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor', exito: false }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

async function processJugada(
  supabaseAdmin: SupabaseClient, 
  requestingUserId: string, 
  partidaId: string, 
  inputFichaId: string, 
  inputLado: 'izquierda' | 'derecha' | 'pasar'
): Promise<{ exito: boolean; mensaje: string; manoFinalizada?: boolean; partidaFinalizada?: boolean; talla?: string }> {
    
    // 1. Obtener partida
    const { data: partida, error: partidaError } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('id', partidaId)
      .single();
    
    if (!partida || partida.estado === 'finalizada') {
      throw new Error('Partida no válida o finalizada');
    }

    // 2. Obtener mano actual
    const { data: mano, error: manoError } = await supabaseAdmin
      .from('manos')
      .select('*')
      .eq('partida_id', partidaId)
      .order('fecha_inicio', { ascending: false })
      .limit(1)
      .single();
    
    if (!mano || mano.estado !== 'en_curso') {
      throw new Error('No hay mano activa o no está en curso');
    }

    // 3. Obtener jugador que realiza la jugada
    const { data: jugador, error: jugadorError } = await supabaseAdmin
      .from('jugadores')
      .select('*')
      .eq('partida_id', partidaId)
      .eq('user_id', requestingUserId)
      .single();
    
    if (!jugador || mano.turno_actual !== jugador.posicion) {
      throw new Error('No es tu turno o no estás en partida');
    }

    let nIzq = mano.extremo_izquierdo;
    let nDer = mano.extremo_derecho;

    // 4. Manejar paso de turno
    if (inputLado === 'pasar') {
        const nextTurno = getNextTurno(mano.turno_actual, mano.sentido);
        await supabaseAdmin
          .from('manos')
          .update({ turno_actual: nextTurno })
          .eq('id', mano.id);
        
        return { 
          exito: true, 
          mensaje: 'Has pasado tu turno', 
          manoFinalizada: false,
          talla: '¡Paso y gano!' 
        };
    }

    // 5. Obtener y validar la ficha
    const { data: fichaMano, error: fichaError } = await supabaseAdmin
      .from('fichas_manos')
      .select('*')
      .eq('id', inputFichaId)
      .eq('jugador_id', jugador.id)
      .eq('mano_id', mano.id)
      .single();
    
    if (!fichaMano) {
      throw new Error('No tienes esa ficha en tu mano');
    }

    const vA = fichaMano.valor_a;
    const vB = fichaMano.valor_b;
    let orientacion: 'normal' | 'invertida' = 'normal';

    // 6. Validar y aplicar la jugada
    if (inputLado === 'izquierda') {
      if (nIzq === null && nDer === null) { 
        // Primera jugada - determinar orientación del doble
        nIzq = vA; 
        nDer = vB; 
      }
      else if (vB === nIzq) { nIzq = vA; }
      else if (vA === nIzq) { orientacion = 'invertida'; nIzq = vB; }
      else throw new Error('La ficha no encaja a la izquierda');
    } else {
      if (nIzq === null && nDer === null) { 
        nIzq = vA; 
        nDer = vB; 
      }
      else if (vA === nDer) { nDer = vB; }
      else if (vB === nDer) { orientacion = 'invertida'; nDer = vA; }
      else throw new Error('La ficha no encaja a la derecha');
    }

    // 7. Registrar la ficha en la mesa
    const { count: c } = await supabaseAdmin
      .from('fichas_mesa')
      .select('*', { count: 'exact', head: true })
      .eq('mano_id', mano.id);
    const ord = (c ?? 0) + 1;

    await supabaseAdmin.from('fichas_mesa').insert({
      mano_id: mano.id,
      jugador_id: jugador.id,
      valor_a: vA,
      valor_b: vB,
      lado: inputLado,
      orientacion,
      orden_jugada: ord
    });

    // 8. Eliminar la ficha de la mano del jugador
    await supabaseAdmin.from('fichas_manos').delete().eq('id', inputFichaId);

    // 9. Verificar si el jugador se pegó (ganó la mano)
    const { count: restantes } = await supabaseAdmin
      .from('fichas_manos')
      .select('*', { count: 'exact', head: true })
      .eq('jugador_id', jugador.id)
      .eq('mano_id', mano.id);

    if (restantes === 0) {
      const result = await finalizarManoPegada(supabaseAdmin, partida, mano, jugador);
      return { 
        exito: true, 
        mensaje: '¡Te pegaste! 🎉', 
        manoFinalizada: true,
        partidaFinalizada: result.partidaFinalizada,
        talla: result.talla
      };
    }

    // 10. Actualizar estado de la mesa y pasar turno
    const nextTurno = getNextTurno(mano.turno_actual, mano.sentido);
    await supabaseAdmin
      .from('manos')
      .update({ 
        extremo_izquierdo: nIzq, 
        extremo_derecho: nDer, 
        turno_actual: nextTurno 
      })
      .eq('id', mano.id);

    // 11. Verificar tranca
    const tranca = await checkTranca(supabaseAdmin, mano.id, nIzq, nDer);
    if (tranca) {
      const result = await finalizarManoTrancada(supabaseAdmin, partida, mano, jugador);
      return { 
        exito: true, 
        mensaje: 'La mano se trancó', 
        manoFinalizada: true,
        partidaFinalizada: result.partidaFinalizada,
        talla: result.talla
      };
    }

    // Determinar talla según el tipo de ficha jugada
    let talla: string | undefined;
    if (vA === vB && vA >= 6) {
      talla = `¡La ${vA}-${vB} pesada!`;
    } else if (vA + vB >= 15) {
      talla = '¡Buena ficha!';
    }

    return { exito: true, mensaje: 'Jugada realizada', manoFinalizada: false, talla };
}

async function processBots(supabaseAdmin: SupabaseClient, partidaId: string) {
    let playing = true;
    while (playing) {
        const { data: mano } = await supabaseAdmin
          .from('manos')
          .select('*')
          .eq('partida_id', partidaId)
          .order('fecha_inicio', { ascending: false })
          .limit(1)
          .single();
        
        if (!mano || mano.estado !== 'en_curso') break;

        const { data: currentJugador } = await supabaseAdmin
          .from('jugadores')
          .select('*')
          .eq('partida_id', partidaId)
          .eq('posicion', mano.turno_actual)
          .single();
        
        if (!currentJugador || !currentJugador.user_id.startsWith('bot-')) break;

        await new Promise(r => setTimeout(r, 800)); // Bot delay

        const { data: botFichas } = await supabaseAdmin
          .from('fichas_manos')
          .select('*')
          .eq('jugador_id', currentJugador.id)
          .eq('mano_id', mano.id);
        
        let validPlay = false;
        
        if (botFichas && botFichas.length > 0) {
            for (const f of botFichas) {
                if ((mano.extremo_izquierdo === null && mano.extremo_derecho === null) || 
                    f.valor_b === mano.extremo_izquierdo || 
                    f.valor_a === mano.extremo_izquierdo) {
                    await processJugada(supabaseAdmin, currentJugador.user_id, partidaId, f.id, 'izquierda');
                    validPlay = true;
                    break;
                }
                if (f.valor_a === mano.extremo_derecho || f.valor_b === mano.extremo_derecho) {
                    await processJugada(supabaseAdmin, currentJugador.user_id, partidaId, f.id, 'derecha');
                    validPlay = true;
                    break;
                }
            }
        }
        
        if (!validPlay) {
            await processJugada(supabaseAdmin, currentJugador.user_id, partidaId, '', 'pasar');
        }
    }
}

function getNextTurno(currentTurno: number, sentido: string): number {
  return (sentido === 'antihorario') ? (currentTurno - 1 + 4) % 4 : (currentTurno + 1) % 4;
}

async function checkTranca(supabaseAdmin: SupabaseClient, manoId: string, extIzq: number, extDer: number): Promise<boolean> {
  const { data: fichas } = await supabaseAdmin
    .from('fichas_manos')
    .select('valor_a, valor_b')
    .eq('mano_id', manoId);
  
  if (!fichas || fichas.length === 0) return false;
  
  for (const f of fichas) {
    if (f.valor_a === extIzq || f.valor_b === extIzq || f.valor_a === extDer || f.valor_b === extDer) {
      return false;
    }
  }
  return true;
}

// =====================================================
// SISTEMA DE PUNTUACIÓN CUBANO
// =====================================================

async function finalizarManoPegada(
  supabaseAdmin: SupabaseClient, 
  partida: any, 
  mano: any, 
  ganador: Jugador
): Promise<{ partidaFinalizada: boolean; talla: string }> {
  
  // 1. Obtener todos los jugadores
  const { data: jugadores } = await supabaseAdmin
    .from('jugadores')
    .select('*')
    .eq('partida_id', partida.id);
  
  if (!jugadores) throw new Error('No se encontraron jugadores');

  // 2. Calcular puntos de fichas restantes por equipo
  const equipoPerdedor = (ganador.equipo === 0) ? 1 : 0;
  const jugadoresPerdedores = jugadores.filter(j => j.equipo === equipoPerdedor);
  
  let puntosFichas = 0;
  for (const jp of jugadoresPerdedores) {
    const { data: fichasRestantes } = await supabaseAdmin
      .from('fichas_manos')
      .select('valor_a, valor_b')
      .eq('mano_id', mano.id)
      .eq('jugador_id', jp.id);
    
    if (fichasRestantes) {
      for (const f of fichasRestantes) {
        puntosFichas += f.valor_a + f.valor_b;
      }
    }
  }

  // 3. Calcular bonos
  const bonoPegada = PUNTOS_PEGADA;
  const bonoSalida = partida.salida_inicial ? PUNTOS_SALIDA_INICIAL : 0;
  const puntosTotales = puntosFichas + bonoPegada + bonoSalida;

  // 4. Actualizar marcador
  const puntosEquipoGanador = partida[`puntos_equipo_${ganador.equipo}`] + puntosTotales;
  const partidaFinalizada = puntosEquipoGanador >= META_PUNTOS;

  await supabaseAdmin.from('manos').update({
    estado: 'finalizada',
    razon_fin: 'pegada',
    puntos_ganados_equipo: ganador.equipo,
    puntos_ganados_detalle: {
      puntosFichas,
      bonoPegada,
      bonoSalida
    },
    fecha_fin: new Date().toISOString()
  }).eq('id', mano.id);

  await supabaseAdmin.from('partidas').update({
    estado: partidaFinalizada ? 'finalizada' : 'esperando',
    [`puntos_equipo_${ganador.equipo}`]: puntosEquipoGanador,
    salida_inicial: false,
    ganador: partidaFinalizada ? ganador.equipo : null
  }).eq('id', partida.id);

  // 5. Generar talla
  let talla = `¡${ganador.nombre} se pegó! +${puntosTotales} pts`;
  if (bonoSalida > 0) talla += ' (incluye bono de salida)';

  return { partidaFinalizada, talla };
}

async function finalizarManoTrancada(
  supabaseAdmin: SupabaseClient, 
  partida: any, 
  mano: any, 
  ultimoJugador: Jugador
): Promise<{ partidaFinalizada: boolean; talla: string }> {
  
  // 1. Obtener todos los jugadores
  const { data: jugadores } = await supabaseAdmin
    .from('jugadores')
    .select('*')
    .eq('partida_id', partida.id);
  
  if (!jugadores) throw new Error('No se encontraron jugadores');

  // 2. Calcular puntos por equipo
  const puntosPorEquipo: { [key: number]: number } = { 0: 0, 1: 0 };
  
  for (const j of jugadores) {
    const { data: fichasRestantes } = await supabaseAdmin
      .from('fichas_manos')
      .select('valor_a, valor_b')
      .eq('mano_id', mano.id)
      .eq('jugador_id', j.id);
    
    if (fichasRestantes) {
      for (const f of fichasRestantes) {
        puntosPorEquipo[j.equipo] += f.valor_a + f.valor_b;
      }
    }
  }

  // 3. Regla del tranque cubano:
  // - El equipo con MENOS puntos gana
  // - Si empate: "el que trancó pierde si no tiene menos"
  let equipoGanador: 0 | 1;
  
  if (puntosPorEquipo[0] < puntosPorEquipo[1]) {
    equipoGanador = 0;
  } else if (puntosPorEquipo[1] < puntosPorEquipo[0]) {
    equipoGanador = 1;
  } else {
    // Empate - el que trancó pierde
    equipoGanador = (ultimoJugador.equipo === 0) ? 1 : 0;
  }

  const equipoPerdedor = equipoGanador === 0 ? 1 : 0;
  const puntosGanados = puntosPorEquipo[equipoPerdedor]; // Puntos del equipo perdedor

  // 4. Actualizar marcador
  const puntosEquipoGanador = partida[`puntos_equipo_${equipoGanador}`] + puntosGanados;
  const partidaFinalizada = puntosEquipoGanador >= META_PUNTOS;

  await supabaseAdmin.from('manos').update({
    estado: 'trancada',
    razon_fin: 'tranca',
    puntos_ganados_equipo: equipoGanador,
    puntos_ganados_detalle: {
      puntosFichas: puntosGanados,
      bonoPegada: 0,
      bonoSalida: 0,
      puntosEquipo0: puntosPorEquipo[0],
      puntosEquipo1: puntosPorEquipo[1]
    },
    fecha_fin: new Date().toISOString()
  }).eq('id', mano.id);

  await supabaseAdmin.from('partidas').update({
    estado: partidaFinalizada ? 'finalizada' : 'esperando',
    [`puntos_equipo_${equipoGanador}`]: puntosEquipoGanador,
    salida_inicial: false,
    ganador: partidaFinalizada ? equipoGanador : null
  }).eq('id', partida.id);

  // 5. Generar talla
  const jugadoresGanadores = jugadores.filter(j => j.equipo === equipoGanador);
  const nombresGanadores = jugadoresGanadores.map(j => j.nombre).join(' y ');
  let talla = `¡Tranque! Ganó ${nombresGanadores} con ${puntosGanados} pts`;
  if (puntosPorEquipo[0] === puntosPorEquipo[1]) {
    talla += ' (por empate, pierde el que trancó)';
  }

  return { partidaFinalizada, talla };
}
