/**
 * MsgOptionsSheet.jsx — Message Long-Press Options
 * ===================================================
 */

import { useInbox } from '../../context/InboxContext'
import { useDialog } from '../../context/DialogContext'

export default function MsgOptionsSheet() {
    const {
        showMsgOptions, setShowMsgOptions,
        handleToggleReaction, handleToggleBookmark,
        handleDeleteMessage, handleEditMessage
    } = useInbox()
    const { showPrompt, showConfirm } = useDialog()

    const close = () => setShowMsgOptions(null)

    if (!showMsgOptions) return null
    const { msgId, isMine, isBookmarked, text } = showMsgOptions

    const onReaction = (emoji) => {
        handleToggleReaction(msgId, emoji)
        close()
    }

    const onBookmark = () => {
        handleToggleBookmark(msgId, isBookmarked)
        close()
    }

    const onEdit = async () => {
        close()
        const newText = await showPrompt({
            title: 'Edit Message',
            message: 'Update your message below:',
            defaultValue: text,
            confirmText: 'Save',
            cancelText: 'Cancel'
        })
        if (newText !== null && newText.trim() !== '') {
            handleEditMessage(msgId, newText.trim())
        }
    }

    const onCopy = async () => {
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Copied to clipboard', icon: 'Check', isSuccess: true } }))
        } catch (e) {
            console.error('Failed to copy text:', e)
        }
        close()
    }

    const onDelete = async () => {
        close()
        const ok = await showConfirm({
            title: 'Delete Message?',
            message: 'Are you sure you want to delete this message for everyone? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            isDanger: true,
            icon: 'Trash'
        })
        if (ok) {
            handleDeleteMessage(msgId)
        }
    }

    return (
        <div className="inbox-bottom-sheet open">
            <div className="inbox-bottom-sheet-overlay" onClick={close} />
            <div className="inbox-bottom-sheet-body">
                <div className="inbox-sheet-pill" />

                <div style={{ padding: '12px 16px 8px', display: 'flex', justifyContent: 'center' }}>
                    <div className="msg-reaction-picker" style={{ position: 'relative' }}>
                        {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                            <div
                                key={emoji}
                                className="msg-reaction-emoji"
                                onClick={() => onReaction(emoji)}
                            >
                                {emoji}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="inbox-sheet-sep" />

                <div className="inbox-sheet-item" onClick={onBookmark}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
                </div>

                {text && (
                    <div className="inbox-sheet-item" onClick={onCopy}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy Text</span>
                    </div>
                )}

                {isMine && text && (
                    <div className="inbox-sheet-item" onClick={onEdit}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit Message</span>
                    </div>
                )}

                {isMine && (
                    <div className="inbox-sheet-item danger" onClick={onDelete}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M9 6V4h6v2" />
                        </svg>
                        <span>Delete Message</span>
                    </div>
                )}
            </div>
        </div>
    )
}
