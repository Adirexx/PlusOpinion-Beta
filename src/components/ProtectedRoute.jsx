/**
 * ProtectedRoute.jsx — Auth guard for protected routes
 *
 * Rules derived from AUTH_REQUIRED_PAGES in spa_router.js (lines 42-51)
 * and guest behaviour in HOMEPAGE_FINAL.HTML.
 *
 * Protected routes (require a logged-in, onboarded user):
 *   /feed        → HOMEPAGE_FINAL.HTML  ✓ in AUTH_REQUIRED_PAGES
 *   /bookmarks   → BOOKMARKS.HTML       ✓ in AUTH_REQUIRED_PAGES
 *   /categories  → CATAGORYPAGE.HTML    ✓ in AUTH_REQUIRED_PAGES
 *   /notifications → NOTIFICATION PANEL.HTML ✓
 *   /myprofile   → PRIVATE OWNER PROFILE.HTML ✓
 *   /myspace     → MY SPACE FINAL (USER).HTML ✓
 *   /workspace   → MY SPACE FINAL(COMPANIES).HTML ✓
 *
 * Public routes (no auth needed):
 *   /            → Login page (index.html)
 *   /login       → Login page
 *   /profile/:username → PUBLIC POV PROFILE.HTML (viewable by guests)
 *   /post/:id    → deep link (viewable by guests, auth_guard.js line 15-27)
 *   /reset-password, /change-password → auth flows, skip check
 *   /about, /support, /privacy-policy, /t&c, /cookies-policy → legal, public
 *
 * BEHAVIOUR:
 *   - While loading: show skeleton shell (no blank flash)
 *   - Not logged in: navigate to /login
 *   - Logged in but needsOnboarding: navigate to /login?onboarding=1
 *     (the login page overlays the profile setup flow)
 *   - OK: render children
 *
 * SOURCE LINES:
 *   AUTH_REQUIRED_PAGES: spa_router.js lines 42-51
 *   Profile deep-link skip: auth_guard.js lines 15-27
 *   Guest mode for /feed: HOMEPAGE_FINAL.HTML — Feed renders in guest
 *     mode (AuthModal shown on protected actions). BUT spa_router.js
 *     has HOMEPAGE_FINAL.HTML in AUTH_REQUIRED_PAGES.
 *     RESOLUTION: The old spa_router.js does an auth check on first visit
 *     to HOMEPAGE_FINAL.HTML, but the Feed page itself shows a guest view
 *     if the user is not logged in (the auth modal appears on interactions).
 *     We match this: /feed is accessible as a guest but shows reduced UI.
 *     Protected: /bookmarks, /notifications, /myprofile, /myspace, /workspace.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { OrbitLoader } from './ui/Icons'

// Routes that require a fully onboarded signed-in user.
// Source: spa_router.js AUTH_REQUIRED_PAGES lines 42-51, adapted to clean paths.
const FULLY_PROTECTED = new Set([
  '/bookmarks',
  '/notifications',
  '/myprofile',
  '/myspace',
  '/workspace',
  '/settings',
])

export default function ProtectedRoute({ children }) {
  const { user, needsOnboarding, loading } = useAuth()
  const location = useLocation()

  // Show skeleton while initial auth check runs — no blank flash
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'var(--bg-deep)',
        }}
      >
        {/* Orbit loader — replaces legacy spin ring */}
        <OrbitLoader size={36} />
      </div>
    )
  }

  const path = location.pathname

  // Fully protected routes: must be logged in AND onboarded
  if (FULLY_PROTECTED.has(path)) {
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
    if (needsOnboarding && isOnline) {
      return <Navigate to="/login?onboarding=1" state={{ from: location }} replace />
    }
  }

  return children
}
