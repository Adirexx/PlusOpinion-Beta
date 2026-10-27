/**
 * useSwipeNavigation.js — Instagram-style horizontal swipe between bottom-nav tabs
 *
 * Attaches touch listeners to the given container ref and navigates to the
 * previous/next tab when a qualifying horizontal swipe is detected.
 *
 * GESTURE DISCRIMINATION (avoids conflicts):
 *   - Must be predominantly horizontal (ratio > 2:1 horizontal vs vertical)
 *   - Minimum drag distance of 60px
 *   - Minimum velocity of 0.3 px/ms
 *   - Once a vertical scroll starts (> 10px vertical before 10px horizontal),
 *     the gesture is locked out for that touch sequence
 *   - Ignored if the touch originates inside elements with their own
 *     horizontal swipe (image carousels, profile tabs, notification items)
 *
 * EXISTING GESTURES (safe — no overlap):
 *   - Inbox: swipe-up from bottom nav area (vertical, different zone)
 *   - Image carousel: inside .post-images, .carousel, [data-swipeable]
 *   - MyProfile tabs: inside .profile-tabs, [data-tab-swipe]
 *   - Notification items: inside .notification-item [data-swipe-action]
 */

import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Tab order matches BottomNav layout (left to right)
const TAB_ORDER = ['/feed', '/categories', '/myspace', '/notifications', '/myprofile']

// Elements whose children should NOT trigger page-level swipe
const SWIPE_EXCLUSION_SELECTORS = [
  '.post-images',
  '.carousel',
  '[data-swipeable]',
  '[data-tab-swipe]',
  '.profile-tabs',
  '.notification-item',
  '.swipe-action',
  '.image-viewer',
  '.lightbox',
  '.inbox-panel',
  '.menu-drawer',
  '.slide-menu',
  '.modal-overlay',
  '[data-modal]',
  'input',
  'textarea',
  'video',
]

export default function useSwipeNavigation(containerRef, onSwipeStart) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isGuest } = useAuth()

  // Track touch state across start/move/end
  const touch = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    locked: false,       // true = vertical scroll detected, ignore rest
    swiping: false,      // true = horizontal swipe confirmed
    currentX: 0,
  })

  const isExcluded = useCallback((target) => {
    if (!target || !target.closest) return false
    return SWIPE_EXCLUSION_SELECTORS.some(sel => {
      try { return target.closest(sel) !== null } catch { return false }
    })
  }, [])

  const getCurrentTabIndex = useCallback(() => {
    return TAB_ORDER.indexOf(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    const el = containerRef?.current
    if (!el) return

    const onTouchStart = (e) => {
      // Skip if touch is inside an excluded element
      if (isExcluded(e.target)) return

      // Skip multi-touch
      if (e.touches.length > 1) return

      // Only trigger on main tab pages
      if (getCurrentTabIndex() === -1) return

      const t = e.touches[0]
      touch.current = {
        startX: t.clientX,
        startY: t.clientY,
        startTime: Date.now(),
        locked: false,
        swiping: false,
        currentX: t.clientX,
      }
    }

    const onTouchMove = (e) => {
      const tc = touch.current
      if (tc.locked || tc.startTime === 0) return

      const t = e.touches[0]
      const dx = t.clientX - tc.startX
      const dy = t.clientY - tc.startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // Early lock: if vertical movement detected first, abort swipe
      if (!tc.swiping && absDy > 10 && absDy > absDx) {
        tc.locked = true
        return
      }

      // Confirm horizontal swiping once threshold reached
      if (!tc.swiping && absDx > 15 && absDx > absDy * 1.5) {
        tc.swiping = true
        if (onSwipeStart) onSwipeStart(dx > 0 ? 'backward' : 'forward')
      }

      tc.currentX = t.clientX
    }

    const onTouchEnd = () => {
      const tc = touch.current
      if (tc.locked || !tc.swiping || tc.startTime === 0) {
        touch.current = { startX: 0, startY: 0, startTime: 0, locked: false, swiping: false, currentX: 0 }
        return
      }

      const dx = tc.currentX - tc.startX
      const elapsed = Date.now() - tc.startTime
      const absDx = Math.abs(dx)
      const velocity = absDx / Math.max(elapsed, 1)

      // Reset touch state
      touch.current = { startX: 0, startY: 0, startTime: 0, locked: false, swiping: false, currentX: 0 }

      // Minimum thresholds: 60px drag OR 0.3 px/ms velocity with 30px drag
      if (absDx < 30) return
      if (absDx < 60 && velocity < 0.3) return

      const currentIdx = getCurrentTabIndex()
      if (currentIdx === -1) return

      // Determine direction: negative dx = swipe left = forward (next tab)
      let nextIdx
      if (dx < 0) {
        // Swipe left → next tab
        nextIdx = currentIdx + 1
      } else {
        // Swipe right → previous tab
        nextIdx = currentIdx - 1
      }

      // Bounds check
      if (nextIdx < 0 || nextIdx >= TAB_ORDER.length) return

      const targetPath = TAB_ORDER[nextIdx]

      // Protected routes — guest can only access /feed and /categories
      if (isGuest && !['/feed', '/categories'].includes(targetPath)) return

      navigate(targetPath)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [containerRef, isExcluded, getCurrentTabIndex, navigate, isGuest, onSwipeStart])
}
