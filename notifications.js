// ============================================
// NOTIFICATION SYSTEM
// Centralized notification management for PlusOpinion
// ============================================

/**
 * Core function to create a notification
 * @param {Object} notificationData - Notification details
 * @returns {Promise<Object>} Created notification
 */
window.createNotification = async function (notificationData) {
    if (!window.supabase || !window.supabase.rpc) {
        console.error('Supabase client not initialized or RPC method missing');
        return null;
    }

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
        // Use RPC to bypass RLS for insertion
        const { data, error } = await window.supabase
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
};

/**
 * Get user profile data for notification metadata
 */
async function getUserForNotification(userId) {
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', userId)
            .single();

        if (error) return null;
        return data;
    } catch (err) {
        return null;
    }
}

/**
 * Format time ago for notifications
 */
function formatTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
}

// ============================================
// POST INTERACTION NOTIFICATIONS
// ============================================

/**
 * Notify when someone likes/agrees with a post
 */
window.notifyPostLiked = async function (postId, actorId) {
    try {
        const post = await window.getPost(postId);
        if (!post || post.user_id === actorId) return; // Don't notify self

        const actor = await getUserForNotification(actorId);
        if (!actor) return;

        // Get product name from post
        const productName = post.product_name || post.item_name || 'your post';

        await window.createNotification({
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
                category: post.category // Add category for rich display
            },
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}&highlight=likes`,
            icon: 'ThumbsUp',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying post liked:', err);
    }
};

/**
 * Notify when someone comments on a post
 */
const notifyPostAgreed = notifyPostLiked; // Alias for agreement notifications

window.notifyPostCommented = async function (postId, actorId, commentText) {
    try {
        const post = await window.getPost(postId);
        if (!post || post.user_id === actorId) return; // Don't notify self

        const actor = await getUserForNotification(actorId);
        if (!actor) return;

        // Get product name from post
        const productName = post.product_name || post.item_name || 'your post';



        await window.createNotification({
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
                comment_preview: commentText, // Store full comment text, not truncated
                comment_text: commentText, // Also store as comment_text for clarity
                post_preview: post.text_content?.substring(0, 100), // Slightly longer preview
                post_full_text: post.text_content, // Store full text if needed
                product_name: productName,
                brand_name: post.brand_name,
                category: post.category, // Add category for rich display
                post_media: post.media_url,   // <--- FIXED: Use correct column name
                post_media_type: post.media_type // <--- ADDED: Media Type (image/video)
            },
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}&section=comments`,
            icon: 'MessageCircle',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying post commented:', err);
    }
};

/**
 * Notify when someone bookmarks a post
 */
