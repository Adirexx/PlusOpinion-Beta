/**
 * routeMap.js — Old filename → New clean path mapping
 *
 * This is the canonical record of every URL translation.
 * Used by:
 *   1. public/_redirects (legacy 301 redirects)
 *   2. legacyGlobals.js (window.navigateTo shim)
 *   3. _worker.js deep-link handler
 *   4. Any code that must convert a legacy path to a new one
 *
 * Keys are the OLD physical filenames/paths (as they appeared
 * in window.location.href assignments in the compiled bundles).
 * Values are the new React Router clean paths.
 */
export const ROUTE_MAP = {
  // ── App pages ────────────────────────────────────────────
  'HOMEPAGE_FINAL.HTML':               '/feed',
  'BOOKMARKS.HTML':                    '/bookmarks',
  'CATAGORYPAGE.HTML':                 '/categories',
  'MY SPACE FINAL (USER).HTML':        '/myspace',
  'MY SPACE FINAL(COMPANIES).HTML':    '/workspace',
  'NOTIFICATION PANEL.HTML':           '/notifications',
  'PRIVATE OWNER PROFILE.HTML':        '/myprofile',
  'PUBLIC POV PROFILE.HTML':           '/profile',

  // ── Auth pages ───────────────────────────────────────────
  'index.html':                        '/',
  'ONBOARDING.HTML':                   '/',      // merged into index.html / Login.jsx
  'reset-password.html':               '/reset-password',
  'change-password.html':              '/change-password',

  // ── Static / legal pages ─────────────────────────────────
  'ABOUT.HTML':                        '/about',
  'SUPPORT.HTML':                      '/support',
  'PRIVACY_POLICY.HTML':               '/privacy-policy',
  'TERMS_AND_CONDITIONS.HTML':         '/t&c',
  'MAINTENANCE.HTML':                  '/maintenance',
  'COOKIES.HTML':                      '/cookies-policy',

  // ── Clean-path aliases (already used in _redirects) ─────
  '/feed':             '/feed',
  '/bookmarks':        '/bookmarks',
  '/categories':       '/categories',
  '/myspace':          '/myspace',
  '/workspace':        '/workspace',
  '/notifications':    '/notifications',
  '/myprofile':        '/myprofile',
  '/profile':          '/profile',
  '/about':            '/about',
  '/support':          '/support',
  '/privacy-policy':   '/privacy-policy',
  '/t&c':              '/t&c',
  '/maintenance':      '/maintenance',
  '/cookies-policy':   '/cookies-policy',
  '/reset-password':   '/reset-password',
  '/change-password':  '/change-password',
  '/settings':         '/settings',
  'SETTINGS.HTML':     '/settings',
  'settings.html':     '/settings',
}

/**
 * Resolve a legacy path or filename to the new clean path.
 * Falls back to the input if not found (for already-clean paths
 * like /profile?id=... which just need query params preserved).
 */
export function resolveRoute(legacyPath) {
  if (!legacyPath) return '/'
  // Strip leading slash for lookup
  const key = legacyPath.startsWith('/') ? legacyPath.slice(1) : legacyPath
  return ROUTE_MAP[legacyPath] || ROUTE_MAP[key] || legacyPath
}

/**
 * List of routes that require authentication.
 * Ported directly from spa_router.js AUTH_REQUIRED_PAGES.
 * Values are the NEW clean paths.
 */
export const AUTH_REQUIRED_ROUTES = new Set([
  '/myspace',
  '/workspace',
  '/notifications',
  '/myprofile',
  '/bookmarks',
  '/settings',
])

/**
 * Routes accessible to guests (no auth needed).
 * Not an exhaustive list — used as a positive allowlist check.
 */
export const GUEST_ALLOWED_ROUTES = new Set([
  '/',
  '/feed',
  '/categories',
  '/profile',
  '/post',
  '/about',
  '/support',
  '/privacy-policy',
  '/t&c',
  '/cookies-policy',
  '/reset-password',
  '/change-password',
])
