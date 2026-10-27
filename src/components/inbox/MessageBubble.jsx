/**
 * MessageBubble.jsx — Single Message Bubble
 * ============================================
 * Ported from inbox_panel.js renderMessage().
 * Handles: text, image, shared post, E2EE decrypt, reactions,
 * bookmarks, swipe-to-reply, long-press context menu.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useActions } from '../../context/ActionsContext'
import { useInbox } from '../../context/InboxContext'
import { decryptFromUser, getChatImageUrl } from '../../lib/inbox/inboxCrypto'
import MessageReactions from './MessageReactions'
import SharedPostPreview from './SharedPostPreview'
import SharedProfilePreview from './SharedProfilePreview'
import { useNavigate } from 'react-router-dom'

// URL linkification regex
const URL_REGEX = /(https?:\/\/[^\s<]+)/gi

function linkify(text) {
    if (!text) return text
    return text.replace(URL_REGEX, (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#5ca8ff;text-decoration:underline;">${url}</a>`
    )
}

function formatMsgTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function MessageBubble({ msg, conv }) {
    const { user } = useAuth()
    const { openImage } = useActions()
    const {
        reactionsMap, bookmarkedSet,
        setReplyToMsg, setShowMsgOptions, closeInbox
    } = useInbox()
    const navigate = useNavigate()

    const isMine = msg.sender_id === user?.id
    const [decryptedContent, setDecryptedContent] = useState(() => {
        if (msg.message_type === 'text' && !msg.content_iv) {
            return msg.content
        }
        return null
    })
    const [imageUrl, setImageUrl] = useState(null)
    const bubbleRef = useRef(null)
    const longPressTimerRef = useRef(null)
    const swipeStartRef = useRef({ x: 0, y: 0 })
    const swipingRef = useRef(false)

    // Decrypt text messages (fallback for real-time unencrypted or non-predecrypted messages)
    useEffect(() => {
        if (msg.message_type === 'text') {
            if (msg.content_iv) {
                // Encrypted — decrypt
                decryptFromUser(msg.content, msg.content_iv, user?.id, conv.otherId)
                    .then(setDecryptedContent)
                    .catch(() => setDecryptedContent('[Decryption failed]'))
            } else if (msg.content !== decryptedContent) {
                setDecryptedContent(msg.content)
            }
        }
    }, [msg.content, msg.content_iv, msg.message_type, user?.id, conv.otherId, decryptedContent])

    // Load image URL
    useEffect(() => {
        if (msg.message_type === 'image' && msg.media_url) {
            if (msg.media_url.startsWith('http') || msg.media_url.startsWith('blob:')) {
                setImageUrl(msg.media_url)
            } else {
                getChatImageUrl(msg.media_url)
                    .then(setImageUrl)
                    .catch(() => setImageUrl(null))
            }
        } else if (msg.message_type === 'image' && msg.content && !msg.content_iv && msg.content !== '[image]') {
            // Optimistic image from content
            setImageUrl(msg.content)
        }
    }, [msg.message_type, msg.media_url, msg.content, msg.content_iv])

    // Parse structured content (text + metadata)
    const parsed = useMemo(() => {
        if (msg.message_type !== 'text' || !decryptedContent) return null
        try {
            const obj = JSON.parse(decryptedContent)
            return obj
        } catch {
            return { text: decryptedContent }
        }
    }, [decryptedContent, msg.message_type])

    // Reactions for this message
    const reactions = reactionsMap[msg.id] || []
    const isBookmarked = bookmarkedSet.has(msg.id)

    // ─── SWIPE TO REPLY ──────────────────────────────────────────
    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0]
        swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
        swipingRef.current = false
    }, [])

    const handleTouchMove = useCallback((e) => {
        if (!bubbleRef.current) return
        const touch = e.touches[0]
        const dx = touch.clientX - swipeStartRef.current.x
        const dy = Math.abs(touch.clientY - swipeStartRef.current.y)

        if (dy > Math.abs(dx)) return // Vertical scroll

        const threshold = isMine ? -30 : 30
        const isCorrectDirection = isMine ? dx < 0 : dx > 0
        const absDx = Math.abs(dx)

        if (isCorrectDirection && absDx > 10) {
            swipingRef.current = true
            const clampedDx = Math.sign(dx) * Math.min(absDx, 60)
            bubbleRef.current.style.transform = `translateX(${clampedDx}px)`

            // Show reply icon when past threshold
            if (absDx > 40) {
                bubbleRef.current.classList.add('reply-active')
            } else {
                bubbleRef.current.classList.remove('reply-active')
            }
        }
    }, [isMine])

    const handleTouchEnd = useCallback(() => {
        if (!bubbleRef.current) return
        bubbleRef.current.style.transform = ''
        bubbleRef.current.classList.remove('reply-active')

        if (swipingRef.current) {
            // Trigger reply
            if (navigator.vibrate) navigator.vibrate(20)
            const replyText = parsed?.text || (msg.message_type === 'image' ? '📷 Image' : '')
            setReplyToMsg({
                id: msg.id,
                senderName: isMine ? 'You' : conv.otherName,
                text: replyText,
                type: msg.message_type
            })
        }
        swipingRef.current = false
    }, [isMine, msg, conv, parsed, setReplyToMsg])

    // ─── LONG PRESS → CONTEXT MENU ──────────────────────────────
    const handleLongPressStart = useCallback((e) => {
        longPressTimerRef.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(30)
            bubbleRef.current?.classList.add('long-pressing')
            setShowMsgOptions({
                msgId: msg.id,
                isMine,
                isBookmarked,
                text: parsed?.text || ''
            })
            setTimeout(() => bubbleRef.current?.classList.remove('long-pressing'), 200)
        }, 500)
    }, [msg.id, isMine, isBookmarked, parsed, setShowMsgOptions])

    const handleLongPressEnd = useCallback(() => {
        clearTimeout(longPressTimerRef.current)
    }, [])

    const timeStr = formatMsgTime(msg.created_at)
    
    // Status indicators for my messages
    const isOptimistic = typeof msg.id === 'string' && msg.id.startsWith('optimistic-')
    
    const renderStatus = () => {
        if (!isMine) return null
        if (isOptimistic) {
            return (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, marginLeft: 4 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            )
        }
        // Single tick indicating the message was successfully sent to the server
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, marginLeft: 4 }}>
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        )
    }

    // ─── IMAGE MESSAGE ───────────────────────────────────────────
    if (msg.message_type === 'image') {
        return (
            <div
                ref={bubbleRef}
                className={`chat-msg direct-img ${isMine ? 'mine' : 'theirs'}`}
                style={{ margin: '8px 0' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="chat-reply-icon">↩</div>
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt="Chat" 
                        loading="lazy" 
                        onClick={() => openImage(imageUrl)}
                    />
                ) : (
                    <div style={{ width: 240, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />
                )}
                <div className="chat-msg-time" style={{ display: 'flex', alignItems: 'center' }}>
                    {timeStr}
                    {renderStatus()}
                </div>
                {isBookmarked && (
                    <div className="msg-bookmark-icon">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </div>
                )}
                <MessageReactions reactions={reactions} msgId={msg.id} />
            </div>
        )
    }

    // ─── TEXT MESSAGE ────────────────────────────────────────────
    const displayText = parsed?.text || ''
    const hasSharedPost = parsed?.share_post_id
    const hasSharedProfile = parsed?.share_profile_id ? { id: parsed.share_profile_id, name: parsed.share_profile_name } : null
    const hasReplyTo = parsed?.reply_to
    const hasOgData = parsed?.og_data

    const isSharedOnly = (hasSharedPost || hasSharedProfile) && !displayText;

    return (
        <div
            ref={bubbleRef}
            className={`chat-msg ${isMine ? 'mine' : 'theirs'} ${isSharedOnly ? 'shared-post-only' : ''}`}
            style={{
                margin: isSharedOnly ? '8px 0' : undefined
            }}
            onTouchStart={(e) => { handleTouchStart(e); handleLongPressStart(e) }}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => { handleTouchEnd(); handleLongPressEnd() }}
            onTouchCancel={handleLongPressEnd}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
        >
            <div className="chat-reply-icon">↩</div>

            {/* Reply block */}
            {hasReplyTo && (
                <div style={{
                    padding: '6px 10px', marginBottom: 6,
                    borderLeft: '3px solid rgba(47,139,255,0.5)',
                    background: 'rgba(47,139,255,0.08)', borderRadius: '0 8px 8px 0',
                    fontSize: 12, color: 'rgba(255,255,255,0.6)'
                }}>
                    <div style={{ fontWeight: 700, color: '#2f8bff', fontSize: 11, marginBottom: 2 }}>
                        {hasReplyTo.senderName || 'Reply'}
                    </div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hasReplyTo.text || (hasReplyTo.type === 'image' ? '📷 Image' : '')}
                    </div>
                </div>
            )}

            {/* Shared post */}
            {hasSharedPost && (
                <div style={{ marginBottom: displayText ? 6 : 0, display: 'flex', flexDirection: 'column' }}>
                    <SharedPostPreview 
                        postId={hasSharedPost} 
                        onClick={() => {
                            navigate(`/post/${hasSharedPost}`)
                        }}
                    />
                </div>
            )}

            {/* Shared Profile */}
            {hasSharedProfile && (
                <div style={{ marginBottom: displayText ? 6 : 0, display: 'flex', flexDirection: 'column' }}>
                    <SharedProfilePreview 
                        profileId={hasSharedProfile.id} 
                        onClick={() => {
                            navigate(`/profile/${hasSharedProfile.id}`)
                        }}
                    />
                </div>
            )}



            {/* OG Link Preview */}
            {hasOgData && (
                <a
                    href={hasOgData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: displayText ? 6 : 0 }}
                >
                    <div style={{
                        borderRadius: 10, overflow: 'hidden',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        {hasOgData.image && (
                            <img src={hasOgData.image} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                        )}
                        <div style={{ padding: '8px 10px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                                {hasOgData.title || hasOgData.url}
                            </div>
                            {hasOgData.description && (
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.3 }}>
                                    {hasOgData.description.substring(0, 80)}
                                </div>
                            )}
                        </div>
                    </div>
                </a>
            )}

            {/* Text content */}
            {displayText && (
                <div dangerouslySetInnerHTML={{ __html: linkify(displayText) }} />
            )}

            {/* Edited indicator */}
            {msg.is_edited && (
                <span style={{ fontSize: 9, opacity: 0.4, marginLeft: 4 }}>(edited)</span>
            )}

            <div className="chat-msg-time" style={{ display: 'flex', alignItems: 'center' }}>
                {timeStr}
                {renderStatus()}
            </div>

            {isBookmarked && (
                <div className="msg-bookmark-icon">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
            )}

            <MessageReactions reactions={reactions} msgId={msg.id} />
        </div>
    )
}
