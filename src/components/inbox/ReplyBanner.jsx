/**
 * ReplyBanner.jsx — Reply-to indicator above input
 * ===================================================
 * Ported from inbox_panel.js reply banner logic.
 */

import { useInbox } from '../../context/InboxContext'

export default function ReplyBanner() {
    const { replyToMsg, setReplyToMsg } = useInbox()

    if (!replyToMsg) return null

    return (
        <div style={{ display: 'block' }}>
            <div className="chat-reply-banner">
                <div className="chat-reply-banner-content">
                    <div className="chat-reply-banner-name">
                        {replyToMsg.senderName || 'Reply'}
                    </div>
                    <div className="chat-reply-banner-text">
                        {replyToMsg.type === 'image' ? '📷 Image' : (replyToMsg.text || '')}
                    </div>
                </div>
                <button
                    className="chat-reply-close"
                    onClick={() => setReplyToMsg(null)}
                    aria-label="Cancel reply"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
