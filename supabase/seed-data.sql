-- ═══════════════════════════════════════════════════════════════
-- PRYSM ABA LMS — SEED DATA (DEV/STAGING)
-- Run this AFTER schema.sql and rls-policies.sql
--
-- IMPORTANT: Before running this, you must first create two
-- users in Supabase Auth (Authentication → Users → Add user):
--   1. bcba@prysm.com  (password: PrysmDemo2026!)
--   2. rbt@prysm.com   (password: PrysmDemo2026!)
--
-- Then replace the UUIDs below with the actual UUIDs from
-- the Supabase Auth dashboard.
-- ═══════════════════════════════════════════════════════════════

-- ─── STEP 1: Update user profiles ────────────────────────────
-- Replace these UUIDs with the actual ones from your Auth Users list

UPDATE public.users
SET full_name = 'Dr. Sarah Mitchell', role = 'bcba'
WHERE id = '427687ba-06f4-4e92-adbe-b7f6f839c023';

UPDATE public.users
SET full_name = 'Maria Rodriguez', role = 'rbt'
WHERE id = 'b17b2a33-6d89-46b1-a3fd-0837e19d4c07';

-- Make sure to create dawenn@prysm.com (or username Dawenn) in Supabase Auth first with ID below
UPDATE public.users
SET full_name = 'Dawenn', role = 'bcba'
WHERE id = 'dawenn-demo-id';

-- ─── STEP 2: Insert demo clients ─────────────────────────────

INSERT INTO public.clients (id, clinical_id, full_name, initials, dob, status) VALUES
  ('a1b2c3d4-0001-4000-a000-000000000001', 'CLN-2026-001', 'John Doe', 'JD', '2019-03-15', 'active'),
  ('a1b2c3d4-0002-4000-a000-000000000002', 'CLN-2026-002', 'Mia Hernandez', 'MH', '2020-07-22', 'active'),
  ('a1b2c3d4-0003-4000-a000-000000000003', 'CLN-2026-003', 'Ethan Brooks', 'EB', '2018-11-04', 'active');

-- ─── STEP 3: Assign staff to clients ─────────────────────────
-- The BCBA supervises all 3 clients, the RBT provides direct care for 2

INSERT INTO public.client_assignments (client_id, user_id, role)
SELECT
  'a1b2c3d4-0001-4000-a000-000000000001',
  id,
  'bcba'
FROM public.users WHERE email = 'bcba@prysm.com';

INSERT INTO public.client_assignments (client_id, user_id, role)
SELECT
  'a1b2c3d4-0002-4000-a000-000000000002',
  id,
  'bcba'
FROM public.users WHERE email = 'bcba@prysm.com';

INSERT INTO public.client_assignments (client_id, user_id, role)
SELECT
  'a1b2c3d4-0003-4000-a000-000000000003',
  id,
  'bcba'
FROM public.users WHERE email = 'bcba@prysm.com';

-- Dawenn gets BCBA assignments too
INSERT INTO public.client_assignments (client_id, user_id, role)
SELECT
  'a1b2c3d4-0001-4000-a000-000000000001',
  id,
  'bcba'
FROM public.users WHERE email = 'dawenn' OR email = 'dawenn@prysm.com';

INSERT INTO public.client_assignments (client_id, user_id, role)
SELECT
  'a1b2c3d4-0002-4000-a000-000000000002',
  id,
  'bcba'
FROM public.users WHERE email = 'dawenn' OR email = 'dawenn@prysm.com';

-- RBT assigned to John Doe and Mia Hernandez (NOT Ethan Brooks — tests RLS)
INSERT INTO public.client_assignments (client_id, user_id, role)
SELECT
  'a1b2c3d4-0001-4000-a000-000000000001',
  id,
  'rbt'
FROM public.users WHERE email = 'rbt@prysm.com';

INSERT INTO public.client_assignments (client_id, user_id, role)
SELECT
  'a1b2c3d4-0002-4000-a000-000000000002',
  id,
  'rbt'
FROM public.users WHERE email = 'rbt@prysm.com';

-- ─── STEP 4: Insert treatment targets for John Doe ───────────
-- These mirror the DEFAULT_PROGRAM from program-data.js

