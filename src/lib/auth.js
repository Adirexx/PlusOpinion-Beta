/**
 * src/lib/auth.js — Auth Functions
 *
 * Ported from auth.js and auth_guard.js in the old project.
 * Function names and signatures are IDENTICAL to the old window.* globals.
 *
 * What changed:
 *   - window.supabase → imported supabase client
 *   - window.location → window.location (kept as-is; AuthContext replaces redirects with router)
 *   - All window.X = ... → named exports
 *   - Hardcoded URL/key in autoAcceptTerms/acceptTerms replaced with env.js values
 *     (the CORS workaround itself is preserved — see note below)
 *
 * CORS WORKAROUND NOTE (from old auth.js L48-92, auth_guard.js L94-128):
 *   The old code uses a raw fetch() to PATCH profiles because the Supabase client's
 *   .from().update() added a 'content-profile' header missing from the Cloudflare
 *   Worker CORS allowlist. With Option B (our custom _proxyFetch interceptor), all
 *   fetch() calls — including this raw one — go through /supabase-api, so the
 *   Cloudflare Worker's CORS headers apply correctly. We preserve the raw fetch()
 *   pattern exactly as-is for now. Phase 9 can simplify once confirmed stable.
 */

import { supabase } from './supabaseClient.js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env.js'

// ── Auth Ready Promise ────────────────────────────────────────────
// Replaces window.authReadyPromise. AuthContext resolves this after
// the initial onAuthStateChange fires.
let _resolveAuthReady
export const authReadyPromise = new Promise(resolve => {
  _resolveAuthReady = resolve
})
export function resolveAuthReady() {
  if (_resolveAuthReady) _resolveAuthReady()
}

// ── Sign Up ───────────────────────────────────────────────────────
export async function signUpUser(email, password, name, dob) {
  const metadata = { full_name: name }
  if (dob) metadata.date_of_birth = dob

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  })

  if (error) throw error
  return data
}

// ── Auto Accept Terms (CORS workaround preserved) ─────────────────
// See CORS WORKAROUND NOTE above.
export async function autoAcceptTerms(userId) {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token
    if (!accessToken) {
      console.warn('[Auth] autoAcceptTerms: no session token, skipping')
      return
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        })
      }
    )

    if (!res.ok) {
      console.warn('[Auth] Terms auto-accept failed (non-critical): HTTP', res.status)
    } else {
      console.log('[Auth] ✅ Terms auto-accepted for user:', userId)
    }
  } catch (err) {
    console.warn('[Auth] Terms auto-accept exception (non-critical):', err.message)
  }
}

// ── Verify Email OTP ──────────────────────────────────────────────
export async function verifyEmailOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  })
  if (error) throw error
  return data
}

// ── Resend Signup OTP ─────────────────────────────────────────────
export async function resendSignupOtp(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  })
  if (error) throw error
}

// ── Sign In ───────────────────────────────────────────────────────
export async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('terms_accepted, profile_completed, username, full_name')
      .eq('id', data.user.id)
      .single()

    const isComplete = profile?.terms_accepted === true
      && profile?.profile_completed === true
      && profile?.username
      && profile?.full_name

    data.user.onboardingRequired = !isComplete
    data.user._profile = profile

    supabase.from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)
      .then(() => {}).catch(() => {})

  } catch (err) {
    console.error('[Auth] Profile check error:', err)
    data.user.onboardingRequired = true
  }

  return data.user
}

// ── Sign Out ──────────────────────────────────────────────────────
export async function signOutUser() {
  await supabase.auth.signOut()
  sessionStorage.clear()
  localStorage.removeItem('plusopinion_access')
  localStorage.removeItem('unread_count')
}

// ── Get Current User (optimistic cache) ───────────────────────────
// Ported EXACTLY from auth.js lines 174-206.
// The optimistic localStorage parse is the key to zero-latency returns.
let _currentUserCache = null

export async function getCurrentUser() {
  if (_currentUserCache) return _currentUserCache

  try {
    const authKeys = Object.keys(localStorage).filter(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    if (authKeys.length > 0) {
      const authData = localStorage.getItem(authKeys[0])
      if (authData) {
        const parsed = JSON.parse(authData)
        if (parsed.user) {
          _currentUserCache = parsed.user
          return parsed.user
        }
      }
    }
  } catch (e) {}

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      _currentUserCache = session.user
      return session.user
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) _currentUserCache = user
    return user || null
  } catch (err) {
    return null
  }
}

// Clear the in-memory user cache (called on sign out and user change)
export function clearUserCache() {
  _currentUserCache = null
}

// ── Session Heartbeat ─────────────────────────────────────────────
// Ported from auth.js lines 246-272. Safety net for long idle sessions.
// AuthContext starts and stops this; it should NOT be called from
// inside onAuthStateChange (infinite loop risk — see auth.js L215-219).
let _sessionHeartbeatInterval = null

export function startSessionHeartbeat() {
  if (_sessionHeartbeatInterval) return

  _sessionHeartbeatInterval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        clearInterval(_sessionHeartbeatInterval)
        _sessionHeartbeatInterval = null
        return
      }
      const expiresAt = session.expires_at
        ? new Date(session.expires_at * 1000).getTime()
        : 0
      const msUntilExpiry = expiresAt - Date.now()
      if (msUntilExpiry > 0 && msUntilExpiry < 10 * 60 * 1000) {
        console.log('[Auth] Heartbeat: token expiring soon, refreshing...')
        await supabase.auth.refreshSession()
      }
    } catch (e) {
      console.warn('[Auth] Heartbeat refresh failed (non-critical):', e.message)
    }
  }, 15 * 60 * 1000)
}

