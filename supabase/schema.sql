-- =====================================================================
-- PRODE MUNDIAL 2026 — Esquema de base de datos
-- Ejecutar completo en: Supabase → SQL Editor → New Query → Run
-- =====================================================================

-- Extensión UUID (ya habilitada en Supabase, por las dudas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- TABLAS
-- =====================================================================

-- 1. Perfiles (ligados a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT profiles_display_name_unique UNIQUE (display_name)
);
COMMENT ON TABLE public.profiles IS 'Un perfil por usuario autenticado.';

-- 2. Pronósticos
CREATE TABLE IF NOT EXISTS public.predictions (
  user_id     UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id    TEXT  NOT NULL,
  goals_home  INT   NOT NULL CHECK (goals_home  >= 0 AND goals_home  <= 20),
  goals_away  INT   NOT NULL CHECK (goals_away  >= 0 AND goals_away  <= 20),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, match_id)
);
COMMENT ON TABLE public.predictions IS 'Pronóstico de cada usuario para cada partido.';

-- 3. Resultados reales
CREATE TABLE IF NOT EXISTS public.results (
  match_id    TEXT  PRIMARY KEY,
  goals_home  INT   NOT NULL CHECK (goals_home >= 0),
  goals_away  INT   NOT NULL CHECK (goals_away >= 0),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.results IS 'Resultado real de cada partido, cargado por el organizador.';

-- 4. Partidos de eliminatoria (el admin los agrega cuando se conocen los cruces)
CREATE TABLE IF NOT EXISTS public.knockout_matches (
  id          TEXT        PRIMARY KEY,
  label       TEXT        NOT NULL DEFAULT 'Eliminatoria',
  team1       TEXT        NOT NULL,
  team2       TEXT        NOT NULL,
  kickoff     TEXT,   -- ISO string con offset ET ej: "2026-07-04T16:00:00-04:00"
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.knockout_matches IS 'Partidos de la fase eliminatoria, definidos a medida que avanza el torneo.';

-- 5. Configuración general (PIN del organizador, etc.)
CREATE TABLE IF NOT EXISTS public.settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
COMMENT ON TABLE public.settings IS 'Pares clave-valor de configuración. Ej: admin_pin.';

-- =====================================================================
-- TRIGGER: actualizar updated_at automáticamente
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knockout_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings         ENABLE ROW LEVEL SECURITY;

-- profiles --
-- Todos los autenticados pueden ver los perfiles (para la tabla de posiciones).
-- Cada usuario solo puede crear/modificar el suyo.
CREATE POLICY "profiles: leer todos"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles: crear el propio"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: editar el propio"
  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- predictions --
-- Todos los autenticados pueden leer (para calcular la tabla).
-- Cada usuario solo puede crear/modificar sus propias predicciones.
CREATE POLICY "predictions: leer todas"
  ON public.predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "predictions: crear las propias"
  ON public.predictions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "predictions: actualizar las propias"
  ON public.predictions FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- results --
-- Todos los autenticados pueden leer.
-- Cualquier autenticado puede escribir (la protección real es el PIN en la app).
CREATE POLICY "results: leer todos"
  ON public.results FOR SELECT TO authenticated USING (true);
CREATE POLICY "results: escribir (requiere PIN en la app)"
  ON public.results FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- knockout_matches --
CREATE POLICY "knockouts: leer todos"
  ON public.knockout_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "knockouts: escribir (requiere PIN en la app)"
  ON public.knockout_matches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- settings --
CREATE POLICY "settings: leer todos"
  ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings: escribir"
  ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================================
-- FIN
-- =====================================================================
-- Verificá que las 5 tablas aparezcan en Supabase → Table Editor.
-- Si querés empezar desde cero más adelante, ejecutá esto primero:
--   DROP TABLE IF EXISTS settings, knockout_matches, results, predictions, profiles CASCADE;
--   DROP FUNCTION IF EXISTS public.set_updated_at CASCADE;
