-- =====================================================
-- MIGRATION: Add fichas_conteo table for tracking tile counts
-- This allows players to see how many tiles opponents have
-- =====================================================

-- =====================================================
-- 1. TABLE: fichas_conteo (Tile count per player per hand)
-- =====================================================
CREATE TABLE IF NOT EXISTS fichas_conteo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mano_id UUID NOT NULL REFERENCES manos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 10,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(mano_id, jugador_id)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX idx_fichas_conteo_mano ON fichas_conteo(mano_id);
CREATE INDEX idx_fichas_conteo_jugador ON fichas_conteo(jugador_id);

-- =====================================================
-- 3. ENABLE RLS
-- =====================================================
ALTER TABLE fichas_conteo ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES
-- Players can see all tile counts in their game
-- =====================================================
CREATE POLICY "Jugadores pueden ver conteo de fichas"
  ON fichas_conteo FOR SELECT
  USING (
    auth.uid() IN (
      SELECT j.user_id 
      FROM jugadores j 
      JOIN manos m ON m.partida_id = j.partida_id 
      WHERE m.id = fichas_conteo.mano_id
    )
  );

CREATE POLICY "Edge function puede modificar conteo"
  ON fichas_conteo FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. FUNCTION: Initialize tile counts when hand starts
-- =====================================================
CREATE OR REPLACE FUNCTION inicializar_fichas_conteo()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert 10 tiles for each player in the game
  INSERT INTO fichas_conteo (mano_id, jugador_id, cantidad)
  SELECT 
    NEW.id as mano_id,
    j.id as jugador_id,
    10 as cantidad
  FROM jugadores j
  WHERE j.partida_id = NEW.partida_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGER: Auto-initialize on new hand
-- =====================================================
DROP TRIGGER IF EXISTS trigger_inicializar_conteo ON manos;
CREATE TRIGGER trigger_inicializar_conteo
  AFTER INSERT ON manos
  FOR EACH ROW
  EXECUTE FUNCTION inicializar_fichas_conteo();

-- =====================================================
-- 7. FUNCTION: Decrement tile count when tile is played
-- =====================================================
CREATE OR REPLACE FUNCTION decrementar_fichas_conteo()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fichas_conteo
  SET cantidad = cantidad - 1,
      fecha_actualizacion = now()
  WHERE mano_id = NEW.mano_id 
    AND jugador_id = NEW.jugador_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGER: Auto-decrement when tile is played
-- =====================================================
DROP TRIGGER IF EXISTS trigger_decrementar_conteo ON fichas_mesa;
CREATE TRIGGER trigger_decrementar_conteo
  AFTER INSERT ON fichas_mesa
  FOR EACH ROW
  EXECUTE FUNCTION decrementar_fichas_conteo();

-- =====================================================
-- 9. FUNCTION: Reset tile counts for new hand
-- =====================================================
CREATE OR REPLACE FUNCTION reset_fichas_conteo_nueva_mano(p_mano_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE fichas_conteo
  SET cantidad = 10,
      fecha_actualizacion = now()
  WHERE mano_id = p_mano_id;
END;
$$ LANGUAGE plpgsql;
