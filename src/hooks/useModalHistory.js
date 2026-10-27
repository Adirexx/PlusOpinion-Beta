/**
 * useModalHistory.js — Singleton SPA Back-Stack Manager
 * ========================================================
 * Industry-standard approach for mobile SPA back button handling.
 *
 * ROOT CAUSE OF PREVIOUS BUG:
 *   Programmatic close was calling window.history.go(-1) to consume a
 *   phantom history entry. This fired a popstate event which our own
 *   global singleton listener caught — treating it as a hardware back
 *   press and closing the NEXT modal on the stack. Classic race condition.
 *
 * SOLUTION:
 *   Never call history.go(-1) from programmatic close.
 *   Instead, mark the history entry as "consumed" via replaceState, and
 *   let a "skip" counter in onGlobalPopState ignore it when it fires.
 *
 *   The only time popstate is handled as a real back press is when it fires
 *   from a genuine hardware/browser back action (not from our own go(-1)).
 *
 * ARCHITECTURE:
 *   - One global popstate listener (singleton)
 *   - One history entry pushed per modal open
 *   - Programmatic close: remove from stack + replaceState (no navigation)
 *   - Hardware back: pop stack top, call its close fn
 */

import { useEffect, useRef } from 'react';

// ── SINGLETON STACK ──────────────────────────────────────────────
// Each entry: { id: Symbol, close: Function }
const modalStack = [];
let listenerAttached = false;

function attachListener() {
    if (listenerAttached) return;
    listenerAttached = true;
    window.addEventListener('popstate', onPopState);
}

function detachListener() {
    if (!listenerAttached) return;
    listenerAttached = false;
    window.removeEventListener('popstate', onPopState);
}

// Counter: how many popstate events to ignore (from our own replaceState calls)
// Note: replaceState itself does NOT fire popstate, so this counter stays 0.
// We only need to skip pops that we explicitly initiated via history.go(-1),
// which we no longer use. This counter is kept for safety / future use.
let skipCount = 0;

function onPopState(e) {
    if (skipCount > 0) {
        skipCount--;
        return;
    }

    const entry = modalStack.pop();
    if (entry) {
        entry.close();
    }

    if (modalStack.length === 0) {
        detachListener();
    }
}

// ── HOOK ─────────────────────────────────────────────────────────

/**
 * useModalHistory(isOpen, onClose)
 *
 * When isOpen becomes true: push entry to stack + pushState.
 * When isOpen becomes false programmatically: remove entry from stack
 *   + replaceState to neutralize the history entry (NO history.go(-1)).
 * When hardware back fires: singleton pops stack top, calls close fn.
 */
export function useModalHistory(isOpen, onClose) {
    // Stable unique ID for this hook instance
    const idRef = useRef(null);
    if (!idRef.current) idRef.current = Symbol('modal');

    // Ref to latest onClose — avoids stale closure without re-registering
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; });

    // Whether this instance currently occupies a stack slot
    const registeredRef = useRef(false);

    useEffect(() => {
        if (isOpen && !registeredRef.current) {
            // ── OPEN ─────────────────────────────────────────────
            registeredRef.current = true;
            const id = idRef.current;

            const closeHandler = () => {
                // Called by hardware back — mark as unregistered
                registeredRef.current = false;
                onCloseRef.current();
            };
            closeHandler._id = id;

            modalStack.push({ id, close: closeHandler });
            // Push a browser history entry so back button fires popstate
            window.history.pushState({ _modal: id.toString() }, '');
            attachListener();

        } else if (!isOpen && registeredRef.current) {
            // ── PROGRAMMATIC CLOSE ────────────────────────────────
            // Called when the app closes the modal via code (tap X, etc.)
            // DO NOT call history.go(-1) — that fires popstate and creates
            // a race condition with the singleton handler.
            // Instead: mark the history entry as consumed with replaceState.
            registeredRef.current = false;
            const id = idRef.current;

            // Remove from stack
            const idx = modalStack.findIndex(e => e.id === id);
            if (idx !== -1) modalStack.splice(idx, 1);

            if (modalStack.length === 0) detachListener();

            // Neutralize the history entry we pushed, without navigation.
            // replaceState DOES NOT fire popstate — safe to call here.
            // The "consumed" entry will sit in history but when/if the user
            // presses back to reach it, our handler will check the stack and
            // find nothing to close (stack is already empty), so it's a no-op.
            try {
                window.history.replaceState({ _consumed: true }, '');
            } catch (_) { /* replaceState can throw cross-origin */ }
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            if (registeredRef.current) {
                registeredRef.current = false;
                const id = idRef.current;
                const idx = modalStack.findIndex(e => e.id === id);
                if (idx !== -1) modalStack.splice(idx, 1);
                if (modalStack.length === 0) detachListener();
                try { window.history.replaceState({ _consumed: true }, ''); } catch (_) {}
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

