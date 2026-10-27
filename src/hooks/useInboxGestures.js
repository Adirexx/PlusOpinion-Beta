/**
 * useInboxGestures.js — Gesture Engine Hook
 * ============================================
 * Ported from inbox.js initGestureEngine().
 * Handles: swipe-up from nav bar to open, pull-down from handle/body to close.
 * All threshold values and bezier curves preserved exactly.
 *
 * FIX: Move/End listeners are registered on `document` so dragging
 *      beyond the handle element still tracks correctly.
 */

import { useEffect, useRef } from 'react'
import { useInbox } from '../context/InboxContext'

export default function useInboxGestures(panelRef, handleRef, bodyRef) {
    const { isOpen, view, openInbox, closeInbox } = useInbox()

    // Refs survive re-renders; we read isOpen / view via refs so the
    // effect doesn't need to re-bind listeners every time state changes.
    const stateRef = useRef({ isOpen, view })
    stateRef.current = { isOpen, view }

    useEffect(() => {
        const getY = (e) => e.touches ? e.touches[0].clientY : e.clientY
        const getX = (e) => e.touches ? e.touches[0].clientX : e.clientX
        const getEndY = (e) => e.changedTouches ? e.changedTouches[0].clientY : e.clientY

        // ── SWIPE UP FROM NAV BAR TO OPEN ──────────────────────────
        const navBar = document.getElementById('bottom-nav-bar')
        let navStartY = 0, navStartX = 0, navTracking = false

        const onNavDown = (e) => {
            if (stateRef.current.isOpen) return
            if (!e.target.closest('#bottom-nav-bar')) return
            navStartY = getY(e)
            navStartX = getX(e)
            navTracking = true
        }

        // ── PULL DOWN FROM HANDLE TO CLOSE ─────────────────────────
        const handle = handleRef.current
        let hdlStartY = 0, hdlTracking = false

        const onHandleDown = (e) => {
            if (!stateRef.current.isOpen) return
            if (!handleRef.current?.contains(e.target)) return
            hdlStartY = getY(e)
            hdlTracking = true
        }

        // ── SMART PULL DOWN IN BODY (CONVERSATION LIST ONLY) ───────
        const body = bodyRef.current
        let bdyStartY = 0, bdyTracking = false

        const onBodyDown = (e) => {
            if (!bodyRef.current?.contains(e.target)) return
            const y = getY(e)
            const isBottomHalf = y > window.innerHeight * 0.5
            const isAtTop = bodyRef.current && bodyRef.current.scrollTop === 0
            if (isBottomHalf && isAtTop && stateRef.current.isOpen && stateRef.current.view === 'list') {
                bdyStartY = y
                bdyTracking = true
            }
        }

        // ── GLOBAL MOVE / END (covers handle + body drags) ─────────
        // ── GLOBAL DOWN (Event Delegation) ─────────
        const onGlobalDown = (e) => {
            onNavDown(e)
            onHandleDown(e)
            onBodyDown(e)
        }

        // ── GLOBAL MOVE / END (covers nav + handle + body drags) ─────────
        const onGlobalMove = (e) => {
            if (navTracking) {
                if (!stateRef.current.isOpen) {
                    const dy = navStartY - getY(e)
                    const dx = Math.abs(getX(e) - navStartX)
                    if (dy < 10) return
                    if (dx > dy * 1.2) { navTracking = false; return }
                    if (dy > 0 && panelRef.current) {
                        const pct = Math.max(0, 100 - (dy / window.innerHeight * 100))
                        panelRef.current.classList.add('no-transition')
                        panelRef.current.style.transform = `translateY(${pct}%)`
                    }
                }
            }
            if (hdlTracking) {
                if (stateRef.current.isOpen) {
                    const dy = getY(e) - hdlStartY
                    if (dy > 0 && panelRef.current) {
                        panelRef.current.classList.add('no-transition')
                        panelRef.current.style.transform = `translateY(${dy}px)`
                    }
                }
            }
            if (bdyTracking) {
                const dy = getY(e) - bdyStartY
                if (dy > 0 && bodyRef.current && bodyRef.current.scrollTop === 0 && panelRef.current) {
                    panelRef.current.classList.add('no-transition')
                    panelRef.current.style.transform = `translateY(${dy * 0.4}px)`
                }
            }
        }
        
        const onGlobalEnd = (e) => {
            if (navTracking) {
                navTracking = false
                if (panelRef.current) {
                    panelRef.current.classList.remove('no-transition')
                    panelRef.current.style.transform = ''
                }
                const dy = navStartY - getEndY(e)
                if (dy > window.innerHeight * 0.18) openInbox()
            }
            if (hdlTracking) {
                hdlTracking = false
                if (panelRef.current) {
                    panelRef.current.classList.remove('no-transition')
                    panelRef.current.style.transform = ''
                }
                const dy = getEndY(e) - hdlStartY
                if (dy > 80) closeInbox()
            }
            if (bdyTracking) {
                bdyTracking = false
                if (panelRef.current) {
                    panelRef.current.classList.remove('no-transition')
                    panelRef.current.style.transform = ''
                }
                const dy = getEndY(e) - bdyStartY
                if (dy > 100) closeInbox()
            }
        }

        document.addEventListener('touchstart', onGlobalDown, { passive: true })
        document.addEventListener('mousedown', onGlobalDown, { passive: true })
        document.addEventListener('touchmove', onGlobalMove, { passive: true })
        document.addEventListener('mousemove', onGlobalMove, { passive: true })
        document.addEventListener('touchend', onGlobalEnd, { passive: true })
        document.addEventListener('mouseup', onGlobalEnd, { passive: true })

        return () => {
            document.removeEventListener('touchstart', onGlobalDown)
            document.removeEventListener('mousedown', onGlobalDown)
            document.removeEventListener('touchmove', onGlobalMove)
            document.removeEventListener('mousemove', onGlobalMove)
            document.removeEventListener('touchend', onGlobalEnd)
            document.removeEventListener('mouseup', onGlobalEnd)
        }
    }, [openInbox, closeInbox, panelRef, handleRef, bodyRef])
}