window.notifyPostBookmarked = async function (postId, actorId) {
    try {
        const post = await window.getPost(postId);
        if (!post || post.user_id === actorId) return; // Don't notify self

        const actor = await getUserForNotification(actorId);
        if (!actor) return;

        // Get product name from post
        const productName = post.product_name || post.item_name || 'your post';

        await window.createNotification({
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
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}`,
            icon: 'Bookmark',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying post bookmarked:', err);
    }
};

/**
 * Notify when someone likes a comment
 */
window.notifyCommentLiked = async function (commentId, actorId) {
    try {
        const { data: comment, error } = await window.supabase
            .from('comments')
            .select('user_id, post_id, text_content')
            .eq('id', commentId)
            .single();

        if (error || !comment || comment.user_id === actorId) return;

        const post = await window.getPost(comment.post_id);
        const productName = post?.product_name || post?.item_name || 'your post';

        const actor = await getUserForNotification(actorId);
        if (!actor) return;

        await window.createNotification({
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
            action_url: `HOMEPAGE_FINAL.HTML?post=${comment.post_id}&section=comments&comment=${commentId}`,
            icon: 'Heart',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying comment liked:', err);
    }
};

/**
 * Notify when someone mentions a user in a post/comment
 */
window.notifyMention = async function (postId, actorId, mentionedUserId, contextText) {
    try {
        if (mentionedUserId === actorId) return; // Don't notify self

        const post = await window.getPost(postId);
        if (!post) return;

        const actor = await getUserForNotification(actorId);
        if (!actor) return;

        const productName = post.product_name || post.item_name || 'a post';

        await window.createNotification({
            user_id: mentionedUserId,
            type: 'mention',
            title: 'New Mention',
            message: `${actor.full_name || actor.username || 'Someone'} mentioned you in a discussion on '${productName}'`,
            related_post_id: postId,
            related_user_id: actorId,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_avatar: actor.avatar_url,
                post_preview: contextText?.substring(0, 80) || post.text_content?.substring(0, 80),
                product_name: productName
            },
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}`,
            icon: 'AtSign',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying mention:', err);
    }
};

// ============================================
// REAL-TIME UNREAD COUNT
// ============================================

/**
 * Get current unread count
 */
window.getUnreadCount = async function () {
    try {
        const user = await window.getCurrentUser();
        if (!user) return 0;

        const { count, error } = await window.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (err) {
        console.error('Error fetching unread count:', err);
        return 0;
    }
};

/**
 * Subscribe to unread count changes
 * @param {Function} onCountChange - Callback(count)
 * @returns {Function} unsubscribe
 */
window.subscribeToUnreadCount = function (onCountChange) {
    if (!window.supabase) return () => { };

    let subscription = null;

    const setup = async () => {
        const user = await window.getCurrentUser();
        if (!user) return;

        // Initial fetch
        const count = await window.getUnreadCount();
        onCountChange(count);

        // Subscribe to changes
        subscription = window.supabase
            .channel('public:notifications:count')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, async () => {
                // On any change (INSERT, UPDATE, DELETE), re-fetch count
                const newCount = await window.getUnreadCount();
                onCountChange(newCount);
            })
            .subscribe();
    };

    setup();

    return () => {
        if (subscription) window.supabase.removeChannel(subscription);
    };
};

/**
 * Notify when someone replies to a comment
 */
window.notifyCommentReplied = async function (postId, parentCommentId, actorId, replyText) {
    try {
        const { data: parentComment, error } = await window.supabase
            .from('comments')
            .select('user_id, text_content')
            .eq('id', parentCommentId)
            .single();

        if (error || !parentComment || parentComment.user_id === actorId) return;

        const post = await window.getPost(postId);
        const productName = post?.product_name || post?.item_name || 'your comment';

        const actor = await getUserForNotification(actorId);
        if (!actor) return;

        await window.createNotification({
            user_id: parentComment.user_id,
            type: 'comment_replied',
            title: 'New Reply',
            message: `${actor.full_name || actor.username || 'Someone'} replied to your comment on '${productName}'`,
            related_post_id: postId,
            related_user_id: actorId,
            metadata: {
                actor_name: actor.full_name || actor.username,
                actor_avatar: actor.avatar_url,
                actor_id: actorId,
                comment_id: parentCommentId,
                comment_preview: replyText, // Store full reply text
                comment_text: replyText, // Also store as comment_text
                product_name: productName,
                category: post?.category // Add category
            },
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}&section=comments`,
            icon: 'MessageSquare',
            category: 'social',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying comment reply:', err);
    }
};

// ============================================
// POST LIFECYCLE NOTIFICATIONS
// ============================================

/**
 * Notify when a post is created successfully
 */
window.notifyPostCreated = async function (postId, userId) {
    try {
        const post = await window.getPost(postId);
        if (!post) return;

        await window.createNotification({
            user_id: userId,
            type: 'post_created',
            title: 'Post Published',
            message: 'Your opinion has been published successfully',
            related_post_id: postId,
            metadata: {
                post_preview: post.text_content?.substring(0, 50) + '...',
                category: post.category,
                product_name: post.product_name
            },
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}`,
            icon: 'CheckCircle',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying post created:', err);
    }
};

/**
 * Notify when a post is edited
 */
window.notifyPostEdited = async function (postId, userId) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'post_edited',
            title: 'Post Updated',
            message: 'Your post has been updated successfully',
            related_post_id: postId,
            metadata: {},
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}`,
            icon: 'Edit',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying post edited:', err);
    }
};

/**
 * Notify when a post is deleted
 */
window.notifyPostDeleted = async function (userId, postPreview) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'post_deleted',
            title: 'Post Deleted',
            message: 'Your post has been deleted',
            metadata: {
                post_preview: postPreview
            },
            icon: 'Trash',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying post deleted:', err);
    }
};

/**
 * Notify when a post is removed by admin
 */
window.notifyPostRemoved = async function (userId, postId, reason) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'post_removed',
            title: 'Post Removed',
            message: `Your post was removed: ${reason}`,
            related_post_id: postId,
            metadata: {
                reason: reason
            },
            icon: 'Shield',
            category: 'system',
            priority: 'high'
        });
    } catch (err) {
        console.error('Error notifying post removed:', err);
    }
};

// ============================================
// PROFILE & VERIFICATION NOTIFICATIONS
// ============================================

/**
 * Notify when user profile is verified
 */
window.notifyProfileVerified = async function (userId) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'profile_verified',
            title: 'Profile Verified! 🎉',
            message: 'Congratulations! Your profile has been verified',
            metadata: {
                badge: 'verified'
            },
            action_url: 'PRIVATE OWNER PROFILE.HTML',
            icon: 'Shield',
            category: 'system',
            priority: 'high'
        });
    } catch (err) {
        console.error('Error notifying profile verified:', err);
    }
};

/**
 * Notify when RQS score is updated - "RQS Level Up"
 */
window.notifyRQSUpdated = async function (userId, oldScore, newScore) {
    try {
        const level = newScore >= 80 ? '1' : null; // Example level logic

        await window.createNotification({
            user_id: userId,
            type: 'rqs_updated',
            title: 'RQS Level Up',
            message: `Your Reputation Quality Score increased to ${newScore}. You are now Level ${level || '1'} eligible.`,
            metadata: {
                old_score: oldScore,
                new_score: newScore,
                level: level || '1'
            },
            action_url: 'PRIVATE OWNER PROFILE.HTML#rqs',
            icon: 'Zap',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying RQS updated:', err);
    }
};

/**
 * Welcome notification for new users
 */
window.notifyWelcome = async function (userId, userName) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'welcome',
            title: `Welcome to PlusOpinion, ${userName}! 👋`,
            message: 'Start sharing your honest opinions and build your reputation',
            metadata: {
                action_type: 'onboarding'
            },
            action_url: 'HOMEPAGE_FINAL.HTML',
            icon: 'Sparkles',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying welcome:', err);
    }
};

// ============================================
// BRAND & MONETIZATION NOTIFICATIONS
// ============================================

/**
 * Notify when a brand views a post - "Samsung viewed your post"
 */
window.notifyBrandView = async function (postId, userId, brandName) {
    try {
        const post = await window.getPost(postId);
        const productName = post?.product_name || post?.item_name || 'your post';

        await window.createNotification({
            user_id: userId,
            type: 'brand_view',
            title: `${brandName} viewed your post`,
            message: `Your review on '${productName}' caught the brand's attention.`,
            related_post_id: postId,
            metadata: {
                brand_name: brandName,
                product_name: productName
            },
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}`,
            icon: 'Eye',
            category: 'brand',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying brand view:', err);
    }
};

/**
 * Notify when a brand marks feedback as helpful - "Brand insight"
 */
window.notifyBrandInsight = async function (postId, userId, brandName) {
    try {
        const post = await window.getPost(postId);
        const productName = post?.product_name || post?.item_name || 'your post';

        await window.createNotification({
            user_id: userId,
            type: 'brand_insight',
            title: `${brandName} insight`,
            message: `Your feedback on '${productName}' was marked as 'Helpful' by the brand team.`,
            related_post_id: postId,
            metadata: {
                brand_name: brandName,
                product_name: productName
            },
            action_url: `HOMEPAGE_FINAL.HTML?post=${postId}`,
            icon: 'Award',
            category: 'brand',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying brand insight:', err);
    }
};

/**
 * Notify about partner program eligibility
 */
window.notifyPartnerProgram = async function (userId) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'partner_program',
            title: 'Partner Program Eligible! 🎊',
            message: "You're now eligible for the PlusOpinion Partner Program",
            metadata: {
                program: 'partner'
            },
            icon: 'Award',
            category: 'monetization',
            priority: 'high'
        });
    } catch (err) {
        console.error('Error notifying partner program:', err);
    }
};

/**
 * Notify about revenue/earnings
 */
window.notifyRevenue = async function (userId, amount, period) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'revenue',
            title: 'Earnings Update 💰',
            message: `You earned $${amount} this ${period}`,
            metadata: {
                amount: amount,
                period: period
            },
            icon: 'DollarSign',
            category: 'monetization',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying revenue:', err);
    }
};

// ============================================
// SECURITY & SYSTEM NOTIFICATIONS
// ============================================

/**
 * Notify on login
 */
window.notifyLogin = async function (userId, device, location) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'login',
            title: 'New Login Detected',
            message: `Login from ${device || 'unknown device'}${location ? ` at ${location}` : ''}`,
            metadata: {
                device: device,
                location: location,
                timestamp: new Date().toISOString()
            },
            icon: 'LogIn',
            category: 'security',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying login:', err);
    }
};

/**
 * Notify on logout
 */
window.notifyLogout = async function (userId, device) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'logout',
            title: 'Logged Out',
            message: `You were logged out from ${device || 'a device'}`,
            metadata: {
                device: device,
                timestamp: new Date().toISOString()
            },
            icon: 'LogOut',
            category: 'security',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying logout:', err);
    }
};

/**
 * Notify on error
 */
window.notifyError = async function (userId, errorMessage, context) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'error',
            title: 'Action Failed',
            message: errorMessage,
            metadata: {
                context: context,
                timestamp: new Date().toISOString()
            },
            icon: 'AlertCircle',
            category: 'system',
            priority: 'high'
        });
    } catch (err) {
        console.error('Error notifying error:', err);
    }
};

/**
 * Admin/Platform update notification
 */
window.notifyAdminUpdate = async function (userId, title, message, priority = 'normal') {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'admin_update',
            title: title,
            message: message,
            metadata: {
                source: 'admin'
            },
            icon: 'Megaphone',
            category: 'system',
            priority: priority
        });
    } catch (err) {
        console.error('Error notifying admin update:', err);
    }
};

/**
 * GLOBAL TITLE UPDATER
 * Automatically updates browser tab title with unread count
 * e.g. "(3) My Profile"
 */
window.initGlobalTitleUpdates = function () {
    // 1. Capture original title once
    // We treat the title present at load time as the "base" title
    let baseTitle = document.title;

    // Optional: Observer to detect if app changes title (SPA navigation)
    // and update baseTitle accordingly, but for now we stick to simple logic

    // 2. Subscribe
    if (window.subscribeToUnreadCount) {
        window.subscribeToUnreadCount((count) => {
            try {
                if (count > 0) {
                    document.title = `(${count}) ${baseTitle}`;
                } else {
                    document.title = baseTitle;
                }
            } catch (e) {
                console.error("Error updating title:", e);
            }
        });
    }
};

// Initialize after a short delay to ensure DOM and Auth are ready
setTimeout(() => {
    window.initGlobalTitleUpdates();
}, 500);


// Export globally
window.notifyPostCommented = notifyPostCommented;
window.notifyPostLiked = notifyPostLiked;
window.notifyPostAgreed = notifyPostAgreed;
window.notifyCommentReplied = notifyCommentReplied;
window.notifyCommentLiked = notifyCommentLiked;

// ============================================
// REAL-TIME UNREAD COUNT
// ============================================

/**
 * Get current unread count
 */
window.getUnreadCount = async function () {
    try {
        const user = await window.getCurrentUser();
        if (!user) return 0;

        const { count, error } = await window.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (err) {
        console.error('Error fetching unread count:', err);
        return 0;
    }
};

/**
 * Subscribe to unread count changes
 * @param {Function} onCountChange - Callback(count)
 * @returns {Function} unsubscribe
 */
/**
 * Get cached unread count (Synchronous)
 * Used for instant badge display to prevent flickering
 */
window.getUnreadCountFromCache = function () {
    try {
        const cached = localStorage.getItem('unread_count');
        return cached ? parseInt(cached, 10) : 0;
    } catch (e) {
        return 0;
    }
};

/**
 * Subscribe to unread count changes
 * @param {Function} onCountChange - Callback(count)
 * @returns {Function} unsubscribe
 */
window.subscribeToUnreadCount = function (onCountChange) {
    if (!window.supabase) return () => { };

    let subscription = null;
    let isCancelled = false;

    // 1. Immediately fire with cached value if available
    // This removes the "blink" from 0 -> N
    const cached = window.getUnreadCountFromCache();
    if (cached > 0) {
        onCountChange(cached);
    }

    // Listen for custom optimistic updates
    const handleOptimisticUpdate = (e) => {
        if (!isCancelled && e.detail && typeof e.detail.count === 'number') {
            onCountChange(e.detail.count);
        }
    };
    window.addEventListener('unread_count_updated', handleOptimisticUpdate);

    const setup = async () => {
        const user = await window.getCurrentUser();
        if (!user || isCancelled) return;

        // Initial fetch
        if (!isCancelled) {
            const count = await window.getUnreadCount();
            if (!isCancelled) {
                // Update cache
                localStorage.setItem('unread_count', count);
                onCountChange(count);
            }
        }

        // Subscribe to changes
        const sub = window.supabase
            .channel('public:notifications:count')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, async () => {
                // On any change (INSERT, UPDATE, DELETE), re-fetch count
                if (!isCancelled) {
                    const newCount = await window.getUnreadCount();
                    if (!isCancelled) {
                        // Update cache
                        localStorage.setItem('unread_count', newCount);
                        onCountChange(newCount);
                    }
                }
            })
            .subscribe();

        if (!isCancelled) {
            subscription = sub;
        } else {
            window.supabase.removeChannel(sub);
        }
    };

    setup();

    return () => {
        isCancelled = true;
        window.removeEventListener('unread_count_updated', handleOptimisticUpdate);
        if (subscription) window.supabase.removeChannel(subscription);
    };
};

// ============================================
// REAL-TIME SUBSCRIPTION (Example/Legacy)
// ============================================

/**
 * Subscribe to real-time notifications for current user
 * @param {Function} callback - Function to call when new notification arrives
 * @returns {Object} Subscription object
 */
window.subscribeToNotifications = async function (callback) {
    const user = await window.getCurrentUser();
    if (!user) {
        console.error('Must be logged in to subscribe to notifications');
        return null;
    }

    const subscription = window.supabase
        .channel('user_notifications')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
        }, (payload) => {
            if (callback && typeof callback === 'function') {
                callback(payload.new);
            }
        })
        .subscribe();

    return subscription;
};

/**
 * Unsubscribe from notifications
 */
window.unsubscribeFromNotifications = async function (subscription) {
    if (subscription) {
        await subscription.unsubscribe();
    }
};




/**
 * GLOBAL TITLE UPDATER
 * Automatically updates browser tab title with unread count
 * e.g. "(3) My Profile"
 */
window.initGlobalTitleUpdates = function () {
    let baseTitle = document.title;
    let unsubscribeUnread = null;

    const startListening = () => {
        if (window.subscribeToUnreadCount && !unsubscribeUnread) {
            unsubscribeUnread = window.subscribeToUnreadCount((count) => {
                try {
                    if (count > 0) {
                        document.title = `(${count}) ${baseTitle}`;
                    } else {
                        document.title = baseTitle;
                    }
                } catch (e) {
                    console.error("Error updating title:", e);
                }
            });
        }
    };

    // 1. Try immediately
    window.getCurrentUser().then(user => {
        if (user) {
            startListening();
        } else {
            // 2. Wait for auth change if not logged in yet
            if (window.supabase && window.supabase.auth) {
                window.supabase.auth.onAuthStateChange((event, session) => {
                    if (session?.user) {
                        startListening();
                    }
                });
            }
        }
    });
};

// Initialize after a short delay to ensure Supabase client is ready
setTimeout(() => {
    if (window.initGlobalTitleUpdates) {
        window.initGlobalTitleUpdates();
    }
}, 500);
// ============================================
// EXTENDED USER ENGAGEMENT NOTIFICATIONS
// ============================================

/**
 * Welcome back notification for returning users
 */
window.notifyWelcomeBack = async function (userId, userName, lastLoginDate) {
    try {
        const now = new Date();
        const last = new Date(lastLoginDate);
        const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24));

        let timeMessage = '';
        if (daysSince === 0) {
            timeMessage = 'earlier today';
        } else if (daysSince === 1) {
            timeMessage = 'yesterday';
        } else if (daysSince < 7) {
            timeMessage = `${daysSince} days ago`;
        } else if (daysSince < 30) {
            const weeks = Math.floor(daysSince / 7);
            timeMessage = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else {
            const months = Math.floor(daysSince / 30);
            timeMessage = `${months} ${months === 1 ? 'month' : 'months'} ago`;
        }

        await window.createNotification({
            user_id: userId,
            type: 'welcome_back',
            title: `Welcome back, ${userName}! 👋`,
            message: `You last logged in ${timeMessage}. Check out what's new!`,
            metadata: {
                last_login: lastLoginDate,
                days_since: daysSince,
                action_type: 'login'
            },
            action_url: 'HOMEPAGE_FINAL.HTML',
            icon: 'Home',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying welcome back:', err);
    }
};

