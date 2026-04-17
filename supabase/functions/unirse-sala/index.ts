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
    console.log('[unirse-sala] Auth header:', authHeader ? 'Presente' : 'Ausente');

    if (!authHeader) {
      throw new Error('No autorizado - Falta header Authorization');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Token inválido - ' + (authError?.message || 'Usuario no encontrado'));
    }

    console.log('[unirse-sala] JWT validado, userId:', user.id);

    const { codigoSala, nombre } = await req.json();
    
    // El userId viene SIEMPRE del JWT, nunca del body
    const playerUserId = user.id;                          
    if (!codigoSala) throw new Error('Código de sala requerido');

    // Find the room
    const { data: partida, error: pError } = await supabaseAdmin
      .from('partidas')
      .select('*')
      .eq('codigo_sala', codigoSala.toUpperCase())
      .single();

    if (pError || !partida) throw new Error('Sala no encontrada');
    if (partida.estado !== 'esperando')
      throw new Error('La partida ya empezó o finalizó');

    // Get current players
    const { data: jugadores, error: jListError } = await supabaseAdmin
      .from('jugadores')
      .select('*')
      .eq('partida_id', partida.id)
      .order('posicion', { ascending: true });

    if (jListError || !jugadores)
      throw new Error(jListError?.message || 'Error leyendo jugadores');

    // Check if the current user is already in the game
    if (jugadores.some((j) => j.user_id === playerUserId)) {
      return new Response(JSON.stringify({ partidaId: partida.id }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const numJugadores = jugadores.length;
    if (numJugadores >= 4) throw new Error('La sala está llena');

    const nuevaPosicion = numJugadores;
    const nuevoEquipo = nuevaPosicion % 2;

    const { data: nuevoJugador, error: jError } = await supabaseAdmin
      .from('jugadores')
      .insert({
        partida_id: partida.id,
        user_id: playerUserId,
        posicion: nuevaPosicion,
        equipo: nuevoEquipo,
        nombre: nombre || `Jugador ${nuevaPosicion + 1}`,
      })
      .select()
      .single();

    if (jError || !nuevoJugador)
      throw new Error(jError?.message || 'Error uniéndose a la partida');

    return new Response(JSON.stringify({ partidaId: partida.id }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || 'Error interno' }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  }
});
