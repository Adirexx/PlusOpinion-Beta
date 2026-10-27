/**
 * routes.jsx — Route Definitions
 *
 * Phase 2 changes:
 *   - errorElement now uses RouteErrorBoundary (§7)
 *   - Protected routes wrapped in ProtectedRoute (§5)
 *   - All lazy-loads preserved from Phase 1
 */

import React, { lazy, Suspense } from 'react'
import AppLayout           from './layouts/AppLayout'
import AuthLayout          from './layouts/AuthLayout'
import { RouteErrorBoundary } from './components/ErrorBoundary'
import ProtectedRoute      from './components/ProtectedRoute'

// ── Lazy-loaded pages ─────────────────────────────────────────────
const Feed          = lazy(() => import('./pages/Feed'))
const Categories    = lazy(() => import('./pages/Categories'))
const Bookmarks     = lazy(() => import('./pages/Bookmarks'))
const MySpace       = lazy(() => import('./pages/MySpace'))
const Workspace     = lazy(() => import('./pages/Workspace'))
const Settings      = lazy(() => import('./pages/Settings'))
const Notifications = lazy(() => import('./pages/Notifications'))
const MyProfile     = lazy(() => import('./pages/MyProfile'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const PostDetail    = lazy(() => import('./pages/PostDetail'))
const LensPage      = lazy(() => import('./pages/LensPage'))
// KitchenSink is a dev-only tool — excluded from production routes
const KitchenSink   = import.meta.env.DEV ? lazy(() => import('./pages/KitchenSink')) : null

const Login          = lazy(() => import('./pages/Login'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))

const About       = lazy(() => import('./pages/static/About'))
const Support     = lazy(() => import('./pages/static/Support'))
const Privacy     = lazy(() => import('./pages/static/Privacy'))
const Terms       = lazy(() => import('./pages/static/Terms'))
const Cookies     = lazy(() => import('./pages/static/Cookies'))
const Maintenance = lazy(() => import('./pages/static/Maintenance'))
const NotFound    = lazy(() => import('./pages/NotFound'))

import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

function PageLoader() {
  return (
    <div style={{ minHeight: '100dvh', background: '#020205' }} />
  )
}

function S({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

/**
 * RootRoute — Smart entry router for `/`
 * - While session resolves: shows clean background loader (zero flash)
 * - If user is logged in: navigates straight to /feed
 * - If user is not logged in: renders Login page inside AuthLayout
 */
function RootRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (user) {
    const searchParams = new URLSearchParams(window.location.search);
    const postId = searchParams.get('post') || searchParams.get('id');
    if (postId) {
      return <Navigate to={`/post/${postId}`} replace />;
    }
    return <Navigate to={`/feed${window.location.search}`} replace />;
  }

  return <Login />
}

// ── Route config ──────────────────────────────────────────────────
export const routes = [
  {
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public — viewable as guest (feed shows reduced UI without auth)
      { path: '/feed',        element: <S><Feed /></S> },
      { path: '/categories',  element: <S><Categories /></S> },
      // Dev-only: KitchenSink — excluded from production (import.meta.env.DEV)
      ...(import.meta.env.DEV && KitchenSink ? [{ path: '/kitchen-sink', element: <S><KitchenSink /></S> }] : []),
      { path: '/lens/*',      element: <S><LensPage /></S> },

      // Public — deep link pages
      { path: '/profile',     element: <S><PublicProfile /></S> },
      { path: '/profile/:id', element: <S><PublicProfile /></S> },
      { path: '/post/:id',    element: <S><PostDetail /></S> },

      // Protected — require logged-in + onboarded user
      { path: '/bookmarks',     element: <ProtectedRoute><S><Bookmarks /></S></ProtectedRoute> },
      { path: '/notifications', element: <ProtectedRoute><S><Notifications /></S></ProtectedRoute> },
      { path: '/myprofile',     element: <ProtectedRoute><S><MyProfile /></S></ProtectedRoute> },
      { path: '/myspace',       element: <ProtectedRoute><S><MySpace /></S></ProtectedRoute> },
      { path: '/workspace',     element: <ProtectedRoute><S><Workspace /></S></ProtectedRoute> },
      { path: '/settings',      element: <ProtectedRoute><S><Settings /></S></ProtectedRoute> },

      // Static / legal
      { path: '/about',          element: <S><About /></S> },
      { path: '/support',        element: <S><Support /></S> },
      { path: '/privacy-policy', element: <S><Privacy /></S> },
      { path: '/t&c',            element: <S><Terms /></S> },
      { path: '/cookies-policy', element: <S><Cookies /></S> },
      { path: '/maintenance',    element: <S><Maintenance /></S> },
    ],
  },

  // Auth shell (no bottom nav)
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/',                element: <RootRoute /> },
      { path: '/login',           element: <S><Login /></S> },
      { path: '/onboarding',      element: <S><Login /></S> },
      { path: '/reset-password',  element: <S><ResetPassword /></S> },
      { path: '/change-password', element: <S><ChangePassword /></S> },
    ],
  },

  // 404
  { path: '*', element: <S><NotFound /></S>, errorElement: <RouteErrorBoundary /> },
]
