import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getCached, setCached, deleteCached, getScrollPosition, saveScrollPosition } from '../lib/dataCache';
import {
    getNotifications,
    deleteNotification,
    toggleNotificationBookmark,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount
} from '../lib/api/notifications';
import Icon from '../components/ui/Icon';
import Avatar from '../components/ui/Avatar';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';

// Module-level flag: persists in memory for the app session lifetime.
// Only the very first time Notifications is opened freshly will the smooth shower cascade play.
let hasPlayedInitialShower = false;

// VIBRATION HELPER
const vibrate = (ms) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(ms); } catch (e) { }
    }
};

const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
    return `${Math.floor(diffInSeconds / 31536000)}y`;
};

// --- COMPONENT PORTED FROM NOTIFICATION PANEL.jsx ---

const formatNotification = (data) => {
    return {
        id: data.id,
        _dbId: data.id,
        type: data.type,
        category: data.category,
        title: data.title,
        desc: data.message,
        time: formatTimeAgo(data.created_at),
        fullDate: new Date(data.created_at).toLocaleString(),
        unread: !data.is_read,
        critical: data.priority === 'critical',
        action_url: data.action_url,
        related_post_id: data.related_post_id,
        actor_id: data.related_user_id || data.metadata?.actor_id || null,
        metadata: data.metadata || {},
        icon: data.icon || 'Bell',
        is_bookmarked: data.metadata?.is_bookmarked || false,
        _status: 'active',
        _action: null
    };
};

const extractActorFromText = (text) => {
    if (!text) return null;
    const match = text.match(/^([^]+?)\s+(?:agreed with|commented on|liked your|replied to|mentioned you|saved your|has seen your)/i);
    return match ? match[1].trim() : null;
};

const extractProductFromText = (text) => {
    if (!text) return null;
    const match = text.match(/(?:on|of|about their product)\s+'([^']+)'/i);
    if (match) return match[1].trim();
    const matchAlt = text.match(/(?:on|of)\s+([A-Z0-9][A-Za-z0-9\s.-]{2,30})/);
    return matchAlt ? matchAlt[1].trim() : null;
};

const extractPostId = (item) => {
    if (!item) return null;
    if (item.related_post_id) return item.related_post_id;
    if (item.metadata?.post_id) return item.metadata.post_id;
    if (item.action_url) {
        try {
            const parsed = item.action_url.startsWith('http')
                ? new URL(item.action_url)
                : new URL(item.action_url, 'https://plusopinion.com');
            const p = parsed.searchParams.get('post') || parsed.searchParams.get('id');
            if (p) return p;
        } catch (_) {
            const m = item.action_url.match(/[?&](?:post|id)=([a-zA-Z0-9_-]+)/);
            if (m) return m[1];
        }
        const postPath = item.action_url.match(/\/post\/([a-zA-Z0-9_-]+)/);
        if (postPath) return postPath[1];
    }
    return null;
};

const renderTextWithMentions = (text) => {
    if (!text) return null;
    const mentionRegex = /(@\w+)/g;
    return text.split(mentionRegex).map((part, i) => {
        if (part.startsWith('@')) {
            return <span key={i} className="text-neon font-semibold">{part}</span>;
        }
        return part;
    });
};

