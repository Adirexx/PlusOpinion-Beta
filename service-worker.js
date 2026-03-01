// Dynamic version - will be replaced at build time
// Updated at: MAR01_AUTH_FIX_V8.3.2
const VERSION = self.registration.scope.includes('localhost')
  ? Date.now().toString()
  : 'BUILD_20260301_AUTHFIX_V8.3.3';

const CACHE_NAME = `plusopinion-pwa-${VERSION}`;
const SUPABASE_HOSTNAME = 'ogqyemyrxogpnwitumsr.supabase.co';
const PROD_PROXY_BASE = 'https://plusopinion.com/supabase-api';

// Complete list of files to cache for offline support
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/onboarding.html",
  "/HOMEPAGE_FINAL.HTML",
  "/BOOKMARKS.HTML",
  "/CATAGORYPAGE.HTML",
  "/PRIVATE OWNER PROFILE.HTML",
  "/PUBLIC POV PROFILE.HTML",
  "/MY SPACE FINAL (USER).HTML",
  "/MY SPACE FINAL(COMPANIES).HTML",
  "/NOTIFICATION PANEL.HTML",
  "/reset-password.html",
  "/change-password.html",
  "/runtime.js",
  "/bridge.js",
  "/data.seed.js",
  "/auth.js",
  "/auth_guard.js",
  "/supabase.js",
  "/api.js",
  "/state_manager.js",
  "/router.js",
  "/pull_to_refresh.js",
  "/navigation_preloader.js",
  "/notifications.js",
  "/rqs_calculator.js",
  "/payment_gateway.js",
  "/build-version.js",
  "/global.css",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  console.log(`[SW] Installing v${VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(new Request(file + (file.includes('?') ? '&' : '?') + 'v=' + VERSION));
        } catch (err) {
          console.warn(`[SW] Cache miss: ${file}`, err.message);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating v${VERSION}`);
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** True if the pathname ends with a video file extension */
function isVideoUrl(pathname) {
  return /\.(mp4|mov|webm|ogg|avi|mkv|m4v|3gp)(\?|$)/i.test(pathname);
}

/** True if the pathname ends with an image file extension */
function isImageUrl(pathname) {
  return /\.(jpg|jpeg|png|gif|webp|heic|avif|svg|bmp|tiff)(\?|$)/i.test(pathname);
}

// ─────────────────────────────────────────────────────────────────
// CLEAN URL MAPPING (Simulates _redirects on Localhost)
// ─────────────────────────────────────────────────────────────────
const CLEAN_TO_PHYSICAL_MAP = {
  "/feed": "/HOMEPAGE_FINAL.HTML",
  "/onboarding": "/onboarding.html",
  "/reset-password": "/reset-password.html",
  "/change-password": "/change-password.html",
  "/bookmarks": "/BOOKMARKS.HTML",
  "/categories": "/CATAGORYPAGE.HTML",
  "/myspace": "/MY SPACE FINAL (USER).HTML",
  "/workspace": "/MY SPACE FINAL(COMPANIES).HTML",
  "/notifications": "/NOTIFICATION PANEL.HTML",
  "/myprofile": "/PRIVATE OWNER PROFILE.HTML",
  "/profile": "/PUBLIC POV PROFILE.HTML",
  "/about": "/ABOUT.HTML",
  "/support": "/SUPPORT.HTML",
  "/privacy-policy": "/PRIVACY_POLICY.HTML",
  "/t&c": "/TERMS_AND_CONDITIONS.HTML",
  "/maintenance": "/MAINTENANCE.HTML"
};

