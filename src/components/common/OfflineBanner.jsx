/**
 * OfflineBanner.jsx — Non-blocking Offline / Reconnection Banner
 *
 * Phase 8 Native Hardening: Shows a slim, animated banner when the app
 * goes offline, and a brief "Back online" success banner on reconnection.
 *
 * Design philosophy (matching Instagram/Twitter native apps):
 *   - NEVER blocks the user with a full-screen page
 *   - Slim 36px bar at the top of the viewport
 *   - Offline: red-tinted "No internet connection — showing cached data"
 *   - Reconnect: green-tinted "Back online" for 3 seconds
 *   - Slides in/out with smooth CSS animation
 *   - Respects safe-area-inset-top for edge-to-edge native displays
 */

import { useNetwork } from '../../context/NetworkContext'
import { useAuth } from '../../context/AuthContext'

export default function OfflineBanner({ message }) {
  const { isOnline, wasOffline } = useNetwork()
  const { user } = useAuth()

  // Don't render anything if online and not in the "just reconnected" window
  if (isOnline && !wasOffline) return null

  const isReconnected = isOnline && wasOffline
  const defaultOfflineText = user ? 'No internet — showing cached data' : 'You are currently offline'
  const displayText = isReconnected ? 'Back online' : (message || defaultOfflineText)

  return (
    <div
      role="status"
      aria-live="polite"
      className="offline-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: isReconnected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '8px 16px',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        color: '#fff',
        letterSpacing: '0.02em',
        animation: 'offlineBannerSlideIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isReconnected ? (
          // Wifi on icon
          <>
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
          </>
        ) : (
          // Wifi off icon
          <>
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
          </>
        )}
      </svg>

      {displayText}

      {/* Pulsing dot for offline state */}
      {!isReconnected && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#fca5a5',
            animation: 'offlineDotPulse 1.5s ease-in-out infinite',
          }}
        />
      )}
    </div>
  )
}
