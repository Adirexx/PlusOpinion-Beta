/**
 * InboxContext.jsx — Global Inbox State & Public API
 * ====================================================
 * Central state management for the entire inbox system.
 * Replaces window._inboxBootPhase1.S, window.openInbox, window.closeInbox,
 * window.sendPostToUser, window.startInboxConversation, etc.
 *
 * Provider nesting in App.jsx: between ActionsProvider and UnreadProvider.
 */

import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'
import * as inboxApi from '../lib/inbox/inboxApi.js'
import * as inboxCrypto from '../lib/inbox/inboxCrypto.js'
import { getCached, setCached } from '../lib/dataCache.js'

const InboxContext = createContext(null)

// ─── HELPERS ─────────────────────────────────────────────────────

function escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractFirstUrl(text) {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
}

// Avatar URL rewriting (same logic as old window.rewriteMediaUrl)
function rewriteMediaUrl(url) {
    if (!url) return url;
    // If URL contains supabase storage path, it's already correct
    return url;
}

const DEFAULT_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='%23090e1a'/%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' stroke='%23326bcb' stroke-width='0.8'/%3E%3Ccircle cx='12' cy='9' r='4' stroke='%23326bcb' stroke-width='0.8'/%3E%3C/svg%3E`;

export function InboxProvider({ children }) {
    const { user } = useAuth()

    // ─── STATE ───────────────────────────────────────────────────
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState('list')           // 'list' | 'chat' | 'search'
    const [conversations, setConversations] = useState([])
    const [requests, setRequests] = useState([])
    const [currentConv, setCurrentConv] = useState(null)
    const [messages, setMessages] = useState([])
    const [reactionsMap, setReactionsMap] = useState({})
    const [bookmarkedSet, setBookmarkedSet] = useState(new Set())
    const [pendingImages, setPendingImages] = useState([])
    const [replyToMsg, setReplyToMsg] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)
    const [searchDefault, setSearchDefault] = useState(null)
    const [loadingConvs, setLoadingConvs] = useState(false)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [loadingSearch, setLoadingSearch] = useState(false)
    const [showRequests, setShowRequests] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showChatMore, setShowChatMore] = useState(false)
    const [showMsgOptions, setShowMsgOptions] = useState(null) // message element data or null
    const [showConvContext, setShowConvContext] = useState(null) // conv data or null
    const [confirmDialog, setConfirmDialog] = useState(null) // { message, onConfirm } or null
    const [typingUsers, setTypingUsers] = useState(new Set())

    // E2EE PIN Recovery State
    const [e2eeState, setE2eeState] = useState('loading') // 'loading' | 'ready' | 'needs_setup' | 'needs_recovery'
    const [e2eeBackup, setE2eeBackup] = useState(null)

    // Pagination state
    const msgAllLoadedRef = useRef(false)
    const msgPageLoadingRef = useRef(false)
    const realtimeChannelRef = useRef(null)
    const globalChannelRef = useRef(null)
    const searchDebounceRef = useRef(null)
    const typingTimeoutRef = useRef({})
    const isOpenRef = useRef(isOpen)
    const viewRef = useRef(view)
    const currentConvRef = useRef(currentConv)

    useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
    useEffect(() => { viewRef.current = view }, [view])
    useEffect(() => { currentConvRef.current = currentConv }, [currentConv])

    // ─── OPEN / CLOSE ────────────────────────────────────────────

    const openInbox = useCallback(() => {
        if (!user) return;
        setIsOpen(true)
        setView('list')
        // Reset all sub-views on fresh open
        setShowSearch(false)
        setShowRequests(false)
        setShowChatMore(false)
        setShowMsgOptions(null)
        setShowConvContext(null)
    }, [user])

    const closeInbox = useCallback(() => {
        setIsOpen(false)
        // Defer state reset so the slide-down animation plays with content
        setTimeout(() => {
            setView('list')
            setCurrentConv(null)
            setMessages([])
            setShowRequests(false)
            setShowSearch(false)
            setShowChatMore(false)
            setShowMsgOptions(null)
            setShowConvContext(null)
            setReplyToMsg(null)
            setPendingImages([])
            setE2eeState('loading') // Reset E2EE on close
            setE2eeBackup(null)
            // Clean up realtime
            if (realtimeChannelRef.current) {
                inboxApi.removeChannel(realtimeChannelRef.current)
                realtimeChannelRef.current = null
            }
        }, 450)
    }, [])

    const toggleInbox = useCallback((open) => {
        if (open === undefined) {
            setIsOpen(prev => !prev)
        } else {
            if (open) openInbox()
            else closeInbox()
        }
    }, [openInbox, closeInbox])

    // ─── LOAD CONVERSATIONS ──────────────────────────────────────

    const fetchConversations = useCallback(async () => {
        if (!user) return

        const uid = user.id
        const cacheKeyConvs = `inbox_convs_${uid}`
        const cacheKeyReqs = `inbox_reqs_${uid}`

        const cachedConvs = getCached(cacheKeyConvs)
        const cachedReqs = getCached(cacheKeyReqs)

        if (cachedConvs) setConversations(cachedConvs)
        if (cachedReqs) setRequests(cachedReqs)

        if (!cachedConvs) setLoadingConvs(true)

        const { data, error } = await inboxApi.loadConversations(uid)

        if (error) {
            console.error('[Inbox] Load convs error:', error)
            setLoadingConvs(false)
            return
        }

        // Gather other-user IDs to batch-fetch profiles
        const otherIds = data.map(c => c.participant_1_id === uid ? c.participant_2_id : c.participant_1_id)

        // Fetch profiles and blocks concurrently
        const [profilesRes, blocksRes] = await Promise.all([
            inboxApi.fetchProfiles(otherIds),
            inboxApi.fetchBlocks(uid)
        ])
        const profiles = profilesRes.data
        const blocks = blocksRes.data || []

        const profileMap = {}
            ; (profiles || []).forEach(p => { profileMap[p.id] = p })

        // Create a set of user IDs that are blocked (either by us or them)
        const blockedUserIds = new Set()
        blocks.forEach(b => {
            if (b.blocker_id === uid) blockedUserIds.add(b.blocked_id)
            if (b.blocked_id === uid) blockedUserIds.add(b.blocker_id)
        })

        const convs = []
        const reqs = []

        data.forEach(c => {
            const isP1 = c.participant_1_id === uid
            const isDeletedByMe = isP1 ? c.is_deleted_by_p1 : c.is_deleted_by_p2
            const isRemovedByMe = isP1 ? c.removed_by_p1 : c.removed_by_p2

            if (isDeletedByMe || isRemovedByMe) return

            const otherId = isP1 ? c.participant_2_id : c.participant_1_id

            // Skip this conversation if the other user is blocked
            if (blockedUserIds.has(otherId)) return

            const p = profileMap[otherId] || {}
            const conv = {
                id: c.id,
                otherId,
                otherName: p.full_name || 'Unknown',
                otherUsername: p.username || '?',
                otherAvatar: rewriteMediaUrl(p.avatar_url),
                preview: c.last_message_preview || '',
                time: c.last_message_at,
                unreadCount: 0,
            }

            const isRecipient = c.participant_2_id === uid
            const weAccepted = isRecipient ? c.accepted_by_p2 : c.accepted_by_p1
            const theyAccepted = isRecipient ? c.accepted_by_p1 : c.accepted_by_p2

            if (isRecipient && !theyAccepted) return
            if (isRecipient && !weAccepted) {
                reqs.push(conv)
            } else {
                convs.push(conv)
            }
        })

        // Fetch unread counts
        const convIds = [...convs, ...reqs].map(c => c.id)
        if (convIds.length > 0) {
            const { data: unreadMsgs } = await inboxApi.fetchUnreadCounts(convIds, uid)
            const unreadCounts = {}
                ; (unreadMsgs || []).forEach(m => {
                    unreadCounts[m.conversation_id] = (unreadCounts[m.conversation_id] || 0) + 1
                })
            convs.forEach(c => c.unreadCount = unreadCounts[c.id] || 0)
            reqs.forEach(c => c.unreadCount = unreadCounts[c.id] || 0)
        }

        // Calculate total unread and dispatch event for UnreadContext
        let totalUnread = 0
        convs.forEach(c => totalUnread += c.unreadCount || 0)
        window.dispatchEvent(new CustomEvent('inbox_unread_changed', { detail: totalUnread }))

        setConversations(convs)
        setRequests(reqs)
        setCached(cacheKeyConvs, convs)
        setCached(cacheKeyReqs, reqs)
        setLoadingConvs(false)

        // Background pre-fetch for ALL recent conversations to ensure instant chat open
        convs.forEach(c => {
            const cacheKeyMsgs = `inbox_msgs_${c.id}`
            if (!getCached(cacheKeyMsgs)) {
                inboxApi.loadMessages(c.id).then(async ({ data }) => {
                    let msgs = (data || []).reverse()

                    const clearedUntil = localStorage.getItem(`cleared_until_${c.id}`)
                    if (clearedUntil) {
                        msgs = msgs.filter(m => new Date(m.created_at) > new Date(clearedUntil))
                    }

                    if (msgs.length > 0) {
                        msgs = await Promise.all(msgs.map(async (msg) => {
                            if (msg.message_type === 'text' && msg.content_iv) {
                                try {
                                    msg.content = await inboxCrypto.decryptFromUser(msg.content, msg.content_iv, uid, c.otherId)
                                    msg.content_iv = null
                                } catch (e) {
                                    msg.content = '{"text":"[Decryption failed]"}'
                                    msg.content_iv = null
                                }
                            }
                            return msg
                        }))
                        setCached(cacheKeyMsgs, msgs)
                    }
                }).catch(e => console.warn('[Inbox] Prefetch error:', e))
            }
        })

    }, [user])

    // ─── LOAD MESSAGES ───────────────────────────────────────────

    const fetchMessages = useCallback(async (convId, otherId) => {
        if (!user) return

        const uid = user.id
        const cacheKeyMsgs = `inbox_msgs_${convId}`
        const cacheKeyReactions = `inbox_reactions_${convId}`
        const cacheKeyBookmarks = `inbox_bookmarks_${convId}`

        const cachedMsgs = getCached(cacheKeyMsgs)
        const cachedReactions = getCached(cacheKeyReactions)
        const cachedBookmarks = getCached(cacheKeyBookmarks)

        if (cachedMsgs) {
            setMessages(cachedMsgs)
            if (cachedReactions) setReactionsMap(cachedReactions)
            if (cachedBookmarks) setBookmarkedSet(new Set(cachedBookmarks))
        } else {
            setLoadingMsgs(true)
        }

        msgAllLoadedRef.current = false
        msgPageLoadingRef.current = false

        const { data, error } = await inboxApi.loadMessages(convId)

        if (error) {
            console.error('[Inbox] Load msgs error:', error)
            setLoadingMsgs(false)
            return
        }

        let msgs = (data || []).reverse()

        const clearedUntil = localStorage.getItem(`cleared_until_${convId}`)
        if (clearedUntil) {
            msgs = msgs.filter(m => new Date(m.created_at) > new Date(clearedUntil))
        }

        if (otherId) {
            msgs = await Promise.all(msgs.map(async (msg) => {
                if (msg.message_type === 'text' && msg.content_iv) {
                    try {
                        msg.content = await inboxCrypto.decryptFromUser(msg.content, msg.content_iv, uid, otherId)
                        msg.content_iv = null
                    } catch (e) {
                        msg.content = '{"text":"[Decryption failed]"}'
                        msg.content_iv = null
                    }
                }
                return msg
            }))
        }

        if (msgs.length < 30) msgAllLoadedRef.current = true

        // Fetch reactions and bookmarks
        const msgIds = msgs.map(m => m.id)
        const [reactionsRes, bookmarksRes] = await Promise.all([
            inboxApi.fetchReactions(msgIds),
            inboxApi.fetchMessageBookmarks(msgIds, uid)
        ])

        const rMap = {}
            ; (reactionsRes.data || []).forEach(r => {
                if (!rMap[r.message_id]) rMap[r.message_id] = []
                rMap[r.message_id].push(r)
            })
        const bSet = new Set((bookmarksRes.data || []).map(b => b.message_id))

        setMessages(msgs)
        setReactionsMap(rMap)
        setBookmarkedSet(bSet)

        setCached(cacheKeyMsgs, msgs)
        setCached(cacheKeyReactions, rMap)
        setCached(cacheKeyBookmarks, Array.from(bSet))

        setLoadingMsgs(false)

        // Mark unread messages as read
        const unreadIds = msgs.filter(m => m.sender_id !== uid && !m.read_at).map(m => m.id)
        if (unreadIds.length > 0) {
            inboxApi.markMessagesRead(unreadIds)
        }

        // Update conversation unread
        setConversations(prev => prev.map(c =>
            c.id === convId ? { ...c, unreadCount: 0 } : c
        ))
    }, [user])

    // ─── LOAD OLDER MESSAGES (PAGINATION) ────────────────────────

    const loadOlderMessages = useCallback(async () => {
        if (!user || !currentConv || msgPageLoadingRef.current || msgAllLoadedRef.current) return
        if (messages.length === 0) return

        msgPageLoadingRef.current = true
        const uid = user.id
        const oldestTimestamp = messages[0].created_at

        const { data } = await inboxApi.loadOlderMessages(currentConv.id, oldestTimestamp)
        let oldMsgs = (data || []).reverse()

        const clearedUntil = localStorage.getItem(`cleared_until_${currentConv.id}`)
        if (clearedUntil) {
            oldMsgs = oldMsgs.filter(m => new Date(m.created_at) > new Date(clearedUntil))
        }

        if (oldMsgs.length > 0) {
            oldMsgs = await Promise.all(oldMsgs.map(async (msg) => {
                if (msg.message_type === 'text' && msg.content_iv) {
                    try {
                        msg.content = await inboxCrypto.decryptFromUser(msg.content, msg.content_iv, uid, currentConv.otherId)
                        msg.content_iv = null
                    } catch (e) {
                        msg.content = '{"text":"[Decryption failed]"}'
                        msg.content_iv = null
                    }
                }
                return msg
            }))
        }

        if (oldMsgs.length < 30) msgAllLoadedRef.current = true
        if (oldMsgs.length === 0) {
            msgPageLoadingRef.current = false
            return
        }

        // Fetch reactions/bookmarks for older messages
        const oldIds = oldMsgs.map(m => m.id)
        const [rRes, bRes] = await Promise.all([
            inboxApi.fetchReactions(oldIds),
            inboxApi.fetchMessageBookmarks(oldIds, uid)
        ])

        const newReactionsMap = { ...reactionsMap }
            ; (rRes.data || []).forEach(r => {
                if (!newReactionsMap[r.message_id]) newReactionsMap[r.message_id] = []
                newReactionsMap[r.message_id].push(r)
            })

        const newBookmarked = new Set(bookmarkedSet)
            ; (bRes.data || []).forEach(b => newBookmarked.add(b.message_id))

        setMessages(prev => {
            const next = [...oldMsgs, ...prev]
            setCached(`inbox_msgs_${currentConv.id}`, next)
            return next
        })
        setReactionsMap(newReactionsMap)
        setCached(`inbox_reactions_${currentConv.id}`, newReactionsMap)
        setBookmarkedSet(newBookmarked)
        setCached(`inbox_bookmarks_${currentConv.id}`, Array.from(newBookmarked))
        msgPageLoadingRef.current = false
    }, [user, currentConv, messages, reactionsMap, bookmarkedSet])

    // ─── SEND MESSAGE ────────────────────────────────────────────

    const sendMessage = useCallback(async (plaintext, imageFiles, extraPayload = {}) => {
        if (!user || !currentConv) return

        const uid = user.id
        const otherId = currentConv.otherId
        const convId = currentConv.id

        // Block check
        const { data: blockData } = await inboxApi.checkBlock(uid, otherId)
        if (blockData) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'You cannot send messages due to a block.', icon: 'Slash', isSuccess: false } }))
            return
        }

        // Re-activate conversation if other user removed or deleted it
        try {
            const { data: convCheck } = await inboxApi.getConversation(convId)
            if (convCheck) {
                const isOtherP1 = convCheck.participant_1_id !== uid
                const otherRemoved = isOtherP1 ? convCheck.removed_by_p1 : convCheck.removed_by_p2
                const otherDeleted = isOtherP1 ? convCheck.is_deleted_by_p1 : convCheck.is_deleted_by_p2
                if (otherRemoved || otherDeleted) {
                    await inboxApi.reactivateConversation(convId, isOtherP1)
                }
            }
        } catch (e) {
            console.warn('[Inbox] Reactivate check error:', e)
        }

        // Handle image files
        let imageSentCount = 0
        if (imageFiles && imageFiles.length > 0) {
            for (const file of imageFiles) {
                try {
                    const compressed = await inboxCrypto.compressImage(file)
                    const path = await inboxCrypto.uploadChatImage(compressed, convId, uid)
                    const signedUrl = await inboxCrypto.getChatImageUrl(path)
                    const { data: insertedMsg, error: insertErr } = await inboxApi.insertMessage({
                        conversation_id: convId,
                        sender_id: uid,
                        content: '[image]',
                        content_iv: null,
                        message_type: 'image',
                        media_url: path
                    })
                    if (insertErr) throw insertErr

                    imageSentCount++
                    // Optimistic UI
                    setMessages(prev => {
                        const next = [...prev, {
                            id: insertedMsg?.id || `optimistic-${Date.now()}-${Math.random()}`,
                            sender_id: uid,
                            content: signedUrl,
                            media_url: signedUrl,
                            message_type: 'image',
                            created_at: new Date().toISOString()
                        }]
                        setCached(`inbox_msgs_${convId}`, next)
                        return next
                    })
                } catch (e) {
                    console.error('[Inbox] Image send error:', e)
                    window.dispatchEvent(new CustomEvent('toast', {
                        detail: { message: 'Image upload failed: ' + (e.message || 'Storage error'), icon: 'AlertTriangle', isSuccess: false }
                    }))
                }
            }
            if (imageSentCount > 0 && !plaintext.trim()) {
                await inboxApi.updateConversationPreview(convId, '📷 Image')
            }
        }

        // Handle text
        if (!plaintext.trim() && Object.keys(extraPayload).length === 0) return

        let ogData = null
        const firstUrl = extractFirstUrl(plaintext)
        if (firstUrl && !extraPayload.og_data) {
            ogData = await inboxApi.fetchOpenGraph(firstUrl)
        }

        const payloadObj = { text: plaintext.trim(), ...extraPayload }
        if (ogData) payloadObj.og_data = ogData
        const payloadStr = JSON.stringify(payloadObj)

        // Optimistic UI
        setMessages(prev => {
            const next = [...prev, {
                id: `optimistic-${Date.now()}-${Math.random()}`,
                sender_id: uid, content: payloadStr,
                content_iv: null, message_type: 'text',
                created_at: new Date().toISOString()
            }]
            setCached(`inbox_msgs_${convId}`, next)
            return next
        })

        // Encrypt
        const { content, content_iv, _unencrypted } = await inboxCrypto.encryptForUser(payloadStr, uid, otherId)

        if (_unencrypted) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Notice: Recipient has not set up encryption keys yet. Sent unencrypted.', icon: 'AlertTriangle', isSuccess: false } }))
        }

        // Preview logic
        let previewText = plaintext.trim()
        if (!previewText && extraPayload.share_post_id) previewText = 'Shared a post'
        else if (!previewText) previewText = 'Sent a message'
        else if (previewText.length > 40) previewText = previewText.substring(0, 40) + '…'

        // Re-activate conversation if other user removed it
        const { data: convCheck } = await inboxApi.getConversation(convId)
        if (convCheck) {
            const isOtherP1 = convCheck.participant_1_id !== uid
            const otherRemoved = isOtherP1 ? convCheck.removed_by_p1 : convCheck.removed_by_p2
            const otherDeleted = isOtherP1 ? convCheck.is_deleted_by_p1 : convCheck.is_deleted_by_p2
            if (otherRemoved || otherDeleted) {
                await inboxApi.reactivateConversation(convId, isOtherP1)
            }
        }

        const { data: newMsg } = await inboxApi.insertMessage({
            conversation_id: convId, sender_id: uid,
            content, content_iv, message_type: 'text'
        })

        if (newMsg) {
            // Replace local optimistic message instantly for the "sent tick"
            setMessages(prev => {
                let next = [...prev]
                const optIndex = next.findIndex(m =>
                    typeof m.id === 'string' &&
                    m.id.startsWith('optimistic-') &&
                    m.message_type === 'text'
                )
                if (optIndex !== -1) {
                    next[optIndex] = { ...newMsg, content: payloadStr, content_iv: null } // Keep local decrypted content
                    setCached(`inbox_msgs_${convId}`, next)
                }
                return next
            })
        }

        await inboxApi.updateConversationPreview(convId, previewText)
    }, [user, currentConv])

    // ─── START CONVERSATION ──────────────────────────────────────

    const startConversation = useCallback(async (otherId) => {
        if (!user) return null
        const uid = user.id

        // Check if conversation already exists
        const { data: existing } = await inboxApi.findExistingConversation(uid, otherId)
        let convId = existing?.id

        if (!convId) {
            const { data: newConv, error } = await inboxApi.createConversation(uid, otherId)
            if (error) { console.error('[Inbox] Create conv error:', error); return null }
            convId = newConv.id
        }

        // Fetch other user profile
        const { data: profile } = await inboxApi.fetchProfile(otherId)

        const conv = {
            id: convId, otherId,
            otherName: profile?.full_name || 'Unknown',
            otherUsername: profile?.username || '?',
            otherAvatar: rewriteMediaUrl(profile?.avatar_url),
        }

        // Ensure inbox is open and show chat
        setIsOpen(true)
        setShowSearch(false)
        openChat(conv)

        // Ensure E2EE keys
        await inboxCrypto.ensureKeys(uid)

        return convId
    }, [user])

    // ─── SEND POST/PROFILE TO USER ───────────────────────────────────────

    const sendPostToUser = useCallback(async (otherId, payloadData) => {
        if (!user) return
        setIsOpen(true)

        const convId = await startConversation(otherId)
        if (convId) {
            const uid = user.id
            const isProfile = payloadData.type === 'profile'

            const payloadObj = isProfile
                ? { share_profile_id: payloadData.id, share_profile_name: payloadData.full_name || payloadData.username }
                : { share_post_id: payloadData.id }

            const payloadStr = JSON.stringify(payloadObj)
            const { content, content_iv } = await inboxCrypto.encryptForUser(payloadStr, uid, otherId)

            const { data } = await inboxApi.insertMessage({
                conversation_id: convId, sender_id: uid,
                content, content_iv, message_type: 'text'
            })

            // If we are currently in this chat, update UI immediately
            if (data && currentConv?.id === convId) {
                setMessages(prev => {
                    const newMsg = { ...data, content: payloadStr, content_iv: null };
                    const next = [...prev, newMsg];
                    setCached(`inbox_msgs_${convId}`, next);
                    return next;
                })
            }

            await inboxApi.updateConversationPreview(convId, isProfile ? 'Shared a profile' : 'Shared a post')
        }
    }, [user, currentConv, startConversation])

    // ─── CHAT VIEW ───────────────────────────────────────────────

    const openChat = useCallback(async (conv) => {
        if (!user) return

        // Phase 7.1C: Block check on conversation open
        const { data: blockData } = await inboxApi.checkBlock(user.id, conv.otherId)
        if (blockData) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'You cannot view or reply to this conversation due to a block.', icon: 'Slash', isSuccess: false } }))
            return
        }

        // CRITICAL: Close search/requests before opening chat
        setShowSearch(false)
        setShowRequests(false)
        setShowChatMore(false)
        setShowMsgOptions(null)
        setShowConvContext(null)

        setCurrentConv(conv)
        setView('chat')
        setReplyToMsg(null)
        setPendingImages([])
        fetchMessages(conv.id, conv.otherId)

        // Subscribe to realtime messages and typing indicators
        if (realtimeChannelRef.current) {
            inboxApi.removeChannel(realtimeChannelRef.current)
        }

        const onMessage = async (payload) => {
            const msg = payload.new
            if (msg.sender_id === user?.id) return // Don't duplicate own optimistic messages

            // Decrypt if needed
            if (msg.message_type === 'text' && msg.content_iv) {
                msg.content = await inboxCrypto.decryptFromUser(
                    msg.content, msg.content_iv, user.id, conv.otherId
                )
                msg.content_iv = null
            }
            if (msg.message_type === 'image' && msg.media_url) {
                msg.content = await inboxCrypto.getChatImageUrl(msg.media_url)
            }

            setMessages(prev => {
                const next = [...prev, msg]
                setCached(`inbox_msgs_${conv.id}`, next)
                return next
            })

            // Auto-clear typing when a message is received
            setTypingUsers(prev => {
                const next = new Set(prev)
                next.delete(msg.sender_id)
                return next
            })

            // Mark as read immediately
            inboxApi.markSingleMessageRead(msg.id)
        }

        const onMessageUpdate = async (payload) => {
            let updatedMsg = payload.new

            // If it has new encrypted content, decrypt it
            if (updatedMsg.message_type === 'text' && updatedMsg.content_iv) {
                try {
                    updatedMsg.content = await inboxCrypto.decryptFromUser(
                        updatedMsg.content, updatedMsg.content_iv, user.id, conv.otherId
                    )
                    updatedMsg.content_iv = null
                } catch (e) {
                    updatedMsg.content = '{"text":"[Decryption failed]"}'
                    updatedMsg.content_iv = null
                }
            }

            setMessages(prev => {
                const idx = prev.findIndex(m => m.id === updatedMsg.id)
                if (idx === -1) return prev

                // If message was soft-deleted by sender, remove it from view instantly
                if (updatedMsg.deleted_at) {
                    const next = prev.filter(m => m.id !== updatedMsg.id)
                    setCached(`inbox_msgs_${conv.id}`, next)
                    return next
                }

                const currentMsg = prev[idx]
                const next = [...prev]

                next[idx] = {
                    ...currentMsg,
                    ...updatedMsg,
                    content: updatedMsg.content,
                    content_iv: updatedMsg.content_iv
                }

                setCached(`inbox_msgs_${conv.id}`, next)
                return next
            })
        }

        const onReactionUpdate = (payload) => {
            const reaction = payload.new || payload.old
            if (!reaction) return

            if (payload.eventType === 'INSERT') {
                setReactionsMap(prev => {
                    const existing = prev[reaction.message_id] || []
                    if (existing.some(r => r.id === reaction.id)) return prev
                    const next = { ...prev, [reaction.message_id]: [...existing, reaction] }
                    setCached(`inbox_reactions_${conv.id}`, next)
                    return next
                })
            } else if (payload.eventType === 'DELETE') {
                setReactionsMap(prev => {
                    const existing = prev[reaction.message_id] || []
                    const filtered = existing.filter(r => r.id !== reaction.id)
                    const next = { ...prev, [reaction.message_id]: filtered }
                    setCached(`inbox_reactions_${conv.id}`, next)
                    return next
                })
            }
        }

        const onTyping = ({ userId, isTyping }) => {
            if (userId === user?.id) return
            setTypingUsers(prev => {
                const next = new Set(prev)
                if (isTyping) next.add(userId)
                else next.delete(userId)
                return next
            })

            // Auto-clear after 5 seconds if we miss a false event
            if (isTyping) {
                clearTimeout(typingTimeoutRef.current[userId])
                typingTimeoutRef.current[userId] = setTimeout(() => {
                    setTypingUsers(prev => {
                        const next = new Set(prev)
                        next.delete(userId)
                        return next
                    })
                }, 5000)
            }
        }

        realtimeChannelRef.current = inboxApi.subscribeToMessages(
            conv.id,
            onMessage,
            onMessageUpdate,
            onReactionUpdate,
            onTyping
        )
    }, [user, fetchMessages])

    const closeChat = useCallback(() => {
        setView('list')
        setCurrentConv(null)
        setMessages([])
        setReactionsMap({})
        setBookmarkedSet(new Set())
        setReplyToMsg(null)
        setPendingImages([])
        setTypingUsers(new Set())

        // Clear any timeouts
        Object.values(typingTimeoutRef.current).forEach(clearTimeout)
        typingTimeoutRef.current = {}

        if (realtimeChannelRef.current) {
            inboxApi.removeChannel(realtimeChannelRef.current)
            realtimeChannelRef.current = null
        }
    }, [])

    // ─── REQUESTS ────────────────────────────────────────────────

    const handleAcceptRequest = useCallback(async (convId) => {
        if (!user) return
        const { error } = await inboxApi.acceptRequest(convId, user.id)
        if (!error) {
            setRequests(prev => prev.filter(r => r.id !== convId))
            fetchConversations()
            setShowRequests(false)
        }
    }, [user, fetchConversations])

    const handleDeclineRequest = useCallback(async (convId) => {
        await inboxApi.declineRequest(convId)
        setRequests(prev => prev.filter(r => r.id !== convId))
    }, [])

    // ─── CONVERSATION ACTIONS ────────────────────────────────────

    const handleDeleteConv = useCallback(async (convId) => {
        if (!user) return

        const now = new Date().toISOString()
        localStorage.setItem(`cleared_until_${convId}`, now)
        await inboxApi.updateConversationPreview(convId, '')

        if (currentConv?.id === convId) {
            setMessages([])
        }

        setCached(`inbox_msgs_${convId}`, [])

        setConversations(prev => {
            const next = prev.map(c => c.id === convId ? { ...c, preview: '' } : c)
            setCached(`inbox_convs_${user.id}`, next)
            return next
        })
        closeChat()
    }, [user, currentConv, closeChat])

    const handleRemoveConv = useCallback(async (convId) => {
        if (!user) return
        const { data: conv } = await inboxApi.getConversationParticipant1(convId)
        if (!conv) return
        const isP1 = conv.participant_1_id === user.id
        await inboxApi.removeConversation(convId, isP1)
        setConversations(prev => {
            const next = prev.filter(c => c.id !== convId)
            setCached(`inbox_convs_${user.id}`, next)
            return next
        })
        closeChat()
    }, [user, closeChat])

    const handleBlockUser = useCallback(async (blockedId, convId) => {
        if (!user) return
        await inboxApi.blockUser(user.id, blockedId)

        // Instantly remove from local lists
        if (convId) {
            setConversations(prev => {
                const next = prev.filter(c => c.id !== convId)
                setCached(`inbox_convs_${user.id}`, next)
                return next
            })
            setRequests(prev => {
                const next = prev.filter(c => c.id !== convId)
                setCached(`inbox_reqs_${user.id}`, next)
                return next
            })
        }

        closeChat()
    }, [user, closeChat])

    // ─── MESSAGE ACTIONS ─────────────────────────────────────────

    const handleToggleReaction = useCallback(async (msgId, emoji) => {
        if (!user) return
        const uid = user.id

        // Optimistic UI Update
        setReactionsMap(prev => {
            const existingForMsg = prev[msgId] || []
            const hasReaction = existingForMsg.find(r => r.user_id === uid && r.emoji === emoji)
            let nextForMsg;
            if (hasReaction) {
                nextForMsg = existingForMsg.filter(r => r.id !== hasReaction.id)
            } else {
                nextForMsg = [...existingForMsg, {
                    id: `temp-${Date.now()}`, message_id: msgId, user_id: uid, emoji, created_at: new Date().toISOString()
                }]
            }
            const next = { ...prev, [msgId]: nextForMsg }
            if (currentConv) setCached(`inbox_reactions_${currentConv.id}`, next)
            return next
        })

        const { data: existing } = await inboxApi.findReaction(msgId, uid, emoji)
        if (existing) {
            await inboxApi.removeReaction(existing.id)
        } else {
            await inboxApi.addReaction(msgId, uid, emoji)
        }

        // Re-fetch reactions to confirm true state
        const { data: allReactions } = await inboxApi.getMessageReactions(msgId)
        setReactionsMap(prev => {
            const next = { ...prev, [msgId]: allReactions || [] }
            if (currentConv) setCached(`inbox_reactions_${currentConv.id}`, next)
            return next
        })
    }, [user, currentConv])

    const handleToggleBookmark = useCallback(async (msgId, isCurrentlyBookmarked) => {
        if (!user) return
        const uid = user.id

        if (isCurrentlyBookmarked) {
            await inboxApi.removeMessageBookmark(msgId, uid)
            setBookmarkedSet(prev => {
                const next = new Set(prev)
                next.delete(msgId)
                if (currentConv) setCached(`inbox_bookmarks_${currentConv.id}`, Array.from(next))
                return next
            })
        } else {
            await inboxApi.addMessageBookmark(msgId, uid)
            setBookmarkedSet(prev => {
                const next = new Set(prev).add(msgId)
                if (currentConv) setCached(`inbox_bookmarks_${currentConv.id}`, Array.from(next))
                return next
            })
        }
    }, [user, currentConv])

    const handleDeleteMessage = useCallback(async (msgId) => {
        if (!currentConv) return

        // Optimistic UI update
        setMessages(prev => {
            const next = prev.filter(m => m.id !== msgId)
            setCached(`inbox_msgs_${currentConv.id}`, next)
            return next
        })

        await inboxApi.deleteMessage(msgId)
    }, [currentConv])

    const handleEditMessage = useCallback(async (msgId, newText) => {
        if (!user || !currentConv) return

        // Optimistic UI Update first
        setMessages(prev => {
            const next = prev.map(m =>
                m.id === msgId ? { ...m, content: JSON.stringify({ text: newText }), content_iv: null, is_edited: true } : m
            )
            setCached(`inbox_msgs_${currentConv.id}`, next)
            return next
        })

        const { content, content_iv } = await inboxCrypto.encryptForUser(
            JSON.stringify({ text: newText }), user.id, currentConv.otherId
        )
        await inboxApi.editMessage(msgId, content, content_iv)
    }, [user, currentConv])

    // ─── SEARCH ──────────────────────────────────────────────────

    const loadSearchDefault = useCallback(async () => {
        if (!user) return

        const cacheKey = `inbox_search_default_${user.id}`
        const cached = getCached(cacheKey)
        if (cached) {
            setSearchDefault(cached)
        } else {
            setLoadingSearch(true)
        }

        const recentConvs = conversations.slice(0, 5)
        const { data: people } = await inboxApi.discoverPeople(user.id)

        const result = { recentConvs, people: people || [] }
        setSearchDefault(result)
        setCached(cacheKey, result)
        setLoadingSearch(false)
    }, [user, conversations])

    const runSearch = useCallback(async (q) => {
        if (!user || !q.trim()) {
            setSearchResults(null)
            return
        }
        setLoadingSearch(true)
        const lq = q.toLowerCase()

        // Filter existing conversations
        const matchedConvs = [...conversations, ...requests].filter(c =>
            c.otherName.toLowerCase().includes(lq) ||
            c.otherUsername.toLowerCase().includes(lq) ||
            (c.preview || '').toLowerCase().includes(lq)
        )

        // Search global users
        const { data: users } = await inboxApi.searchUsers(q, user.id)

        setSearchResults({
            matchedConvs,
            users: users || [],
            query: q
        })
        setLoadingSearch(false)
    }, [user, conversations, requests])

    // ─── INITIAL HYDRATION & SYNC ON AUTH ────────────────────────
    useEffect(() => {
        if (!user) {
            setConversations([])
            setRequests([])
            return
        }

        const uid = user.id
        const cachedConvs = getCached(`inbox_convs_${uid}`)
        const cachedReqs = getCached(`inbox_reqs_${uid}`)
        if (cachedConvs && Array.isArray(cachedConvs)) setConversations(cachedConvs)
        if (cachedReqs && Array.isArray(cachedReqs)) setRequests(cachedReqs)

        fetchConversations()
    }, [user?.id, fetchConversations])

    // ─── REALTIME: GLOBAL INBOX ──────────────────────────────────

    useEffect(() => {
        if (!user) return

        // Ensure E2EE keys on mount
        inboxCrypto.ensureKeys(user.id).catch(console.warn)

        const handleNewMessage = (payload) => {
            const newMsg = payload?.new
            if (!newMsg) {
                fetchConversations()
                return
            }

            // If incoming message from another user:
            if (newMsg.sender_id !== user.id) {
                // If not currently chatting in this exact conversation, optimistically bump unread immediately
                const isCurrentChat = isOpenRef.current && viewRef.current === 'chat' && currentConvRef.current?.id === newMsg.conversation_id
                if (!isCurrentChat) {
                    setConversations(prev => {
                        const exists = prev.some(c => c.id === newMsg.conversation_id)
                        if (!exists) return prev // fetchConversations will add the new conversation
                        return prev.map(c => {
                            if (c.id === newMsg.conversation_id) {
                                return {
                                    ...c,
                                    unreadCount: (c.unreadCount || 0) + 1,
                                    time: newMsg.created_at || new Date().toISOString()
                                }
                            }
                            return c
                        })
                    })
                }
            }

            // Always trigger background sync to fetch exact counts and preview
            fetchConversations()
        }

        const handleConvChange = () => {
            fetchConversations()
        }

        // Subscribe to global inbox changes scoped to current user
        globalChannelRef.current = inboxApi.subscribeGlobalInbox(
            user.id,
            handleConvChange,
            handleNewMessage
        )

        return () => {
            if (globalChannelRef.current) {
                inboxApi.removeChannel(globalChannelRef.current)
                globalChannelRef.current = null
            }
        }
    }, [user?.id, fetchConversations])

    // Listen for global block/unblock events to keep conversations strictly clean
    useEffect(() => {
        const onBlocksChanged = () => {
            fetchConversations()
        }
        window.addEventListener('user_blocks_changed', onBlocksChanged)
        return () => window.removeEventListener('user_blocks_changed', onBlocksChanged)
    }, [fetchConversations])

    // ─── INITIALIZATION (E2EE + Convs) ───────────────────────────

    useEffect(() => {
        if (!isOpen || !user) return

        let mounted = true

        async function initInbox() {
            setE2eeState('loading')

            if (inboxCrypto.hasLocalKey(user.id)) {
                if (mounted) {
                    setE2eeState('ready')
                    fetchConversations()
                }
                return
            }

            const backup = await inboxCrypto.checkCloudBackup(user.id)
            if (!mounted) return

            if (backup.hasBackup) {
                setE2eeBackup(backup)
                setE2eeState('needs_recovery')
            } else {
                setE2eeState('needs_setup')
            }
        }

        initInbox()

        return () => { mounted = false }
    }, [isOpen, user, fetchConversations])

    // ─── DERIVED UNREAD INBOX COUNT ───────────────────────────────
    const unreadInboxCount = useMemo(
        () => (conversations || []).filter(c => (c.unreadCount || 0) > 0).length,
        [conversations]
    )

    // ─── VALUE ───────────────────────────────────────────────────

    const value = {
        // State
        isOpen,
        view,
        conversations,
        unreadInboxCount,
        requests,
        currentConv,
        messages,
        reactionsMap,
        bookmarkedSet,
        pendingImages,
        replyToMsg,
        searchQuery,
        searchResults,
        searchDefault,
        loadingConvs,
        loadingMsgs,
        loadingSearch,
        showRequests,
        showSearch,
        showChatMore,
        showMsgOptions,
        showConvContext,
        msgAllLoaded: msgAllLoadedRef.current,

        // Constants
        DEFAULT_AVATAR,

        // Panel actions
        openInbox,
        closeInbox,
        toggleInbox,
        fetchConversations,

        // Chat actions
        openChat,
        closeChat,
        fetchMessages,
        loadOlderMessages,
        sendMessage,
        startConversation,
        sendPostToUser,
        sendTypingEvent: (isTyping) => {
            if (realtimeChannelRef.current && user) {
                inboxApi.sendTypingIndicator(realtimeChannelRef.current, user.id, isTyping)
            }
        },
        typingUsers,

        // Request actions
        handleAcceptRequest,
        handleDeclineRequest,
        setShowRequests,

        // Conversation actions
        handleDeleteConv,
        handleRemoveConv,
        handleBlockUser,
        confirmDialog,
        setConfirmDialog,

        // Message actions
        handleToggleReaction,
        handleToggleBookmark,
        handleDeleteMessage,
        handleEditMessage,

        // Reply
        setReplyToMsg,

        // Images
        setPendingImages,

        // Search
        setShowSearch,
        loadSearchDefault,
        runSearch,
        setSearchQuery,

        // Bottom sheets
        setShowChatMore,
        setShowMsgOptions,
        setShowConvContext,

        // E2EE
        e2eeState,
        setE2eeState,
        e2eeBackup,
        setE2eeBackup,

        // Helpers
        escHtml,
        rewriteMediaUrl,
    }

    return (
        <InboxContext.Provider value={value}>
            {children}
        </InboxContext.Provider>
    )
}

export function useInbox() {
    const ctx = useContext(InboxContext)
    if (!ctx) throw new Error('useInbox must be used inside InboxProvider')
    return ctx
}