/**
 * Notify when user reports content
 */
window.notifyReportSubmitted = async function (userId, reportType, targetId, reason) {
    try {
        const reportTypeLabel = reportType === 'post' ? 'post' : 'user';

        await window.createNotification({
            user_id: userId,
            type: 'report_submitted',
            title: 'Report Submitted ✓',
            message: `Your report on this ${reportTypeLabel} has been received. We'll review it within 24 hours.`,
            metadata: {
                report_type: reportType,
                target_id: targetId,
                reason: reason,
                reference_id: `REF-${Date.now().toString(36).toUpperCase()}`
            },
            icon: 'Shield',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying report submitted:', err);
    }
};

/**
 * Notify user about incomplete profile with RQS boost potential
 */
window.notifyProfileIncomplete = async function (userId, missingFields, rqsBoost) {
    try {
        const fieldsList = missingFields.join(', ');
        const boost = rqsBoost || (missingFields.length * 5);

        await window.createNotification({
            user_id: userId,
            type: 'profile_incomplete',
            title: 'Complete Your Profile 📝',
            message: `Add your ${fieldsList} to boost your RQS by +${boost} points`,
            metadata: {
                missing_fields: missingFields,
                potential_boost: boost,
                completion_percentage: Math.max(0, 100 - (missingFields.length * 20))
            },
            action_url: 'PRIVATE OWNER PROFILE.HTML?edit=true',
            icon: 'User',
            category: 'system',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying profile incomplete:', err);
    }
};

/**
 * Notify when user reaches RQS milestones (50, 75, 90, 100)
 */
window.notifyRQSMilestone = async function (userId, milestone, currentScore) {
    try {
        let title, message, emoji;

        switch (milestone) {
            case 50:
                emoji = '🎯';
                title = 'RQS Milestone: 50 Points!';
                message = 'Halfway there! Your opinions are making an impact.';
                break;
            case 75:
                emoji = '⭐';
                title = 'RQS Milestone: 75 Points!';
                message = 'Excellent progress! You\'re building a strong reputation.';
                break;
            case 90:
                emoji = '🔥';
                title = 'RQS Milestone: 90 Points!';
                message = 'Almost perfect! Just 10 more points to reach the top tier.';
                break;
            case 100:
                emoji = '🏆';
                title = 'RQS Milestone: Perfect 100!';
                message = 'Congratulations! You\'ve achieved the highest reputation score.';
                break;
            default:
                emoji = '📊';
                title = `RQS Milestone: ${milestone} Points!`;
                message = 'Great work on building your reputation!';
        }

        await window.createNotification({
            user_id: userId,
            type: 'rqs_milestone',
            title: `${title} ${emoji}`,
            message: message,
            metadata: {
                milestone: milestone,
                current_score: currentScore,
                next_milestone: milestone < 100 ? Math.min(milestone + 25, 100) : 100
            },
            action_url: 'MY SPACE FINAL (USER).HTML?view=rqs',
            icon: 'Award',
            category: 'achievement',
            priority: 'high'
        });
    } catch (err) {
        console.error('Error notifying RQS milestone:', err);
    }
};

/**
 * Notify about partner program progress
 */
window.notifyPartnerProgress = async function (userId, currentProgress, breakdown) {
    try {
        const remaining = 100 - currentProgress;
        const { rqsProgress = 0, interactionProgress = 0, streakProgress = 0 } = breakdown || {};

        let focusArea = '';
        if (rqsProgress < 100) {
            focusArea = 'Boost your RQS score';
        } else if (interactionProgress < 100) {
            focusArea = 'Increase community interactions';
        } else if (streakProgress < 100) {
            focusArea = 'Maintain your active streak';
        }

        await window.createNotification({
            user_id: userId,
            type: 'partner_progress',
            title: `Partner Program: ${currentProgress}% Complete`,
            message: `${remaining}% to go! ${focusArea} to reach eligibility.`,
            metadata: {
                current_progress: currentProgress,
                remaining: remaining,
                rqs_progress: rqsProgress,
                interaction_progress: interactionProgress,
                streak_progress: streakProgress,
                focus_area: focusArea
            },
            action_url: 'MY SPACE FINAL (USER).HTML?view=monetization',
            icon: 'TrendingUp',
            category: 'monetization',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying partner progress:', err);
    }
};

/**
 * Encourage new users to post their first opinion
 */
window.notifyFirstPostEncouragement = async function (userId, userName) {
    try {
        await window.createNotification({
            user_id: userId,
            type: 'first_post_encouragement',
            title: `${userName}, Share Your Voice! 💡`,
            message: 'Post your first opinion today. We guarantee your voice will be heard and it will boost your RQS!',
            metadata: {
                action_type: 'encouragement',
                is_first_post: true
            },
            action_url: 'HOMEPAGE_FINAL.HTML',
            icon: 'Edit',
            category: 'engagement',
            priority: 'normal'
        });
    } catch (err) {
        console.error('Error notifying first post encouragement:', err);
    }
};

// ============================================
// MILESTONE TRACKING HELPERS
// ============================================

/**
 * Check if user has already received a specific notification type
 */
async function hasReceivedNotification(userId, notificationType) {
    try {
        const { data, error } = await window.supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('type', notificationType)
            .limit(1);

        if (error) throw error;
        return data && data.length > 0;
    } catch (err) {
        console.error('Error checking notification history:', err);
        return false; // Safe default: don't block notification
    }
}

/**
 * Get last notification of a specific type
 */
async function getLastNotification(userId, notificationType) {
    try {
        const { data, error } = await window.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('type', notificationType)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        return null;
    }
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
    const diff = Math.abs(new Date(date2) - new Date(date1));
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check and trigger RQS milestone notifications
 */
window.checkRQSMilestone = async function (userId, newScore) {
    try {
        const milestones = [50, 75, 90, 100];

        for (const milestone of milestones) {
            if (newScore >= milestone) {
                const notifType = `rqs_milestone_${milestone}`;
                const alreadyNotified = await hasReceivedNotification(userId, notifType);

                if (!alreadyNotified) {
                    await window.notifyRQSMilestone(userId, milestone, newScore);
                }
            }
        }
    } catch (err) {
        console.error('Error checking RQS milestones:', err);
    }
};

/**
 * Check profile completion and send reminder if needed
 */
window.checkProfileCompletion = async function (userId) {
    try {
        // Validate userId to prevent invalid UUID errors
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            // Invalid userId - silently return (logging disabled for security)
            return;
        }

        // Additional check: ensure it's not an object stringified
        if (userId === '[object Object]' || userId.includes('[object')) {
            // Object passed instead of string - silently return (logging disabled for security)
            return;
        }

        // Validate UUID format (basic check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            // Invalid UUID format - silently return (logging disabled for security)
            return;
        }

        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('bio, avatar_url, location, website')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const missingFields = [];
        if (!profile.bio) missingFields.push('bio');
        if (!profile.avatar_url) missingFields.push('profile picture');
        if (!profile.location) missingFields.push('location');

        if (missingFields.length > 0) {
            // Check last reminder date (max once per week)
            const lastReminder = await getLastNotification(userId, 'profile_incomplete');
            const daysSinceReminder = lastReminder ? daysBetween(lastReminder.created_at, new Date()) : 999;

            if (daysSinceReminder >= 7) {
                const rqsBoost = missingFields.length * 5;
                await window.notifyProfileIncomplete(userId, missingFields, rqsBoost);
            }
        }
    } catch (err) {
        console.error('Error checking profile completion:', err);
    }
};

/**
 * Send weekly partner progress update (only if progress < 100%)
 */
window.sendWeeklyPartnerUpdate = async function (userId) {
    try {
        // Get partner stats
        const stats = await window.getPartnerStats();
        const profile = await window.getMyProfile();

        if (!stats || !profile) return;

        // Calculate progress
        const rqsProgress = Math.min((profile.rqs / 75) * 100, 100);
        const intProgress = Math.min((stats.interactionCount / 500) * 100, 100);
        const streakProgress = Math.min((stats.streakWeeks / 4) * 100, 100);
        const totalProgress = Math.round((rqsProgress + intProgress + streakProgress) / 3);

        // Only send if not at 100%
        if (totalProgress < 100) {
            // Check last update (max once per week)
            const lastUpdate = await getLastNotification(userId, 'partner_progress');
            const daysSinceUpdate = lastUpdate ? daysBetween(lastUpdate.created_at, new Date()) : 999;

            if (daysSinceUpdate >= 7) {
                await window.notifyPartnerProgress(userId, totalProgress, {
                    rqsProgress,
                    interactionProgress: intProgress,
                    streakProgress
                });
            }
        }
    } catch (err) {
        console.error('Error sending weekly partner update:', err);
    }
};

/**
 * Check if user should receive first post encouragement
 */
window.checkFirstPostEncouragement = async function (userId, userName) {
    try {
        // Check if user has any posts
        const { count, error } = await window.supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_deleted', false);

        if (error) throw error;

        // If no posts, check if we've already sent encouragement
        if (count === 0) {
            const alreadySent = await hasReceivedNotification(userId, 'first_post_encouragement');

            if (!alreadySent) {
                // Check account age (only send if account is at least 24 hours old)
                const { data: profile } = await window.supabase
                    .from('profiles')
                    .select('created_at')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    const hoursSinceSignup = (new Date() - new Date(profile.created_at)) / (1000 * 60 * 60);

                    if (hoursSinceSignup >= 24) {
                        await window.notifyFirstPostEncouragement(userId, userName);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error checking first post encouragement:', err);
    }
};

// Export helper functions
window.hasReceivedNotification = hasReceivedNotification;
window.getLastNotification = getLastNotification;

// ============================================
// NOTIFICATION RETRIEVAL & MANAGEMENT
// These 3 functions are called by NOTIFICATION PANEL.HTML
// and MUST exist here for correct read/delete behaviour.
// ============================================

/**
 * Fetch notifications for the current user from the database.
 * Returns raw rows — the panel formats them via formatNotification().
 */
window.getNotifications = async function ({ limit = 50, offset = 0 } = {}) {
    try {
        const user = await window.getCurrentUser();
        if (!user) return [];

        const { data, error } = await window.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('[Notifications] getNotifications failed:', err);
        return [];
    }
};

/**
 * Mark a single notification as read in the database.
 * @param {string} notificationId - The UUID of the notification row.
 */
window.markNotificationRead = async function (notificationId) {
    if (!notificationId) return;
    try {
        const { error } = await window.supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;

        // Optimistically update badge count across app
        const currentCount = window.getUnreadCountFromCache();
        const newCount = Math.max(0, currentCount - 1);
        localStorage.setItem('unread_count', newCount);
        window.dispatchEvent(new CustomEvent('unread_count_updated', { detail: { count: newCount } }));

        console.log('[Notifications] Marked as read:', notificationId);
    } catch (err) {
        console.error('[Notifications] markNotificationRead failed:', err);
    }
};

/**
 * Mark ALL notifications for the current user as read.
 */
window.markAllNotificationsRead = async function () {
    try {
        const user = await window.getCurrentUser();
        if (!user) return;

        const { error } = await window.supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) throw error;

        // Clear badge count across app
        localStorage.setItem('unread_count', 0);
        window.dispatchEvent(new CustomEvent('unread_count_updated', { detail: { count: 0 } }));

        console.log('[Notifications] All marked as read');
    } catch (err) {
        console.error('[Notifications] markAllNotificationsRead failed:', err);
    }
};

/**
 * Hard-delete a notification from the database.
 * @param {string} notificationId - The UUID of the notification row.
 */
window.deleteNotification = async function (notificationId) {
    if (!notificationId) return;
    try {
        const { error } = await window.supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
        console.log('[Notifications] Deleted:', notificationId);
    } catch (err) {
        console.error('[Notifications] deleteNotification failed:', err);
        throw err; // re-throw so caller can handle UI rollback
    }
};

/**
 * Toggle is_bookmarked flag on a notification.
 * @param {string} notificationId - UUID of the notification.
 * @param {boolean} bookmarked - New bookmark state.
 */
window.toggleNotificationBookmark = async function (notificationId, bookmarked) {
    if (!notificationId) return;
    try {
        const { error } = await window.supabase
            .from('notifications')
            .update({
                metadata: window.supabase.rpc
                    ? undefined  // will be handled by merge below
                    : undefined
            });
        // Use a targeted update via jsonb merge instead of overwriting whole metadata
        const { error: err2 } = await window.supabase
            .from('notifications')
            .update({ is_bookmarked: bookmarked })
            .eq('id', notificationId);

        if (err2) throw err2;
    } catch (err) {
        console.error('[Notifications] toggleNotificationBookmark failed:', err);
        throw err;
    }
};

console.log('✅ Extended notification system loaded successfully');

