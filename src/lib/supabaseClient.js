/**
 * supabaseClient.js — Single Supabase Client Instance
 *
 * Phase 2 / §2 — Option B: the client targets /supabase-api directly.
 *
 * HOW THIS DIFFERS FROM THE OLD supabase.js:
 * ─────────────────────────────────────────────────────────────────────
 * Old approach: client initialized with the real supabase.co URL.
 *   The Service Worker intercepts all fetches to supabase.co and rewrites
 *   them to /supabase-api. Client never knows about the proxy.
 *
 * New approach (Option B): a custom fetch wrapper rewrites supabase.co
 *   URLs to /supabase-api BEFORE they leave the browser, inside the
 *   Supabase client itself — no Service Worker needed. This is required
 *   for Capacitor Android, where SW interception is unreliable.
 *
 * HOW IT WORKS:
 *   The Supabase JS client builds all URLs from the project URL you pass
 *   to createClient(). Internally it does:
 *     fetch(`${projectUrl}/rest/v1/...`, ...)
 *     fetch(`${projectUrl}/auth/v1/...`, ...)
 *     fetch(`${projectUrl}/storage/v1/...`, ...)
 *   We pass the real URL to createClient() (required — the client uses it
 *   to build all endpoint paths), and supply a custom global.fetch that
 *   intercepts any outgoing request targeting supabase.co and rewrites the
 *   URL to the same-origin proxy before the network call is made.
 *
 * REALTIME:
 *   WebSockets cannot be rewritten via fetch(). We pass the proxy WebSocket
 *   URL directly via realtime.url in production (same as the old supabase.js
 *   lines 71-73). On localhost, Vite's dev proxy handles /supabase-api,
 *   including ws:// upgrades (Vite's proxy has native WS support).
 *
 * autoAcceptTerms / acceptTerms CORS NOTE (from auth.js L48-92, auth_guard.js L94-128):
 *   In the old app, calls using window.supabase.from().update() to patch
 *   profiles failed silently because the Cloudflare Worker's CORS allowlist
 *   was missing the 'content-profile' header. The workaround was a raw
 *   fetch() directly to supabase.co. With Option B and our custom fetch
 *   interceptor, ALL fetch calls (including those from this workaround) go
 *   through /supabase-api — so the content-profile header issue goes away.
 *   The raw fetch() workarounds in auth.js/auth_guard.js are PRESERVED
 *   as-is in AuthContext.jsx for now. Phase 9 can simplify them once the
 *   fix is confirmed stable.
 *
 * OLD OPTIONS vs NEW OPTIONS (required by §4):
 * ┌────────────────────────────┬───────────────────────────────────────┐
 * │ Option (old supabase.js)   │ New value / note                      │
 * ├────────────────────────────┼───────────────────────────────────────┤
 * │ URL: real supabase.co      │ SAME — required for internal paths    │
 * │ auth.persistSession: true  │ SAME                                  │
 * │ auth.autoRefreshToken: true│ SAME                                  │
 * │ auth.detectSessionInUrl:tr │ SAME                                  │
 * │ auth.storage: localStorage │ SAME                                  │
 * │ auth.flowType: 'implicit'  │ SAME (Google One Tap requirement)     │
 * │ global.headers X-Client-In │ SAME: 'plusopinion-web'               │
 * │ realtime.params.eventsPerS │ SAME: 10                              │
 * │ realtime.url (prod only)   │ SAME pattern — ws://origin/supabase-a│
 * │                            │   /realtime/v1                        │
 * │ global.fetch (SW proxy)    │ NEW: custom fetch interceptor — same  │
 * │                            │   net effect, no SW dependency        │
 * └────────────────────────────┴───────────────────────────────────────┘
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env.js'

// ── Environment detection ──────────────────────────────────────────
const _hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const _port = typeof window !== 'undefined' ? window.location.port : ''
const _isCapacitor = typeof window !== 'undefined' && (
  Boolean(window.Capacitor) ||
  window.location.protocol === 'capacitor:' ||
  (_hostname === 'localhost' && !_port)
)
const _isLocalhost = !_isCapacitor && (
  _hostname === 'localhost' ||
  _hostname === '127.0.0.1' ||
  _hostname.startsWith('192.168.') ||
  _hostname.startsWith('10.') ||
  _hostname.endsWith('.local')
)

const SUPABASE_HOSTNAME = 'ogqyemyrxogpnwitumsr.supabase.co'
const SUPABASE_ORIGIN   = `https://${SUPABASE_HOSTNAME}`

/**
 * Custom fetch interceptor — rewrites supabase.co → /supabase-api
 * before the request hits the network. Works in browser, Capacitor WebView,
 * and any environment where fetch() is available.
 *
 * On localhost: /supabase-api → Vite dev proxy → real supabase.co
 * On production / Capacitor: /supabase-api → Cloudflare _worker.js → real supabase.co
 */
function _proxyFetch(input, init = {}) {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

  if (typeof url === 'string' && url.includes(SUPABASE_HOSTNAME)) {
    // In Capacitor, origin is https://localhost (with no local proxy server).
    // Route to production Cloudflare proxy to preserve ISP bypass and CORS.
    const origin = _isCapacitor
      ? 'https://plusopinion.com'
      : (typeof window !== 'undefined' ? window.location.origin : '')
    url = url.replace(SUPABASE_ORIGIN, origin + '/supabase-api')

    // Clone the Request if needed, preserving all init options
    const requestInit = {
      ...init,
      // duplex: 'half' is required when a POST body is sent from a Service Worker;
      // it's optional (but harmless) in a regular browser context. We set it
      // here to future-proof Capacitor scenarios.
      ...(init.body && init.method && !['GET', 'HEAD'].includes(init.method)
        ? { duplex: 'half' }
        : {}),
    }

    return fetch(url, requestInit)
  }

  // Non-supabase URL — pass through unchanged
  return fetch(input, init)
}

// ── WebSocket URL for Realtime ──────────────────────────────────────
// Localhost: Vite proxy handles /supabase-api with ws:// upgrade support
// Production / Capacitor: Cloudflare _worker.js handles the WS upgrade via WebSocketPair
const _realtimeUrl = _isCapacitor
  ? 'wss://plusopinion.com/supabase-api/realtime/v1'
  : (_isLocalhost
    ? undefined  // Let the client connect to Vite proxy ws://localhost:5173/supabase-api/realtime/v1
    : (typeof window !== 'undefined'
      ? window.location.origin.replace(/^http/, 'ws') + '/supabase-api/realtime/v1'
      : undefined))

// ── Create the single Supabase client instance ─────────────────────
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: true,
      storage:           typeof window !== 'undefined' ? window.localStorage : undefined,
      // 'implicit' flow is required for Google One Tap (signInWithIdToken).
      // PKCE would redirect to the current URL path — on localhost this can
      // produce a /onboarding route (without .html) → 404. Keep implicit.
      flowType: 'implicit',
    },
    global: {
      headers: {
        'X-Client-Info': 'plusopinion-web',
      },
      fetch: _proxyFetch,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      ...(_realtimeUrl ? { url: _realtimeUrl } : {}),
    },
  }
)

// ── Dev log ────────────────────────────────────────────────────────
const _proxyMode = _isLocalhost
  ? 'localhost → Vite proxy → supabase.co'
  : 'production → /supabase-api → Cloudflare Worker → supabase.co'
console.log('[Supabase] ✅ Client initialized (Option B proxy) →', _proxyMode)
