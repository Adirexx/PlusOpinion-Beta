/**
 * haptics.js — Unified Haptic Feedback Bridge
 *
 * Phase 8: Provides a single haptic feedback function that works across
 * all platforms:
 *   - Native (Capacitor): Uses @capacitor/haptics for proper taptic engine
 *   - Web/PWA: Falls back to navigator.vibrate()
 *
 * This replaces all scattered navigator.vibrate() calls across the codebase.
 * Import { triggerHaptic } from this file instead of calling navigator.vibrate directly.
 */

let _Haptics = null
let _ImpactStyle = null
let _pluginLoaded = false

// Lazy-load the Capacitor haptics plugin only when running natively
async function loadHapticsPlugin() {
  if (_pluginLoaded) return
  _pluginLoaded = true
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const mod = await import('@capacitor/haptics')
      _Haptics = mod.Haptics
      _ImpactStyle = mod.ImpactStyle
    }
  } catch {
    // Not in native context — fall back to navigator.vibrate
  }
}

/**
 * Trigger a haptic feedback.
 * @param {number} [ms=5] - Vibration duration in ms (used for web fallback)
 * @param {'Light'|'Medium'|'Heavy'} [style='Light'] - Impact style for native haptics
 */
export const triggerHaptic = async (ms = 5, style = 'Light') => {
  try {
    if (!_pluginLoaded) await loadHapticsPlugin()

    if (_Haptics && _ImpactStyle) {
      await _Haptics.impact({ style: _ImpactStyle[style] || _ImpactStyle.Light })
      return
    }
  } catch {
    // Swallow — native haptics unavailable
  }

  // Web fallback
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(ms) } catch { /* ignore */ }
  }
}

/**
 * Trigger a notification-style haptic (success/warning/error).
 * @param {'Success'|'Warning'|'Error'} [type='Success']
 */
export const triggerNotification = async (type = 'Success') => {
  try {
    if (!_pluginLoaded) await loadHapticsPlugin()

    if (_Haptics) {
      const mod = await import('@capacitor/haptics')
      await _Haptics.notification({ type: mod.NotificationType[type] || mod.NotificationType.Success })
      return
    }
  } catch {
    // Swallow
  }

  // Web fallback
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(type === 'Error' ? [30, 50, 30] : 10) } catch { /* ignore */ }
  }
}
