import { rewriteMediaUrl } from "./media.js"

/**
 * posts.js — Posts API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { rewritePostUrls } from './media.js'
import { createNotification } from './notifications.js'
import { sendPostDeletedNotification } from './notificationsService.js'

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Notify when someone agrees with (likes) a post
 */
async function notifyPostLiked(postId, actorId) {
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
            type: 'post_liked',
            title: 'New Agreement',
            message: `${actor.full_name || actor.username || 'Someone'} agreed with your opinion on '${productName}'`,
            related_post_id: postId,
            related_user_id: actorId,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_avatar: actor.avatar_url,
                actor_id: actorId,
                post_preview: post.text_content?.substring(0, 80),
                product_name: productName,
                brand_name: post.brand_name,
                category: post.category
            },
            action_url: `/?post=${postId}`,
            icon: 'ThumbsUp',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('notifyPostLiked failed:', err);
    }
}

// Module-level hidden items cache (same as old window._hiddenItemsCache)
let _hiddenItemsCache = null

export async function getUserBadgeNumber(userId) {
    if (!userId) return null;

    // 1. Get user's created_at
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

    if (profileError || !userProfile) return null;

    // 2. Count users created BEFORE this user (Rank - 1)
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', userProfile.created_at);

    if (countError) return null;

    // 3. Return Rank + 4
    return count + 4;
};


// ============================================
// POSTS API
// ============================================

/**
 * Create a new post/opinion
 */



export async function createPost(postData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to create posts');
    if (!supabase || !supabase.from) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            text_content: postData.text_content,
            category: postData.category,
            product_name: postData.product_name || null,
            brand_name: postData.brand_name || null,
            media_url: postData.media_url || null,
            media_type: postData.media_type || null,
            images: postData.images || null,
            is_verified_purchase: postData.is_verified_purchase || false,
            verification_proof_url: postData.verification_proof_url || null,
            is_draft: postData.is_draft || false
        })
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score,
        is_verified
      )
    `)
        .single();

    if (error) throw error;

    // Trigger notification for successful post creation (skip silently — no SPA handler needed)
    // notifyPostCreated is a system-side event, not needed for user-facing notifications

    return data;
};

/**
 * Get feed posts with pagination
 */



export async function getPost(postId) {
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score,
        is_verified
      )
    `)
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();

    if (error) throw error;
    // Rewrite media URL so video/image sources are proxied
    if (data && rewriteMediaUrl) {
        data.media_url = data.media_url ? rewriteMediaUrl(data.media_url) : data.media_url;
        if (data.profiles?.avatar_url) {
            data.profiles.avatar_url = rewriteMediaUrl(data.profiles.avatar_url);
        }
    }
    return data;
};

/**
 * Update a post
 */



export async function updatePost(postId, updates) {
    const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get current user's draft posts
 */



export async function getMyDrafts() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (
                id,
                full_name,
                username,
                avatar_url,
                rqs_score,
                is_verified
            )
        `)
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Get posts that the current user has commented on
 */



export async function getMyCommentedPosts() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // 1. Get all unique post IDs from user's comments
    const { data: comments, error: commentError } = await supabase
        .from('comments')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (commentError) throw commentError;

    if (!comments || comments.length === 0) return [];

    // Extract unique IDs
    const postIds = [...new Set(comments.map(c => c.post_id))];

    // 2. Fetch the actual posts
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (
                id,
                full_name,
                username,
                avatar_url,
                rqs_score,
                is_verified
            )
        `)
        .in('id', postIds)
        .eq('is_deleted', false)
        .eq('is_draft', false); // Don't show drafts even if commented (edge case)

    if (postsError) throw postsError;
    return posts;
};


/**
 * Delete a post by moving it to deleted_posts archive table
 * Posts are physically removed from posts table and archived for admin review
 */



export async function deletePost(postId, reason = null) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Must be logged in');

        // 1. Fetch complete post data before deletion
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (fetchError) throw fetchError;
        if (!post) throw new Error('Post not found');

        // 2. Insert into deleted_posts archive table (using upsert to avoid duplicate errors)
        const { error: insertError } = await supabase
            .from('deleted_posts')
            .upsert({
                // Copy all original post fields
                id: post.id,
                user_id: post.user_id,
                text_content: post.text_content,
                product_name: post.product_name,
                category: post.category,
                media_url: post.media_url,
                media_type: post.media_type,
                verification_proof: post.verification_proof,
                is_verified: post.is_verified,
                agrees_count: post.agrees_count,
                disagrees_count: post.disagrees_count,
                comments_count: post.comments_count,
                created_at: post.created_at,

                // Add deletion metadata
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
                deletion_reason: reason,
                original_data: post // Complete backup as JSONB
            }, { onConflict: 'id' });

        if (insertError) throw insertError;

        // 3. Permanently delete from posts table
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (deleteError) {
            // Rollback: Remove from deleted_posts if main deletion fails
            await supabase
                .from('deleted_posts')
                .delete()
                .eq('id', postId);
            throw deleteError;
        }

        // 4. Send deletion notification
        if (post) {
            const preview = post.text_content ? (post.text_content.substring(0, 50) + '...') : '';
            sendPostDeletedNotification(user.id, preview).catch(err =>
                console.error('Failed to send deletion notification:', err)
            );
        }

        // Post deleted successfully (logging disabled for security)
        return { success: true, archived: true };

    } catch (error) {
        console.error('Delete post failed:', error);
        throw error;
    }
};

