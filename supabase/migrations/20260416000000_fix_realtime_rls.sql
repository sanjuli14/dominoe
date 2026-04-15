-- Simplificar RLS de jugadores para que Supabase Realtime no se bloquee.
-- Las subconsultas a la misma tabla (jugadores) causan que el WAL decoder
-- de Realtime falle y no envíe el evento de INSERT a los suscriptores.

DROP POLICY IF EXISTS "Jugadores pueden ver jugadores" ON jugadores;

CREATE POLICY "Jugadores pueden ver jugadores en toda la app"
  ON jugadores FOR SELECT
  USING (auth.uid() IS NOT NULL);
