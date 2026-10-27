/**
 * dataCache.js — Unified Memory & IndexedDB Persistent Offline Cache
 *
 * Phase 2 + Phase 8 Native Hardening:
 * Provides two-tier caching:
 *   1. L1 Memory Cache (Map): Instant synchronous access within the session
 *   2. L2 Persistent Cache (IndexedDB via offlineStorage.js): Persists across
 *      app restarts, device reboots, and offline cold starts.
 *
 * Pre-warms essential keys ('feed:posts', 'categories:data', 'bookmarks:data')
 * on startup so initial renders find cached data synchronously.
 *
 * Cleared on logout and on any user change (security: user B must
 * never see user A's cached data).
 */

import { offlineGet, offlineSet, offlineClear } from './offlineStorage'

const _cache = new Map()

// Pre-warm critical keys from IndexedDB on startup
const PREWARM_KEYS = ['feed:posts', 'categories:data', 'bookmarks:data']
if (typeof window !== 'undefined') {
  PREWARM_KEYS.forEach(key => {
    offlineGet(key).then(data => {
      if (data && !_cache.has(key)) {
        // Stored with timestamp 0: accessible immediately if offline, but considered stale on fresh online launch
        _cache.set(key, { data, timestamp: 0 })
        window.dispatchEvent(new CustomEvent('cache:hydrated', { detail: { key, data } }))
      }
    }).catch(() => {})
  })
}

/**
 * Get a cached entry from L1 memory. Returns undefined if not found.
 */
export function getCached(key) {
  const entry = _cache.get(key)
  return entry ? entry.data : undefined
}

/**
 * Get a cached entry asynchronously (checks L1 memory, falls back to L2 IndexedDB).
 */
export async function getCachedAsync(key) {
  if (_cache.has(key)) {
    return _cache.get(key).data
  }
  try {
    const data = await offlineGet(key)
    if (data !== null && data !== undefined) {
      _cache.set(key, { data, timestamp: Date.now() })
      return data
    }
  } catch {}
  return undefined
}

/**
 * Store data in L1 memory and persist to L2 IndexedDB.
 */
export function setCached(key, data) {
  _cache.set(key, { data, timestamp: Date.now() })
  try {
    offlineSet(key, data).catch(() => {})
  } catch {}
}

/**
 * Delete data from cache.
 */
export function deleteCached(key) {
  _cache.delete(key)
}

/**
 * Returns true if the entry doesn't exist or is older than maxAgeMs.
 * Default stale threshold: 90 seconds.
 */
export function isStale(key, maxAgeMs = 90_000) {
  const entry = _cache.get(key)
  if (!entry) return true
  return Date.now() - entry.timestamp > maxAgeMs
}

/**
 * Clear ALL entries from both L1 memory and L2 IndexedDB.
 * Called on logout and on user change.
 */
export function clearCache() {
  _cache.clear()
  resetFeedSession()
  try {
    offlineClear().catch(() => {})
  } catch {}
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) {
    console.log('[Cache] Cleared all memory and persistent entries')
  }
}

/**
 * Alias for user change.
 */
export const clearCacheForUser = clearCache

// ── Feed In-App Session Tracking ─────────────────────────────────────
// Distinguishes between:
// 1. In-App Navigation (tab switching / returning to feed): session remains active,
//    feed content and scroll position are 100% preserved.
// 2. Fresh App Launch (app was quit and reopened): session is false on startup,
//    allowing online fresh load behind skeletons or offline fallback to cached data.
let _isFeedSessionActive = false

export function isFeedSessionActive() {
  return _isFeedSessionActive
}

export function markFeedSessionActive() {
  _isFeedSessionActive = true
}

export function resetFeedSession() {
  _isFeedSessionActive = false
  _scrollPositions.clear()
}

// ── Scroll Position Persistence ──────────────────────────────────────
const _scrollPositions = new Map()

export function saveScrollPosition(key, position) {
  _scrollPositions.set(key, position)
}

export function getScrollPosition(key) {
  return _scrollPositions.get(key) || 0
}

export function clearScrollPositions() {
  _scrollPositions.clear()
}