export function stopSessionHeartbeat() {
  if (_sessionHeartbeatInterval) {
    clearInterval(_sessionHeartbeatInterval)
    _sessionHeartbeatInterval = null
  }
}

// ── Password Reset ────────────────────────────────────────────────
export async function resetPassword(email) {
  const redirectPath = '/reset-password'
  const redirectTo = window.location.origin + redirectPath

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  })

  if (error) throw error
}

// ── Profile Functions ─────────────────────────────────────────────
export async function getUserProfileByUsername(username) {
  if (!username) return null
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUsername)
      .single()

    if (error || !data) return null
    return data
  } catch (err) {
    console.error('[Auth] Exception fetching profile by username:', err)
    return null
  }
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadAvatar(userId, file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('Avatars')
    .upload(fileName, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('Avatars').getPublicUrl(fileName)
  await updateUserProfile(userId, { avatar_url: data.publicUrl })
  return data.publicUrl
}

export async function checkUsernameAvailable(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()
  if (error) throw error
  return !data
}

// ── acceptTerms (CORS workaround preserved) ───────────────────────
export async function acceptTerms() {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token
    if (!accessToken) return false

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        })
      }
    )

    return res.ok
  } catch (err) {
    console.error('[Auth] Error accepting terms:', err.message)
    return false
  }
}

export async function hasAcceptedTerms() {
  try {
    const user = await getCurrentUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('terms_accepted')
      .eq('id', user.id)
      .single()

    return profile?.terms_accepted === true
  } catch (err) {
    return false
  }
}

export async function getMyProfile() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return profile
  } catch (err) {
    return null
  }
}

export async function checkOnboardingStatus() {
  try {
    const path = window.location.pathname.toLowerCase()
    const searchParams = new URLSearchParams(window.location.search)
    const isPostDeepLink = searchParams.has('post') || path.startsWith('/post/')
    const isProfileDeepLink = path.startsWith('/profile/')

    const isIndexPage = path === '/' || path === '/login'

    if (
      isIndexPage ||
      path.includes('reset-password') ||
      path.includes('change-password') ||
      isProfileDeepLink ||
      (isPostDeepLink && (path.includes('feed') || path.startsWith('/post/')))
    ) {
      return true
    }

    const user = await getCurrentUser()
    if (!user) return false

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('terms_accepted, profile_completed, username, full_name')
      .eq('id', user.id)
      .single()

    if (error || !profile) return false

    return (
      profile.terms_accepted === true &&
      profile.profile_completed === true &&
      !!profile.username &&
      !!profile.full_name
    )
  } catch (err) {
    console.error('[AuthGuard] Error:', err)
    return false
  }
}

// ── Google Identity Services ──────────────────────────────────────
// Ported from auth.js lines 380-514.
// GIS initialization still injects the script tag dynamically.
// AuthContext calls initGoogleIdentityServices() once on mount.
const GOOGLE_CLIENT_ID = '409858133156-vho68t8ci9mob650b1lokl9drgqr2eih.apps.googleusercontent.com'
let _gisInitialized = false
let _gisCallbacks = [] // Queued callbacks awaiting GIS init

export function initGoogleIdentityServices(onCredential) {
  if (document.getElementById('gsi-script')) {
    if (_gisInitialized && onCredential) {
      // Already loaded; store callback for credential response
      _gisCallbacks.push(onCredential)
    }
    return
  }

  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.id = 'gsi-script'
  script.async = true
  script.defer = true
  script.onload = () => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: _handleGoogleCredentialResponse,
      context: 'use',
      itp_support: true,
      cancel_on_tap_outside: false
    })
    _gisInitialized = true
    scanAndRenderGoogleButtons()
  }
  document.head.appendChild(script)

  if (onCredential) _gisCallbacks.push(onCredential)
}

export function scanAndRenderGoogleButtons() {
  if (!_gisInitialized || !window.google) return

  const containers = document.querySelectorAll('.google-sso-container:not([data-rendered="true"])')
  containers.forEach(el => {
    const action = el.dataset.action || 'signin'
    el.style.width = '100%'
    el.style.display = 'flex'
    el.style.justifyContent = 'center'

    window.google.accounts.id.renderButton(el, {
      theme: 'filled_black',
      size: 'large',
      type: 'standard',
      shape: 'pill',
      text: action === 'signup' ? 'signup_with' : 'signin_with',
      width: 320
    })
    el.dataset.rendered = 'true'
  })
}

// Called by GIS when credential is ready; calls all queued callbacks.
async function _handleGoogleCredentialResponse(response) {
  for (const cb of _gisCallbacks) {
    try { await cb(response) } catch (e) { console.error('[GIS] Callback error:', e) }
  }
}

export async function handleGoogleSignIn(response) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential
  })

  if (error) throw error
  if (!data?.user?.id) throw new Error('No user returned from Supabase ID token exchange.')

  let isComplete = false
  let profileData = null
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_completed, terms_accepted, username, full_name')
      .eq('id', data.user.id)
      .single()

    profileData = profile

    if (!profileError && profile?.profile_completed && profile?.terms_accepted && profile?.username && profile?.full_name) {
      isComplete = true
    }
  } catch (profileErr) {
    console.warn('[Auth] Profile check exception (will show profile setup):', profileErr)
  }

  return { user: data.user, isComplete, profile: profileData }
}

export async function signInWithProvider(provider) {
  if (provider === 'google') {
    if (_gisInitialized) {
      window.google.accounts.id.prompt()
    } else {
      throw new Error('Google Sign-In is initializing. Please try again.')
    }
  }
}

console.log('✅ Auth module loaded (OTP flow enabled)')
