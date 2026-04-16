-- Migration: Add pasar_turno function
-- Created: 2026-04-16

-- FUNCTION: pasar_turno (Skip turn when player has no valid moves)
CREATE OR REPLACE FUNCTION pasar_turno(
  p_jugador_id UUID,
  p_mano_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_mano RECORD;
  v_jugador RECORD;
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
    turno_actual = v_siguiente_turno
  WHERE id = p_mano_id;

  RETURN jsonb_build_object(
    'success', true,
    'nuevo_turno', v_siguiente_turno,
    'mensaje', 'Turno pasado'
  );
END;
$$ LANGUAGE plpgsql;
