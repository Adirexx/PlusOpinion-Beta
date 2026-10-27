/**
 * useOfflineCache.js — Hook for offline-first data fetching
 *
 * Phase 8 Native Hardening: Provides a stale-while-revalidate pattern
 * backed by IndexedDB for offline persistence.
 *
 * Pattern:
 *   1. Return cached data immediately (from IndexedDB) — instant display
 *   2. Fetch fresh data in the background
 *   3. Update the UI when fresh data arrives
 *   4. Save fresh data to IndexedDB for next offline use
 *   5. If offline, return cached data with no error
 *
 * This is the same pattern used by Instagram, Twitter, WhatsApp, etc.
 * The user always sees SOMETHING — never a blank screen.
 *
 * Usage:
 *   const { data, loading, isStale, error } = useOfflineCache(
 *     'feed:home',
 *     () => getFeed({ page: 0, limit: 20 }),
 *     { ttl: 15 * 60 * 1000, deps: [] }
 *   )
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { offlineGet, offlineSet } from '../lib/offlineStorage'

/**
 * @param {string} cacheKey — unique key for this data (e.g., 'feed:home', 'profile:abc')
 * @param {() => Promise<any>} fetchFn — async function that fetches fresh data
 * @param {Object} [options]
 * @param {number} [options.ttl=900000] — cache TTL in ms (default 15 minutes)
 * @param {any[]} [options.deps=[]] — dependency array to re-trigger fetch
 * @param {boolean} [options.enabled=true] — disable fetch (useful for conditional queries)
 * @param {boolean} [options.persistOnlyWhenOnline=false] — only save to IndexedDB when online
 */
export default function useOfflineCache(cacheKey, fetchFn, options = {}) {
  const {
    ttl = 15 * 60 * 1000, // 15 minutes default
    deps = [],
    enabled = true,
    persistOnlyWhenOnline = false,
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isStale, setIsStale] = useState(false)
  const [error, setError] = useState(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const mountedRef = useRef(true)
  const fetchRef = useRef(fetchFn)

  // Keep fetchFn ref fresh without causing re-renders
  fetchRef.current = fetchFn

  // ── Load from cache + fetch fresh ─────────────────────────────────
  const execute = useCallback(async () => {
    if (!enabled || !cacheKey) return

    setLoading(true)
    setError(null)

    // Step 1: Try to get cached data (instant)
    try {
      const cached = await offlineGet(cacheKey)
      if (cached !== null && mountedRef.current) {
        setData(cached)
        setIsFromCache(true)
        setIsStale(true)
        setLoading(false)
      }
    } catch {
      // IndexedDB unavailable — proceed without cache
    }

    // Step 2: Fetch fresh data
    if (!navigator.onLine) {
      // Offline — don't attempt fetch
      if (mountedRef.current) {
        setLoading(false)
        if (data === null) {
          // No cached data either
          setError(new Error('offline'))
        }
      }
      return
    }

    try {
      const freshData = await fetchRef.current()
      if (!mountedRef.current) return

      setData(freshData)
      setIsFromCache(false)
      setIsStale(false)
      setLoading(false)
      setError(null)

      // Step 3: Persist to IndexedDB for offline use
      if (!persistOnlyWhenOnline || navigator.onLine) {
        offlineSet(cacheKey, freshData, ttl).catch(() => {})
      }
    } catch (fetchErr) {
      if (!mountedRef.current) return

      // If we already have cached data, don't show error — just mark as stale
      if (data !== null) {
        setIsStale(true)
        setLoading(false)
      } else {
        setError(fetchErr)
        setLoading(false)
      }
    }
  }, [cacheKey, enabled, ttl, persistOnlyWhenOnline, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initial fetch + re-fetch on deps change ───────────────────────
  useEffect(() => {
    mountedRef.current = true
    execute()
    return () => { mountedRef.current = false }
  }, [execute])

  // ── Re-fetch when coming back online ──────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      if (enabled) execute()
    }
    window.addEventListener('network:online', handleOnline)
    return () => window.removeEventListener('network:online', handleOnline)
  }, [execute, enabled])

  // ── Manual refresh function ───────────────────────────────────────
  const refresh = useCallback(() => execute(), [execute])

  return {
    data,
    loading,
    isStale,       // true = showing cached data, fresh data pending
    isFromCache,   // true = data came from IndexedDB
    error,
    refresh,
  }
}
