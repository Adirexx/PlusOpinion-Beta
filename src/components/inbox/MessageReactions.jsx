/**
 * MessageReactions.jsx — Reaction Chips Below Bubble
 * =====================================================
 * Ported from inbox_panel.js reaction chip rendering.
 */

import { useAuth } from '../../context/AuthContext'
import { useInbox } from '../../context/InboxContext'

export default function MessageReactions({ reactions, msgId }) {
    const { user } = useAuth()
    const { handleToggleReaction } = useInbox()

    if (!reactions || reactions.length === 0) return null

    // Group by emoji
    const grouped = {}
    reactions.forEach(r => {
        if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0, isMine: false }
        grouped[r.emoji].count++
        if (r.user_id === user?.id) grouped[r.emoji].isMine = true
    })

    return (
        <div className="chat-msg-reactions">
            {Object.values(grouped).map(g => (
                <span
                    key={g.emoji}
                    className={`chat-reaction-chip ${g.isMine ? 'mine' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleToggleReaction(msgId, g.emoji)
                    }}
                >
                    {g.emoji}
                    {g.count > 1 && <span className="chip-count">{g.count}</span>}
                </span>
            ))}
        </div>
    )
}
