/**
 * offlineStorage.js — IndexedDB Persistent Offline Cache
 *
 * Phase 8 Native Hardening: Provides persistent key-value storage using
 * IndexedDB so the app can serve cached data when offline.
 *
 * Why IndexedDB over localStorage:
 *   - localStorage: 5–10 MB limit, synchronous (blocks main thread), string-only
 *   - IndexedDB: 50–100+ MB, async, stores structured data natively
 *
 * Usage:
 *   import { offlineGet, offlineSet, offlineClear } from './offlineStorage'
 *   await offlineSet('feed:home', feedData, 15 * 60 * 1000)  // 15 min TTL
 *   const cached = await offlineGet('feed:home')
 *
 * Security:
 *   - All keys are scoped to the active user ID via `offlineClearUser()`
 *   - On logout, ALL offline data is purged (user B must never see user A's data)
 *   - E2EE inbox keys are NEVER stored here (handled by inbox_crypto.js)
 */

const DB_NAME = 'plusopinion_offline'
const DB_VERSION = 1
const STORE_NAME = 'cache'

let _db = null
let _dbPromise = null

/**
 * Open (or reuse) the IndexedDB connection.
 * Thread-safe: multiple concurrent calls share a single promise.
 */
function _openDB() {
  if (_db) return Promise.resolve(_db)
  if (_dbPromise) return _dbPromise

  _dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      }

      request.onsuccess = (e) => {
        _db = e.target.result
        _dbPromise = null

        // Handle connection loss (tab backgrounded on mobile)
        _db.onclose = () => { _db = null }
        _db.onversionchange = () => {
          _db.close()
          _db = null
        }

        resolve(_db)
      }

      request.onerror = (e) => {
        _dbPromise = null
        console.warn('[OfflineStorage] IndexedDB open failed:', e.target.error)
        reject(e.target.error)
      }
    } catch (err) {
      _dbPromise = null
      reject(err)
    }
  })

  return _dbPromise
}

/**
 * Get a cached value by key.
 * Returns null if key doesn't exist or has expired.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function offlineGet(key) {
  try {
    const db = await _openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry = request.result
        if (!entry) { resolve(null); return }

        // Check TTL expiration
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          // Expired — delete in background, return null
          _deleteKey(key).catch(() => {})
          resolve(null)
          return
        }

        resolve(entry.data)
      }

      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * Store a value with optional TTL.
 * @param {string} key
 * @param {any} data — must be structured-cloneable (no functions, symbols, etc.)
 * @param {number} [ttlMs] — time-to-live in milliseconds. Omit for permanent.
 */
export async function offlineSet(key, data, ttlMs) {
  try {
    const db = await _openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      const entry = {
        key,
        data,
        savedAt: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : null,
      }

      const request = store.put(entry)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.warn('[OfflineStorage] Set failed for key:', key, err)
  }
}

/**
 * Delete a single key.
 */
async function _deleteKey(key) {
  try {
    const db = await _openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Swallow
  }
}

export const offlineDelete = _deleteKey

/**
 * Clear ALL cached data. Called on logout for security.
 */
export async function offlineClear() {
  try {
    const db = await _openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.clear()
      tx.oncomplete = () => {
        console.log('[OfflineStorage] Cleared all entries')
        resolve()
      }
      tx.onerror = () => resolve()
    })
  } catch {
    // Swallow
  }
}

/**
 * Clear only keys matching a prefix (e.g., 'user:abc123:*').
 * Useful for clearing a specific user's data without wiping shared caches.
 * @param {string} prefix
 */
export async function offlineClearPrefix(prefix) {
  try {
    const db = await _openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.openCursor()
      let count = 0

      request.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
          if (cursor.key.startsWith(prefix)) {
            cursor.delete()
            count++
          }
          cursor.continue()
        } else {
          if (count > 0) {
            console.log(`[OfflineStorage] Cleared ${count} entries with prefix: ${prefix}`)
          }
          resolve()
        }
      }

      request.onerror = () => resolve()
    })
  } catch {
    // Swallow
  }
}

/**
 * Check if IndexedDB is available in the current environment.
 */
export function isOfflineStorageAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}
