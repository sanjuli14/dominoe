-- =====================================================
-- DOMINO DOBLE 9 - SUPABASE DATABASE SCHEMA
-- 55 tiles (0-0 to 9-9), 4 players, 2 teams, 200 points
-- =====================================================

-- =====================================================
-- FUNCTION: generate_room_code
-- =====================================================
CREATE OR REPLACE FUNCTION generar_codigo_sala() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. TABLE: partidas (Games)
-- =====================================================
CREATE TABLE IF NOT EXISTS partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_sala TEXT UNIQUE DEFAULT generar_codigo_sala(),
  estado TEXT NOT NULL DEFAULT 'esperando', -- 'esperando', 'en_curso', 'finalizada'
  puntos_equipo_0 INTEGER NOT NULL DEFAULT 0,
  puntos_equipo_1 INTEGER NOT NULL DEFAULT 0,
  mano_actual INTEGER NOT NULL DEFAULT 1,
  salida_inicial BOOLEAN NOT NULL DEFAULT true,
  ganador INTEGER, -- 0 or 1 (team)
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. TABLE: jugadores (Players in a game)
-- =====================================================
CREATE TABLE IF NOT EXISTS jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Supabase auth.users.id
  posicion INTEGER NOT NULL, -- 0, 1, 2, 3
  equipo INTEGER NOT NULL, -- 0 or 1 (posicion % 2)
  nombre TEXT NOT NULL DEFAULT 'Jugador',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partida_id, user_id),
  UNIQUE(partida_id, posicion)
);

-- =====================================================
-- 3. TABLE: manos (Rounds/Hands within a game)
-- =====================================================
CREATE TABLE IF NOT EXISTS manos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id UUID NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'en_curso', -- 'repartiendo', 'en_curso', 'finalizada', 'trancada'
  jugador_salida UUID, -- jugador_id who starts
  extremo_izquierdo INTEGER,
  extremo_derecho INTEGER,
  turno_actual INTEGER NOT NULL DEFAULT 0, -- posicion 0-3
  sentido TEXT NOT NULL DEFAULT 'horario', -- 'horario', 'antihorario'
  razon_fin TEXT, -- 'pegada', 'tranca'
  puntos_ganados_equipo INTEGER,
  puntos_ganados_detalle JSONB, -- { puntosFichas, bonoPegada, bonoSalida }
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ
);

-- =====================================================
-- 4. TABLE: fichas_manos (Tiles held by players)
-- =====================================================
CREATE TABLE IF NOT EXISTS fichas_manos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mano_id UUID NOT NULL REFERENCES manos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  valor_a INTEGER NOT NULL,
  valor_b INTEGER NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 5. TABLE: fichas_mesa (Tiles played on the board)
-- =====================================================
CREATE TABLE IF NOT EXISTS fichas_mesa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mano_id UUID NOT NULL REFERENCES manos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  valor_a INTEGER NOT NULL,
  valor_b INTEGER NOT NULL,
  lado TEXT NOT NULL, -- 'izquierda', 'derecha'
  orientacion TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'invertida'
  orden_jugada INTEGER NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_jugadores_partida ON jugadores(partida_id);
CREATE INDEX idx_jugadores_user ON jugadores(user_id);
CREATE INDEX idx_manos_partida ON manos(partida_id);
CREATE INDEX idx_fichas_manos_mano ON fichas_manos(mano_id);
CREATE INDEX idx_fichas_manos_jugador ON fichas_manos(jugador_id);
CREATE INDEX idx_fichas_mesa_mano ON fichas_mesa(mano_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE manos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_manos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichas_mesa ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: partidas
-- All players in a game can read/update the game state
-- =====================================================
CREATE POLICY "Jugadores pueden ver partidas"
  ON partidas FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM jugadores WHERE partida_id = partidas.id
    )
  );

CREATE POLICY "Jugadores pueden actualizar partidas"
  ON partidas FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM jugadores WHERE partida_id = partidas.id
    )
  );

CREATE POLICY "Jugadores pueden insertar partidas"
  ON partidas FOR INSERT
  WITH CHECK (true); -- Anyone can create a game

-- =====================================================
-- RLS POLICIES: jugadores
-- Players can see all players in their game
-- =====================================================
CREATE POLICY "Jugadores pueden ver jugadores"
  ON jugadores FOR SELECT
  USING ( true );

CREATE POLICY "Jugadores pueden insertar jugadores"
  ON jugadores FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: manos
