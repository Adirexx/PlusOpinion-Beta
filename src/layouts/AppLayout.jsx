/**
 * AppLayout.jsx — Persistent App Shell
 *
 * Layout wrapping all authenticated/app pages. Renders ONCE per session:
 *   - <Outlet /> — the active page (remounts when route changes; see note below)
 *   - <BottomNav /> — always mounted, never remounts between navigations
 *
 * MOUNT BEHAVIOUR (confirmed in production build, no StrictMode):
 *   React Router's <Outlet /> unmounts the leaving page component and
 *   mounts the incoming one on every route change. This is standard
 *   react-router-dom v6 behaviour and is NOT the problem we fixed here.
 *
 *   What DID get fixed (C1.4): the Phase 1 version used key={location.pathname}
 *   on the Outlet wrapper div, which caused that div AND BottomNav to be
 *   destroyed and recreated too, wiping scroll position and tab state.
 *   Removing the key means the shell (BottomNav, layout divs) persists.
 *   Page-level scroll and data caching across tab switches is a Phase 5
 *   concern (see carry-forward list: external cache + quiet refresh).
 *
 * ANIMATION:
 *   We use useLayoutEffect (not useEffect) to toggle the .route-enter
 *   class. useLayoutEffect fires synchronously before the browser paints,
 *   so the class is re-applied before the frame is drawn — eliminating the
 *   one-frame flicker that useEffect can cause on tab switches.
 */

import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import BottomNav from '../components/nav/BottomNav'
import InboxPanel from '../components/inbox/InboxPanel'
import OpinionFab from '../components/common/OpinionFab'
import OfflineBanner from '../components/common/OfflineBanner'
import { useAuth } from '../context/AuthContext'
import { useActions } from '../context/ActionsContext'
import useSwipeNavigation from '../hooks/useSwipeNavigation'

const PATH_TO_TAB = {
  '/feed': 'home',
  '/categories': 'categories',
  '/bookmarks': 'bookmarks',
  '/notifications': 'notifications',
  '/myprofile': 'profile',
  '/myspace': 'myspace',
  '/workspace': 'workspace',
}

export default function AppLayout() {
  const { isGuest, user, needsOnboarding, loading } = useAuth()
  const { openAuth } = useActions()
  const location = useLocation()
  const activeTab = PATH_TO_TAB[location.pathname] || 'home'

  const outletRef = useRef(null)
  const prevPath = useRef(location.pathname)
  const slideDirection = useRef(null)

  // Instagram-style swipe navigation between bottom-nav tabs
  useSwipeNavigation(outletRef, (dir) => {
    slideDirection.current = dir
  })

  // ── Global Scroll Roll Coordinator (MPA Port) ────────────────────────
  // When scrolling down past 50px, roll top header and bottom nav inside
  // to give full screen coverage of the page content.
  // When scrolling up or near the top, roll both bars outside into view.
  useEffect(() => {
    let lastY = 0
    let ticking = false
    let lastToggleTime = 0

    const handleScroll = (e) => {
      const target = e.target
      if (!target || typeof target.scrollTop !== 'number') return

      // Ignore horizontal carousels or non-scrollable containers
      if (target.scrollHeight <= target.clientHeight + 40) return

      const currentY = target.scrollTop

      if (!ticking) {
        requestAnimationFrame(() => {
          // Near the top: ALWAYS roll outside / visible
          if (currentY <= 50) {
            document.body.classList.remove('nav-hidden')
            window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }))
            lastY = currentY
            ticking = false
            return
          }

          const delta = currentY - lastY
          const now = Date.now()

          // Require 14px scroll delta AND 300ms cooldown between toggles
          if (Math.abs(delta) >= 14 && now - lastToggleTime > 300) {
            if (delta > 0) {
              // Scrolling DOWN: roll inside / hide
              document.body.classList.add('nav-hidden')
              window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: false } }))
            } else {
              // Scrolling UP: roll outside / show
              document.body.classList.remove('nav-hidden')
              window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }))
            }
            lastY = currentY
            lastToggleTime = now
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true })
      document.body.classList.remove('nav-hidden')
    }
  }, [])

  // On route change, always restore bars to visible
  useEffect(() => {
    document.body.classList.remove('nav-hidden')
    window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }))
  }, [location.pathname])

  // useLayoutEffect fires before paint — prevents the one-frame flicker
  // that useEffect could cause if the browser paints the removed class
  // state before re-adding it.
  useLayoutEffect(() => {
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname

    const el = outletRef.current
    if (!el) return

    el.classList.remove('route-enter', 'route-enter-forward', 'route-enter-backward')
    el.offsetHeight   // force synchronous reflow before paint

    // Pick animation class based on swipe direction
    const cls = slideDirection.current === 'forward'
      ? 'route-enter-forward'
      : slideDirection.current === 'backward'
        ? 'route-enter-backward'
        : 'route-enter'

    el.classList.add(cls)
    slideDirection.current = null
  }, [location.pathname])

  // If a logged-in user has not completed onboarding, force them to the onboarding flow
  // (Offline guard: never kick user to onboarding when offline, as onboarding requires network)
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  if (!loading && user && needsOnboarding && isOnline) {
    return <Navigate to="/login?onboarding=1" state={{ from: location }} replace />
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-deep)',
      }}
    >
      {/* ── Offline/Reconnect Banner ─────────────────────────────
          Fixed-position, non-blocking. Shows only when offline. */}
      <OfflineBanner />
      {/* Page content — remounts on route change (React Router default).
          Scroll/data persistence across tab switches is built in Phase 5. */}
      <div
        ref={outletRef}
        className="scroll-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Outlet />
      </div>

      {/* ── Bottom Navigation ─────────────────────────────────────
          Persists across all route changes. Never remounts.
          Phase 2: receives isGuest, unread counts from contexts.
          Phase 3: receives ActionsContext triggers (openComposer).
          Phase 7: InboxHost mounts alongside this.
      */}
      {!location.pathname.startsWith('/post/') && !location.pathname.startsWith('/profile') && !location.pathname.startsWith('/lens') && !['/about', '/support', '/privacy-policy', '/t&c', '/cookies-policy', '/maintenance', '/bookmarks', '/settings'].includes(location.pathname) && (
        <BottomNav activeTab={activeTab} isGuest={isGuest} onAuthRequired={openAuth} />
      )}

      {/* ── Inbox System ──────────────────────────────────────────
          Renders globally above everything, managed by InboxContext */}
      <InboxPanel />

      {/* ── Animated +Opinion / Close FAB ──────────────────────── */}
      <OpinionFab />
    </div>
  )
}