// ============================================
// LIKES API
// ============================================

/**
 * Like a post (agree)
 */



export async function likePost(postId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to like posts');

    const { data, error } = await supabase
        .from('post_likes')
        .insert({
            post_id: postId,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('You already liked this post');
        }
        throw error;
    }

    // Trigger notification for post author
    if (data) {
        notifyPostLiked(postId, user.id).catch(err =>
            console.error('Failed to send like notification:', err)
        );
    }

    return data;
};

/**
 * Unlike a post
 */



export async function unlikePost(postId) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

    if (error) throw error;

};

/**
 * Check if current user liked a post
 */



export async function hasLikedPost(postId) {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) throw error;
    return !!data;
};

// ============================================
// COMMENTS API
// ============================================

/**
 * Edit a post (Only once allowed)
 */



export async function editPost(postId, newText) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // 1. Fetch post to check ownership and is_edited status
    const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id, is_edited')
        .eq('id', postId)
        .single();

    if (fetchError) throw fetchError;

    if (post.user_id !== user.id) {
        throw new Error('Unauthorized: You can only edit your own posts');
    }

    if (post.is_edited) {
        throw new Error('You have already edited this post once. Further edits are not allowed.');
    }

    // 2. Update post
    const { data, error: updateError } = await supabase
        .from('posts')
        .update({
            text_content: newText,
            is_edited: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

    if (updateError) throw updateError;

    // Post edit notification — skip, not user-facing

    return data;
};

/**
 * Hide an item (Post, Brand, or Category)
 */



export async function hideItem(type, target, postId = null) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Normalize types
    let normalizedType = type;
    if (type === 'hide_post') normalizedType = 'post';
    if (type === 'mute_brand') normalizedType = 'brand';
    if (type === 'not_interested') normalizedType = 'category';
    if (type === 'mute_category') normalizedType = 'category';

    const payload = {
        user_id: user.id,
        type: normalizedType
    };

    if (normalizedType === 'post') payload.post_id = target || postId;
    else if (normalizedType === 'brand') {
        payload.brand_name = target;
        payload.post_id = postId; // Optional: track which post triggered the mute
    }
    else if (normalizedType === 'category') {
        payload.category = target;
        payload.post_id = postId; // Optional
    }

    const { error } = await supabase
        .from('hidden_items')
        .insert(payload);

    if (error) throw error;

    // Invalidate local cache instantly so next feed load fetches fresh exclusions
    _hiddenItemsCache = null; // invalidate cache (was: delete window._hiddenItemsCache)

    return true;
};

/**
 * Get all hidden items for current user (to filter feed)
 */



export async function getHiddenItems() {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('hidden_items')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching hidden items:', error);
        return { posts: [], brands: [], categories: [] };
    }

    return {
        posts: data.filter(i => i.type === 'post').map(i => i.post_id),
        brands: data.filter(i => i.type === 'brand').map(i => i.brand_name),
        categories: data.filter(i => i.type === 'category').map(i => i.category)
    };
};

/**
 * Bookmark a post
 */



export async function trackShare(postId) {
    if (!postId) return;
    try {
        const { error } = await supabase.rpc('track_post_share', { target_post_id: postId });
        if (error) throw error;
    } catch (err) {
        console.error('Error tracking share:', err);
    }
};


/**
 * Get comments for a post - returns threaded structure: top-level + replies
 */



export async function unhideItem(type, target) {
    const user = await getCurrentUser();
    if (!user) {
        console.error("Unhide failed: No user found");
        throw new Error('Must be logged in');
    }

    let normalizedType = type;
    if (type === 'hide_post') normalizedType = 'post';
    else if (type === 'mute_brand') normalizedType = 'brand';
    // 'category' is already category

    // Unhiding item (debug logging disabled for security)

    let query = supabase
        .from('hidden_items')
        .delete()
        .eq('user_id', user.id)
        .eq('type', normalizedType);

    if (normalizedType === 'post') {
        query = query.eq('post_id', target);
    } else if (normalizedType === 'brand') {
        query = query.eq('brand_name', target);
    } else if (normalizedType === 'category') {
        query = query.eq('category', target);
    }

    const { error } = await query;
    if (error) {
        console.error("Supabase Unhide Error Detail:", JSON.stringify(error, null, 2));
        throw error;
    }

    // Unhide successful
    return true;
};


// ============================================
// ADVANCED INTERACTIONS API
// ============================================

/**
 * Report a post
 */


