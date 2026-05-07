-- ═══════════════════════════════════════════════════════════════
-- PRYSM ABA LMS — DATABASE SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM TYPES ──────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('bcba', 'rbt');
CREATE TYPE target_domain AS ENUM ('skill', 'problem');
CREATE TYPE measurement_type AS ENUM ('ta', 'percent', 'interval', 'frequency', 'duration');
CREATE TYPE target_phase AS ENUM (
  'Acquisition', 'Fluency', 'Generalization',
  'Maintenance', 'Intervention', 'Reduction'
);
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'discharged');

-- ─── USERS (extends auth.users) ─────────────────────────────
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'rbt',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CLIENTS ─────────────────────────────────────────────────
CREATE TABLE public.clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinical_id   TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  initials      TEXT NOT NULL,
  dob           DATE,
  status        client_status NOT NULL DEFAULT 'active',
  created_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CLIENT ↔ STAFF ASSIGNMENTS ─────────────────────────────
CREATE TABLE public.client_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- ─── TARGETS (Treatment Plan Programs) ──────────────────────
CREATE TABLE public.targets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  domain              target_domain NOT NULL,
  measurement_type    measurement_type NOT NULL,
  phase               target_phase NOT NULL DEFAULT 'Acquisition',
  op_def              TEXT,
  procedures          TEXT,
  example             TEXT,
  non_example         TEXT,
  steps               TEXT[],
  interval_length     INT,
  interval_unit       TEXT CHECK (interval_unit IN ('seconds', 'minutes')),
  interval_kind       TEXT CHECK (interval_kind IN ('whole', 'partial', 'momentary')),
  mastery_threshold   INT,
  mastery_consecutive INT DEFAULT 3,
  mastery_max_occ     INT,
  last_staff_name     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── SESSION DATA ────────────────────────────────────────────
CREATE TABLE public.session_data (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  target_id     UUID NOT NULL REFERENCES public.targets(id) ON DELETE CASCADE,
  rbt_id        UUID NOT NULL REFERENCES public.users(id),
  session_date  TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_secs INT,
  data_json     JSONB NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CLIENT FILES (Document Metadata) ───────────────────────
CREATE TABLE public.client_files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('insurance', 'assessment', 'treatment', 'additional')),
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  description   TEXT,
  uploaded_by   UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_client_assignments_user ON public.client_assignments(user_id);
CREATE INDEX idx_client_assignments_client ON public.client_assignments(client_id);
CREATE INDEX idx_targets_client ON public.targets(client_id);
CREATE INDEX idx_session_data_client ON public.session_data(client_id);
CREATE INDEX idx_session_data_target ON public.session_data(target_id);
CREATE INDEX idx_session_data_rbt ON public.session_data(rbt_id);
CREATE INDEX idx_client_files_client ON public.client_files(client_id);

-- ─── AUTO-UPDATE updated_at TRIGGER ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_targets_updated_at
  BEFORE UPDATE ON public.targets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── AUTO-CREATE USER PROFILE ON SIGNUP ─────────────────────
-- When a new user signs up via Supabase Auth, automatically
-- create a row in public.users with their email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'rbt')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
