/**
 * notifications.js — Notifications API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'

export async function getNotifications(options = {}) {
    const { limit = 50, unreadOnly = false } = options;
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (unreadOnly) {
        query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Mark notification as read
 */



export async function markNotificationRead(notificationId) {
    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

    if (error) throw error;
};

/**
 * Mark all notifications as read
 */



export async function markAllNotificationsRead() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) throw error;
};




export async function deleteNotification(notificationId) {
    if (!supabase) throw new Error('Supabase not initialized');

    // Deleting notification (logging disabled for security)
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('❌ Failed to delete notification:', error);
        throw error;
    }
    // Notification deleted successfully
    return true;
};

/**
 * Toggle notification bookmark status (persisted in metadata JSONB)
 */



export async function toggleNotificationBookmark(notificationId, isBookmarked) {
    if (!supabase) throw new Error('Supabase not initialized');

    // 1. Get current metadata
    const { data: notif, error: fetchError } = await supabase
        .from('notifications')
        .select('metadata')
        .eq('id', notificationId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Update metadata with bookmark status
    const updatedMetadata = {
        ...(notif.metadata || {}),
        is_bookmarked: isBookmarked
    };

    const { data, error: updateError } = await supabase
        .from('notifications')
        .update({ metadata: updatedMetadata })
        .eq('id', notificationId)
        .select()
        .single();

    if (updateError) throw updateError;
    return data;
};

/**
 * Fetch all bookmarked notifications for current user
 */



export async function getBookmarkedNotifications() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .contains('metadata', { is_bookmarked: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Get unread notification count
 */



export async function getUnreadCount() {
    const user = await getCurrentUser();
    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) throw error;
    return count || 0;
};

// ============================================
// PROFILE API (Extended)
// ============================================

/**
 * Get current user's full profile
 */



/**
 * createNotification — ported from notifications.js (full module)
 * Used by comments.js to create notification records via RPC.
 * The RPC 'send_notification' bypasses RLS for insertion.
 */
export async function createNotification(notificationData) {
    const {
        user_id,
        type,
        title,
        message,
        related_post_id = null,
        related_user_id = null,
        metadata = {},
        action_url = null,
        icon = 'Bell',
        category = 'system',
        priority = 'normal'
    } = notificationData;

    try {
        const { data, error } = await supabase
            .rpc('send_notification', {
                user_id,
                type,
                title,
                message,
                related_post_id,
                related_user_id,
                metadata,
                action_url,
                icon,
                category,
                priority
            });

        if (error) {
            console.error('Error creating notification via RPC:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Exception creating notification via RPC:', err);
        return null;
    }
}
