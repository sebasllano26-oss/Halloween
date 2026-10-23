-- The server connects through PostgreSQL as the table owner.
-- Browser/API roles receive no row policies for private application state.
BEGIN;
CREATE TABLE IF NOT EXISTS public.halloween_app_state (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.halloween_app_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.halloween_app_state FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.halloween_app_state FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.halloween_app_state FROM authenticated;
  END IF;
END $$;
COMMIT;