-- All players in a game can read/update hands
-- =====================================================
CREATE POLICY "Jugadores pueden ver manos"
  ON manos FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM jugadores
      WHERE partida_id = manos.partida_id
    )
  );

CREATE POLICY "Jugadores pueden insertar manos"
  ON manos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Jugadores pueden actualizar manos"
  ON manos FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM jugadores
      WHERE partida_id = manos.partida_id
    )
  );

-- =====================================================
-- RLS POLICIES: fichas_manos (CRITICAL - players ONLY see their own tiles)
-- =====================================================
CREATE POLICY "Solo el dueño ve sus fichas"
  ON fichas_manos FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM jugadores
      WHERE id = fichas_manos.jugador_id
    )
  );

CREATE POLICY "Edge function puede insertar fichas"
  ON fichas_manos FOR INSERT
  WITH CHECK (true); -- Only Edge Functions insert tiles

CREATE POLICY "Edge function puede eliminar fichas"
  ON fichas_manos FOR DELETE
  USING (true); -- Edge Functions delete when tiles are played

-- =====================================================
-- RLS POLICIES: fichas_mesa (All players can see board tiles)
-- =====================================================
CREATE POLICY "Todos pueden ver fichas de mesa"
  ON fichas_mesa FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM jugadores
      WHERE partida_id = (
        SELECT partida_id FROM manos WHERE id = fichas_mesa.mano_id
      )
    )
  );

CREATE POLICY "Edge function puede insertar fichas de mesa"
  ON fichas_mesa FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTION: Generate 55 domino tiles (0-0 to 9-9)
-- =====================================================
CREATE OR REPLACE FUNCTION generar_fichas_doble_9()
RETURNS TABLE(valor_a INTEGER, valor_b INTEGER) AS $$
BEGIN
  FOR valor_a IN 0..9 LOOP
    FOR valor_b IN valor_a..9 LOOP
      RETURN NEXT;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Update fecha_actualizacion on partidas
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partidas_updated_at
  BEFORE UPDATE ON partidas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: pasar_turno (Skip turn when player has no valid moves)
-- =====================================================
CREATE OR REPLACE FUNCTION pasar_turno(
  p_jugador_id UUID,
  p_mano_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_mano RECORD;
  v_jugador RECORD;
  v_partida RECORD;
  v_siguiente_turno INTEGER;
  v_puede_jugar BOOLEAN;
BEGIN
  -- Obtener datos de la mano
  SELECT * INTO v_mano FROM manos WHERE id = p_mano_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Mano no encontrada');
  END IF;

  -- Verificar que la mano esté en curso
  IF v_mano.estado != 'en_curso' THEN
    RETURN jsonb_build_object('error', 'La mano no está en curso');
  END IF;

  -- Obtener datos del jugador
  SELECT * INTO v_jugador FROM jugadores WHERE id = p_jugador_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Jugador no encontrado');
  END IF;

  -- Verificar que sea el turno del jugador
  IF v_mano.turno_actual != v_jugador.posicion THEN
    RETURN jsonb_build_object('error', 'No es tu turno');
  END IF;

  -- Verificar que el jugador no tenga fichas jugables (seguridad)
  SELECT EXISTS (
    SELECT 1 FROM fichas_manos fm
    WHERE fm.jugador_id = p_jugador_id
    AND fm.mano_id = p_mano_id
    AND (
      v_mano.extremo_izquierdo IS NULL OR -- Primera jugada
      fm.valor_a = v_mano.extremo_izquierdo OR
      fm.valor_b = v_mano.extremo_izquierdo OR
      fm.valor_a = v_mano.extremo_derecho OR
      fm.valor_b = v_mano.extremo_derecho
    )
  ) INTO v_puede_jugar;

  IF v_puede_jugar THEN
    RETURN jsonb_build_object('error', 'Tienes fichas para jugar');
  END IF;

  -- Calcular siguiente turno según el sentido
  IF v_mano.sentido = 'horario' THEN
    v_siguiente_turno := (v_mano.turno_actual + 1) % 4;
  ELSE
    v_siguiente_turno := (v_mano.turno_actual + 3) % 4; -- +3 es equivalente a -1 en módulo 4
  END IF;

  -- Actualizar el turno
  UPDATE manos SET
    turno_actual = v_siguiente_turno,
    fecha_actualizacion = now()
  WHERE id = p_mano_id;

  RETURN jsonb_build_object(
    'success', true,
    'nuevo_turno', v_siguiente_turno,
    'mensaje', 'Turno pasado'
  );
END;
$$ LANGUAGE plpgsql;
