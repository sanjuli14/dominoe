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

ALTER TABLE partidas ADD COLUMN codigo_sala TEXT UNIQUE DEFAULT generar_codigo_sala();

DROP POLICY IF EXISTS "Los jugadores pueden ver a otros jugadores" ON jugadores;
CREATE POLICY "Los jugadores pueden ver a otros jugadores"
  ON jugadores FOR SELECT
  USING ( true );
