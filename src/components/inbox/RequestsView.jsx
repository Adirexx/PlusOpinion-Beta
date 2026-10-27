/**
 * RequestsView.jsx — Message Requests Container
 * ===============================================
 * Ported from inbox.js req-view HTML + inbox_panel.js request rendering.
 */

import { useRef, useCallback } from 'react'
import { useInbox } from '../../context/InboxContext'
import { useNavigate } from 'react-router-dom'
import usePullToRefresh from '../../hooks/usePullToRefresh'
import PullToRefreshIndicator from '../common/PullToRefreshIndicator'

export default function RequestsView() {
    const {
        requests, showRequests, setShowRequests,
        handleAcceptRequest, handleDeclineRequest,
        DEFAULT_AVATAR, escHtml, closeInbox,
        fetchConversations,
    } = useInbox()
    const navigate = useNavigate()
    const scrollRef = useRef(null)

    const handlePullRefresh = useCallback(async () => {
        if (fetchConversations) {
            await fetchConversations()
        }
    }, [fetchConversations])

    const ptr = usePullToRefresh(scrollRef, handlePullRefresh, {
        disabled: !showRequests,
    })

    const handleProfileClick = (otherId, e) => {
        e.stopPropagation()
        closeInbox()
        navigate(`/profile/${otherId}`)
    }

    return (
        <div id="inbox-requests-view" className={showRequests ? 'open' : ''}>
            <div className="req-view-header">
                <button
                    className="chat-back-btn"
                    onClick={() => setShowRequests(false)}
                >
                    &#8592;
                </button>
                <span className="req-view-title">Message Requests</span>
            </div>
            <div className="relative flex-1 overflow-hidden flex flex-col">
                <PullToRefreshIndicator {...ptr.indicatorProps} />
                <div
                    ref={scrollRef}
                    className={`inbox-body ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
                    style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
                >
                {requests.length === 0 ? (
                    <div className="inbox-empty">
                        <div className="inbox-empty-icon">📬</div>
                        <div className="inbox-empty-title">No new requests</div>
                        <div className="inbox-empty-sub">
                            You don't have any pending message requests right now.
                        </div>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="req-card">
                            <img
                                className="req-card-avatar"
                                src={req.otherAvatar || DEFAULT_AVATAR}
                                alt="Avatar"
                                onClick={(e) => handleProfileClick(req.otherId, e)}
                                style={{ cursor: 'pointer' }}
                                onError={(e) => { e.target.src = DEFAULT_AVATAR }}
                            />
                            <div className="req-card-body">
                                <div 
                                    className="req-card-name" 
                                    onClick={(e) => handleProfileClick(req.otherId, e)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {escHtml(req.otherName)}
                                </div>
                                <div className="req-card-preview">{req.preview || 'Wants to message you'}</div>
                                <div className="req-card-actions">
                                    <button
                                        className="req-btn accept"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleAcceptRequest(req.id)
                                        }}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="req-btn decline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeclineRequest(req.id)
                                        }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                </div>
            </div>
        </div>
    )
}
