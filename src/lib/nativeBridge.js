/**
 * nativeBridge.js — Capacitor Native Bridge Service
 *
 * Phase 8: Central initialization point for all native platform integrations.
 * Called once from main.jsx after React renders.
 *
 * Responsibilities:
 *   1. Hardware back button handling (LIFO modal stack)
 *   2. Deep link / App Links handling
 *   3. Splash screen dismissal
 *   4. Status bar styling
 *   5. External link interception (Chrome Custom Tabs)
 *
 * All native imports are lazy-loaded so this module is safe to import on web.
 * The guard `Capacitor.isNativePlatform()` prevents any native code from
 * executing in the browser.
 */

import { authReadyPromise } from './auth.js'
import { resetFeedSession } from './dataCache.js'

// ── Platform detection (synchronous, safe on web) ──────────────────
export const isNative = () => {
  try {
    return window.Capacitor?.isNativePlatform?.() === true
  } catch {
    return false
  }
}

// ── Back button exit guard state ───────────────────────────────────
let _lastBackPress = 0
let _routerRef = null

/**
 * Set the React Router instance so the back button can navigate history.
 * Called from App.jsx after router creation.
 */
export const setNativeRouter = (router) => {
  _routerRef = router
}

/**
 * Initialize all native bridge listeners.
 * Safe to call on web — all native code is guarded.
 */
export async function initNativeBridge() {
  if (!isNative()) return

  try {
    // ── 1. Status Bar — edge-to-edge overlay mode ──────────────────
    // setOverlaysWebView(true) makes the webview extend UNDER the status bar.
    // CSS env(safe-area-inset-top) then provides the exact pixel offset so
    // our fixed headers sit below the status bar icons — clean edge-to-edge.
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setStyle({ style: Style.Dark })
    // Background is irrelevant in overlay mode but keep for compatibility
    await StatusBar.setBackgroundColor({ color: '#020205' })

    // ── 2. Splash Screen — wait for auth before hiding ──────────────
    // We keep the splash up until auth state is resolved so the user never
    // sees a flash of the login page or a loading spinner on first open.
    // authReadyPromise resolves in AuthContext as soon as the INITIAL_SESSION
    // event fires — typically < 200 ms. We cap at 2 s as a safety timeout.
    const { SplashScreen } = await import('@capacitor/splash-screen')
    const authTimeout = new Promise(resolve => setTimeout(resolve, 2000))
    await Promise.race([authReadyPromise, authTimeout])
    try {
      await SplashScreen.hide()
    } catch (e) {
      console.warn('[NativeBridge] SplashScreen.hide failed:', e)
    }

    // ── 3. Hardware Back Button ────────────────────────────────────
    const { App } = await import('@capacitor/app')

    App.addListener('backButton', ({ canGoBack }) => {
      // Layer 1: Check for open modals/overlays (close them first)
      const modalClosed = tryCloseTopModal()
      if (modalClosed) return

      // Layer 2: Check if we can go back in navigation history
      if (canGoBack && _routerRef) {
        _routerRef.navigate(-1)
        return
      }

      // Layer 3: Root screen — double-press to exit
      const now = Date.now()
      if (now - _lastBackPress < 2000) {
        resetFeedSession()
        App.exitApp()
      } else {
        _lastBackPress = now
        // Dispatch a toast event so ToastContext picks it up
        window.dispatchEvent(new CustomEvent('toast', {
          detail: {
            message: 'Press back again to exit',
            icon: 'ArrowLeft',
            isSuccess: false,
          }
        }))
      }
    })

    // ── 4. Deep Links / App Links ──────────────────────────────────
    App.addListener('appUrlOpen', (data) => {
      try {
        const url = new URL(data.url)
        const pathname = url.pathname + url.search + url.hash

        // Only handle plusopinion.com URLs
        if (url.hostname === 'plusopinion.com' || url.hostname === 'www.plusopinion.com') {
          if (_routerRef) {
            _routerRef.navigate(pathname)
          } else {
            // Fallback: use window.navigateTo from legacyGlobals
            window.navigateTo?.(pathname)
          }
        }
      } catch {
        // Invalid URL — ignore
      }
    })

    // ── 5. App state change listener (resume/pause) ────────────────
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground — refresh auth session if needed
        window.dispatchEvent(new Event('app-resume'))
      }
    })

    console.log('[NativeBridge] Initialized successfully')
  } catch (err) {
    console.warn('[NativeBridge] Init failed:', err)
  }
}

/**
 * Try to close the topmost open modal/overlay.
 * Returns true if a modal was closed, false otherwise.
 *
 * Detection priority (LIFO):
 *   1. Image/Video lightbox
 *   2. Share modal
 *   3. Opinion modal
 *   4. Auth modal (login/signup)
 *   5. Menu drawer
 *   6. Inbox panel
 *   7. Any dialog
 */
function tryCloseTopModal() {
  // Strategy: dispatch a custom event that modal components listen for.
  // Each modal checks if it's open and closes itself, stopping propagation.
  const event = new CustomEvent('native-back-button', {
    bubbles: true,
    cancelable: true,
    detail: { handled: false }
  })
  document.dispatchEvent(event)

  // If any modal handled it, the event's detail.handled will be true
  if (event.detail.handled) return true

  // Fallback: check for common modal selectors in the DOM
  const overlays = [
    // Full-screen image/video lightbox
    '.lightbox-overlay',
    // Share modal
    '[data-modal="share"]',
    // Opinion modal
    '[data-modal="opinion"]',
    // Auth modal
    '[data-modal="auth"]',
    // Menu drawer
    '.menu-drawer.open',
    '.slide-menu.open',
    // Inbox panel
    '.inbox-panel.open',
    // Generic overlays
    '.modal-overlay',
    '.overlay.open',
  ]

  for (const selector of overlays) {
    const el = document.querySelector(selector)
    if (el) {
      // Try clicking the close button or the overlay backdrop
      const closeBtn = el.querySelector('[data-close], .close-btn, .back-btn, button[aria-label="Close"]')
      if (closeBtn) {
        closeBtn.click()
        return true
      }
      // Click the overlay itself to dismiss
      el.click()
      return true
    }
  }

  return false
}

/**
 * Open an external URL in Chrome Custom Tabs (native) or new tab (web).
 * Use this instead of window.open() for external links.
 */
export async function openExternalUrl(url) {
  if (isNative()) {
    try {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url, presentationStyle: 'popover' })
      return
    } catch {
      // Fall through to web
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Native share sheet. Falls back to Web Share API on browsers.
 */
export async function nativeShare(title, text, url) {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title, text, url, dialogTitle: 'Share with...' })
      return { success: true }
    } catch (err) {
      // User cancelled or plugin error
      return { success: false, error: err }
    }
  }

  // Web Share API fallback
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return { success: true }
    } catch (err) {
      return { success: false, error: err }
    }
  }

  return { success: false, error: new Error('Share not supported') }
}
