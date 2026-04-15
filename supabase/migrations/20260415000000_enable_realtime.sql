-- Enable realtime for tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'partidas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE partidas;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'jugadores') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE jugadores;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'manos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE manos;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'fichas_mesa') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE fichas_mesa;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'fichas_manos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE fichas_manos;
  END IF;
END $$;
