/**
 * usePullToRefresh.js — Core Gesture Engine
 *
 * Phase 9.1: Reusable hook that powers the Neon Pulse Ring pull-to-refresh
 * across every scrollable page and inbox sub-view.
 *
 * Usage:
 *   const ptr = usePullToRefresh(scrollRef, handleRefresh)
 *   // In JSX:
 *   <PullToRefreshIndicator {...ptr.indicatorProps} />
 *   <div ref={scrollRef} style={{ transform: `translateY(${ptr.pullOffset}px)` }}>
 *
 * Gesture Physics:
 *   - Logarithmic damping: pullDistance * 0.4 (capped at 80px)
 *   - Threshold: 65px damped distance to arm
 *   - Only activates when scrollTop === 0 and pulling downward
 *   - Horizontal swipe detection: ignores if deltaX > deltaY
 *
 * Guards:
 *   - Disabled while already refreshing
 *   - Disabled if options.disabled is true
 *   - Does NOT block offline pulls (pages handle offline fallback themselves)
 *
 * Haptics:
 *   - Light impact tick at threshold crossing (native via @capacitor/haptics)
 *   - Falls back to navigator.vibrate(8) on web
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { isNative } from '../lib/nativeBridge'

const DEFAULT_THRESHOLD = 65  // Damped pixels to trigger refresh
const DEFAULT_MAX_PULL = 80   // Maximum damped displacement
const DAMPING_FACTOR = 0.4    // Logarithmic feel: real pull * 0.4

/**
 * Trigger a single haptic tick.
 * Uses Capacitor Haptics on native, navigator.vibrate on web.
 */
async function hapticTick() {
  try {
    if (isNative()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({ style: ImpactStyle.Light })
      return
    }
  } catch { /* not native or not available */ }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(8)
  }
}

/**
 * Trigger completion haptic feedback on successful data load.
 */
async function hapticSuccess() {
  try {
    if (isNative()) {
      const { Haptics, NotificationType } = await import('@capacitor/haptics')
      await Haptics.notification({ type: NotificationType.Success })
      return
    }
  } catch { /* not native or not available */ }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([10, 30, 10])
  }
}

