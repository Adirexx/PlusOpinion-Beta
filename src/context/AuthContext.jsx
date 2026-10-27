/**
 * AuthContext.jsx — Authentication State Provider
 *
 * Ported from auth.js, auth_guard.js, and the inline auth logic in
 * index.html (HOMEPAGE_FINAL.HTML). Subscribes ONCE to onAuthStateChange
 * for the lifetime of the app.
 *
 * Exposed: { user, profile, isGuest, needsOnboarding, loading, logout, requireAuth }
 *
 * HEARTBEAT: startSessionHeartbeat / stopSessionHeartbeat ported from auth.js.
 *   Never called inside onAuthStateChange (infinite loop risk — auth.js L215-219).
 *
 * DATA CACHE: clearCache() called on logout and user change (user B must never
 *   see user A's cached data).
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import {
  getCurrentUser, clearUserCache,
  startSessionHeartbeat, stopSessionHeartbeat,
  getMyProfile, resolveAuthReady,
  initGoogleIdentityServices, handleGoogleSignIn, autoAcceptTerms
} from '../lib/auth.js'
import { clearCache } from '../lib/dataCache.js'
import { offlineClear } from '../lib/offlineStorage.js'
import { runLoginNotificationChecks } from '../lib/api/notificationsService.js'

const AuthContext = createContext(null)

// ── Local Profile Persistence Helpers ────────────────────────────
function getCachedProfile(userId) {
  if (!userId) return null
  try {
    const raw = localStorage.getItem('po_profile_' + userId)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setCachedProfile(userId, profileData) {
  if (!userId || !profileData) return
  try {
    localStorage.setItem('po_profile_' + userId, JSON.stringify(profileData))
  } catch {}
}

function checkProfileComplete(p) {
  if (!p) return false
  return p.terms_accepted === true
    && p.profile_completed === true
    && !!p.username
    && !!p.full_name
}

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [profile, setProfile]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const prevUserId = useRef(null)

  // isGuest: no user logged in. Feed/Categories/public profiles viewable.
  const isGuest = !user && !loading

  // ── Load profile after user is set ──────────────────────────────
  async function _loadProfile(userId) {
    if (!userId) return { data: null, isComplete: false }

    // 1. Fast path: load cached profile immediately
    const cached = getCachedProfile(userId)
    if (cached) {
      setProfile(cached)
      const cachedComplete = checkProfileComplete(cached)
      setNeedsOnboarding(!cachedComplete)
    }

    // 2. If offline, rely on cached profile — never block user with onboarding when offline
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
    if (isOffline) {
      if (cached) {
        return { data: cached, isComplete: checkProfileComplete(cached) }
      }
      // If offline and no cache yet, default to false (onboarding is impossible offline anyway)
      setNeedsOnboarding(false)
      return { data: null, isComplete: true }
    }

    // 3. Online: fetch fresh profile from Supabase
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('[Auth] _loadProfile query error:', error)
        if (cached) {
          return { data: cached, isComplete: checkProfileComplete(cached) }
        }
        // Network/server error — do not trap authenticated user in onboarding
        setNeedsOnboarding(false)
        return { data: null, isComplete: true }
      }

      // ── Auto-reactivation on login ───────────────────────────────
      // If the user's account was deactivated, logging back in is the
      // explicit reactivation signal. Clear the flag silently so their
      // profile and content become visible again immediately.
      if (data?.is_deactivated === true && !data?.deletion_requested) {
        await supabase
          .from('profiles')
          .update({ is_deactivated: false, deactivated_at: null })
          .eq('id', userId)
        data.is_deactivated = false
        data.deactivated_at = null
      }

      if (data) {
        setCachedProfile(userId, data)
        setProfile(data)
        const isComplete = checkProfileComplete(data)
        setNeedsOnboarding(!isComplete)
        return { data, isComplete }
      } else {
        // No DB record at all for this user ID -> genuinely new user requires onboarding
        setProfile(null)
        setNeedsOnboarding(true)
        return { data: null, isComplete: false }
      }
    } catch (err) {
      console.warn('[Auth] _loadProfile exception:', err)
      if (cached) {
        setProfile(cached)
        const cachedComplete = checkProfileComplete(cached)
        setNeedsOnboarding(!cachedComplete)
        return { data: cached, isComplete: cachedComplete }
      }
      setNeedsOnboarding(false)
      return { data: null, isComplete: true }
    }
  }


  // ── Public refresh — call after profile completion so guards update ──
  async function refreshProfile() {
    const currentUser = user
    if (!currentUser) return
    const res = await _loadProfile(currentUser.id)
    if (res?.data) {
      runLoginNotificationChecks(res.data).catch(() => {})
    }
  }

  // ── Auth state subscription ──────────────────────────────────────
  useEffect(() => {
    let mounted = true

    // ── Single source of truth: onAuthStateChange ─────────────────
    //
    // Supabase v2 fires INITIAL_SESSION synchronously on subscription
    // with the current persisted session (if any). The old code only
    // handled SIGNED_IN/TOKEN_REFRESHED/USER_UPDATED, so INITIAL_SESSION
    // fell into the else-branch → loading=false with user=null → flash.
    //
    // The separate getCurrentUser() call was added to paper over that gap,
    // but it makes an async server round-trip (200–500 ms) — during which
    // ProtectedRoute sees {loading:false, user:null} and redirects to /login,
    // causing the login-page flash on every hard reload.
    //
    // FIX: handle INITIAL_SESSION the same as SIGNED_IN. Remove the separate
    // getCurrentUser() bootstrap entirely. The subscription provides the
    // session immediately and atomically — no gap, no flash.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // 1. Synchronize Realtime JWT so WebSocket RLS allows user's notifications
        if (session?.access_token) {
          try { supabase.realtime.setAuth(session.access_token) } catch (_) {}
        }

        const newUser = session?.user || null
        const newUserId = newUser?.id || null

        // User switched account — clear cached data for security
        if (prevUserId.current && newUserId && prevUserId.current !== newUserId) {
          clearUserCache()
          clearCache()
        }

        if (event === 'SIGNED_OUT') {
          stopSessionHeartbeat()
          clearUserCache()
          clearCache()
          setUser(null)
          setProfile(null)
          setNeedsOnboarding(false)
          prevUserId.current = null
          setLoading(false)
          resolveAuthReady()
        } else if (
          newUser && (
            event === 'INITIAL_SESSION' ||
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED'
          )
        ) {
          // Keep loading:true until profile is fetched — prevents any flash
          prevUserId.current = newUserId
          const profileRes = await _loadProfile(newUserId)
          if (!mounted) return
          setUser(newUser)
          setLoading(false)
          resolveAuthReady()
          // Note: NEVER call refreshSession() here — would create infinite loop.
          // startSessionHeartbeat() handles proactive refresh safely.
          if (event === 'SIGNED_IN') {
            startSessionHeartbeat()
            if (profileRes?.data) {
              // Detect if this is a brand-new user: profile created in the last 5 minutes
              const createdAt = profileRes.data.created_at
              const isNewUser = createdAt
                ? (Date.now() - new Date(createdAt).getTime()) < 5 * 60 * 1000
                : false
              runLoginNotificationChecks(profileRes.data, isNewUser).catch(() => {})
            }
          }
        } else {
          // INITIAL_SESSION with null user → not logged in
          setLoading(false)
          resolveAuthReady()
        }
      }
    )

    // Init GIS on mount — handles Google One Tap
    initGoogleIdentityServices(async (response) => {
      try {
        const { user: gUser, isComplete } = await handleGoogleSignIn(response)
        if (!isComplete) {
          await autoAcceptTerms(gUser.id)
          setNeedsOnboarding(true)
          window.dispatchEvent(new CustomEvent('auth:profileSetupRequired', {
            detail: { user: gUser }
          }))
        }
        // If complete, onAuthStateChange SIGNED_IN fires → sets user/profile
      } catch (err) {
        console.error('[Auth] Google Sign-In Error:', err)
        window.dispatchEvent(new CustomEvent('auth:error', { detail: { error: err.message } }))
      }
    })

    // ── App resume: refresh session after backgrounding ──────────
    // On Android, the app may be backgrounded for hours. When it resumes,
    // the Supabase token could be expired. Proactively refresh it.
    const handleAppResume = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const expiresAt = session.expires_at
            ? new Date(session.expires_at * 1000).getTime()
            : 0
          const msUntilExpiry = expiresAt - Date.now()
          // Refresh if token expires in less than 10 minutes
          if (msUntilExpiry > 0 && msUntilExpiry < 10 * 60 * 1000) {
            console.log('[Auth] App resumed — refreshing near-expiry token')
            await supabase.auth.refreshSession()
          }
        }
      } catch (e) {
        console.warn('[Auth] App resume refresh failed (non-critical):', e.message)
      }
    }
    // ── Network online: quietly re-verify profile when internet returns ──
    const handleNetworkOnline = () => {
      const activeId = prevUserId.current
      if (activeId) {
        _loadProfile(activeId).catch(() => {})
      }
    }
    window.addEventListener('network:online', handleNetworkOnline)

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('app-resume', handleAppResume)
      window.removeEventListener('network:online', handleNetworkOnline)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  // ── Logout ───────────────────────────────────────────────────────
  async function logout() {
    // 1. Immediately reset state in React so downstream components and routes treat user as logged out
    stopSessionHeartbeat()
    clearUserCache()
    clearCache()
    setUser(null)
    setProfile(null)
    setNeedsOnboarding(false)
    prevUserId.current = null
    setLoading(false)

    if (user) {
      localStorage.removeItem('po_profile_' + user.id)
      localStorage.removeItem('po_inbox_pk_' + user.id)
    }
    sessionStorage.clear()
    localStorage.removeItem('plusopinion_access')
    localStorage.removeItem('unread_count')
    // Clear all offline cached data (security: user B must never see user A's data)
    offlineClear().catch(() => {})

    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[Auth] Sign out error:', err)
    }

    if (window.navigateTo) {
      window.navigateTo('/login?mode=login', { replace: true })
    } else {
      window.location.replace('/login?mode=login')
    }
  }

  // ── requireAuth ───────────────────────────────────────────────────
  // Exposed to pages — they call this to gate protected actions.
  // If user is not logged in, dispatches an event that AuthModal listens to (Phase 3).
  function requireAuth(action) {
    if (user) return true
    window.dispatchEvent(new CustomEvent('auth:required', { detail: { action } }))
    return false
  }

  const value = {
    user,
    profile,
    isGuest,
    needsOnboarding,
    loading,
    logout,
    requireAuth,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
