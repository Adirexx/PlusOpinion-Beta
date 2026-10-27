/**
 * ChatHeader.jsx — Chat Header Bar
 * ===================================
 * Ported from inbox.js chat header HTML.
 * Avatar, name, username, back button, more button.
 */

import { useNavigate } from 'react-router-dom'
import { useInbox } from '../../context/InboxContext'

export default function ChatHeader() {
    const { currentConv, closeChat, closeInbox, setShowChatMore, DEFAULT_AVATAR, typingUsers } = useInbox()
    const navigate = useNavigate()

    if (!currentConv) return null

    const handleAvatarClick = () => {
        navigate(`/profile/${currentConv.otherId}`)
    }

    const handleNameClick = () => {
        navigate(`/profile/${currentConv.otherId}`)
    }

    return (
        <div className="chat-header">
            <button className="chat-back-btn" onClick={closeChat}>
                &#8592;
            </button>
            <img
                className="chat-header-avatar"
                src={currentConv.otherAvatar || DEFAULT_AVATAR}
                alt="Avatar"
                onClick={handleAvatarClick}
                onError={(e) => { e.target.src = DEFAULT_AVATAR }}
            />
            <div className="chat-header-info">
                <div
                    className="chat-header-name"
                    onClick={handleNameClick}
                    style={{ cursor: 'pointer' }}
                >
                    {currentConv.otherName}
                </div>
                <div className="chat-header-username">
                    {typingUsers.has(currentConv.otherId) ? (
                        <span style={{ color: '#2f8bff', fontWeight: 500 }}>typing...</span>
                    ) : (
                        `@${currentConv.otherUsername}`
                    )}
                </div>
            </div>
            <button
                className="chat-more-btn"
                onClick={() => setShowChatMore(true)}
                aria-label="More options"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                </svg>
            </button>
        </div>
    )
}
