/**
 * ChatView.jsx — Chat View Container
 * =====================================
 * Ported from inbox.js chat view HTML + inbox_panel.js chat rendering logic.
 * Slides in from right, contains header, E2EE bar, messages, and input.
 */

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useInbox } from '../../context/InboxContext'
import ChatHeader from './ChatHeader'
import MessageBubble from './MessageBubble'
import DayDivider from './DayDivider'
import E2EEBanner from './E2EEBanner'
import ChatInput from './ChatInput'
import ReplyBanner from './ReplyBanner'
import ImagePreviewBar from './ImagePreviewBar'
import { OrbitLoader } from '../ui/Icons'

export default function ChatView() {
    const {
        view, currentConv, messages, loadingMsgs,
        loadOlderMessages, msgAllLoaded, typingUsers
    } = useInbox()

    const observerTarget = useRef(null)

    // Infinite scroll with IntersectionObserver
    useEffect(() => {
        if (!observerTarget.current || msgAllLoaded) return
        
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingMsgs && !msgAllLoaded) {
                    loadOlderMessages()
                }
            },
            { threshold: 0.1 }
        )
        
        observer.observe(observerTarget.current)
        return () => observer.disconnect()
    }, [loadOlderMessages, msgAllLoaded, loadingMsgs])

    // Group messages by day
    const groupedMessages = groupByDay(messages)

    return (
        <div
            id="inbox-chat"
            className={view === 'chat' ? 'open' : ''}
        >
            {currentConv && (
                <>
                    <ChatHeader />

                    <div className="chat-messages">
                        
                        {/* ── TYPING INDICATOR ── (visually at the bottom, so DOM start in column-reverse) */}
                        {currentConv && typingUsers.has(currentConv.otherId) && (
                            <div className="chat-msg theirs typing-indicator">
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        {loadingMsgs ? (
                            <div className="inbox-loader" style={{ height: '100%' }}>
                                <div className="inbox-spinner">
                                    <OrbitLoader size={32} />
                                </div>
                            </div>
                        ) : (
                            [...groupedMessages].reverse().map((group, gi) => (
                                <div key={group.date} style={{ display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}>
                                    {[...group.messages].reverse().map((msg) => (
                                        <MessageBubble
                                            key={msg.id}
                                            msg={msg}
                                            conv={currentConv}
                                        />
                                    ))}
                                    <DayDivider date={group.date} />
                                </div>
                            ))
                        )}

                        {/* Trigger for loading older messages */}
                        {!msgAllLoaded && !loadingMsgs && messages.length > 0 && (
                            <div ref={observerTarget} style={{ height: 20, flexShrink: 0 }} />
                        )}

                        {/* E2EE Info Banner at top (DOM end in column-reverse) */}
                        <E2EEBanner otherName={currentConv.otherName} />
                    </div>

                    {/* ── IMAGE PREVIEW BAR ── */}
                    <ImagePreviewBar />

                    {/* ── REPLY BANNER ── */}
                    <ReplyBanner />

                    {/* ── INPUT BAR ── */}
                    <ChatInput />
                </>
            )}
        </div>
    )
}

// ─── Helper: group messages by day ─────────────────────────────
function groupByDay(messages) {
    const groups = []
    let currentDate = null

    messages.forEach(msg => {
        const d = new Date(msg.created_at)
        const dateStr = d.toDateString()

        if (dateStr !== currentDate) {
            currentDate = dateStr
            groups.push({ date: dateStr, messages: [msg] })
        } else {
            groups[groups.length - 1].messages.push(msg)
        }
    })

    return groups
}
