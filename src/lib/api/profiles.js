/**
 * profiles.js — Profiles API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { rewriteMediaUrl } from './media.js'
import { getBlockedUserIds } from './moderation.js'

export async function getMyProfile() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get any user's profile by ID
 */



export async function getUserProfile(userId) {
    if (!supabase || !supabase.from) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get any user's profile by username
 */



export async function getUserProfileByUsername(username) {
    if (!supabase || !supabase.from) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get a user's posts with pagination
 */



export async function getUserPosts(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    if (!supabase || !supabase.from) throw new Error('Supabase client not initialized');

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
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
};

/**
 * Get posts that a specific user has commented on with pagination
 */



export async function getUserCommentedPosts(userId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    if (!supabase || !supabase.from) throw new Error('Supabase client not initialized');

    // 1. Get all unique post IDs from user's comments
    const { data: comments, error: commentError } = await supabase
        .from('comments')
        .select('post_id')
        .eq('user_id', userId)
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
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (postsError) throw postsError;
    return posts;
};


/**
 * Get current user's posts
 */



export async function getMyPosts(options = {}) {
    const { limit = 20, offset = 0 } = options;
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
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
};

/**
 * Get user stats (for My Space page)
 */



export async function getMyStats() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Get total posts
    const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

    // Get total likes received
    const { data: posts } = await supabase
        .from('posts')
        .select('agrees_count')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

    const totalLikes = posts?.reduce((sum, post) => sum + (post.agrees_count || 0), 0) || 0;

    // Get total comments received
    const { data: postsWithComments } = await supabase
        .from('posts')
        .select('comments_count')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

    const totalComments = postsWithComments?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;

    return {
        totalPosts: totalPosts || 0,
        totalLikes,
        totalComments
    };
};

/**
 * Accept terms and privacy policy
 */



export async function getTopReviewers(limit = 5) {
    try {
        // Get profiles ordered by RQS (beta-friendly, no strict filters)
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, rqs_score, is_verified, verified_count, lifetime_interactions')
            .not('rqs_score', 'is', null)
            .order('rqs_score', { ascending: false })
            .limit(100);

        if (error) throw error;
        if (!profiles || profiles.length === 0) return [];

        const blockedIds = new Set(await getBlockedUserIds().catch(() => []));
        const filteredProfiles = blockedIds.size > 0
            ? profiles.filter(p => !blockedIds.has(String(p.id)))
            : profiles;

        // Calculate composite score using available data
        // RQS: 70%, Verified Reviews: 20%, Lifetime Interactions: 10%
        const scoredProfiles = filteredProfiles.map(profile => ({
            ...profile,
            _score: (profile.rqs_score || 0) * 0.7 +
                (profile.verified_count || 0) * 10 * 0.2 +
                (profile.lifetime_interactions || 0) * 0.1
        }));

        // Sort by composite score
        scoredProfiles.sort((a, b) => b._score - a._score);

        // Return top reviewers without internal score
        return scoredProfiles.slice(0, limit).map(({ _score, ...profile }) => profile);

    } catch (error) {
        console.error('Top reviewers failed:', error);
        return [];
    }
};

/**
 * Get all profiles on the platform in shuffled order
 * For the "Explore More" section
 */
export async function getAllProfiles() {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, rqs_score')
            .not('username', 'is', null)
            .order('created_at', { ascending: false }); // Get newest first, then shuffle

        if (error) throw error;
        if (!profiles || profiles.length === 0) return [];

        const blockedIds = new Set(await getBlockedUserIds().catch(() => []));
        const filtered = blockedIds.size > 0
            ? profiles.filter(p => !blockedIds.has(String(p.id)))
            : profiles;

        // Shuffle the profiles for variety
        const shuffled = filtered.sort(() => Math.random() - 0.5);

        return shuffled;

    } catch (error) {
        console.error('Get all profiles failed:', error);
        return [];
    }
};



export async function getProfilesByIds(userIds) {
    if (!userIds || userIds.length === 0) return [];
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);
    if (error) throw error;
    return data;
}
