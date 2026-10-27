/**
 * ConversationRow.jsx — Single Conversation Row
 * =================================================
 * Ported from inbox_panel.js conversation row HTML rendering.
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInbox } from '../../context/InboxContext'

function formatTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d

    if (diff < 60000) return 'now'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h'
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ConversationRow({ conv, onClick, onLongPressStart, onLongPressEnd }) {
    const { DEFAULT_AVATAR, escHtml, closeInbox } = useInbox()
    const navigate = useNavigate()

    const timeStr = useMemo(() => formatTime(conv.time), [conv.time])
    const hasUnread = conv.unreadCount > 0

    const handleAvatarClick = (e) => {
        e.stopPropagation()
        closeInbox()
        navigate(`/profile/${conv.otherId}`)
    }

    return (
        <div
            className={`inbox-conv-row ${hasUnread ? 'unread' : ''}`}
            onClick={onClick}
            onTouchStart={onLongPressStart}
            onTouchEnd={onLongPressEnd}
            onTouchCancel={onLongPressEnd}
            onMouseDown={onLongPressStart}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
        >
            <img
                className="inbox-conv-avatar"
                src={conv.otherAvatar || DEFAULT_AVATAR}
                alt=""
                onClick={handleAvatarClick}
                onError={(e) => { e.target.src = DEFAULT_AVATAR }}
            />
            <div className="inbox-conv-info">
                <div className="inbox-conv-name-wrapper">
                    <div className="inbox-conv-name">{escHtml(conv.otherName)}</div>
                    {hasUnread && (
                        <span className="inbox-unread-badge">{conv.unreadCount}</span>
                    )}
                </div>
                <div className="inbox-conv-preview">{conv.preview || ''}</div>
            </div>
            <div className="inbox-conv-meta">
                <div className="inbox-conv-time">{timeStr}</div>
            </div>
        </div>
    )
}
