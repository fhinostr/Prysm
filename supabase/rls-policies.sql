-- ═══════════════════════════════════════════════════════════════
-- PRYSM ABA LMS — ROW-LEVEL SECURITY POLICIES
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

-- ─── HELPER: Get current user's role ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ─── HELPER: Check if user is assigned to a client ──────────
CREATE OR REPLACE FUNCTION public.is_assigned_to(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_assignments
    WHERE client_id = p_client_id AND user_id = auth.uid()
  );
$$;


-- ═══════════════════════════════════════════════════════════════
-- USERS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════

-- All authenticated users can read their own profile
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (id = auth.uid());

-- BCBAs can read all user profiles (to manage their team)
CREATE POLICY "users_select_bcba_all"
  ON public.users FOR SELECT
  USING (public.get_my_role() = 'bcba');

-- Users can update their own profile (name only, not role)
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- CLIENTS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Users see only clients they are assigned to
CREATE POLICY "clients_select_assigned"
  ON public.clients FOR SELECT
  USING (public.is_assigned_to(id));

-- Only BCBAs can create clients
CREATE POLICY "clients_insert_bcba"
  ON public.clients FOR INSERT
  WITH CHECK (public.get_my_role() = 'bcba');

-- Only BCBAs can update clients they are assigned to
CREATE POLICY "clients_update_bcba"
  ON public.clients FOR UPDATE
  USING (public.get_my_role() = 'bcba' AND public.is_assigned_to(id))
  WITH CHECK (public.get_my_role() = 'bcba');

-- Only BCBAs can delete clients they are assigned to
CREATE POLICY "clients_delete_bcba"
  ON public.clients FOR DELETE
  USING (public.get_my_role() = 'bcba' AND public.is_assigned_to(id));


-- ═══════════════════════════════════════════════════════════════
-- CLIENT ASSIGNMENTS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Users can see their own assignments
CREATE POLICY "assignments_select_own"
  ON public.client_assignments FOR SELECT
  USING (user_id = auth.uid());

-- BCBAs can see all assignments for their clients
CREATE POLICY "assignments_select_bcba"
  ON public.client_assignments FOR SELECT
  USING (
    public.get_my_role() = 'bcba'
    AND public.is_assigned_to(client_id)
  );

-- BCBAs can manage assignments for their clients
CREATE POLICY "assignments_insert_bcba"
  ON public.client_assignments FOR INSERT
  WITH CHECK (public.get_my_role() = 'bcba');

CREATE POLICY "assignments_delete_bcba"
  ON public.client_assignments FOR DELETE
  USING (public.get_my_role() = 'bcba');


-- ═══════════════════════════════════════════════════════════════
-- TARGETS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Users see targets for their assigned clients
CREATE POLICY "targets_select_assigned"
  ON public.targets FOR SELECT
  USING (public.is_assigned_to(client_id));

-- Only BCBAs can create targets
CREATE POLICY "targets_insert_bcba"
  ON public.targets FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'bcba'
    AND public.is_assigned_to(client_id)
  );

-- Only BCBAs can update targets
CREATE POLICY "targets_update_bcba"
  ON public.targets FOR UPDATE
  USING (public.get_my_role() = 'bcba' AND public.is_assigned_to(client_id))
  WITH CHECK (public.get_my_role() = 'bcba');

-- Only BCBAs can delete targets
CREATE POLICY "targets_delete_bcba"
  ON public.targets FOR DELETE
  USING (public.get_my_role() = 'bcba' AND public.is_assigned_to(client_id));


-- ═══════════════════════════════════════════════════════════════
-- SESSION DATA POLICIES
-- ═══════════════════════════════════════════════════════════════

-- RBTs can insert session data for their assigned clients
CREATE POLICY "session_data_insert_rbt"
  ON public.session_data FOR INSERT
  WITH CHECK (
    rbt_id = auth.uid()
    AND public.is_assigned_to(client_id)
  );

-- RBTs see their own session data
CREATE POLICY "session_data_select_own"
  ON public.session_data FOR SELECT
  USING (rbt_id = auth.uid());

-- BCBAs see all session data for their assigned clients
CREATE POLICY "session_data_select_bcba"
  ON public.session_data FOR SELECT
  USING (
    public.get_my_role() = 'bcba'
    AND public.is_assigned_to(client_id)
  );


-- ═══════════════════════════════════════════════════════════════
-- CLIENT FILES POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Users see files for their assigned clients
CREATE POLICY "files_select_assigned"
  ON public.client_files FOR SELECT
  USING (public.is_assigned_to(client_id));

-- BCBAs can upload files
CREATE POLICY "files_insert_bcba"
  ON public.client_files FOR INSERT
  WITH CHECK (public.get_my_role() = 'bcba');

-- BCBAs can delete files
CREATE POLICY "files_delete_bcba"
  ON public.client_files FOR DELETE
  USING (public.get_my_role() = 'bcba' AND public.is_assigned_to(client_id));
