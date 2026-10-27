import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ── Phase 7: PWA enabled ─────────────────────────────────────────
// Service Worker strategy: "injectManifest" is NOT used here because
// we rely on Cloudflare Pages' _worker.js for proxy routing and OG
// injection. Instead we use generateSW (Workbox) with a careful
// runtime caching strategy that does NOT intercept /supabase-api/*
// or the SPA router. This keeps the Capacitor Phase 8 path clean.
//
// Caching strategy:
//   - App shell (HTML): NetworkFirst (always gets fresh index.html)
//   - Static assets (JS/CSS/fonts/images): CacheFirst (long-lived)
//   - /supabase-api/*: NetworkOnly (never cached — auth tokens etc.)
//   - /feed, /post/*, /profile/*: NetworkFirst (SPA navigation)

const SUPABASE_REAL = 'https://ogqyemyrxogpnwitumsr.supabase.co'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Use the existing public/manifest.json (Phase 7 manifest)
      manifest: false,

      // Workbox config — generateSW mode (Vite handles SW generation)
      workbox: {
        // SW scope: the whole app
        navigateFallback: '/index.html',

        // Never intercept Supabase API calls — auth tokens must not be cached
        navigateFallbackDenylist: [
          /^\/supabase-api\//,
          /^\/api\//,
        ],

        // Runtime caching rules
        runtimeCaching: [
          {
            // Supabase API — NetworkOnly, never cached
            urlPattern: /\/supabase-api\//,
            handler: 'NetworkOnly',
          },
          {
            // Static assets (JS, CSS, fonts, woff2)
            urlPattern: /\.(?:js|css|woff2?|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Images (PNG, JPG, WEBP, SVG, GIF)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            // Supabase storage CDN images (avatars, post media)
            urlPattern: new RegExp(`^https://.*\\.supabase\\.co/storage/`),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-media',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days
              },
            },
          },
        ],

        // Precache the core app shell files
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Exclude _worker.js from precache — Cloudflare Pages handles it
        globIgnores: ['_worker.js', '_redirects', '_headers'],
      },

      devOptions: {
        // Enable SW in dev so you can test offline/caching behaviour
        enabled: false, // set to true temporarily to test PWA in dev
        type: 'module',
      },
    }),
  ],

  // ── Dev server proxy (replaces the old SW localhost proxy) ───────
  // /supabase-api/* → real supabase.co for local development.
  // In production: Cloudflare _worker.js handles /supabase-api/*.
  server: {
    proxy: {
      '/supabase-api': {
        target: SUPABASE_REAL,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/supabase-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward Range header so video streaming works in dev
            if (req.headers['range']) {
              proxyReq.setHeader('Range', req.headers['range'])
            }
          })
        },
      },
    },
    host: true,   // expose to LAN for Android device testing
  },

  // ── Preview (production build server) ────────────────────────────
  preview: {
    host: true,
    port: 4173,
  },

  // ── Build ─────────────────────────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: false,          // never ship source maps to production
    target: 'es2020',          // Android WebView 89+ / Chrome 85+ supports ES2020
    cssCodeSplit: true,        // per-page CSS chunks — faster first paint
    assetsInlineLimit: 4096,   // inline assets <4KB as base64 (saves HTTP round-trips)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React stack — loaded on every page
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) return 'vendor'
          // Supabase client — auth/data layer
          if (id.includes('@supabase/supabase-js') || id.includes('@supabase/realtime')) return 'supabase'
          // Framer Motion — only loaded on animated pages
          if (id.includes('framer-motion')) return 'framer'
          // jsPDF — only loaded in MySpace earnings export
          if (id.includes('jspdf')) return 'pdf'
        },
        // Content-hash filenames for immutable long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})

