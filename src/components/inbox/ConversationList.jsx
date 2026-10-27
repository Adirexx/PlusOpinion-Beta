/**
 * ConversationList.jsx — Conversations List View
 * =================================================
 * Ported from inbox_panel.js renderConversations().
 * Shows conversation rows + requests button.
 */

import { useCallback, useRef } from 'react'
import { useInbox } from '../../context/InboxContext'
import ConversationRow from './ConversationRow'
import { OrbitLoader } from '../ui/Icons'

export default function ConversationList() {
    const {
        conversations, requests, loadingConvs,
        setShowRequests, openChat, setShowConvContext
    } = useInbox()

    const longPressTimer = useRef(null)
    const longPressConv = useRef(null)

    // Long-press handler for conversation context menu
    const handleLongPressStart = useCallback((conv, e) => {
        longPressConv.current = conv
        longPressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(30)
            setShowConvContext(conv)
        }, 500)
    }, [setShowConvContext])

    const handleLongPressEnd = useCallback(() => {
        clearTimeout(longPressTimer.current)
        longPressConv.current = null
    }, [])

    if (loadingConvs) {
        return (
            <div className="inbox-loader">
                <div className="inbox-spinner">
                    <OrbitLoader size={28} />
                </div>
            </div>
        )
    }

    return (
        <div id="inbox-list-view">
            {/* ── REQUESTS BUTTON ── */}
            {/* ── REQUESTS BUTTON (Permanent) ── */}
            <div
                className="inbox-requests-btn"
                onClick={() => setShowRequests(true)}
            >
                <span className="inbox-req-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>Message Requests</span>
                    {requests.length > 0 && (
                        <span className="inbox-req-badge">{requests.length}</span>
                    )}
                </span>
                <span className="inbox-req-arrow">›</span>
            </div>

            {/* ── CONVERSATION ROWS ── */}
            <div className="inbox-conv-list">
                {conversations.length === 0 ? (
                    <div className="inbox-empty">
                        <div className="inbox-empty-icon">💬</div>
                        <div className="inbox-empty-title">No conversations yet</div>
                        <div className="inbox-empty-sub">
                            Start a conversation by searching for people or messaging from their profile.
                        </div>
                    </div>
                ) : (
                    conversations.map(conv => (
                        <ConversationRow
                            key={conv.id}
                            conv={conv}
                            onClick={() => openChat(conv)}
                            onLongPressStart={(e) => handleLongPressStart(conv, e)}
                            onLongPressEnd={handleLongPressEnd}
                        />
                    ))
                )}
                {conversations.length > 0 && (
                    <div className="inbox-end-indicator">
                        <div className="inbox-end-line" />
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Your personal messages are end-to-end encrypted</span>
                        <div className="inbox-end-line" />
                    </div>
                )}
            </div>
        </div>
    )
}
