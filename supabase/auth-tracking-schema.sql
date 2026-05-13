-- ═══════════════════════════════════════════════════════════════
-- PRYSM ABA LMS — AUTHORIZATION TRACKING SCHEMA
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── CLIENT AUTHORIZATIONS ──────────────────────────────────
-- Stores which CPT codes are authorized for each client
-- and how many hours are approved for each.
CREATE TABLE IF NOT EXISTS public.client_authorizations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cpt_code          TEXT NOT NULL,
  authorized_hours  NUMERIC(6,2) NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  auth_start_date   DATE,
  auth_end_date     DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, cpt_code)
);

-- ─── APPOINTMENTS (Billing Calendar) ────────────────────────
-- Persists the billing calendar appointments with CPT code,
-- completion status, and duration tracking.
CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name     TEXT,
  rbt_name        TEXT,
  reason          TEXT,
  cpt_code        TEXT,
  day_index       INT NOT NULL,
  start_slot      INT NOT NULL,
  end_slot        INT NOT NULL,
  duration_minutes NUMERIC(6,2),
  status          TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  completed_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_client_auths_client
  ON public.client_authorizations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_auths_code
  ON public.client_authorizations(cpt_code);
CREATE INDEX IF NOT EXISTS idx_appointments_client
  ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_cpt
  ON public.appointments(cpt_code);

-- ─── AUTO-UPDATE TRIGGERS ────────────────────────────────────
CREATE TRIGGER set_client_auths_updated_at
  BEFORE UPDATE ON public.client_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── SEED SAMPLE AUTHORIZATIONS ─────────────────────────────
-- Give John Doe some example authorizations
INSERT INTO public.client_authorizations (client_id, cpt_code, authorized_hours, is_active)
VALUES
  ('a1b2c3d4-0001-4000-a000-000000000001', '97153', 40, true),
  ('a1b2c3d4-0001-4000-a000-000000000001', '97155', 10, true),
  ('a1b2c3d4-0001-4000-a000-000000000001', '97156', 5,  true),
  ('a1b2c3d4-0002-4000-a000-000000000002', '97153', 30, true),
  ('a1b2c3d4-0002-4000-a000-000000000002', '97151', 8,  true)
ON CONFLICT (client_id, cpt_code) DO NOTHING;
