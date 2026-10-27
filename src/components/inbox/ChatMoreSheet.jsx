/**
 * ChatMoreSheet.jsx — Chat Header Options Sheet
 * ===============================================
 */

import { useInbox } from '../../context/InboxContext'

export default function ChatMoreSheet() {
    const {
        currentConv, setShowChatMore,
        handleRemoveConv, handleDeleteConv, handleBlockUser,
        setConfirmDialog
    } = useInbox()

    const close = () => setShowChatMore(false)

    const onRemove = () => {
        if (!currentConv) return
        setConfirmDialog({
            message: `Remove ${currentConv.otherName}? They can still message you later.`,
            confirmText: 'Remove',
            isDanger: false,
            onConfirm: () => {
                handleRemoveConv(currentConv.id)
                close()
            }
        })
    }

    const onDelete = () => {
        if (!currentConv) return
        setConfirmDialog({
            message: `Delete chat with ${currentConv.otherName}? This cannot be undone.`,
            confirmText: 'Delete Chat',
            isDanger: true,
            onConfirm: () => {
                handleDeleteConv(currentConv.id)
                close()
            }
        })
    }

    const onBlock = () => {
        if (!currentConv) return
        setConfirmDialog({
            message: `Block ${currentConv.otherName}? They won't be able to message you.`,
            confirmText: 'Block User',
            isDanger: true,
            onConfirm: () => {
                handleBlockUser(currentConv.otherId, currentConv.id)
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
                    <span>Remove {currentConv?.otherName}</span>
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
                    <span>Block {currentConv?.otherName}</span>
                </div>
            </div>
        </div>
    )
}