INSERT INTO public.targets (client_id, name, domain, measurement_type, phase, op_def, procedures, example, non_example, steps, mastery_threshold, mastery_consecutive, last_staff_name) VALUES
(
  'a1b2c3d4-0001-4000-a000-000000000001',
  'Tying Shoes',
  'skill',
  'ta',
  'Acquisition',
  'The learner will independently complete all steps of tying their shoes within 2 minutes of the discriminative stimulus (Sd) "Tie your shoes".',
  'Total Task Presentation with least-to-most prompting. Wait 3 seconds for independent response before providing next level prompting. Reinforce immediately upon completion.',
  'Learner pulls loops tight securely without the knot slipping.',
  'Learner ties a "granny knot" that falls apart immediately.',
  ARRAY['Pick up one lace in each hand', 'Cross the laces', 'Tuck one lace under the other', 'Pull tight', 'Make a loop with one lace', 'Wrap the other lace around the loop', 'Push the lace through the hole', 'Pull both loops tight'],
  90, 3, 'Maria R.'
),
(
  'a1b2c3d4-0001-4000-a000-000000000001',
  'Tacting Colors',
  'skill',
  'percent',
  'Acquisition',
  'Saying the correct color name (verbal response) within 3 seconds of the therapist pointing to a colored card and asking "What color?".',
  'Present Sd "What color?". Wait 3s. If incorrect, use echoic prompt and mark (-). If correct, provide vocal praise and mark (+).',
  'Saying "Blue" clearly. Approximations like "Bwue" are acceptable.',
  'Saying the wrong color, no response, or saying "color".',
  NULL,
  90, 3, 'James T.'
),
(
  'a1b2c3d4-0001-4000-a000-000000000001',
  'Independent Play',
  'skill',
  'interval',
  'Generalization',
  'Engaging appropriately with toys continuously for the entire 1-minute interval without seeking adult attention.',
  'Whole interval recording. Mark the interval ONLY if the child played independently for the entire 60 seconds without interruption.',
  'Stacking blocks, looking at book pages quietly.',
  'Throwing toys, bringing toy to therapist during the interval.',
  NULL,
  90, 3, 'Maria R.'
),
(
  'a1b2c3d4-0001-4000-a000-000000000001',
  'Hitting',
  'problem',
  'frequency',
  'Intervention',
  'Any instance of open or closed hand making forceful contact with another person from a distance greater than 6 inches.',
  'Block when possible. Do not provide verbal attention. Re-direct neutrally.',
  'Slapping therapist''s arm.',
  'High-five, gently resting hand on shoulder.',
  NULL,
  NULL, 3, 'James T.'
),
(
  'a1b2c3d4-0001-4000-a000-000000000001',
  'Tantrum',
  'problem',
  'duration',
  'Intervention',
  'Engaging in crying with tears or whining accompanied by dropping to the floor or throwing items.',
  'Start timer at onset. Stop timer when 30 seconds of calm behavior occurs. Planned ignoring. Ensure safety.',
  'Crying loudly while kicking floor.',
  'Brief protest without crying, calmly saying "no".',
  NULL,
  NULL, 3, 'Sara L.'
);

-- ─── STEP 5: Insert sample session data (last 3 sessions) ───
-- For John Doe's "Tacting Colors" target

INSERT INTO public.session_data (client_id, target_id, rbt_id, session_date, data_json)
SELECT
  'a1b2c3d4-0001-4000-a000-000000000001',
  t.id,
  u.id,
  now() - interval '3 days',
  '{"correct": 7, "total": 10, "percent": 70}'::jsonb
FROM public.targets t, public.users u
WHERE t.name = 'Tacting Colors'
  AND t.client_id = 'a1b2c3d4-0001-4000-a000-000000000001'
  AND u.email = 'rbt@prysm.com';

INSERT INTO public.session_data (client_id, target_id, rbt_id, session_date, data_json)
SELECT
  'a1b2c3d4-0001-4000-a000-000000000001',
  t.id,
  u.id,
  now() - interval '2 days',
  '{"correct": 8, "total": 10, "percent": 80}'::jsonb
FROM public.targets t, public.users u
WHERE t.name = 'Tacting Colors'
  AND t.client_id = 'a1b2c3d4-0001-4000-a000-000000000001'
  AND u.email = 'rbt@prysm.com';

INSERT INTO public.session_data (client_id, target_id, rbt_id, session_date, data_json)
SELECT
  'a1b2c3d4-0001-4000-a000-000000000001',
  t.id,
  u.id,
  now() - interval '1 day',
  '{"correct": 9, "total": 10, "percent": 90}'::jsonb
FROM public.targets t, public.users u
WHERE t.name = 'Tacting Colors'
  AND t.client_id = 'a1b2c3d4-0001-4000-a000-000000000001'
  AND u.email = 'rbt@prysm.com';