// ─────────────────────────────────────────────────────────────────
// FETCH EVENT
// ─────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isLocalhost = self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1';

  // ══════════════════════════════════════════════════════════════════
  // CLEAN URL FALLBACK (Localhost only)
  // Intercepts clean paths (e.g. /onboarding) and serves the .html file
  // ══════════════════════════════════════════════════════════════════
  if (isLocalhost && CLEAN_TO_PHYSICAL_MAP[url.pathname]) {
    const physicalPath = CLEAN_TO_PHYSICAL_MAP[url.pathname];
    const newUrl = new URL(physicalPath, url.origin);
    // Maintain query params and hash
    newUrl.search = url.search;
    newUrl.hash = url.hash;

    console.log(`[SW] Routing clean path: ${url.pathname} -> ${physicalPath}`);

    event.respondWith(
      fetch(newUrl).then(response => {
        if (response.ok) return response;
        // If physical file not found, fall back to original request (will 404 anyway)
        return fetch(event.request);
      }).catch(() => fetch(event.request))
    );
    return;
  }

  // ══════════════════════════════════════════════════════════════════
  // SUPABASE ISP BYPASS — Intercept all supabase.co requests
  // ══════════════════════════════════════════════════════════════════
  if (url.hostname === SUPABASE_HOSTNAME) {
    if (isLocalhost) {
      // ── LOCALHOST STRATEGY ─────────────────────────────────────────
      // Videos and images need DIFFERENT proxy strategies:
      //
      // IMAGES → wsrv.nl CDN (fast, compressed, no CORS issues for <img>)
      //          wsrv.nl is an IMAGE-ONLY CDN and CANNOT handle video files.
      //
      // VIDEOS → Production Cloudflare proxy (https://plusopinion.com/supabase-api)
      //          Videos require full HTTP streaming (206 Partial Content + Range),
      //          CORS headers, and Content-Type — all broken with wsrv.nl + no-cors.
      //
      // ALL OTHER (REST/auth) → Production proxy
      // ──────────────────────────────────────────────────────────────

      if (isImageUrl(url.pathname)) {
        // IMAGE: wsrv.nl CDN — compresses & serves as WebP instantly
        const imgProxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url.toString())}&w=900&fit=cover&output=webp&q=80`;
        event.respondWith(
          fetch(imgProxyUrl, {
            mode: 'cors',  // Use cors (not no-cors) so <img> can display the result
            credentials: 'omit'
          }).catch(() =>
            // Fallback: try production proxy if wsrv.nl fails
            fetch(PROD_PROXY_BASE + url.pathname + url.search, { mode: 'cors', credentials: 'omit' })
              .catch(() => new Response(null, { status: 504 }))
          )
        );
        return;
      }

      // VIDEO or REST/Auth: proxy through production Cloudflare worker
      // Localhost python server CANNOT proxy POST/OPTIONS requests properly
      // so we MUST send these directly to the live proxy.
      const prodProxyUrl = PROD_PROXY_BASE + url.pathname + url.search;
      event.respondWith(
        fetch(prodProxyUrl, {
          method: event.request.method,
          headers: event.request.headers,
          body: ['GET', 'HEAD'].includes(event.request.method) ? undefined : event.request.body,
          mode: 'cors',
          credentials: 'omit'
        }).catch(err => {
          console.warn('[SW] Localhost prod-proxy failed:', err.message);
          return new Response(
            isVideoUrl(url.pathname) ? null : JSON.stringify({ error: 'proxy_failed', details: err.message }),
            {
              status: 502,
              headers: {
                'Content-Type': isVideoUrl(url.pathname) ? 'video/mp4' : 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        })
      );
      return;
    }

    // ── PRODUCTION STRATEGY (Cloudflare Pages) ─────────────────────────
    // Same-origin proxy: /supabase-api/* → Cloudflare Worker → Supabase
    // All headers forwarded (Authorization, Range, apikey, etc.)
    // Worker adds proper CORS headers and handles WebSocket upgrades.
    const proxyUrl = self.location.origin + '/supabase-api' + url.pathname + url.search;
    event.respondWith(
      fetch(proxyUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: ['GET', 'HEAD'].includes(event.request.method) ? undefined : event.request.body,
        mode: 'cors',
        credentials: 'omit'
      }).catch(err => {
        console.warn('[SW] Production proxy failed:', err.message);
        return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
      })
    );
    return;
  }

  // Skip non-GET
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip external domains (non-same-origin)
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(null, { status: 504, statusText: 'Gateway Timeout' })
      )
    );
    return;
  }

  // ── Network-first for HTML (always fetch latest) ──
  if (event.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.HTML')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ── Cache-first for static assets (JS, CSS, images) ──
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
    )
  );
});

// Listen for messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
