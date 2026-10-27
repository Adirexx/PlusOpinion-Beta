/**
 * moderation.js — Moderation API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { sendReportSubmittedNotification } from './notificationsService.js'

export async function reportPost(postId, reason, action = 'pending', additionalData = {}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to report');

    const payload = {
        user_id: user.id,
        post_id: postId,
        reason: reason,
        action_taken: action,
        reporter_username: additionalData.reporter_username || null,
        reported_username: additionalData.reported_username || null,
        post_url: additionalData.post_url || null
    };

    const { error } = await supabase
        .from('reports')
        .insert(payload);

    if (error) {
        console.error('Report failed:', error);
        throw error;
    }

    sendReportSubmittedNotification(user.id, 'post', postId, reason).catch(() => {});
    return true;
};

/**
 * Report a user
 */



export async function reportUser(targetUserId, reason, additionalData = {}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to report');

    const payload = {
        user_id: user.id,
        reported_user_id: targetUserId,
        reason: reason,
        action_taken: 'pending',
        reporter_username: additionalData.reporter_username || null,
        reported_username: additionalData.reported_username || null
    };

    const { error } = await supabase
        .from('reports')
        .insert(payload);

    if (error) {
        console.error('User report failed:', error);
        throw error;
    }

    sendReportSubmittedNotification(user.id, 'user', targetUserId, reason).catch(() => {});
    return true;
};

/**
 * Block a user
 */



export async function blockUser(targetUserId) {
    if (!targetUserId) return false;
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to block');
    if (String(user.id) === String(targetUserId)) {
        throw new Error('Cannot block yourself');
    }

    const { error } = await supabase
        .from('profile_blocks')
        .upsert(
            { blocker_id: user.id, blocked_id: targetUserId },
            { onConflict: 'blocker_id,blocked_id' }
        );

    if (error && error.code !== '23505') {
        console.error('Block failed:', error);
        throw error;
    }

    // Invalidate local storage cache & broadcast change
    try {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user_blocks_changed', {
                detail: { action: 'block', targetUserId: String(targetUserId) }
            }));
            // Clear any profile caches
            try { sessionStorage.removeItem(`profile_${targetUserId}`); } catch (e) {}
            try { localStorage.removeItem(`profile_${targetUserId}`); } catch (e) {}
        }
    } catch (e) {}

    return true;
};

/**
 * Unblock a user
 */
export async function unblockUser(targetUserId) {
    if (!targetUserId) return false;
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
        .from('profile_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId);

    if (error) {
        console.error('Unblock failed:', error);
        throw error;
    }

    try {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user_blocks_changed', {
                detail: { action: 'unblock', targetUserId: String(targetUserId) }
            }));
        }
    } catch (e) {}

    return true;
};

/**
 * Get list of blocked user IDs for the current user
 */
export async function getBlockedUserIds() {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        const { data, error } = await supabase
            .from('profile_blocks')
            .select('blocked_id')
            .eq('blocker_id', user.id);

        if (error) return [];
        return (data || []).map(b => String(b.blocked_id));
    } catch (e) {
        return [];
    }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(targetUserId) {
    if (!targetUserId) return false;
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('profile_blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};

/**
 * Get list of users blocked by the current user
 */
export async function getBlockedUsers() {
    const user = await getCurrentUser();
    if (!user) return [];

    try {
        // Step 1: Fetch blocked user IDs
        const { data: blocks, error: blockErr } = await supabase
            .from('profile_blocks')
            .select('blocked_id')
            .eq('blocker_id', user.id);

        if (blockErr || !blocks || blocks.length === 0) {
            return [];
        }

        const blockedIds = blocks.map(b => b.blocked_id);

        // Step 2: Fetch profiles for those blocked users
        const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', blockedIds);

        if (profErr) {
            console.error('Error fetching blocked profiles:', profErr);
            return [];
        }

        return profiles || [];
    } catch (e) {
        console.error('Error in getBlockedUsers:', e);
        return [];
    }
};

// Alias for consistency with component calls



// submitReport is an alias for reportPost — re-exported in index.js

// window.hideItem moved to top for consistency and fixed.
// Previous duplicate removed.

/**
 * Get user's hidden items (for filtering feed)
 */



export async function reportContent(targetType, targetId, reason, description = '') {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to report content');

    try {
        // Submit report to database
        const { data, error } = await supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                target_type: targetType,
                target_id: targetId,
                reason: reason,
                description: description,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Send confirmation notification
        if (window.notifyReportSubmitted) {
            window.notifyReportSubmitted(user.id, targetType, targetId, reason)
                .catch(err => console.error('Failed to send report notification:', err));
        }

        return data;
    } catch (err) {
        console.error('Error submitting report:', err);
        throw err;
    }
};

// ============================================
// UNIVERSAL SEARCH (LENS) API
// ============================================

/**
 * Search profiles by username or full name with intelligent ranking
 * Ranking: Exact username match > Exact full name match > Partial matches
 * @param {string} query - Search query
 * @param {number} limit - Maximum results (default: 20)
 */


