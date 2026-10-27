/**
 * main.jsx — Application Entry Point
 *
 * The ONLY place createRoot() is called.
 *
 * Phase 2 change: legacyGlobals.js is imported BEFORE App — this
 * ensures window.supabase, window.getFeed, window.navigateTo etc.
 * are available before any component mounts. Any not-yet-ported
 * code that calls window.* will find them already on the global.
 *
 * C1.5 FONT FIX: Latin subset only (Phase 1 correction).
 */

// ── Legacy globals shim (MUST be first import) ──────────────────
import './lib/legacyGlobals.js'

import React from 'react'
import ReactDOM from 'react-dom/client'

// ── Fonts — Latin subset only (C1.5) ────────────────────────────
import '@fontsource/inter/latin-300.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'

// ── Styles (tokens → global [includes Tailwind] → app-shell) ────
import './styles/tokens.css'
import './styles/global.css'
import './styles/app-shell.css'
import './styles/static-pages.css'
import './styles/pull-to-refresh.css'

// ── Native bridge (Phase 8 — Capacitor) ─────────────────────────
import { initNativeBridge } from './lib/nativeBridge.js'

// ── App root ─────────────────────────────────────────────────────
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Initialize native bridge AFTER React has mounted — this hides the
// splash screen and registers hardware back button, deep links, etc.
// Safe on web — all native calls are guarded by isNativePlatform().
initNativeBridge()
