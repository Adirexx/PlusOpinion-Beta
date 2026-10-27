/**
 * NetworkContext.jsx — Network Status Provider
 *
 * Phase 8 Native Hardening: Provides app-wide online/offline awareness.
 *
 * What this provides:
 *   - `isOnline` — boolean reflecting current network state
 *   - `connectionType` — 'wifi' | '4g' | '3g' | 'slow-2g' | 'unknown'
 *   - `showOfflineBanner` — boolean for UI to show non-blocking offline indicator
 *   - `wasOffline` — true after reconnection for 3 seconds (triggers refresh UX)
 *
 * How native apps handle this:
 *   - Show a slim banner at the top: "You're offline — showing cached data"
 *   - When back online, show brief "Back online" success banner
 *   - Never block the user with a full-screen "offline" page
 *   - Continue showing cached feed, profile, notifications, inbox
 *
 * Uses the Network Information API where available (Chrome, Android WebView)
 * and falls back to navigator.onLine + online/offline events.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

const NetworkContext = createContext(null)

// Debounce rapid online/offline toggles (common on mobile networks)
const DEBOUNCE_MS = 300
// How long to show "Back online" banner after reconnection
const RECONNECT_BANNER_MS = 3000

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  })
  const [connectionType, setConnectionType] = useState('unknown')
  const [wasOffline, setWasOffline] = useState(false)
  const debounceRef = useRef(null)
  const wasOfflineTimerRef = useRef(null)
  const prevOnlineRef = useRef(isOnline)

  // Update connection type from Network Information API
  const updateConnectionInfo = useCallback(() => {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (conn) {
        // effectiveType: '4g', '3g', '2g', 'slow-2g'
        setConnectionType(conn.effectiveType || conn.type || 'unknown')
      }
    } catch {
      // Not supported — keep 'unknown'
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setIsOnline(true)
        updateConnectionInfo()

        // If we were offline, show "Back online" banner briefly
        if (!prevOnlineRef.current) {
          setWasOffline(true)
          if (wasOfflineTimerRef.current) clearTimeout(wasOfflineTimerRef.current)
          wasOfflineTimerRef.current = setTimeout(() => {
            setWasOffline(false)
          }, RECONNECT_BANNER_MS)

          // Dispatch event for other parts of the app to refresh data
          window.dispatchEvent(new CustomEvent('network:online'))
        }
        prevOnlineRef.current = true
      }, DEBOUNCE_MS)
    }

    const handleOffline = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setIsOnline(false)
        prevOnlineRef.current = false

        // Dispatch event for data layer to switch to cached mode
        window.dispatchEvent(new CustomEvent('network:offline'))
      }, DEBOUNCE_MS)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for Network Information API changes
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (conn) {
        conn.addEventListener('change', updateConnectionInfo)
        updateConnectionInfo()
      }
    } catch { /* Not supported */ }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (wasOfflineTimerRef.current) clearTimeout(wasOfflineTimerRef.current)
      try {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
        if (conn) conn.removeEventListener('change', updateConnectionInfo)
      } catch { /* ignore */ }
    }
  }, [updateConnectionInfo])

  const value = {
    isOnline,
    connectionType,
    showOfflineBanner: !isOnline,
    wasOffline, // true for 3s after reconnection
  }

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used inside NetworkProvider')
  return ctx
}
