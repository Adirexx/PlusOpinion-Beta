/**
 * SearchOverlay.jsx — Global Search Overlay
 * ============================================
 * Ported from inbox.js and inbox_panel.js search logic.
 * Slides up from bottom, searches convs and global users.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInbox } from '../../context/InboxContext'
import usePullToRefresh from '../../hooks/usePullToRefresh'
import PullToRefreshIndicator from '../common/PullToRefreshIndicator'
import { OrbitLoader } from '../ui/Icons'

export default function SearchOverlay() {
    const {
        showSearch, setShowSearch, searchQuery, setSearchQuery,
        searchResults, searchDefault, loadingSearch,
        runSearch, openChat, startConversation, DEFAULT_AVATAR,
        closeInbox, loadSearchDefault
    } = useInbox()

    const navigate = useNavigate()
    const inputRef = useRef(null)
    const debounceRef = useRef(null)
    const scrollRef = useRef(null)

    const handlePullRefresh = useCallback(async () => {
        if (searchQuery.trim()) {
            await runSearch(searchQuery.trim())
        } else if (loadSearchDefault) {
            await loadSearchDefault()
        }
    }, [searchQuery, runSearch, loadSearchDefault])

    const ptr = usePullToRefresh(scrollRef, handlePullRefresh, {
        disabled: !showSearch,
    })

    // Focus input when opened
    useEffect(() => {
        if (showSearch) {
            setTimeout(() => inputRef.current?.focus(), 350)
        } else {
            setSearchQuery('')
        }
    }, [showSearch, setSearchQuery])

    const handleInput = (e) => {
        const val = e.target.value
        setSearchQuery(val)

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            runSearch(val)
        }, 400)
    }

    const handleClose = () => {
        setShowSearch(false)
        setSearchQuery('')
    }

    const handleConvClick = (conv) => {
        handleClose()
        openChat(conv)
    }

    const handleUserClick = async (userId) => {
        // Optimistic UI for start conversation
        handleClose()
        const convId = await startConversation(userId)
        if (!convId) {
            console.error('[Inbox] Failed to start conversation')
        }
    }

    return (
        <div id="inbox-search-overlay" className={showSearch ? 'open' : ''}>
            <div className="search-overlay-header">
                <div className="search-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        ref={inputRef}
                        className="search-main-input"
                        placeholder="Search messages or people…"
                        value={searchQuery}
                        onChange={handleInput}
                        autoComplete="off"
                    />
                </div>
                <button className="search-cancel-btn" onClick={handleClose}>
                    Cancel
                </button>
            </div>

            <div className="relative flex-1 overflow-hidden flex flex-col">
                <PullToRefreshIndicator {...ptr.indicatorProps} />
                <div
                    ref={scrollRef}
                    className={`search-results ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
                    style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
                >
                {loadingSearch && (
                    <div className="inbox-loader">
                        <div className="inbox-spinner">
                            <OrbitLoader size={28} />
                        </div>
                    </div>
                )}

                {!loadingSearch && searchQuery.trim() === '' && searchDefault && (
                    <div className="search-default-state">
                        {searchDefault.recentConvs.length > 0 && (
                            <div className="search-default-section">
                                <div className="search-section-label">Recent Conversations</div>
                                {searchDefault.recentConvs.map(c => (
                                    <UserRow
                                        key={c.id}
                                        id={c.otherId}
                                        name={c.otherName}
                                        username={c.otherUsername}
                                        avatar={c.otherAvatar}
                                        onClick={() => handleConvClick(c)}
                                        onAvatarClick={(e) => {
                                            e.stopPropagation()
                                            handleClose()
                                            closeInbox()
                                            navigate(`/profile/${c.otherId}`)
                                        }}
                                        defaultAvatar={DEFAULT_AVATAR}
                                    />
                                ))}
                            </div>
                        )}
                        {searchDefault.people.length > 0 && (
                            <div className="search-default-section">
                                <div className="search-section-label">Discover People</div>
                                {searchDefault.people.map(p => (
                                    <UserRow
                                        key={p.id}
                                        id={p.id}
                                        name={p.full_name}
                                        username={p.username}
                                        avatar={p.avatar_url}
                                        onClick={() => handleUserClick(p.id)}
                                        onAvatarClick={(e) => {
                                            e.stopPropagation()
                                            handleClose()
                                            closeInbox()
                                            navigate(`/profile/${p.id}`)
                                        }}
                                        defaultAvatar={DEFAULT_AVATAR}
                                    />
                                ))}
                            </div>
                        )}
                        {searchDefault.recentConvs.length === 0 && searchDefault.people.length === 0 && (
                            <div className="search-default-empty">
                                <div className="search-default-empty-icon">🔍</div>
                                <div>Search for people by username or full name</div>
                            </div>
                        )}
                    </div>
                )}

                {!loadingSearch && searchResults && (
                    <>
                        {searchResults.matchedConvs.length === 0 && searchResults.users.length === 0 && (
                            <div className="search-no-results">
                                No results for "{searchResults.query}"
                            </div>
                        )}

                        {searchResults.matchedConvs.length > 0 && (
                            <div className="search-default-section">
                                <div className="search-section-label">Conversations</div>
                                {searchResults.matchedConvs.map(c => (
                                    <UserRow
                                        key={c.id}
                                        id={c.otherId}
                                        name={c.otherName}
                                        username={c.otherUsername}
                                        avatar={c.otherAvatar}
                                        onClick={() => handleConvClick(c)}
                                        onAvatarClick={(e) => {
                                            e.stopPropagation()
                                            handleClose()
                                            closeInbox()
                                            navigate(`/profile/${c.otherId}`)
                                        }}
                                        defaultAvatar={DEFAULT_AVATAR}
                                    />
                                ))}
                            </div>
                        )}

                        {searchResults.users.length > 0 && (
                            <div className="search-default-section">
                                <div className="search-section-label">Global Users</div>
                                {searchResults.users.map(p => (
                                    <UserRow
                                        key={p.id}
                                        id={p.id}
                                        name={p.full_name}
                                        username={p.username}
                                        avatar={p.avatar_url}
                                        onClick={() => handleUserClick(p.id)}
                                        onAvatarClick={(e) => {
                                            e.stopPropagation()
                                            handleClose()
                                            closeInbox()
                                            navigate(`/profile/${p.id}`)
                                        }}
                                        defaultAvatar={DEFAULT_AVATAR}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
                </div>
            </div>
        </div>
    )
}

function UserRow({ name, username, avatar, onClick, onAvatarClick, defaultAvatar }) {
    return (
        <div className="search-user-row" onClick={onClick}>
            <img
                className="search-user-avatar"
                src={avatar || defaultAvatar}
                alt=""
                onClick={onAvatarClick}
                onError={(e) => { e.target.src = defaultAvatar }}
            />
            <div className="search-user-info">
                <div className="search-user-name">{name || 'Unknown'}</div>
                <div className="search-user-handle">@{username || '???'}</div>
            </div>
        </div>
    )
}
