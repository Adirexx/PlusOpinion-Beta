/**
 * UnreadContext.jsx — Unread notification count
 *
 * Wraps notifications.js behavior from the old project:
 *   - window.subscribeToUnreadCount (notifications.js lines 894-964)
 *   - window.getUnreadCountFromCache (notifications.js lines 880-887)
 *   - window 'inbox_unread_changed' CustomEvent (emitted by inbox.js)
 *
 * Subscription is created once per signed-in user and torn down on
 * sign-out or user change (the old commit message "Refactor unread count
 * subscription for user scope" confirms this matters).
 *
 * getUnreadCountFromCache returns the value from localStorage instantly —
 * same behaviour as the old code (prevents badge flickering from 0 → N).
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { getUnreadCount } from '../lib/api/notifications.js'
import { supabase } from '../lib/supabaseClient.js'

const UnreadContext = createContext(0)

// Sync localStorage (same key as old notifications.js line 924)
const LS_KEY = 'unread_count'

function getCachedCount() {
  try {
    const v = localStorage.getItem(LS_KEY)
    return v ? parseInt(v, 10) : 0
  } catch {
    return 0
  }
}

function setCachedCount(n) {
  try { localStorage.setItem(LS_KEY, String(n)) } catch {}
}

export function UnreadProvider({ children }) {
  const { user } = useAuth()
  const [count, setCount]     = useState(getCachedCount)
  const cancelRef             = useRef(false)
  const channelRef            = useRef(null)

  useEffect(() => {
    if (!user) {
      // Signed out — clear count
      setCount(0)
      setCachedCount(0)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    cancelRef.current = false

    // 1. Return cached value instantly (no blink from 0→N)
    const cached = getCachedCount()
    if (cached > 0) setCount(cached)

    // 2. Fetch real count + subscribe
    async function setup() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          try { supabase.realtime.setAuth(session.access_token) } catch (_) {}
        }
      } catch (_) {}

      try {
        const initial = await getUnreadCount()
        if (cancelRef.current) return
        setCount(initial)
        setCachedCount(initial)
      } catch {}

      // 3. Realtime subscription — scoped to user ID (matches old code channel name)
      const ch = supabase
        .channel(`notifications:count:${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, async () => {
          if (cancelRef.current) return
          try {
            const newCount = await getUnreadCount()
            if (!cancelRef.current) {
              setCount(newCount)
              setCachedCount(newCount)
            }
          } catch {}
        })
        .subscribe()

      if (!cancelRef.current) {
        channelRef.current = ch
      } else {
        supabase.removeChannel(ch)
      }
    }

    setup()

    // 4. Listen for optimistic updates for notification count
    function handleNotificationCountEvent(e) {
      if (cancelRef.current) return
      const n = typeof e.detail === 'number' ? e.detail : e.detail?.count;
      if (typeof n === 'number') { setCount(n); setCachedCount(n) }
    }
    // Notifications only: do not listen to inbox_unread_changed here!
    window.addEventListener('unread_count_updated', handleNotificationCountEvent)
    window.addEventListener('notification_count_updated', handleNotificationCountEvent)

    return () => {
      cancelRef.current = true
      window.removeEventListener('unread_count_updated', handleNotificationCountEvent)
      window.removeEventListener('notification_count_updated', handleNotificationCountEvent)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user?.id]) // Re-run if user changes

  return (
    <UnreadContext.Provider value={count}>
      {children}
    </UnreadContext.Provider>
  )
}

export function useUnreadCount() {
  return useContext(UnreadContext)
}
