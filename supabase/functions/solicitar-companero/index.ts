import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * BUSCA / SOLICITAR COMPAÑERO
 *
 * Cuando un jugador no tiene dobles al inicio:
 * 1. Puede solicitar que su compañero juegue si lo tiene
 * 2. Si el compañero tampoco tiene, se le devuelve el turno
 * 3. Se registra la solicitud en un evento para notificar al compañero
 */
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

    // 1. Obtener partida
    const { data: partida, error: partidaError } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('id', partidaId)
      .single();

    if (partidaError || !partida) {
      throw new Error('Partida no encontrada');
    }

    // 2. Obtener mano actual
    const { data: mano, error: manoError } = await supabaseAdmin
      .from('manos')
      .select('*')
      .eq('partida_id', partidaId)
      .order('fecha_inicio', { ascending: false })
      .limit(1)
      .single();

    if (manoError || !mano || mano.estado !== 'en_curso') {
      throw new Error('No hay mano activa');
    }

    // 3. Obtener jugador solicitante
    const { data: jugador, error: jugadorError } = await supabaseAdmin
      .from('jugadores')
      .select('*')
      .eq('partida_id', partidaId)
      .eq('user_id', user.id)
      .single();

    if (!jugador || mano.turno_actual !== jugador.posicion) {
      throw new Error('No es tu turno');
    }

    // 4. Verificar que la mano acaba de empezar (tablero vacío)
    const { count: fichasCount } = await supabaseAdmin
      .from('fichas_mesa')
      .select('*', { count: 'exact', head: true })
      .eq('mano_id', mano.id);

    if (fichasCount && fichasCount > 0) {
      throw new Error('La mano ya ha comenzado, no puedes solicitar compañero');
    }

    // 5. Obtener todos los jugadores
    const { data: jugadores } = await supabaseAdmin
      .from('jugadores')
      .select('*')
      .eq('partida_id', partidaId)
      .order('posicion', { ascending: true });

    if (!jugadores || jugadores.length !== 4) {
      throw new Error('Error: número de jugadores inválido');
    }

    // 6. Obtener compañero (equipo igual, posición + 2 mod 4)
    const partnerPosicion = (jugador.posicion + 2) % 4;
    const partner = jugadores.find((j) => j.posicion === partnerPosicion);

    if (!partner) {
      throw new Error('No se encontró compañero');
    }

    // 7. Obtener fichas del compañero
    const { data: partnerFichas } = await supabaseAdmin
      .from('fichas_manos')
      .select('*')
      .eq('mano_id', mano.id)
      .eq('jugador_id', partner.id);

    // 8. Buscar el doble más alto del compañero
    let highestDouble = -1;
    let highestFichaId = '';

    if (partnerFichas && partnerFichas.length > 0) {
      for (const f of partnerFichas) {
        if (f.valor_a === f.valor_b && f.valor_a > highestDouble) {
          highestDouble = f.valor_a;
          highestFichaId = f.id;
        }
      }
    }

    // 9. Si el compañero SÍ tiene dobles, transferir turno
    if (highestDouble >= 0) {
      // Actualizar turno a la posición del compañero
      await supabaseAdmin
        .from('manos')
        .update({ turno_actual: partner.posicion })
        .eq('id', mano.id);

      return new Response(
        JSON.stringify({
          exito: true,
          busca: true,
          mensaje: `¡${partner.nombre} juega con su doble ${highestDouble}!`,
          partnerNombre: partner.nombre,
          partnerPosicion: partner.posicion,
          highestDouble,
          highestFichaId,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      );
    }

    // 10. Si el compañero NO tiene dobles, devolver turno al solicitante
    if (highestDouble === -1) {
      return new Response(
        JSON.stringify({
          exito: true,
          busca: false,
          mensaje: `Tu compañero ${partner.nombre} tampoco tiene dobles. ¡Te toca jugar a ti!`,
          partnerNombre: partner.nombre,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        },
      );
    }
  } catch (error: any) {
    console.error('Error in solicitar-companero:', error);
    return new Response(
      JSON.stringify({
        exito: false,
        error: error.message || 'Error interno del servidor',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  }
});
