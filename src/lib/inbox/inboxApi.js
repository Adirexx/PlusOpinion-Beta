/**
 * PLUSOPINION INBOX — API Layer
 * ==============================
 * All Supabase calls for the inbox system consolidated into one module.
 * Ported from inbox_panel.js (44 direct window.supabase calls).
 *
 * CHANGES: window.supabase → import { supabase }
 * PRESERVED: All query shapes, filters, ordering, limits, and column selections.
 */

import { supabase } from '../supabaseClient.js'

// ===================================================================
// CONVERSATIONS
// ===================================================================

/**
 * Load all conversations for the current user.
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function loadConversations(userId) {
    return supabase
        .from('conversations')
        .select(`
            id, accepted_by_p1, accepted_by_p2,
            last_message_at, last_message_preview,
            participant_1_id, participant_2_id,
            is_deleted_by_p1, is_deleted_by_p2,
            removed_by_p1, removed_by_p2
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .limit(50);
}

/**
 * Check if a conversation already exists between two users.
 * @param {string} userId
 * @param {string} otherId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function findExistingConversation(userId, otherId) {
    return supabase
        .from('conversations')
        .select('id')
        .or(
            `and(participant_1_id.eq.${userId},participant_2_id.eq.${otherId}),and(participant_1_id.eq.${otherId},participant_2_id.eq.${userId})`
        )
        .maybeSingle();
}

/**
 * Create a new conversation.
 * @param {string} senderId - participant_1
 * @param {string} recipientId - participant_2
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function createConversation(senderId, recipientId) {
    return supabase
        .from('conversations')
        .insert({
            participant_1_id: senderId,
            participant_2_id: recipientId,
            accepted_by_p1: true,
            accepted_by_p2: false
        })
        .select('id').single();
}

/**
 * Update conversation preview text and timestamp.
 * @param {string} convId
 * @param {string} preview
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateConversationPreview(convId, preview) {
    return supabase
        .from('conversations')
        .update({
            last_message_preview: preview,
            last_message_at: new Date().toISOString()
        })
        .eq('id', convId);
}

/**
 * Get a single conversation by ID.
 * @param {string} convId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getConversation(convId) {
    return supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();
}

/**
 * Accept a message request (set accepted_by_p2 = true).
 * @param {string} convId
 * @param {string} userId - must be participant_2
 * @returns {Promise<{error: object|null}>}
 */
export async function acceptRequest(convId, userId) {
    return supabase
        .from('conversations')
        .update({ accepted_by_p2: true })
        .eq('id', convId)
        .eq('participant_2_id', userId);
}

/**
 * Decline a message request (soft delete).
 * @param {string} convId
 * @returns {Promise<{error: object|null}>}
 */
export async function declineRequest(convId) {
    return supabase
        .from('conversations')
        .update({ is_deleted_by_p2: true })
        .eq('id', convId);
}

/**
 * Delete a conversation (soft, per-user).
 * @param {string} convId
 * @param {boolean} isP1 - whether user is participant_1
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteConversation(convId, isP1) {
    const updateObj = isP1 ? { is_deleted_by_p1: true } : { is_deleted_by_p2: true };
    return supabase
        .from('conversations')
        .update(updateObj)
        .eq('id', convId);
}

/**
 * Remove a conversation (soft, per-user).
 * @param {string} convId
 * @param {boolean} isP1
 * @returns {Promise<{error: object|null}>}
 */
export async function removeConversation(convId, isP1) {
    const updateObj = isP1 ? { removed_by_p1: true } : { removed_by_p2: true };
    return supabase
        .from('conversations')
        .update(updateObj)
        .eq('id', convId);
}

/**
 * Re-activate a conversation for the other participant (when sending after they removed).
 * @param {string} convId
 * @param {boolean} isOtherP1 - whether the OTHER user is participant_1
 * @returns {Promise<{error: object|null}>}
 */
