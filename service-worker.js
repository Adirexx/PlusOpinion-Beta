// Dynamic version - will be replaced at build time
// For localhost, use timestamp; for production, use build timestamp
// Updated at: FEB23_MAJOR_UPDATE_V3.4
const VERSION = self.registration.scope.includes('localhost')
  ? Date.now().toString()
  : 'BUILD_20260223_MAJOR_V3.5';

const CACHE_NAME = `plusopinion-pwa-${VERSION}`;

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

  // Core Scripts
  "/runtime.js",
  "/bridge.js",
  "/data.seed.js",
  "/auth.js",
  "/auth_guard.js",
  "/supabase.js",
  "/api.js",

  // SPA Infrastructure
  "/state_manager.js",
  "/router.js",
  "/pull_to_refresh.js",
  "/navigation_preloader.js",

  // Feature Scripts
  "/notifications.js",
  "/rqs_calculator.js",
  "/payment_gateway.js",
  "/build-version.js",

  // Styles
  "/global.css",

  // Media
  "/bg-video.mp4",
  "/icon-192.png",
  "/icon-512.png",

  // PWA
  "/manifest.json"
];

// Install event - cache files with robust error handling
self.addEventListener("install", (event) => {
  console.log(`[SW] Installing version ${VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Loop through files and add them individually to pinpoint errors
      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
          // console.log(`[SW] Cached: ${file}`);
        } catch (err) {
          console.error(`[SW] Failed to cache: ${file}`, err);
          // In production, you might want to throw or ignore
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate event - delete old caches
self.addEventListener("activate", (event) => {
  console.log(`[SW] Activating version ${VERSION}`);
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control immediately
});

// Fetch event - smart caching strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip caching for non-GET requests (POST, PUT, DELETE are not cacheable)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip caching for external domains (only cache same-origin requests)
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }



  // Network-first for HTML pages (always get latest version)
  if (event.request.destination === 'document' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline - serve from cache
          return caches.match(event.request);
        })
    );
  }
  // Cache-first for static assets (CSS, JS, images) - faster loading
  else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          // Only cache successful responses
          if (fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        });
      })
    );
  }
});

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