export default function usePullToRefresh(scrollRef, onRefresh, options = {}) {
  const {
    threshold = DEFAULT_THRESHOLD,
    maxPull = DEFAULT_MAX_PULL,
    disabled = false,
    validateTouchStart,
  } = options

  const [pullOffset, setPullOffset] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)

  // Touch tracking refs (not state — must be synchronous for 120fps touch events)
  const startYRef = useRef(0)
  const startXRef = useRef(0)
  const pullingRef = useRef(false)
  const armedRef = useRef(false)
  const directionLockedRef = useRef(false) // true once we know it's vertical
  const hasHapticked = useRef(false)

  // Computed progress (0 → 1)
  const progress = Math.min(pullOffset / threshold, 1)
  const isArmed = progress >= 1

  // Sync armed ref
  useEffect(() => {
    armedRef.current = isArmed
  }, [isArmed])

  // ── TOUCH HANDLERS ───────────────────────────────────────────────

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return
    const el = scrollRef.current
    if (!el) return

    // Only start tracking if scrolled to absolute top
    if (el.scrollTop > 0) return

    // Optional validator (e.g., upper half only for inbox view)
    if (validateTouchStart && !validateTouchStart(e)) return

    startYRef.current = e.touches[0].clientY
    startXRef.current = e.touches[0].clientX
    pullingRef.current = true
    directionLockedRef.current = false
    hasHapticked.current = false
  }, [disabled, isRefreshing, scrollRef, validateTouchStart])

  const handleTouchMove = useCallback((e) => {
    if (!pullingRef.current || disabled || isRefreshing) return
    const el = scrollRef.current
    if (!el) return

    // If the user has scrolled down since touchstart, abort
    if (el.scrollTop > 0) {
      pullingRef.current = false
      setPullOffset(0)
      return
    }

    const currentY = e.touches[0].clientY
    const currentX = e.touches[0].clientX
    const deltaY = currentY - startYRef.current
    const deltaX = currentX - startXRef.current

    // Direction lock: first 10px of movement decides if this is vertical or horizontal
    if (!directionLockedRef.current) {
      if (Math.abs(deltaY) < 10 && Math.abs(deltaX) < 10) return // Not enough movement yet
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe — abort PTR, let swipe navigation handle it
        pullingRef.current = false
        setPullOffset(0)
        return
      }
      directionLockedRef.current = true
    }

    // Only process downward pulls
    if (deltaY <= 0) {
      setPullOffset(0)
      return
    }

    // Keep nav visible during active pull
    window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }))

    // Apply damping for rubber-band physics
    const dampedPull = Math.min(deltaY * DAMPING_FACTOR, maxPull)
    setPullOffset(dampedPull)

    // Haptic tick when crossing threshold (fire once per pull gesture)
    if (dampedPull >= threshold && !hasHapticked.current) {
      hasHapticked.current = true
      hapticTick()
    }
  }, [disabled, isRefreshing, scrollRef, threshold, maxPull])

  const handleTouchEnd = useCallback(() => {
    if (!pullingRef.current || disabled) return
    pullingRef.current = false
    directionLockedRef.current = false
    hasHapticked.current = false

    if (isRefreshing) {
      // Already refreshing — just reset pull visual
      setPullOffset(0)
      return
    }

    if (armedRef.current && onRefresh) {
      // Check offline guard
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
      if (!isOnline) {
        setPullOffset(0)
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: "You're offline", icon: 'WifiOff' } }))
        return
      }

      // Threshold reached — trigger refresh
      setIsRefreshing(true)
      setPullOffset(threshold) // Lock at threshold position

      const doRefresh = async () => {
        try {
          await onRefresh()
          hapticSuccess()
        } catch (err) {
          console.warn('[PTR] Refresh failed:', err)
        } finally {
          // Completion animation
          setIsCompleting(true)
          setPullOffset(0)

          // Allow fade-out animation to play, then fully reset
          setTimeout(() => {
            setIsRefreshing(false)
            setIsCompleting(false)
          }, 280)
        }
      }
      doRefresh()
    } else {
      // Below threshold — snap back
      setPullOffset(0)
    }
  }, [disabled, isRefreshing, onRefresh, threshold])

  const handleTouchCancel = useCallback(() => {
    pullingRef.current = false
    directionLockedRef.current = false
    hasHapticked.current = false
    setPullOffset(0)
  }, [])

  // ── ATTACH LISTENERS ─────────────────────────────────────────────

  useEffect(() => {
    const el = scrollRef.current
    if (!el || disabled) return

    // Add ptr-enabled class for overscroll-behavior containment
    el.classList.add('ptr-enabled')

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      el.classList.remove('ptr-enabled')
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [scrollRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, disabled])

  // ── PROGRAMMATIC TRIGGER ──────────────────────────────────────────
  /**
   * Programmatically trigger Pull-To-Refresh with full visual pull down,
   * OrbitLoader spinning indicator, haptics, and smooth snap-back.
   */
  const triggerPTR = useCallback(async () => {
    if (disabled || isRefreshing) return
    const el = scrollRef.current
    if (el && el.scrollTop > 0) {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Check offline guard
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (!isOnline) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: "You're offline", icon: 'WifiOff' } }))
      return
    }

    setIsAutoRefreshing(true)
    setIsRefreshing(true)
    setPullOffset(threshold)
    hapticTick()

    try {
      if (onRefresh) {
        await onRefresh()
      }
      hapticSuccess()
    } catch (err) {
      console.warn('[PTR] Programmatic refresh failed:', err)
    } finally {
      setIsCompleting(true)
      setPullOffset(0)
      setTimeout(() => {
        setIsRefreshing(false)
        setIsCompleting(false)
        setIsAutoRefreshing(false)
      }, 300)
    }
  }, [disabled, isRefreshing, scrollRef, threshold, onRefresh])

  return {
    pullOffset,
    isRefreshing,
    isCompleting,
    isAutoRefreshing,
    progress: isRefreshing ? 1 : progress,
    isArmed: isRefreshing ? true : isArmed,
    triggerPTR,

    // Spread these directly onto <PullToRefreshIndicator />
    indicatorProps: {
      progress: isRefreshing ? 1 : progress,
      isArmed: isRefreshing ? true : isArmed,
      isRefreshing,
      isCompleting,
      pullOffset,
    },
  }
}