export async function reactivateConversation(convId, isOtherP1) {
    const updateObj = isOtherP1
        ? { removed_by_p1: false, is_deleted_by_p1: false, accepted_by_p1: false }
        : { removed_by_p2: false, is_deleted_by_p2: false, accepted_by_p2: false };
    return supabase
        .from('conversations')
        .update(updateObj)
        .eq('id', convId);
}

/**
 * Get participant_1_id for a conversation (used to determine isP1).
 * @param {string} convId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getConversationParticipant1(convId) {
    return supabase
        .from('conversations')
        .select('participant_1_id')
        .eq('id', convId)
        .single();
}

// ===================================================================
// MESSAGES
// ===================================================================

/**
 * Load messages for a conversation (newest first, paginated).
 * @param {string} convId
 * @param {number} limit
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function loadMessages(convId, limit = 30) {
    return supabase
        .from('messages')
        .select('id, sender_id, content, content_iv, message_type, media_url, created_at, read_at')
        .eq('conversation_id', convId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);
}

/**
 * Load older messages (for scroll pagination).
 * @param {string} convId
 * @param {string} beforeTimestamp - created_at of the oldest currently-loaded message
 * @param {number} limit
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function loadOlderMessages(convId, beforeTimestamp, limit = 30) {
    return supabase
        .from('messages')
        .select('id, sender_id, content, content_iv, message_type, media_url, created_at, read_at')
        .eq('conversation_id', convId)
        .is('deleted_at', null)
        .lt('created_at', beforeTimestamp)
        .order('created_at', { ascending: false })
        .limit(limit);
}

/**
 * Send a message (text or image).
 * @param {object} msg - { conversation_id, sender_id, content, content_iv, message_type, media_url? }
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function insertMessage(msg) {
    return supabase.from('messages').insert(msg).select().single();
}

/**
 * Mark messages as read.
 * @param {string[]} messageIds
 * @returns {Promise<{error: object|null}>}
 */
export async function markMessagesRead(messageIds) {
    return supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds);
}

/**
 * Soft-delete a message.
 * @param {string} messageId
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteMessage(messageId) {
    return supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);
}

/**
 * Edit a message (re-encrypt content).
 * @param {string} messageId
 * @param {string} content - encrypted content
 * @param {string} contentIv - encryption IV
 * @returns {Promise<{error: object|null}>}
 */
export async function editMessage(messageId, content, contentIv) {
    return supabase
        .from('messages')
        .update({ content, content_iv: contentIv, is_edited: true })
        .eq('id', messageId);
}

// ===================================================================
// UNREAD COUNTS
// ===================================================================

/**
 * Fetch unread message counts for a set of conversation IDs.
 * @param {string[]} convIds
 * @param {string} userId - current user (exclude own messages)
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchUnreadCounts(convIds, userId) {
    return supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .is('read_at', null)
        .neq('sender_id', userId);
}

/**
 * Get total inbox unread count for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getInboxUnreadCount(userId) {
    try {
        const { data: convs } = await supabase
            .from('conversations')
            .select('id')
            .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`);

        if (!convs || !convs.length) return 0;
        const convIds = convs.map(c => c.id);

        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .is('read_at', null)
            .neq('sender_id', userId);

        if (error) throw error;
        return count || 0;
    } catch (err) {
        console.error('Error fetching inbox unread count:', err);
        return 0;
    }
}

// ===================================================================
// REACTIONS
// ===================================================================

/**
 * Get reactions for a set of message IDs.
 * @param {string[]} messageIds
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchReactions(messageIds) {
    if (!messageIds.length) return { data: [] };
    return supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);
}

/**
 * Check if user has reacted with a specific emoji.
 * @param {string} messageId
 * @param {string} userId
 * @param {string} emoji
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function findReaction(messageId, userId, emoji) {
    return supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();
}

/**
 * Remove a reaction.
 * @param {string} reactionId
 * @returns {Promise<{error: object|null}>}
 */
