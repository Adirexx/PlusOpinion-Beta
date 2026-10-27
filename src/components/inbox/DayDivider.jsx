/**
 * DayDivider.jsx — Day separator in chat
 * Ported from inbox_panel.js day divider rendering.
 */

export default function DayDivider({ date }) {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()

    let label
    if (isToday) label = 'Today'
    else if (isYesterday) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    return (
        <div className="chat-day-divider">
            <div className="chat-day-divider-line" />
            <span className="chat-day-divider-label">{label}</span>
            <div className="chat-day-divider-line" />
        </div>
    )
}
