/**
 * InboxPanel.jsx — Main Panel Container
 * ========================================
 * Slide-up overlay that contains the entire inbox system.
 *
 * BACK BUTTON ARCHITECTURE:
 *   The inbox manages its own back-navigation layer independently from
 *   the rest of the app. Each sub-view opening pushes ONE history entry.
 *   Hardware back pops the topmost layer (bottom sheet → sub-view → panel).
 *
 *   Stack order (LIFO):
 *     1. InboxPanel opens       → push entry [closes inbox]
 *     2. ChatView opens         → push entry [closes chat → back to list]
 *     3. SearchOverlay opens    → push entry [closes search]
 *     4. RequestsView opens     → push entry [closes requests]
 *     5. ChatMoreSheet opens    → push entry [closes sheet]
 *     6. MsgOptionsSheet opens  → push entry [closes sheet]
 *     7. ConvContextSheet opens → push entry [closes sheet]
 *
 *   Back button always pops the TOP, so: sheet → sub-view → panel → host page.
 *   Host page background never changes; only the inbox layer pops.
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useInbox } from '../../context/InboxContext'
import { useModalHistory } from '../../hooks/useModalHistory'
import ConversationList from './ConversationList'
import ChatView from './ChatView'
import SearchOverlay from './SearchOverlay'
import RequestsView from './RequestsView'
import ChatMoreSheet from './ChatMoreSheet'
import MsgOptionsSheet from './MsgOptionsSheet'
import ConvContextSheet from './ConvContextSheet'
import { E2EESetupModal, E2EERecoveryModal } from './E2EEModals'
import useInboxGestures from '../../hooks/useInboxGestures'
import usePullToRefresh from '../../hooks/usePullToRefresh'
import PullToRefreshIndicator from '../common/PullToRefreshIndicator'
import './InboxPanel.css'

export default function InboxPanel() {
    const {
        isOpen, view, closeInbox, closeChat,
        showSearch, setShowSearch,
        showRequests, setShowRequests,
        showChatMore, setShowChatMore,
        showMsgOptions, setShowMsgOptions,
        showConvContext, setShowConvContext,
        e2eeState,
        confirmDialog, setConfirmDialog,
        fetchConversations,
    } = useInbox()

    const panelRef = useRef(null)
    const handleRef = useRef(null)
    const bodyRef = useRef(null)

    const location = useLocation()
    const [openedAt, setOpenedAt] = useState(null)

    useEffect(() => {
        if (isOpen) {
            setOpenedAt(prev => prev || location.pathname)
        } else {
            setOpenedAt(null)
        }
    }, [isOpen, location.pathname])

    // If the inbox is open, but we navigated away from the page where we opened it, hide it temporarily.
    // This allows clicking shared links to render the page, and going back to seamlessly unhide the inbox.
    const isHidden = isOpen && openedAt && location.pathname !== openedAt

    // Gesture engine (swipe up from nav, pull down from handle/body)
    useInboxGestures(panelRef, handleRef, bodyRef)

    // Pull-to-refresh: upper half pulls trigger refresh; lower half dismisses inbox panel
    const handlePullRefresh = useCallback(async () => {
        if (fetchConversations) {
            await fetchConversations()
        }
    }, [fetchConversations])

    const ptr = usePullToRefresh(bodyRef, handlePullRefresh, {
        disabled: !isOpen || view !== 'list',
        validateTouchStart: (e) => e.touches[0].clientY <= window.innerHeight * 0.5,
    })

    // ── STABLE CLOSE CALLBACKS ────────────────────────────────────
    // useCallback with [] dep so identity is stable — required by
    // useModalHistory to avoid spurious re-registrations.
    const closeMsgOptions  = useCallback(() => setShowMsgOptions(null),  [setShowMsgOptions])
    const closeConvContext = useCallback(() => setShowConvContext(null), [setShowConvContext])
    const closeChatMore    = useCallback(() => setShowChatMore(false),   [setShowChatMore])
    const closeSearch      = useCallback(() => setShowSearch(false),     [setShowSearch])
    const closeRequests    = useCallback(() => setShowRequests(false),   [setShowRequests])

    // ── HARDWARE BACK BUTTON ──────────────────────────────────────
    // Register each layer with the singleton back-stack (innermost first).
    // The singleton ensures only ONE layer closes per back press.
    useModalHistory(!!showConvContext, closeConvContext)
    useModalHistory(!!showMsgOptions,  closeMsgOptions)
    useModalHistory(showChatMore,      closeChatMore)
    useModalHistory(showSearch,        closeSearch)
    useModalHistory(showRequests,      closeRequests)
    useModalHistory(view === 'chat',   closeChat)
    useModalHistory(!!confirmDialog,   () => setConfirmDialog(null))
    // Panel is outermost — registered last, closes last
    useModalHistory(isOpen,            closeInbox)

    // Prevent body scroll when inbox is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    return (
        <>
            <div
                id="inbox-panel"
                ref={panelRef}
                className={isOpen ? 'open' : ''}
                style={{ display: isHidden ? 'none' : '' }}
            >
                {/* ── DRAG HANDLE ── */}
                <div className="inbox-handle-bar" ref={handleRef}>
                    <div className="inbox-handle-pill" />
                    <div className="inbox-handle-title">
                        <h2>Inbox</h2>
                        <button
                            className="inbox-handle-close"
                            onClick={closeInbox}
                            aria-label="Close inbox"
                        >
                            &#x2039;
                        </button>
                    </div>
                </div>

                {/* ── BODY (conversations list) ── */}
                <div className="relative flex-1 overflow-hidden flex flex-col">
                    <PullToRefreshIndicator {...ptr.indicatorProps} />
                    <div
                        className={`inbox-body ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
                        ref={bodyRef}
                        style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
                    >
                        <ConversationList />
                    </div>
                </div>

                {/* ── FLOATING SEARCH FAB (only on list view) ── */}
                {view === 'list' && <SearchFAB />}

                {/* ── CHAT VIEW (slides in from right, z-index 30) ── */}
                <ChatView />

                {/* ── REQUESTS VIEW (slides in from right, z-index 25) ── */}
                <RequestsView />

                {/* ── SEARCH OVERLAY (slides up from bottom, z-index 20) ── */}
                <SearchOverlay />
            </div>

            {/* ── E2EE PIN Modals ── */}
            {e2eeState === 'needs_setup' && <E2EESetupModal />}
            {e2eeState === 'needs_recovery' && <E2EERecoveryModal />}

            {/* ── BOTTOM SHEETS (outside panel for correct z-index stacking) ── */}
            {showChatMore    && <ChatMoreSheet />}
            {showMsgOptions  && <MsgOptionsSheet />}
            {showConvContext  && <ConvContextSheet />}
            
            {/* ── CUSTOM CONFIRM MODAL ── */}
            {confirmDialog && (
                <ConfirmModal
                    dialog={confirmDialog}
                    onClose={() => setConfirmDialog(null)}
                />
            )}
        </>
    )
}

function ConfirmModal({ dialog, onClose }) {
    const handleConfirm = () => {
        dialog.onConfirm()
        onClose()
    }
    
    return (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:px-4 sm:items-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            
            {/* Modal Body */}
            <div 
                className="relative w-full sm:max-w-sm bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-slide-up flex flex-col items-center text-center pb-8"
                onClick={e => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0 sm:hidden"></div>

                {/* Warning Icon if danger */}
                {dialog.isDanger ? (
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                ) : (
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-5">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                        </svg>
                    </div>
                )}

                <h3 className="text-white font-heading font-bold text-xl mb-3">
                    {dialog.confirmText || 'Confirm Action'}
                </h3>
                
                <p className="text-white/60 text-sm mb-8 px-2 leading-relaxed">
                    {dialog.message}
                </p>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={handleConfirm}
                        className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
                            dialog.isDanger 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-white text-black hover:bg-gray-200'
                        }`}
                    >
                        {dialog.confirmText || 'Confirm'}
                    </button>
                    
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-bold text-white/70 text-base bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

function SearchFAB() {
    const { setShowSearch, loadSearchDefault } = useInbox()

    const handleClick = () => {
        setShowSearch(true)
        loadSearchDefault()
    }

    return (
        <button
            id="inbox-search-fab"
            onClick={handleClick}
            aria-label="Search messages or users"
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>
        </button>
    )
}
