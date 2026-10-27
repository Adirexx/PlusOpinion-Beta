/**
 * bookmarks.js — Bookmarks API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { createNotification } from './notifications.js'
import { getPost } from './posts.js'

/**
 * Notify when someone bookmarks a post
 */
async function notifyPostBookmarked(postId, actorId) {
    try {
        const post = await getPost(postId);
        if (!post || post.user_id === actorId) return;

        const { data: actor } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', actorId)
            .maybeSingle();
        if (!actor) return;

        const productName = post.product_name || post.item_name || 'your post';

        await createNotification({
            user_id: post.user_id,
            type: 'post_bookmarked',
            title: 'Post Saved',
            message: `${actor.full_name || actor.username || 'Someone'} saved your review of '${productName}'`,
            related_post_id: postId,
            related_user_id: actorId,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_avatar: actor.avatar_url,
                post_preview: post.text_content?.substring(0, 80),
                product_name: productName,
                brand_name: post.brand_name
            },
            action_url: `/?post=${postId}`,
            icon: 'Bookmark',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('notifyPostBookmarked failed:', err);
    }
}

export async function bookmarkPost(postId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
        .from('bookmarks')
        .insert({
            user_id: user.id,
            post_id: postId
        });

    if (error && error.code !== '23505') { // Ignore unique violation
        throw error;
    }

    // Trigger notification for post author (optional)
    notifyPostBookmarked(postId, user.id).catch(err =>
        console.error('Failed to send bookmark notification:', err)
    );

    return true;
};

/**
 * Remove bookmark
 */



export async function removeBookmark(postId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

    if (error) throw error;
    return true;
};

/**
 * Check if post is bookmarked
 */



export async function isBookmarked(postId) {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};

/**
 * Get user's bookmarked posts
 */



export async function getBookmarks(options = {}) {
    const { limit = 20, offset = 0 } = options;
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Join with posts and profiles
    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
            post_id,
            posts:post_id (
                *,
                profiles:user_id (
                    id,
                    full_name,
                    username,
                    avatar_url,
                    rqs_score,
                    is_verified
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;

    // Filter out null posts (deleted ones) or where join failed
    return data
        .map(item => item.posts)
        .filter(post => post && !post.is_deleted);
};


/**
 * Get all categories
 */




// --- Added for Phase 4.1 Bookmarks Refactoring ---

export async function getBookmarkedNotificationsWithProfiles(userId) {
    const { data, error } = await supabase
        .from('notifications')
        .select('*, profiles:related_user_id (id, full_name, username, avatar_url)')
        .eq('user_id', userId)
        .contains('metadata', { is_bookmarked: true })
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getBookmarkedMessages(userId) {
    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
            id, 
            created_at, 
            message_id, 
            messages (
                id, 
                sender_id, 
                conversation_id,
                content,
                content_iv,
                conversations:conversation_id (
                    participant_1_id,
                    participant_2_id
                )
            )
        `)
        .eq('user_id', userId)
        .not('message_id', 'is', null)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function deleteBookmarkById(bookmarkId) {
    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);
    if (error) throw error;
}

export async function getUserBookmarkPostIds(userId) {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', userId);
    if (error) throw error;
    return data;
}
