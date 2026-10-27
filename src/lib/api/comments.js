/**
 * comments.js — Comments API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { getPost } from './posts.js'
import { createNotification } from './notifications.js'
import { getBlockedUserIds } from './moderation.js'

// ============================================
// NOTIFICATION HELPERS (local to this module)
// ============================================

/**
 * Notify post author when someone comments on their post
 */
async function notifyPostCommented(postId, actorId, commentText) {
    try {
        const post = await getPost(postId);
        if (!post || post.user_id === actorId) return; // Don't notify self

        const { data: actor } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', actorId)
            .maybeSingle();
        if (!actor) return;

        const productName = post.product_name || post.item_name || 'your post';

        await createNotification({
            user_id: post.user_id,
            type: 'post_commented',
            title: 'New Comment',
            message: `${actor.full_name || actor.username || 'Someone'} commented on your review of '${productName}'`,
            related_post_id: postId,
            related_user_id: actorId,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_avatar: actor.avatar_url,
                actor_id: actorId,
                comment_preview: commentText?.substring(0, 100),
                post_preview: post.text_content?.substring(0, 100),
                product_name: productName,
                brand_name: post.brand_name,
                category: post.category,
                post_media: post.media_url,
                post_media_type: post.media_type
            },
            action_url: `/?post=${postId}&section=comments`,
            icon: 'MessageCircle',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('notifyPostCommented failed:', err);
    }
}

/**
 * Notify comment author when someone likes their comment
 */
async function notifyCommentLiked(commentId, actorId) {
    try {
        const { data: comment } = await supabase
            .from('comments')
            .select('user_id, post_id, text_content')
            .eq('id', commentId)
            .maybeSingle();

        if (!comment || comment.user_id === actorId) return;

        const post = await getPost(comment.post_id);
        const productName = post?.product_name || post?.item_name || 'your post';

        const { data: actor } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', actorId)
            .maybeSingle();
        if (!actor) return;

        await createNotification({
            user_id: comment.user_id,
            type: 'comment_liked',
            title: 'Comment Liked',
            message: `${actor.full_name || actor.username || 'Someone'} liked your comment on '${productName}'`,
            related_post_id: comment.post_id,
            related_user_id: actorId,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_avatar: actor.avatar_url,
                comment_id: commentId,
                comment_preview: comment.text_content?.substring(0, 80),
                product_name: productName
            },
            action_url: `/?post=${comment.post_id}&section=comments&comment=${commentId}`,
            icon: 'Heart',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('notifyCommentLiked failed:', err);
    }
}

export async function getComments(postId) {
    const { data, error } = await supabase
        .from('comments')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score
      ),
      likes:comment_likes(count)
    `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

    if (error) throw error;

    const blockedIds = new Set(await getBlockedUserIds().catch(() => []));
    const validData = blockedIds.size > 0
        ? (data || []).filter(c => !blockedIds.has(String(c.user_id)))
        : (data || []);

    // Build threaded structure: top-level comments with nested replies
    const topLevel = [];
    const repliesMap = {};

    validData.forEach(c => {
        if (!c.parent_comment_id) {
            topLevel.push({ ...c, replies: [] });
        } else {
            if (!repliesMap[c.parent_comment_id]) repliesMap[c.parent_comment_id] = [];
            repliesMap[c.parent_comment_id].push(c);
        }
    });

    // Attach replies to their parent
    topLevel.forEach(c => {
        c.replies = repliesMap[c.id] || [];
    });

    return topLevel;
};

/**
 * Create a top-level comment on a post
 */



export async function createComment(postId, text) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to comment');

    const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: user.id,
            text_content: text
        })
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score
      ),
      likes:comment_likes(count)
    `)
        .single();

    if (error) throw error;

    // Trigger notification for post author
    if (data) {
        notifyPostCommented(postId, user.id, text).catch(err =>
            console.error('Failed to send comment notification:', err)
        );
    }

    // Fire mention notifications for @tagged users in text
    _fireMentionNotifications(user.id, postId, text);

    return { ...data, replies: [] };
};

/**
 * Create a reply to an existing comment
 */