export async function removeReaction(reactionId) {
    return supabase
        .from('message_reactions')
        .delete()
        .eq('id', reactionId);
}

/**
 * Add a reaction.
 * @param {string} messageId
 * @param {string} userId
 * @param {string} emoji
 * @returns {Promise<{error: object|null}>}
 */
export async function addReaction(messageId, userId, emoji) {
    return supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji });
}

/**
 * Get all reactions for a single message (after toggle).
 * @param {string} messageId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function getMessageReactions(messageId) {
    return supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);
}

// ===================================================================
// BOOKMARKS (MESSAGE-LEVEL)
// ===================================================================

/**
 * Get bookmarked message IDs for a user.
 * @param {string[]} messageIds
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchMessageBookmarks(messageIds, userId) {
    if (!messageIds.length) return { data: [] };
    return supabase
        .from('bookmarks')
        .select('message_id')
        .in('message_id', messageIds)
        .eq('user_id', userId);
}

/**
 * Add a message bookmark.
 * @param {string} messageId
 * @param {string} userId
 * @returns {Promise<{error: object|null}>}
 */
export async function addMessageBookmark(messageId, userId) {
    return supabase
        .from('bookmarks')
        .insert({ message_id: messageId, user_id: userId });
}

/**
 * Remove a message bookmark.
 * @param {string} messageId
 * @param {string} userId
 * @returns {Promise<{error: object|null}>}
 */
export async function removeMessageBookmark(messageId, userId) {
    return supabase
        .from('bookmarks')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);
}

// ===================================================================
// PROFILES
// ===================================================================

/**
 * Batch fetch profiles by IDs.
 * @param {string[]} ids
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchProfiles(ids) {
    return supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', [...new Set(ids)]);
}

/**
 * Fetch a single profile.
 * @param {string} userId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function fetchProfile(userId) {
    return supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', userId)
        .single();
}

/**
 * Discover random people (for search default state).
 * @param {string} excludeUserId
 * @param {number} limit
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function discoverPeople(excludeUserId, limit = 8) {
    return supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', excludeUserId || '')
        .not('username', 'is', 'null')
        .not('avatar_url', 'is', 'null')
        .limit(limit);
}

/**
 * Search users by username or full name.
 * @param {string} query
 * @param {string} excludeUserId
 * @param {number} limit
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function searchUsers(query, excludeUserId, limit = 10) {
    return supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', excludeUserId)
        .limit(limit);
}

// ===================================================================
// BLOCKS
// ===================================================================

/**
 * Check if a block exists between two users (in either direction).
 * @param {string} userId
 * @param {string} otherId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function checkBlock(userId, otherId) {
    return supabase
        .from('profile_blocks')
        .select('id')
        .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${userId})`)
        .maybeSingle();
}

/**
 * Fetch all blocks involving this user (either direction).
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export async function fetchBlocks(userId) {
    return supabase
        .from('profile_blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
}

export async function blockUser(blockerId, blockedId) {
    const { error } = await supabase
        .from('profile_blocks')
        .upsert(
            { blocker_id: blockerId, blocked_id: blockedId },
            { onConflict: 'blocker_id,blocked_id' }
        );

    try {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('po_blocked_ids');
            window.dispatchEvent(new CustomEvent('user_blocks_changed', {
                detail: { action: 'block', targetUserId: String(blockedId) }
            }));
        }
    } catch (e) {}

    return { error };
}

/**
 * Unblock a user.
 * @param {string} blockerId
 * @param {string} blockedId
 * @returns {Promise<{error: object|null}>}
 */
export async function unblockUser(blockerId, blockedId) {
    const { error } = await supabase
        .from('profile_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

    try {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('po_blocked_ids');
            window.dispatchEvent(new CustomEvent('user_blocks_changed', {
                detail: { action: 'unblock', targetUserId: String(blockedId) }
            }));
        }
    } catch (e) {}

    return { error };
}

