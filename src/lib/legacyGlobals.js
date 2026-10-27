/**
 * legacyGlobals.js — Temporary window.* shim
 *
 * Imported ONCE in main.jsx (before any page code).
 * Exposes every API function and auth helper as window.* so any
 * not-yet-ported code that calls window.getFeed() etc. still works.
 *
 * Phase 9: Delete this file. SHIM_USAGE.md tracks what still depends on it.
 *
 * NOTE: In production this file logs nothing. Dev logs are gated by IS_DEV.
 */

import * as apiAll from './api/index.js'
import { supabase } from './supabaseClient.js'
import {
  getCurrentUser, signUpUser, signInUser, signInWithProvider,
  signOutUser, resetPassword, getUserProfile, updateUserProfile,
  uploadAvatar, checkUsernameAvailable, autoAcceptTerms,
  verifyEmailOtp, resendSignupOtp, initGoogleIdentityServices,
  scanAndRenderGoogleButtons, acceptTerms, hasAcceptedTerms,
  getMyProfile, checkOnboardingStatus,
} from './auth.js'
import { IS_DEV } from '../config/env.js'

// ── Expose Supabase client ─────────────────────────────────────────
window.supabase = supabase

// ── Expose auth functions ──────────────────────────────────────────
Object.assign(window, {
  getCurrentUser,
  _authGetCurrentUser: getCurrentUser,
  signUpUser,
  signInUser,
  signInWithProvider,
  signOutUser,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  checkUsernameAvailable,
  autoAcceptTerms,
  verifyEmailOtp,
  resendSignupOtp,
  initGoogleIdentityServices,
  scanAndRenderGoogleButtons,
  acceptTerms,
  hasAcceptedTerms,
  getMyProfile,
  checkOnboardingStatus,
})

// ── Expose all API functions ───────────────────────────────────────
Object.assign(window, apiAll)

// ── window.vibrate shim ───────────────────────────────────────────
// Some pages call window.vibrate(pattern) for haptic feedback.
// Delegate to navigator.vibrate if available.
window.vibrate = (pattern) => {
  if (navigator.vibrate) navigator.vibrate(pattern)
}

// ── window.navigateTo shim ────────────────────────────────────────
// Old code: window.navigateTo('HOMEPAGE_FINAL.HTML')
// New code: translates the old filename to the clean path and pushes to router.
// The router instance is set here from App.jsx via setRouterRef().
let _routerRef = null
export function setRouterRef(router) {
  _routerRef = router
}

const OLD_TO_CLEAN = {
  'HOMEPAGE_FINAL.HTML':              '/feed',
  'BOOKMARKS.HTML':                   '/bookmarks',
  'CATAGORYPAGE.HTML':                '/categories',
  'MY SPACE FINAL (USER).HTML':       '/myspace',
  'MY SPACE FINAL(COMPANIES).HTML':   '/workspace',
  'NOTIFICATION PANEL.HTML':          '/notifications',
  'PRIVATE OWNER PROFILE.HTML':       '/myprofile',
  'PUBLIC POV PROFILE.HTML':          '/profile',
  'ABOUT.HTML':                       '/about',
  'SUPPORT.HTML':                     '/support',
  'PRIVACY_POLICY.HTML':              '/privacy-policy',
  'TERMS_AND_CONDITIONS.HTML':        '/t&c',
  'MAINTENANCE.HTML':                 '/maintenance',
  'COOKIES.HTML':                     '/cookies-policy',
  'index.html':                       '/login',
  'onboarding.html':                  '/login',
  'reset-password.html':              '/reset-password',
  'change-password.html':             '/change-password',
  'settings.html':                    '/settings',
  'SETTINGS.HTML':                    '/settings',
}

window.navigateTo = (pageOrPath, options = {}) => {
  const clean = OLD_TO_CLEAN[pageOrPath] || pageOrPath
  if (_routerRef) {
    _routerRef.navigate(clean, options)
  } else {
    // Fallback before router is mounted
    window.location.href = clean
  }
}

// ── Toast event bridge ────────────────────────────────────────────
// Old code dispatches: window.dispatchEvent(new CustomEvent('toast', { detail }))
// ToastContext handles the actual rendering; we just forward the event.
// The actual handler is registered by ToastContext on mount.
// This block ensures the event name is preserved for any legacy callers.
if (IS_DEV) {
  console.log('[legacyGlobals] ✅ Shim loaded — window.* exposed')
}