export async function createReply(postId, parentCommentId, text) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to reply');

    const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: user.id,
            text_content: text,
            parent_comment_id: parentCommentId
        })
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score
      ),
      likes:comment_likes(count)
    `)
        .single();

    if (error) throw error;

    // Notify the original commenter (if not replying to yourself)
    if (data) {
        try {
            // Get parent comment author — use maybeSingle to avoid 406 if not found
            const { data: parentComment } = await supabase
                .from('comments')
                .select('user_id')
                .eq('id', parentCommentId)
                .maybeSingle();

            if (parentComment && parentComment.user_id !== user.id) {
                notifyCommentReplied(parentCommentId, parentComment.user_id, user.id, postId, text)
                    .catch(err => console.error('Reply notification failed:', err));
            }
        } catch (e) {
            // Non-critical — skip notification silently
        }

        // Also notify post author
        notifyPostCommented(postId, user.id, text, true).catch(() => { });
    }

    // Fire mention notifications
    _fireMentionNotifications(user.id, postId, text);

    return data;
};

/**
 * Search users by username prefix for @mention autocomplete
 */



export async function searchUsersForMention(query) {
    if (!query || query.length < 1) return [];
    const cleanQuery = query.replace(/^@/, '').trim().toLowerCase();
    if (!cleanQuery) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, rqs_score')
        .or(`username.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`)
        .limit(16);

    if (error) return [];
    if (!data || data.length === 0) return [];

    // Rank: exact/prefix match on username or full_name first, then words in full_name, then partials
    const ranked = data.map(profile => {
        const uLow = (profile.username || '').toLowerCase();
        const nLow = (profile.full_name || '').toLowerCase();
        let rank = 7;
        if (uLow === cleanQuery || nLow === cleanQuery) rank = 1;
        else if (uLow.startsWith(cleanQuery)) rank = 2;
        else if (nLow.startsWith(cleanQuery)) rank = 3;
        else if (nLow.split(/\s+/).some(part => part.startsWith(cleanQuery))) rank = 4;
        else if (uLow.includes(cleanQuery)) rank = 5;
        else if (nLow.includes(cleanQuery)) rank = 6;
        return { ...profile, _rank: rank };
    });
    ranked.sort((a, b) => a._rank !== b._rank ? a._rank - b._rank : (b.rqs_score || 0) - (a.rqs_score || 0));
    return ranked.slice(0, 8).map(({ _rank, ...p }) => p);
};


/**
 * Send notification when a comment reply is posted
 * Uses the existing send_notification SECURITY DEFINER RPC to bypass client-side RLS
 */



export async function notifyCommentReplied(commentId, recipientId, actorId, postId, replyText) {
    try {
        const { data: actor } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', actorId)
            .maybeSingle();

        if (!actor) return;

        // Fetch the parent comment text so recipient has context
        const { data: parentComment } = await supabase
            .from('comments')
            .select('text_content')
            .eq('id', commentId)
            .maybeSingle();

        const parentPreview = parentComment?.text_content?.substring(0, 80);
        const replyPreview = replyText?.substring(0, 80);

        // Use SECURITY DEFINER RPC so we can insert for another user (bypasses RLS)
        await supabase.rpc('send_notification', {
            user_id: recipientId,
            type: 'comment_replied',
            title: 'New Reply',
            message: `@${actor.username} replied to your comment`,
            related_post_id: postId,
            related_user_id: actorId,
            icon: 'MessageCircle',
            category: 'social',
            priority: 'normal',
            action_url: `/?post=${postId}&section=comments&comment=${commentId}`,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_username: actor.username,
                actor_avatar: actor.avatar_url,
                comment_preview: parentPreview,   // the comment that was replied to
                reply_text: replyPreview,          // the reply text itself
                comment_id: commentId
            }
        });
    } catch (e) {
        console.error('notifyCommentReplied failed', e);
    }
};


/**
 * Send notification when a user is @mentioned
 * Uses the existing send_notification SECURITY DEFINER RPC to bypass client-side RLS
 */



export async function notifyMentioned(mentionedUserId, actorId, postId, text) {
    try {
        if (mentionedUserId === actorId) return; // Don't notify yourself

        const { data: actor } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', actorId)
            .maybeSingle();

        if (!actor) return;

        // Fetch the post context so recipient knows which post it relates to
        const { data: post } = await supabase
            .from('posts')
            .select('text_content, product_name, item_name, category')
            .eq('id', postId)
            .maybeSingle();

        const postContext = post?.product_name || post?.item_name || '';
        const postPreview = post?.text_content?.substring(0, 80);
        const mentionSnippet = text?.substring(0, 100);

        // Use SECURITY DEFINER RPC so we can insert for another user (bypasses RLS)
        await supabase.rpc('send_notification', {
            user_id: mentionedUserId,
            type: 'mention',           // matches the panel's type handler
            title: 'New Mention',
            message: `@${actor.username} mentioned you in a comment`,
            related_post_id: postId,
            related_user_id: actorId,
            icon: 'AtSign',
            category: 'social',
            priority: 'normal',
            action_url: `/?post=${postId}&section=comments`,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_username: actor.username,
                actor_avatar: actor.avatar_url,
                comment_text: mentionSnippet,      // the comment containing the mention
                post_preview: postPreview,          // the post the comment is on
                product_name: postContext,          // product/item name for context
                category: post?.category
            }
        });
    } catch (e) {
        console.error('notifyMentioned failed', e);
    }
};


/**
 * Internal: Parse @mentions from text and fire notifications
 */



export async function _fireMentionNotifications(actorId, postId, text) {
    try {
        const mentionRegex = /@([a-zA-Z0-9_\.]+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[1].toLowerCase());
        }
        if (mentions.length === 0) return;

        // Deduplicate
        const uniqueMentions = [...new Set(mentions)];

        // Look up each username
        const { data: users } = await supabase
            .from('profiles')
            .select('id, username')
            .in('username', uniqueMentions);

        if (!users) return;

        for (const u of users) {
            notifyMentioned(u.id, actorId, postId, text).catch(() => { });
        }
    } catch (e) {
        console.error('_fireMentionNotifications failed', e);
    }
};

/**
 * Delete a comment
 */



export async function deleteComment(commentId) {
    try {
        const { data, error } = await supabase.rpc('delete_comment', {
            p_comment_id: commentId
        });
        if (!error && data?.success) return data;
    } catch (rpcErr) {
        console.warn('RPC delete_comment failed, falling back:', rpcErr);
    }

    const { data: comment, error } = await supabase
        .from('comments')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select('post_id')
        .single();

    if (error) throw error;
    return comment;
}

/**
 * Restore a deleted comment (Undo)
 */
export async function restoreComment(commentId) {
    try {
        const { data, error } = await supabase.rpc('restore_comment', {
            p_comment_id: commentId
        });
        if (!error && data?.success) return data;
    } catch (rpcErr) {
        console.warn('RPC restore_comment failed, falling back:', rpcErr);
    }

    const { data: comment, error } = await supabase
        .from('comments')
        .update({
            is_deleted: false,
            deleted_at: null
        })
        .eq('id', commentId)
        .select('post_id')
        .single();

    if (error) throw error;
    return comment;
}


/**
 * Like a comment
 */



export async function likeComment(commentId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
        .from('comment_likes')
        .insert({
            comment_id: commentId,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            // Already liked, ignore
            return null;
        }
        throw error;
    }

    // Trigger notification for comment author
    if (data) {
        notifyCommentLiked(commentId, user.id).catch(err =>
            console.error('Failed to send comment like notification:', err)
        );
    }

    return data;
};

/**
 * Unlike a comment
 */



export async function unlikeComment(commentId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
        .from('comment_likes')
        .delete()
        .match({ comment_id: commentId, user_id: user.id });

    if (error) throw error;
};

/**
 * Check if user liked a comment
 */



export async function hasLikedComment(commentId) {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .match({ comment_id: commentId, user_id: user.id })
        .maybeSingle();

    if (error) throw error;
    return !!data;
};

if (typeof window !== 'undefined') {
    window.deleteComment = deleteComment;
    window.restoreComment = restoreComment;
    window.getComments = getComments;
    window.createComment = createComment;
    window.createReply = createReply;
    window.likeComment = likeComment;
    window.unlikeComment = unlikeComment;
    window.hasLikedComment = hasLikedComment;
}


