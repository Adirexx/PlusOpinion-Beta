// ============================================
// SUPABASE CLIENT INITIALIZATION
// PlusOpinion — ISP-Bypass Enabled
// ============================================
// FIX #1: Save UMD library reference BEFORE we overwrite window.supabase
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

// FIX #2: Realtime WebSocket Proxy
// In production, route WebSocket through Cloudflare — same origin as the REST proxy.
// Cloudflare Workers propagate WebSocket Upgrade headers natively.
// In localhost dev, we must use the direct Supabase URL since localhost can't proxy WS.
const SUPABASE_REST_URL = _isLocalhost
  ? 'https://plusopinion.com/supabase-api'     // Dev: piggyback on live production proxy
  : window.location.origin + '/supabase-api';  // Production: same-origin Cloudflare proxy

// The Supabase JS client derives its Realtime WebSocket URL from the project URL.
// We force it to go through our proxy by using a custom 'global.fetch' and 'realtime' params.
// For WebSocket: Supabase uses the restUrl's hostname to build the WSS URL.
// By pointing restUrl to our proxy, realtime ALSO uses our proxy path.

function initializeSupabase() {
  if (!window._supabaseLib || !window._supabaseLib.createClient) {
    console.error('[Supabase] UMD library not loaded! Cannot initialize client.');
    return null;
  }

  const client = window._supabaseLib.createClient(
    SUPABASE_REST_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        flowType: 'implicit'  // Implicit works correctly with Google One Tap (signInWithIdToken)
        // Do NOT use 'pkce' here — PKCE redirects back to the current URL path, which on
        // localhost becomes /onboarding (without .html) from the route cleaner → 404.
      },
      global: {
        headers: {
          // Ensure our proxy can identify requests if needed
          'X-Client-Info': 'plusopinion-web'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
          // Route realtime through our proxy endpoint in production
          // In production, the worker handles 'wss://<domain>/supabase-api/realtime/v1/websocket'
        },
        // Only route through proxy in production — localhost can't proxy WebSockets
        ...(
          !_isLocalhost && {
            url: window.location.origin.replace(/^http/, 'ws') + '/supabase-api/realtime/v1'
          }
        )
      }
    }
  );

  // FIX #1 (cont): Expose the initialized CLIENT (not the library) as window.supabase
  // This is safe now because we saved the library under window._supabaseLib
  window.supabase = client;
  return client;
}

// Initialize immediately when script loads
initializeSupabase();

console.log('[Supabase] ✅ Client initialized via ISP-bypass proxy →', SUPABASE_REST_URL);
