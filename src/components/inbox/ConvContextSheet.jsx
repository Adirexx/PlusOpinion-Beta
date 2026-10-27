/**
 * ConvContextSheet.jsx — Conversation Long-Press Options
 * ========================================================
 */

import { useInbox } from '../../context/InboxContext'

export default function ConvContextSheet() {
    const {
        showConvContext, setShowConvContext,
        handleRemoveConv, handleDeleteConv, handleBlockUser,
        setConfirmDialog
    } = useInbox()

    const close = () => setShowConvContext(null)

    if (!showConvContext) return null
    const conv = showConvContext

    const onRemove = () => {
        setConfirmDialog({
            message: `Remove ${conv.otherName}? They can still message you later.`,
            confirmText: 'Remove',
            isDanger: false,
            onConfirm: () => {
                handleRemoveConv(conv.id)
                close()
            }
        })
    }

    const onDelete = () => {
        setConfirmDialog({
            message: `Delete chat with ${conv.otherName}? This cannot be undone.`,
            confirmText: 'Delete Chat',
            isDanger: true,
            onConfirm: () => {
                handleDeleteConv(conv.id)
                close()
            }
        })
    }

    const onBlock = () => {
        setConfirmDialog({
            message: `Block ${conv.otherName}? They won't be able to message you.`,
            confirmText: 'Block User',
            isDanger: true,
            onConfirm: () => {
                handleBlockUser(conv.otherId, conv.id)
                close()
            }
        })
    }

    return (
        <div className="inbox-bottom-sheet open">
            <div className="inbox-bottom-sheet-overlay" onClick={close} />
            <div className="inbox-bottom-sheet-body">
                <div className="inbox-sheet-pill" />
                <div className="inbox-sheet-title">Options</div>

                <div className="inbox-sheet-item" onClick={onRemove}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    <span>Remove {conv?.otherName}</span>
                </div>
                <div className="inbox-sheet-sep" />
                <div className="inbox-sheet-item danger" onClick={onDelete}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4h6v2" />
                    </svg>
                    <span>Delete Chat</span>
                </div>
                <div className="inbox-sheet-item danger" onClick={onBlock}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <span>Block {conv?.otherName}</span>
                </div>
            </div>
        </div>
    )
}