const getNotificationDetails = (data) => {
    const meta = data.metadata || {};
    const type = (data.type || '').toLowerCase();
    const category = (data.category || '').toLowerCase();
    const titleRaw = data.title || '';
    const messageRaw = data.desc || data.message || '';

    // 1. Resolve Actor & Brand
    const actorName = meta.actor_name || extractActorFromText(messageRaw) || (meta.actor_username ? `@${meta.actor_username}` : null);
    const actorAvatar = meta.actor_avatar || null;
    const brandName = meta.brand_name || ((type.includes('brand') || category === 'brand') ? extractActorFromText(messageRaw) || 'Brand' : null);

    // 2. Resolve Product & Category Context
    const productName = meta.product_name || meta.item_name || extractProductFromText(messageRaw) || extractProductFromText(titleRaw);
    const categoryName = meta.category || null;
    let postContext = null;
    if (categoryName && productName) {
        postContext = `on ${categoryName} / ${productName}`;
    } else if (productName) {
        postContext = `on '${productName}'`;
    } else if (categoryName) {
        postContext = `on ${categoryName}`;
    }

    // 3. Resolve Content Snippets
    // Primary comment or reply snippet
    const commentText = meta.reply_text || meta.comment_text || meta.comment_preview || null;

    // Reply context (the parent comment that was replied to)
    const replyContext = (type === 'comment_replied' || type === 'reply')
        ? (meta.parent_comment_preview || (meta.reply_text && meta.comment_preview ? meta.comment_preview : null))
        : null;

    // Post preview (original opinion snippet)
    const postPreview = meta.post_preview || meta.post_full_text || null;

    // Fallback message text for system/brand
    let displayMessage = null;

    // Badges, icons and colors
    let badgeIcon = 'Bell';
    let displayTitle = titleRaw || 'Notification';
    let displayTag = null;
    let isUserSocial = false;

    if (type === 'post_liked' || type === 'post_agreed' || type === 'agree' || type === 'like') {
        isUserSocial = true;
        badgeIcon = 'ThumbsUp';
        displayTitle = actorName ? `${actorName} agreed` : 'New Agreement';
    } else if (type === 'post_commented' || type === 'comment') {
        isUserSocial = true;
        badgeIcon = 'MessageCircle';
        displayTitle = actorName ? `${actorName} commented` : 'New Comment';
    } else if (type === 'comment_replied' || type === 'reply') {
        isUserSocial = true;
        badgeIcon = 'CornerDownRight';
        displayTitle = actorName ? `${actorName} replied` : 'New Reply';
    } else if (type === 'comment_liked' || type === 'like_comment') {
        isUserSocial = true;
        badgeIcon = 'ThumbsUp';
        displayTitle = actorName ? `${actorName} agreed with your comment` : 'Comment Agreed';
    } else if (type === 'mention' || type === 'mentioned') {
        isUserSocial = true;
        badgeIcon = 'AtSign';
        displayTitle = actorName ? `${actorName} mentioned you` : 'New Mention';
    } else if (type === 'post_bookmarked' || type === 'saved') {
        isUserSocial = true;
        badgeIcon = 'BookmarkFilled';
        displayTitle = actorName ? `${actorName} saved your opinion` : 'Post Saved';
    } else if (category === 'brand' || type === 'brand_view' || type === 'brand_seen' || type === 'brand_insight') {
        badgeIcon = 'Eye';
        displayTitle = brandName ? `${brandName} Viewed Your Opinion` : 'Brand Viewed Your Opinion';
        displayMessage = productName ? `Your review on '${productName}' caught the brand's attention.` : 'Your opinion was viewed by the brand.';
        displayTag = 'Brand Activity';
    } else if (category === 'revenue' || type === 'revenue_credit') {
        badgeIcon = 'Wallet';
        displayTitle = 'Wallet Credited';
        displayMessage = meta.amount ? `You earned ₹${meta.amount} for your review.` : messageRaw;
        displayTag = meta.amount ? `+ ₹${meta.amount}` : 'Revenue';
    } else if (type.includes('partner')) {
        badgeIcon = 'Award';
        displayTitle = titleRaw || 'Creator Partner Program';
        displayMessage = messageRaw || 'Progress towards the Creator Partner Program';
        displayTag = meta.signal || '(Setting up)';
    } else if (type.includes('rqs') || type === 'profile_incomplete') {
        badgeIcon = 'Zap';
        displayTitle = titleRaw || 'RQS Update';
        displayMessage = messageRaw;
        displayTag = meta.potential_boost ? `+${meta.potential_boost} RQS` : (meta.new_score ? `RQS ${meta.new_score}` : (meta.milestone ? `RQS ${meta.milestone}` : 'RQS'));
    } else if (category === 'security' || type.includes('password') || type.includes('pin') || type.includes('security') || type.includes('login')) {
        badgeIcon = 'ShieldAlert';
        displayTitle = titleRaw || 'Security Alert';
        displayMessage = messageRaw || 'Your account security details were updated.';
        displayTag = 'Security';
    } else if (type === 'welcome' || type === 'welcome_back') {
        badgeIcon = type === 'welcome_back' ? 'LogIn' : 'Sparkles';
        displayTitle = titleRaw || (type === 'welcome_back' ? 'Welcome Back!' : 'Welcome to PlusOpinion!');
        displayMessage = messageRaw || 'Discover authentic opinions and share your honest voice.';
        displayTag = 'System';
    } else if (type === 'post_deleted' || type === 'post_removed') {
        badgeIcon = 'Trash2';
        displayTitle = titleRaw || 'Post Removed';
        displayMessage = messageRaw || (productName ? `Your post on '${productName}' was removed.` : 'A post was removed following review.');
        displayTag = 'System';
    } else if (type === 'report_submitted' || category === 'moderation') {
        badgeIcon = 'AlertTriangle';
        displayTitle = titleRaw || 'Report Submitted';
        displayMessage = messageRaw;
        displayTag = 'Moderation';
    } else {
        badgeIcon = data.icon || 'Bell';
        displayTitle = titleRaw || 'Notification';
        displayMessage = messageRaw;
        if (category === 'system') displayTag = 'System';
    }

    return {
        actorName,
        actorAvatar,
        brandName,
        displayTitle,
        displayMessage,
        commentText,
        replyContext,
        postPreview,
        postContext,
        displayTag,
        badgeIcon,
        isUserSocial,
        mediaUrl: meta.post_media,
        mediaType: meta.post_media_type || 'image'
    };
};

const UndoRow = ({ action, onUndo, onDismiss }) => (
    <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
        <span className="text-sm font-medium text-white/70">
            {action === 'delete' ? 'Notification deleted' : 'Saved to Bookmarks'}
        </span>
        <div className="flex items-center gap-4">
            <button
                onClick={(e) => { e.stopPropagation(); onUndo(); }}
                className="text-sm font-bold text-neon hover:text-white transition-colors"
            >
                Undo
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="text-white/40 hover:text-white transition-colors p-2 -mr-2"
            >
                <Icon icon="X" size={16} />
            </button>
        </div>
    </div>
);