// ===================================================================
// OPENGRAPH
// ===================================================================

/**
 * Fetch OpenGraph metadata for a URL.
 * @param {string} url
 * @returns {Promise<object|null>}
 */
export async function fetchOpenGraph(url) {
    try {
        const { data, error } = await supabase.functions.invoke('opengraph-proxy', {
            body: { url }
        });
        if (!error && data && !data.error) return data;
        return null;
    } catch (e) {
        console.warn('[Inbox] OG proxy failed:', e);
        return null;
    }
}

// ===================================================================
// REALTIME
// ===================================================================

/**
 * Subscribe to new messages in a conversation, and listen for typing indicators.
 * @param {string} convId
 * @param {function} onMessage - callback with payload.new
 * @param {function} onTyping - callback with payload { userId, isTyping }
 * @returns {object} channel (to unsubscribe later)
 */
export function subscribeToMessages(convId, onMessageInsert, onMessageUpdate, onReactionUpdate, onTyping) {
    return supabase
        .channel(`inbox-msgs-${convId}`)
        .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'messages',
            filter: `conversation_id=eq.${convId}`
        }, onMessageInsert)
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'messages',
            filter: `conversation_id=eq.${convId}`
        }, onMessageUpdate)
        .on('postgres_changes', {
            event: '*', schema: 'public', table: 'message_reactions'
        }, onReactionUpdate)
        .on('broadcast', { event: 'typing' }, (payload) => {
            if (onTyping) onTyping(payload.payload)
        })
        .subscribe();
}

/**
 * Send typing indicator over the active channel.
 * @param {object} channel - active Supabase channel
 * @param {string} userId - sender's user ID
 * @param {boolean} isTyping
 */
export async function sendTypingIndicator(channel, userId, isTyping) {
    if (!channel) return;
    return channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping }
    });
}

/**
 * Subscribe to conversation updates and messages (for live unread tracking and list refresh).
 * @param {string|function} userIdOrOnConvUpdate
 * @param {function} [onConvUpdateOrOnNewMessage]
 * @param {function} [maybeOnNewMessage]
 * @returns {object} channel
 */
export function subscribeGlobalInbox(userIdOrOnConvUpdate, onConvUpdateOrOnNewMessage, maybeOnNewMessage) {
    let userId = null;
    let onConvUpdate;
    let onNewMessage;

    if (typeof userIdOrOnConvUpdate === 'string') {
        userId = userIdOrOnConvUpdate;
        onConvUpdate = onConvUpdateOrOnNewMessage;
        onNewMessage = maybeOnNewMessage;
    } else {
        onConvUpdate = userIdOrOnConvUpdate;
        onNewMessage = onConvUpdateOrOnNewMessage;
    }

    const channelName = userId ? `inbox:global:${userId}` : 'inbox-global-channel';
    return supabase
        .channel(channelName)
        .on('postgres_changes', {
            event: '*', schema: 'public', table: 'conversations'
        }, onConvUpdate)
        .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'messages'
        }, onNewMessage)
        .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'messages'
        }, onNewMessage)
        .subscribe();
}

/**
 * Subscribe to inbox unread count changes.
 * @param {string} userId
 * @param {function} onChange
 * @returns {object} channel
 */
export function subscribeToInboxUnread(userId, onChange) {
    return supabase
        .channel('public:inbox:unread')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=neq.${userId}`
        }, onChange)
        .subscribe();
}

/**
 * Remove a realtime channel.
 * @param {object} channel
 */
export function removeChannel(channel) {
    if (channel) supabase.removeChannel(channel);
}

/**
 * Mark a single message as read (for realtime incoming messages).
 * @param {string} messageId
 * @returns {Promise<{error: object|null}>}
 */
export async function markSingleMessageRead(messageId) {
    return supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
}
