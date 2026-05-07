// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Supabase Client (Singleton)
// Include this via <script> AFTER the Supabase CDN script.
// ═══════════════════════════════════════════════════════════════

// ┌──────────────────────────────────────────────────────────────┐
// │  REPLACE THESE WITH YOUR SUPABASE PROJECT CREDENTIALS       │
// │  (Settings → API → Project URL & anon key)                  │
// └──────────────────────────────────────────────────────────────┘
const SUPABASE_URL = 'https://bxviubmwwhsmkbccauum.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dml1Ym13d2hzbWtiY2NhdXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Mjc0NzYsImV4cCI6MjA2MjIwMzQ3Nn0.8XAleW8bxdEiyeQ0cjmD_g_4jbp9x7U';

// Initialize the Supabase client (requires the CDN script loaded first)
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