const NotificationItem = ({ data, onSwipe, onClick, highlightId }) => {
    const isHighlighted = highlightId === data.id;
    const isUnread = data.unread;
    const x = useMotionValue(0);
    const background = useTransform(
        x,
        [-100, 0, 100],
        ['rgb(239, 68, 64)', 'rgb(255, 255, 255, 0)', 'rgb(59, 130, 246)']
    );
    const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
    const saveOpacity = useTransform(x, [50, 100], [0, 1]);
    const navigate = useNavigate();

    const dragDistance = useRef(0);
    const isDraggingRef = useRef(false);
    const lastNavTime = useRef(0);

    const handleDragStart = () => {
        isDraggingRef.current = true;
    };

    const handleDrag = (_, info) => {
        dragDistance.current = Math.abs(info.offset.x);
    };

    const handleDragEnd = (event, info) => {
        const offset = info.offset.x;
        setTimeout(() => {
            isDraggingRef.current = false;
            dragDistance.current = 0;
        }, 150);

        if (offset < -75) {
            onSwipe(data.id, 'delete');
        } else if (offset > 75) {
            onSwipe(data.id, 'bookmark');
        } else {
            x.set(0);
        }
    };

    const handleAvatarClick = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const actorId = data.actor_id || data.metadata?.actor_id || data.metadata?.user_id;
        if (actorId) {
            navigate(`/profile?id=${actorId}`);
        } else if (data.metadata?.brand_id || data.metadata?.company_id) {
            navigate(`/myspace?id=${data.metadata.brand_id || data.metadata.company_id}`);
        } else if (details.actorName && details.actorName.startsWith('@')) {
            navigate(`/profile?username=${details.actorName.slice(1)}`);
        }
    };

    const handleNavigation = () => {
        // Mark as read optimistically
        if (data.unread && onClick) {
            onClick(data.id);
        }

        // 1. Check if linked to a post
        const postId = extractPostId(data);
        if (postId) {
            const commentId = data.metadata?.comment_id;
            navigate(`/post/${postId}${commentId ? `?comment=${commentId}` : ''}`);
            return;
        }

        // 2. Normalize and follow action_url if present
        if (data.action_url) {
            const rawUrl = data.action_url;
            const lower = rawUrl.toLowerCase();

            if (lower.includes('myspace') || lower.includes('my space')) {
                if (lower.includes('rqs')) navigate('/myspace?view=rqs');
                else if (lower.includes('monetization') || lower.includes('partner') || lower.includes('revenue')) navigate('/myspace?view=monetization');
                else navigate('/myspace');
                return;
            }
            if (lower.includes('private owner profile') || lower.includes('settings')) {
                if (lower.includes('security') || lower.includes('edit')) navigate('/settings');
                else navigate('/myprofile');
                return;
            }
            if (lower.includes('public pov profile') || lower.includes('profile')) {
                const idMatch = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if (idMatch) navigate(`/profile?id=${idMatch[1]}`);
                else navigate('/profile');
                return;
            }
            if (lower.includes('catagory') || lower.includes('categories')) {
                navigate('/categories');
                return;
            }
            if (lower.includes('homepage') || lower === '/' || lower.startsWith('/?')) {
                const postMatch = rawUrl.match(/[?&]post=([a-zA-Z0-9_-]+)/);
                if (postMatch) {
                    navigate(`/post/${postMatch[1]}`);
                    return;
                }
                navigate('/feed');
                return;
            }
            if (rawUrl.startsWith('/')) {
                navigate(rawUrl);
                return;
            }
            if (rawUrl.startsWith('http')) {
                window.location.href = rawUrl;
                return;
            }
        }

        // 3. Fallbacks for system / interactive categories
        const type = (data.type || '').toLowerCase();
        const category = (data.category || '').toLowerCase();

        if (category === 'revenue' || type === 'revenue_credit') {
            navigate('/myspace?view=monetization');
            return;
        }
        if (type.includes('partner')) {
            navigate('/myspace?view=monetization');
            return;
        }
        if (type.includes('rqs') || type === 'profile_incomplete') {
            navigate('/myspace?view=rqs');
            return;
        }
        if (category === 'security' || type.includes('password') || type.includes('pin') || type.includes('login')) {
            navigate('/settings');
            return;
        }
        if (type === 'welcome' || type === 'welcome_back') {
            navigate('/feed');
            return;
        }

        // 4. Static system notifications (post_deleted, etc.) stay static — no broken redirects
    };

    const triggerNavigation = (e) => {
        if (e && e.defaultPrevented) return;
        const target = e?.target;
        if (target && (target.closest('.avatar-click-target') || target.closest('button') || target.closest('.user-profile-link'))) {
            return;
        }
        if (isDraggingRef.current || dragDistance.current > 8) return;
        const now = Date.now();
        if (now - lastNavTime.current < 450) return;
        lastNavTime.current = now;

        handleNavigation();
    };

    const details = getNotificationDetails(data);

    return (
        <div id={`notif-${data.id}`} className="notification-item relative border-b border-white/5 overflow-hidden touch-pan-y group select-none">
            {/* Swipe Actions Background */}
            <motion.div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none" style={{ background }}>
                <motion.div style={{ opacity: saveOpacity }} className="flex items-center gap-2 text-white font-bold">
                    <Icon icon={data.is_bookmarked ? "BookmarkFilled" : "Bookmark"} size={20} />
                    <span>{data.is_bookmarked ? 'Unsave' : 'Save'}</span>
                </motion.div>
                <motion.div style={{ opacity: deleteOpacity }} className="flex items-center gap-2 text-white font-bold">
                    <span>Delete</span>
                    <Icon icon="Trash" size={20} />
                </motion.div>
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onTap={(event, info) => {
                    if (Math.abs(info?.offset?.x || 0) < 8) {
                        triggerNavigation(event);
                    }
                }}
                onClick={triggerNavigation}
                style={{ x }}
                className={`relative flex gap-3.5 p-4 sm:px-6 cursor-pointer transition-colors
                    ${isHighlighted ? 'bg-blue-500/20' : 'bg-[#020205]'}
                    ${isUnread && !isHighlighted ? 'bg-white/[0.03]' : ''}
                    hover:bg-white/[0.04] active:bg-white/[0.06]`}
            >
                {/* Critical or Unread left accent */}
                {data.critical && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,64,0.5)]"></div>
                )}
                {isUnread && !data.critical && (
                    <div className="absolute top-5 left-1.5 w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_8px_var(--neon)]"></div>
                )}

                {/* Left: Avatar / Sub-icon or System Icon Tile */}
                <div className="relative shrink-0 pt-0.5">
                    {details.actorAvatar || details.isUserSocial ? (
                        <div 
                            className="relative w-11 h-11 cursor-pointer avatar-click-target z-20" 
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={handleAvatarClick}
                            title="View Profile"
                        >
                            <Avatar 
                                src={details.actorAvatar} 
                                className="w-11 h-11 rounded-full object-cover border border-white/10 hover:border-white/30 transition-colors pointer-events-none" 
                                fallbackSize={20} 
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1A1C23] flex items-center justify-center border-2 border-[#020205] shadow-sm pointer-events-none">
                                <Icon icon={details.badgeIcon} size={10} className="text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-white">
                            <Icon icon={details.badgeIcon} size={20} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Middle: Content Area */}
                <div className="flex-1 min-w-0">
                    {/* Header: Title + Timestamp + Bookmark */}
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span 
                                className={`font-semibold text-[14px] leading-snug ${details.actorName && details.isUserSocial ? 'user-profile-link cursor-pointer hover:text-neon transition-colors' : ''} ${isUnread ? 'text-white font-bold' : 'text-slate-200'}`}
                                onClick={(e) => {
                                    if (details.actorName && details.isUserSocial) {
                                        const actorId = data.actor_id || data.metadata?.actor_id || data.metadata?.user_id;
                                        if (actorId) {
                                            e.stopPropagation();
                                            navigate(`/profile?id=${actorId}`);
                                        }
                                    }
                                }}
                            >
                                {details.displayTitle}
                            </span>
                            {details.brandName && (
                                <Icon icon="CheckCircle" size={13} className="text-neon inline-block shrink-0" />
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                                {data.time}
                            </span>
                            {data.is_bookmarked && (
                                <Icon icon="BookmarkFilled" size={13} className="text-neon shrink-0" />
                            )}
                        </div>
                    </div>

                    {/* Body: Snippets, Context, Media */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                            {/* Primary Comment / Reply text */}
                            {details.commentText && (
                                <p className={`text-[13px] leading-snug break-words tracking-normal ${isUnread ? 'text-white font-medium' : 'text-slate-200'}`}>
                                    "{renderTextWithMentions(details.commentText)}"
                                </p>
                            )}

                            {/* Reply context ("In reply to: ...") */}
                            {details.replyContext && (
                                <div className="pl-2.5 border-l-2 border-white/20 py-0.5">
                                    <p className="text-[12px] text-slate-300 italic line-clamp-2 leading-relaxed">
                                        In reply to: "{renderTextWithMentions(details.replyContext)}"
                                    </p>
                                </div>
                            )}

                            {/* Post Preview Quote (for agreements, saves, or comment background) */}
                            {details.postPreview && !details.replyContext && (details.isUserSocial || !details.commentText) && (
                                <div className="pl-2.5 border-l-2 border-white/15 py-0.5">
                                    <p className="text-[12px] text-slate-300 italic line-clamp-2 leading-relaxed">
                                        "{renderTextWithMentions(details.postPreview)}"
                                    </p>
                                </div>
                            )}

                            {/* System / Brand description */}
                            {details.displayMessage && (
                                <p className={`text-[12.5px] leading-relaxed break-words ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                                    {details.displayMessage}
                                </p>
                            )}

                            {/* Context Line: "on Category / Product" */}
                            {details.postContext && (
                                <div className="text-[11.5px] text-slate-400 font-medium tracking-tight">
                                    {details.postContext}
                                </div>
                            )}

                            {/* Display Tag */}
                            {details.displayTag && (
                                <div className="pt-0.5">
                                    <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-md inline-block bg-white/10 text-white border border-white/15">
                                        {details.displayTag}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right side: Media Thumbnail */}
                        {details.mediaUrl && (
                            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-sm mt-0.5">
                                {details.mediaType === 'video' ? (
                                    <video
                                        src={details.mediaUrl}
                                        className="w-full h-full object-cover opacity-90"
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={`${details.mediaUrl}?width=150&quality=70&resize=cover`}
                                        className="w-full h-full object-cover opacity-90"
                                        alt="Post thumbnail"
                                        onError={(e) => {
                                            e.target.src = details.mediaUrl;
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const FilterModal = ({ isOpen, onClose, activeFilter, onSelect }) => {
    if (!isOpen) return null;
    const filters = ['All', 'Unread', 'System', 'Brand Activity', 'Mentions'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-heading font-bold text-lg text-white">Filter Feed</h3>
                    <button onClick={onClose}><span className="text-sm text-neon font-bold">Done</span></button>
                </div>
                <div className="flex flex-wrap gap-3">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => onSelect(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${activeFilter === f ? 'bg-neon/10 border-neon text-neon' : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/20'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, settings, onToggle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <h3 className="font-heading font-bold text-lg text-white mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">Show Unread Count</p>
                            <p className="text-xs text-slate-400">Badge in header</p>
                        </div>
                        <button onClick={() => onToggle('showCount')} className="text-neon transition-all">
                            <Icon icon={settings.showCount ? 'ToggleRight' : 'ToggleLeft'} size={32} className={settings.showCount ? 'text-neon' : 'text-slate-500'} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">Push Notifications</p>
                            <p className="text-xs text-slate-400">Real-time alerts</p>
                        </div>
                        <button onClick={() => onToggle('push')} className="text-neon transition-all">
                            <Icon icon={settings.push ? 'ToggleRight' : 'ToggleLeft'} size={32} className={settings.push ? 'text-neon' : 'text-slate-500'} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">Email Digest</p>
                            <p className="text-xs text-slate-400">Weekly summary</p>
                        </div>
                        <button onClick={() => onToggle('email')} className="text-neon transition-all">
                            <Icon icon={settings.email ? 'ToggleRight' : 'ToggleLeft'} size={32} className={settings.email ? 'text-neon' : 'text-slate-500'} />
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="w-full mt-8 bg-white/5 py-3 rounded-xl text-white font-bold text-sm hover:bg-white/10 transition-colors">Close</button>
            </div>
        </div>
    );
};

export default function Notifications() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const highlightIdParam = searchParams.get('highlight');
    const [highlightId, setHighlightId] = useState(null);

    const [filter, setFilter] = useState('All');
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [navVisible, setNavVisible] = useState(true);
    const lastY = useRef(0);
    const scrollRef = useRef(null);
    const deleteTimers = useRef({});

    const [settings, setSettings] = useState({
        showCount: true,
        push: true,
        email: false
    });

    // Only play the smooth shower cascade animation on the VERY FIRST opening of Notifications in this app session
    const [shouldAnimateShower, setShouldAnimateShower] = useState(!hasPlayedInitialShower);

    useEffect(() => {
        if (!loading && notifications.length > 0 && !hasPlayedInitialShower) {
            hasPlayedInitialShower = true;
            const timer = setTimeout(() => {
                setShouldAnimateShower(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [loading, notifications.length]);

    const handleScroll = useCallback((e) => {
        const currentY = e.target.scrollTop;
        if (currentY <= 50) {
            setNavVisible(true);
            window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }));
        } else {
            const delta = currentY - lastY.current;
            if (Math.abs(delta) >= 6) {
                if (delta > 0) {
                    setNavVisible(false);
                    window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: false } }));
                } else {
                    setNavVisible(true);
                    window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }));
                }
            }
        }
        lastY.current = currentY;
        saveScrollPosition('notifications_scroll', currentY);
    }, []);

    const fetchFreshNotifications = useCallback(async (isInitial = false) => {
        if (!user) return;
        try {
            const cacheKey = `notifications_${user.id}`;
            if (isInitial) {
                const cachedData = getCached(cacheKey);
                if (cachedData) {
                    setNotifications(cachedData);
                    setHasUnread(cachedData.some(n => n.unread));
                    setLoading(false);
                }
            }

            // Fetch fresh data
            const data = await getNotifications({ limit: 50 });
            const formatted = data.map(formatNotification);

            // Fetch missing avatars for actors
            const notificationsWithMissingAvatars = formatted.filter(
                n => n.actor_id && !n.metadata?.actor_avatar
            );

            if (notificationsWithMissingAvatars.length > 0) {
                const userIds = [...new Set(notificationsWithMissingAvatars.map(n => n.actor_id))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url')
                    .in('id', userIds);

                if (profiles) {
                    const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
                    formatted.forEach(n => {
                        if (n.actor_id && profileMap[n.actor_id]) {
                            const profile = profileMap[n.actor_id];
                            if (!n.metadata) n.metadata = {};
                            if (!n.metadata.actor_avatar && profile.avatar_url) {
                                n.metadata.actor_avatar = profile.avatar_url;
                            }
                            if (!n.metadata.actor_name) {
                                n.metadata.actor_name = profile.full_name || profile.username;
                            }
                        }
                    });
                }
            }

            // Fetch missing post context (product_name, category, post_preview, post_media)
            const postIdsToFetch = formatted
                .filter(n => n.related_post_id && (!n.metadata?.product_name || !n.metadata?.post_preview))
                .map(n => n.related_post_id);

            if (postIdsToFetch.length > 0) {
                const uniquePostIds = [...new Set(postIdsToFetch)];
                try {
                    const { data: posts } = await supabase
                        .from('posts')
                        .select('id, product_name, category, text_content, media_url, media_type')
                        .in('id', uniquePostIds);

                    if (posts && posts.length > 0) {
                        const postMap = posts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
                        formatted.forEach(n => {
                            if (n.related_post_id && postMap[n.related_post_id]) {
                                const p = postMap[n.related_post_id];
                                if (!n.metadata) n.metadata = {};
                                if (!n.metadata.product_name && p.product_name) n.metadata.product_name = p.product_name;
                                if (!n.metadata.category && p.category) n.metadata.category = p.category;
                                if (!n.metadata.post_preview && p.text_content) n.metadata.post_preview = p.text_content.slice(0, 120);
                                if (!n.metadata.post_media && p.media_url) {
                                    n.metadata.post_media = p.media_url;
                                    n.metadata.post_media_type = p.media_type;
                                }
                            }
                        });
                    }
                } catch (e) {}
            }

            // Fetch missing comment text if comment_id is present but comment text is missing
            const commentIdsToFetch = formatted
                .filter(n => n.metadata?.comment_id && !n.metadata?.comment_text && !n.metadata?.comment_preview)
                .map(n => n.metadata.comment_id);

            if (commentIdsToFetch.length > 0) {
                const uniqueCommentIds = [...new Set(commentIdsToFetch)];
                try {
                    const { data: comments } = await supabase
                        .from('comments')
                        .select('id, content')
                        .in('id', uniqueCommentIds);

                    if (comments && comments.length > 0) {
                        const commentMap = comments.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
                        formatted.forEach(n => {
                            if (n.metadata?.comment_id && commentMap[n.metadata.comment_id]) {
                                n.metadata.comment_text = commentMap[n.metadata.comment_id].content;
                                n.metadata.comment_preview = commentMap[n.metadata.comment_id].content;
                            }
                        });
                    }
                } catch (e) {}
            }

            setNotifications(formatted);
            setHasUnread(formatted.some(n => n.unread));
            setLoading(false);
            setCached(cacheKey, formatted);
        } catch (err) {
            console.error('Error loading notifications:', err);
            setLoading(false);
        }
    }, [user]);

    const handlePullRefresh = useCallback(async () => {
        await fetchFreshNotifications(false);
    }, [fetchFreshNotifications]);

    const ptr = usePullToRefresh(scrollRef, handlePullRefresh);
    const lastTapToTopRef = useRef(0);

    // Handle re-click on Notifications nav tab: first click scrolls to top, subsequent clicks instant PTR
    useEffect(() => {
        const handleNavTabReclick = (e) => {
            if (e.detail?.tab === 'notifications') {
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                const now = Date.now();
                const currentScroll = scrollRef.current ? scrollRef.current.scrollTop : 0;

                if (currentScroll > 20) {
                    if (now - lastTapToTopRef.current < 1200) {
                        lastTapToTopRef.current = 0;
                        if (scrollRef.current) scrollRef.current.scrollTop = 0;
                        ptr.triggerPTR();
                    } else {
                        lastTapToTopRef.current = now;
                        if (scrollRef.current) {
                            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                } else {
                    lastTapToTopRef.current = 0;
                    ptr.triggerPTR();
                }
            }
        };
        window.addEventListener('nav_tab_reclick', handleNavTabReclick);
        return () => window.removeEventListener('nav_tab_reclick', handleNavTabReclick);
    }, [ptr]);

    useEffect(() => {
        if (!user) return;
        let isMounted = true;
        fetchFreshNotifications(true);
        return () => { isMounted = false; };
    }, [user, fetchFreshNotifications]);

    useEffect(() => {
        if (!user) return;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.access_token) {
                try { supabase.realtime.setAuth(session.access_token); } catch (_) {}
            }
        }).catch(() => {});

        const subscription = supabase
            .channel(`notifications:page:${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, async (payload) => {
                let newPayload = { ...payload.new };
                if (newPayload.related_user_id) {
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, username, avatar_url')
                            .eq('id', newPayload.related_user_id)
                            .single();

                        if (profile) {
                            if (!newPayload.metadata) newPayload.metadata = {};
                            newPayload.metadata.actor_avatar = profile.avatar_url;
                            newPayload.metadata.actor_name = profile.full_name || profile.username;
                        }
                    } catch (err) {}
                }

                if (newPayload.related_post_id && (!newPayload.metadata?.product_name || !newPayload.metadata?.post_preview)) {
                    try {
                        const { data: post } = await supabase
                            .from('posts')
                            .select('product_name, category, text_content, media_url, media_type')
                            .eq('id', newPayload.related_post_id)
                            .single();
                        if (post) {
                            if (!newPayload.metadata) newPayload.metadata = {};
                            if (!newPayload.metadata.product_name) newPayload.metadata.product_name = post.product_name;
                            if (!newPayload.metadata.category) newPayload.metadata.category = post.category;
                            if (!newPayload.metadata.post_preview && post.text_content) newPayload.metadata.post_preview = post.text_content.slice(0, 120);
                            if (!newPayload.metadata.post_media && post.media_url) {
                                newPayload.metadata.post_media = post.media_url;
                                newPayload.metadata.post_media_type = post.media_type;
                            }
                        }
                    } catch (_) {}
                }

                const newNotif = formatNotification(newPayload);
                setNotifications(prev => {
                    const next = [newNotif, ...prev];
                    setCached(`notifications_${user.id}`, next);
                    return next;
                });
                setHasUnread(true);
                vibrate(10);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    // Unmount hook for marking notifications as read
    useEffect(() => {
        return () => {
            if (user) {
                // Delay slightly to not block unmount UI transition
                setTimeout(() => {
                    markAllNotificationsRead().then(() => {
                        window.dispatchEvent(new CustomEvent('unread_count_updated', { detail: 0 }));
                        const cacheKey = `notifications_${user.id}`;
                        const cached = getCached(cacheKey);
                        if (cached) {
                            const updated = cached.map(n => ({ ...n, unread: false }));
                            setCached(cacheKey, updated);
                        }
                    }).catch(()=>{});
                }, 100);
            }
        };
    }, [user]);

    useLayoutEffect(() => {
        if (!loading && notifications.length > 0) {
            const savedScroll = getScrollPosition('notifications_scroll');
            if (savedScroll > 0 && scrollRef.current) {
                const el = scrollRef.current;
                el.style.scrollBehavior = 'auto';
                el.scrollTop = savedScroll;
                requestAnimationFrame(() => {
                    if (el) el.style.scrollBehavior = '';
                });
            }
        }
    }, [loading]); // Only run once when loading finishes

    useEffect(() => {
        if (highlightIdParam && !loading && notifications.length > 0) {
            const id = highlightIdParam.toLowerCase();
            const match = notifications.find(n => String(n.id).toLowerCase() === id);

            if (match) {
                setHighlightId(match.id);
                setTimeout(() => {
                    const element = document.getElementById(`notif-${match.id}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 700);
                setTimeout(() => setHighlightId(null), 3500);
            }
        }
    }, [loading, notifications, highlightIdParam]);

    const handleSwipeV2 = async (id, action) => {
        vibrate(10);
        const notif = notifications.find(n => n.id === id);
        if (!notif) return;

        if (action === 'delete') {
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, _status: 'deleted', _action: action } : n
            ));

            // Delayed delete: Wait 5 seconds before hitting the DB
            deleteTimers.current[id] = setTimeout(async () => {
                try {
                    if (notif._dbId) {
                        await deleteNotification(notif._dbId);
                        deleteCached(`notifications_${user.id}`);
                    }
                } catch (err) {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to delete from DB', icon: 'AlertTriangle', isSuccess: false } }));
                } finally {
                    delete deleteTimers.current[id];
                }
            }, 5000);

        } else if (action === 'bookmark') {
            const newBookmarkState = !notif.is_bookmarked;
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_bookmarked: newBookmarkState } : n
            ));

            try {
                if (notif._dbId) {
                    await toggleNotificationBookmark(notif._dbId, newBookmarkState);
                    window.dispatchEvent(new CustomEvent('toast', {
                        detail: {
                            message: newBookmarkState ? 'Saved to Bookmarks' : 'Removed from Bookmarks',
                            icon: newBookmarkState ? 'BookmarkFilled' : 'Bookmark',
                            isSuccess: true
                        }
                    }));
                }
            } catch (err) {
                setNotifications(prev => prev.map(n =>
                    n.id === id ? { ...n, is_bookmarked: !newBookmarkState } : n
                ));
                window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to update bookmark', icon: 'AlertTriangle', isSuccess: false } }));
            }
        }
    };

    const handleUndoV2 = async (id) => {
        vibrate(5);
        const notif = notifications.find(n => n.id === id);
        const action = notif?._action;

        if (action === 'delete') {
            if (deleteTimers.current[id]) {
                clearTimeout(deleteTimers.current[id]);
                delete deleteTimers.current[id];
            }
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, _status: 'active', _action: null } : n
            ));
        } else if (action === 'bookmark') {
            // Un-bookmark logic if needed. (Right now bookmarks don't have an undo row, they just toggle)
        }
    };

    const handleDismissV2 = async (id) => {
        // If the user dismisses the undo row early, we immediately delete
        if (deleteTimers.current[id]) {
            clearTimeout(deleteTimers.current[id]);
            delete deleteTimers.current[id];
        }
        
        const notif = notifications.find(n => n.id === id);
        if (notif && notif._dbId) {
            deleteNotification(notif._dbId).catch(() => {});
            deleteCached(`notifications_${user.id}`);
        }
        
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const toggleSetting = (key) => {
        vibrate(5);
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredList = useMemo(() => {
        let list = notifications;
        if (filter === 'Unread') list = list.filter(n => n.unread);
        if (filter === 'System') {
            list = list.filter(n =>
                n.category === 'system' ||
                n.category === 'security' ||
                ['system', 'security', 'revenue', 'welcome', 'welcome_back', 'password_changed', 'pin_changed', 'new_device_login', 'report_submitted', 'admin_announcement', 'post_deleted', 'post_created', 'post_removed', 'profile_verified', 'profile_incomplete'].includes(n.type)
            );
        }
        if (filter === 'Brand Activity') {
            list = list.filter(n =>
                n.category === 'brand' ||
                ['brand_view', 'brand_insight', 'brand_seen'].includes(n.type)
            );
        }
        if (filter === 'Mentions') {
            list = list.filter(n =>
                n.type === 'mention' ||
                n.type === 'comment_replied' ||
                (n.category === 'social' && (n.title?.toLowerCase().includes('mention') || n.title?.toLowerCase().includes('reply')))
            );
        }
        return list;
    }, [filter, notifications]);

    const derivedUnreadCount = notifications.filter(n => n.unread && n._status !== 'deleted').length;

    const handleMarkAsRead = useCallback(async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
        try {
            await markNotificationRead(id);
            const cacheKey = `notifications_${user?.id}`;
            const cached = getCached(cacheKey);
            if (cached) {
                setCached(cacheKey, cached.map(n => n.id === id ? { ...n, unread: false } : n));
            }
            window.dispatchEvent(new CustomEvent('unread_count_updated', {
                detail: Math.max(0, derivedUnreadCount - 1)
            }));
        } catch (_) {}
    }, [user, derivedUnreadCount]);

    return (
        <div className="flex-1 flex flex-col h-full relative bg-[#020205] overflow-hidden">
            {/* Header */}
            <div className="header-glass sticky top-0 left-0 w-full z-30 bg-[#020205]/98 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="w-full h-14 flex items-center justify-between px-5 relative">
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-[18px] tracking-tight text-white">Notifications</span>
                        {settings.showCount && derivedUnreadCount > 0 && (
                            <div className="flex items-center gap-1.5 ml-2">
                                <span className="text-[11px] font-bold text-[#ef4444] px-1.5 py-0.5 rounded-full bg-[#ef4444]/15 border border-[#ef4444]/30">{derivedUnreadCount} New</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsFilterOpen(true)} className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors active:scale-90 ${filter !== 'All' ? 'bg-[#2f8bff]/10 border-[#2f8bff] text-[#2f8bff]' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`} aria-label="Filter">
                            <Icon icon="Filter" size={16} />
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors active:scale-90" aria-label="Settings">
                            <Icon icon="Settings" size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative flex-1 overflow-hidden">
                <PullToRefreshIndicator {...ptr.indicatorProps} />
                <div
                    ref={scrollRef}
                    className={`h-full overflow-y-auto px-0 pb-28 no-scrollbar ${ptr.pullOffset > 0 ? (ptr.isAutoRefreshing ? 'ptr-content-auto-pull' : 'ptr-content-pulling') : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
                    onScroll={handleScroll}
                    style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
                >
                {filter !== 'All' && (
                    <div className="px-6 py-2 flex items-center gap-2">
                        <span className="text-xs text-slate-400">Showing:</span>
                        <span className="text-xs text-white font-bold bg-white/10 px-2 py-0.5 rounded">{filter}</span>
                        <button onClick={() => setFilter('All')} className="text-xs text-neon font-bold ml-auto">Clear</button>
                    </div>
                )}

                <div className="notifications-list flex flex-col">
                    {filteredList.length > 0 ? (
                        filteredList.map((n, idx) => {
                            if (n._status === 'deleted') {
                                return (
                                    <motion.div 
                                        key={n.id} 
                                        initial={{ opacity: 0, height: 0 }} 
                                        animate={{ opacity: 1, height: 'auto' }} 
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <UndoRow action={n._action} onUndo={() => handleUndoV2(n.id)} onDismiss={() => handleDismissV2(n.id)} />
                                    </motion.div>
                                );
                            }

                            if (shouldAnimateShower) {
                                return (
                                    <motion.div 
                                        key={n.id}
                                        initial={{ opacity: 0, y: -16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ 
                                            delay: Math.min(idx * 0.032, 0.26), 
                                            duration: 0.3, 
                                            ease: [0.16, 1, 0.3, 1] 
                                        }}
                                        style={{ willChange: 'transform, opacity' }}
                                    >
                                        <NotificationItem data={n} onSwipe={handleSwipeV2} onClick={handleMarkAsRead} highlightId={highlightId} />
                                    </motion.div>
                                );
                            }

                            // Subsequent visits, tab returns, and PTR refreshes:
                            // Solid, instant rendering with zero layout reflows and zero falling effect!
                            return (
                                <div key={n.id}>
                                    <NotificationItem data={n} onSwipe={handleSwipeV2} onClick={handleMarkAsRead} highlightId={highlightId} />
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 opacity-40">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Icon icon="Bell" size={24} className="text-white" />
                            </div>
                            <p className="text-xs font-medium text-white/80">No notifications</p>
                        </div>
                    )}
                </div>

                <div className="py-8 flex flex-col items-center gap-3 opacity-30">
                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"></div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-white">End of List</span>
                </div>
            </div>
            </div>

            <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} activeFilter={filter} onSelect={(f) => { setFilter(f); setIsFilterOpen(false); }} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onToggle={toggleSetting} />
        </div>
    );
}
