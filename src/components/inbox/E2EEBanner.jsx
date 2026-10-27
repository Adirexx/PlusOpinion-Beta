/**
 * E2EEBanner.jsx — E2EE Info Banner at top of chat
 * ===================================================
 * Ported from inbox_panel.js renderE2EEBanner().
 */

export default function E2EEBanner({ otherName }) {
    return (
        <div className="e2ee-banner">
            <div className="e2ee-banner-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Messages are end-to-end encrypted</span>
            </div>
            <div className="e2ee-banner-sub">
                Messages with {otherName || 'this user'} are secured with end-to-end encryption.
                No one outside of this chat, not even PlusOpinion, can read them.
            </div>
            <div className="e2ee-key-warning">
                ⚠️ If you clear browser data, encrypted message history will become unreadable on this device.
            </div>
        </div>
    )
}
