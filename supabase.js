// ============================================
// SUPABASE CLIENT INITIALIZATION
// PlusOpinion — ISP-Bypass Enabled
// ============================================
// HOW THE PROXY WORKS:
// ─────────────────────────────────────────────
// The Supabase JS client MUST be initialized with the real supabase.co URL.
// Supabase uses that URL internally to build auth, storage, and realtime paths.
// If you swap this for the proxy URL, the client builds wrong token/storage endpoints.
//
// THE PROXY IS APPLIED TRANSPARENTLY:
//   Localhost  → Service Worker intercepts supabase.co fetches → routes to https://plusopinion.com/supabase-api
//   Production → Service Worker intercepts supabase.co fetches → routes to /supabase-api (same-origin Cloudflare Worker)
//   Cloudflare Worker → strips /supabase-api prefix → forwards to real supabase.co
//
// This means ALL Supabase API calls go through our proxy automatically — auth, REST, storage, realtime.
// The client never needs to know about the proxy at all.
// ─────────────────────────────────────────────

// FIX: Save UMD library reference BEFORE we overwrite window.supabase
// The Supabase UMD bundle sets window.supabase = { createClient, ... }
// We MUST save it under a private key first, or we destroy the library.
window._supabaseLib = window.supabase;

const SUPABASE_PROJECT_REF = 'ogqyemyrxogpnwitumsr';
const SUPABASE_PROJECT_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM";

// Detect environment
const _hostname = window.location.hostname;
const _isLocalhost = _hostname === 'localhost' ||
  _hostname === '127.0.0.1' ||
  _hostname.startsWith('192.168.') ||
  _hostname.startsWith('10.') ||
  _hostname.endsWith('.local');

function initializeSupabase() {
  if (!window._supabaseLib || !window._supabaseLib.createClient) {
    console.error('[Supabase] UMD library not loaded! Cannot initialize client.');
    return null;
  }

  const client = window._supabaseLib.createClient(
    // Always pass the real Supabase project URL — the Service Worker proxies it transparently.
    // Passing the proxy URL here would cause internal client paths (auth, storage, realtime) to break.
    SUPABASE_PROJECT_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        // 'implicit' flow is required for Google One Tap (signInWithIdToken).
        // PKCE redirects to the current URL path — on localhost this becomes /onboarding
        // (without .html) from the route cleaner → 404. Keep implicit.
        flowType: 'implicit'
      },
      global: {
        headers: {
          'X-Client-Info': 'plusopinion-web'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        // In production, route WebSocket through Cloudflare Worker.
        // The SW can't upgrade HTTP→WS on localhost, so we let the client
        // connect directly to supabase.co for realtime on localhost.
        ...(!_isLocalhost && {
          url: window.location.origin.replace(/^http/, 'ws') + '/supabase-api/realtime/v1'
        })
      }
    }
  );

  // Expose the initialized CLIENT (not the library) as window.supabase
  window.supabase = client;
  return client;
}

// Initialize immediately when script loads
const _supabaseClient = initializeSupabase();

// Log which path is being used (service worker will handle the actual proxying)
const _proxyMode = _isLocalhost
  ? 'localhost → SW → https://plusopinion.com/supabase-api'
  : 'production → SW → /supabase-api (Cloudflare Worker)';
console.log('[Supabase] ✅ Client initialized via ISP-bypass proxy →', _proxyMode);

