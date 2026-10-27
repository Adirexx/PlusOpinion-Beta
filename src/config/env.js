/**
 * env.js — Environment Configuration
 *
 * Reads all runtime config from import.meta.env (Vite VITE_* variables).
 * Set these in .env (local dev) or Cloudflare Pages dashboard (production).
 * The Supabase anon key is public by design — security is enforced by RLS.
 *
 * Cloudflare Pages note: set NODE_VERSION=22 in the dashboard to match
 * the engines field in package.json (Vite 8 requires Node >=20.19 || >=22.12).
 *
 * TODO(Phase 9): Remove all hardcoded fallback values below.
 * They exist only to allow the app to start during Phase 1–8 development
 * without a .env file. In production all VITE_* vars must be set in the
 * Cloudflare Pages environment variables dashboard.
 */

export const SUPABASE_PROJECT_REF = 'ogqyemyrxogpnwitumsr'

// TODO(Phase 9): Remove fallback
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL
  || `https://${SUPABASE_PROJECT_REF}.supabase.co`

// TODO(Phase 9): Remove fallback (anon key — public by design, prefer env var)
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM'

// TODO(Phase 9): Remove fallback
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '409858133156-vho68t8ci9mob650b1lokl9drgqr2eih.apps.googleusercontent.com'

// TODO(Phase 9): Remove fallback
export const GA_ID =
  import.meta.env.VITE_GA_ID
  || 'G-D42E61TP4M'

export const IS_DEV  = import.meta.env.DEV
export const IS_PROD = import.meta.env.PROD

// Supabase proxy base — used by supabaseClient.js (Phase 2, Q4 Option B)
// The Supabase client is initialised pointing here; Vite proxy (dev) and
// _worker.js (prod) rewrite /supabase-api/* to the real supabase endpoint.
export const SUPABASE_PROXY_BASE = '/supabase-api'
