import { DEFAULT_AVATAR } from '../../lib/constants';
import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import ReactDOM from 'react-dom';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import SmartMedia from './SmartMedia';
import CommentItem from './CommentItem';
import MentionAutocomplete from './MentionAutocomplete';
import { renderTextWithMentions } from '../../utils/textFormatter';
import { formatTimeAgo } from '../../lib/utils';
import { getComments, createComment, createReply, deleteComment } from '../../lib/api/comments';
import { blockUser } from '../../lib/api/moderation';
import { useAuth } from '../../context/AuthContext';

const vibrate = (ms) => {
    if (navigator.vibrate) navigator.vibrate(ms);
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    return formatTimeAgo(dateString);
};

const PostCard = ({ post, index, onComment, onShare, onSave, comments = [], onAddComment, onImageClick, onRemove, onEdit, onBookmark, userProfile, isOwner = false, savedPosts, isGuest, onAuthRequired, hideActions, isDetailView = false }) => {
    const instanceId = useId();
    const { user } = useAuth();
    const currentUserId = user?.id || userProfile?.id;
    const isPostOwner = isOwner || Boolean(
        currentUserId && post && (
            String(currentUserId) === String(post.user_id) ||
            String(currentUserId) === String(post.profiles?.id) ||
            String(currentUserId) === String(post.author_id)
        )
    );
    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(post.agrees !== undefined ? post.agrees : (post.agrees_count || 0));
    const [showComments, setShowComments] = useState(isDetailView);
    const [localComments, setLocalComments] = useState(comments);
    const [commentText, setCommentText] = useState('');
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isHidden, setIsHidden] = useState(post.isHidden || false);
    const [deleteConfirmPost, setDeleteConfirmPost] = useState(false); // in-app delete confirm
    const [blockConfirmPost, setBlockConfirmPost] = useState(false); // in-app block confirm
    const [isBlocking, setIsBlocking] = useState(false);
    const isSaved = savedPosts?.has(String(post.id));
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [localCommentCount, setLocalCommentCount] = useState(post.comments !== undefined ? post.comments : (post.comments_count || 0));
    const [replyingTo, setReplyingTo] = useState(null); // { id, topLevelId, user, username }
    const [mentionQuery, setMentionQuery] = useState(null); // active @query string
    const commentInputRef = useRef(null);
    const commentsFetchedRef = useRef(false); // tracks if we've done a fresh threaded fetch
    const localCommentsRef = useRef(localComments); // always has latest comments for realtime handler
    const pendingDeleteTimersRef = useRef(new Map());

    // Unmount cleanup: if any comment deletion was pending, immediately finalize it in DB
    useEffect(() => {
        return () => {
            pendingDeleteTimersRef.current.forEach((item, id) => {
                clearTimeout(item.timer);
                deleteComment(id).catch(console.error);
            });
            pendingDeleteTimersRef.current.clear();
        };
    }, []);

    // Keep ref in sync with state
    useEffect(() => {
        localCommentsRef.current = localComments;
    }, [localComments]);

    // Initial fetch if isDetailView
    useEffect(() => {
        if (isDetailView && !commentsFetchedRef.current) {
            fetchThreadedComments();
        }
    }, [isDetailView]);

    // Portal menu positioning
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const moreButtonRef = useRef(null);

    useEffect(() => {
        if (showMoreMenu && moreButtonRef.current) {
            const rect = moreButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY + 10,
                right: window.innerWidth - rect.right
            });
        }
    }, [showMoreMenu]);

    useEffect(() => {
        setLocalLikes(post.agrees !== undefined ? post.agrees : (post.agrees_count || 0));
    }, [post.agrees, post.agrees_count]);

    useEffect(() => {
        const checkLikeStatus = async () => {
            if (window.hasLikedPost) {
                try {
                    const hasLiked = await window.hasLikedPost(post.id);
                    setIsLiked(hasLiked);
                } catch (e) {
                    console.error('Like check failed', e);
                }
            }
        };
        checkLikeStatus();
    }, [post.id]);

    // Realtime Like/Agree Count Logic
    useEffect(() => {
        if (hideActions) return;
        const channel = window.supabase.channel(`post-likes:${post.id}-${instanceId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'posts',
                filter: `id=eq.${post.id}`
            }, (payload) => {
                if (payload.new) {
                    if (payload.new.agrees_count !== undefined) {
                        setLocalLikes(payload.new.agrees_count);
                    }
                    if (payload.new.comments_count !== undefined) {
                        setLocalCommentCount(payload.new.comments_count);
                    }
                }
            })
            .subscribe();

        return () => {
            window.supabase.removeChannel(channel);
        };
    }, [post.id]);

    const handleLike = async () => {
        if (isGuest) {
            if (onAuthRequired) onAuthRequired();
            return;
        }
        vibrate(10);
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLocalLikes(prev => newStatus ? prev + 1 : prev - 1);

        try {
            if (newStatus) {
                await window.likePost(post.id);
            } else {
                await window.unlikePost(post.id);
            }
        } catch (error) {
            console.error('Like failed', error);
            // Revert UI on error
            setIsLiked(!newStatus);
            setLocalLikes(prev => !newStatus ? prev + 1 : prev - 1);
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: error.message || 'Action failed', icon: 'AlertTriangle', isSuccess: false } }));
        }
    };

    const transformComment = (c) => ({
        id: c.id,
        user: c.profiles?.full_name || 'User',
        username: c.profiles?.username || '',
        avatar: c.profiles?.avatar_url || '',
        text: c.text_content,
        time: formatTime(c.created_at),
        user_id: c.user_id,
        likes: c.likes,
        parent_comment_id: c.parent_comment_id || null,
        replies: (c.replies || []).map(r => transformComment(r))
    });

    const fetchThreadedComments = async () => {
        setIsLoadingComments(true);
        try {
            const commentsFn = getComments || window.getComments;
            const fetchedComments = await commentsFn(post.id);
            setLocalComments(fetchedComments.map(transformComment));
            commentsFetchedRef.current = true;
        } catch (error) {
            console.error('Failed to load comments', error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    const toggleComments = async () => {
        if (isGuest) {
            if (onAuthRequired) onAuthRequired();
            return;
        }
        vibrate(5);
        const shouldShow = !showComments;
        setShowComments(shouldShow);

        // Only fetch when opening AND we haven't loaded threaded data yet
        // (commentsFetchedRef is reset if the post re-mounts)
        if (shouldShow && !commentsFetchedRef.current) {
            await fetchThreadedComments();
        }
    };

    // Realtime Comments - subscribe once on mount, independent of showComments toggle
    useEffect(() => {
        if (hideActions) return;
        const channel = window.supabase.channel(`comments:${post.id}-${instanceId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, async (payload) => {
                const currentUser = await window.getCurrentUser();
                if (payload.new.user_id === currentUser?.id) return; // Handled optimistically

                const { data: profile } = await window.supabase
                    .from('profiles')
                    .select('full_name, username, avatar_url')
                    .eq('id', payload.new.user_id)
                    .maybeSingle();

                const newEntry = {
                    id: payload.new.id,
                    user_id: payload.new.user_id,
                    user: profile?.full_name || 'User',
                    username: profile?.username || '',
                    avatar: profile?.avatar_url || '',
                    text: payload.new.text_content,
                    time: 'Just now',
                    parent_comment_id: payload.new.parent_comment_id || null,
                    likes: [],
                    replies: []
                };

                const parentId = payload.new.parent_comment_id;
                if (!parentId) {
                    // Top-level comment
                    setLocalComments(prev => {
                        // Avoid duplicates
                        if (prev.some(c => c.id === newEntry.id)) return prev;
                        return [...prev, newEntry];
                    });
                } else {
                    // Reply — nest under parent (use functional update to get latest state)
                    setLocalComments(prev => {
                        const parentExists = prev.some(c => c.id === parentId);
                        if (!parentExists) return prev; // parent not loaded yet, skip
                        return prev.map(c =>
                            c.id === parentId
                                ? {
                                    ...c, replies: [
                                        ...(c.replies || []).filter(r => r.id !== newEntry.id), // dedup
                                        newEntry
                                    ]
                                }
                                : c
                        );
                    });
                }
                vibrate(5);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, (payload) => {
                if (payload.new?.is_deleted) {
                    const deletedId = payload.new.id;
                    setLocalComments(prev => {
                        const filtered = prev.filter(c => c.id !== deletedId);
                        if (filtered.length !== prev.length) return filtered;
                        return prev.map(c => ({
                            ...c,
                            replies: (c.replies || []).filter(r => r.id !== deletedId)
                        }));
                    });
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, (payload) => {
                const deletedId = payload.old?.id;
                if (!deletedId) return;
                setLocalComments(prev => {
                    const filtered = prev.filter(c => c.id !== deletedId);
                    if (filtered.length !== prev.length) return filtered;
                    return prev.map(c => ({
                        ...c,
                        replies: (c.replies || []).filter(r => r.id !== deletedId)
                    }));
                });
            })
            .subscribe();

        return () => {
            window.supabase.removeChannel(channel);
        };
    }, [post.id]); // only post.id, NOT showComments

    const toggleShareMenu = () => {
        vibrate(5);
        setShowShareMenu(!showShareMenu);
    };

    const toggleMoreMenu = (e) => {
        e.stopPropagation();
        vibrate(5);
        setShowMoreMenu(!showMoreMenu);
    };

    const handleSendComment = async () => {
        if (!commentText.trim()) return;

        const isReply = !!replyingTo;
        const tempId = Date.now();
        const tempEntry = {
            id: tempId,
            user: userProfile?.full_name || 'You',
            username: userProfile?.username || '',
            user_id: userProfile?.id,
            avatar: userProfile?.avatar_url || '',
            text: commentText,
            time: 'Just now',
            isPending: true,
            likes: [],
            replies: []
        };

        if (isReply) {
            // Optimistically add to topLevel's replies
            setLocalComments(prev => prev.map(c =>
                c.id === replyingTo.topLevelId
                    ? { ...c, replies: [...(c.replies || []), tempEntry] }
                    : c
            ));
        } else {
            setLocalComments(prev => [...prev, tempEntry]);
        }

        const textToSend = commentText;
        setCommentText('');
        // Keep replyingTo in local scope for createReply call before nullifying
        const currentReplyingTo = replyingTo;
        setReplyingTo(null);
        setMentionQuery(null);
        vibrate(10);

        try {
            let newData;
            if (isReply) {
                const replyFn = createReply || window.createReply;
                newData = await replyFn(post.id, currentReplyingTo.topLevelId, textToSend);
                // Update reply in parent's replies list
                setLocalComments(prev => prev.map(c =>
                    c.id === currentReplyingTo.topLevelId
                        ? {
                            ...c, replies: (c.replies || []).map(r =>
                                r.id === tempId ? {
                                    id: newData.id,
                                    user: userProfile?.full_name || 'You',
                                    username: userProfile?.username || '',
                                    user_id: userProfile?.id,
                                    avatar: userProfile?.avatar_url || '',
                                    text: newData.text_content,
                                    time: 'Just now',
                                    likes: [],
                                    replies: [],
                                    isPending: false
                                } : r
                            )
                        }
                        : c
                ));
            } else {
                const commentFn = createComment || window.createComment;
                newData = await commentFn(post.id, textToSend);
                setLocalComments(prev => prev.map(c => c.id === tempId ? {
                    id: newData.id,
                    user: userProfile?.full_name || 'You',
                    username: userProfile?.username || '',
                    avatar: userProfile?.avatar_url || '',
                    text: newData.text_content,
                    time: 'Just now',
                    likes: newData.likes || [],
                    replies: [],
                    isPending: false
                } : c));
            }

            if (onAddComment) onAddComment(post.id, textToSend);
        } catch (error) {
            console.error('Comment failed', error);
            // Rollback
            if (isReply) {
                setLocalComments(prev => prev.map(c =>
                    c.id === currentReplyingTo?.topLevelId
                        ? { ...c, replies: (c.replies || []).filter(r => r.id !== tempId) }
                        : c
                ));
            } else {
                setLocalComments(prev => prev.filter(c => c.id !== tempId));
            }
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to post comment', icon: 'AlertTriangle', isSuccess: false } }));
        }
    };

    // Handle reply button click from CommentItem/ReplyItem
    const handleReply = (commentOrReply) => {
        // Always reply to the top-level comment ID if replying to a reply
        const topLevelId = commentOrReply.parent_comment_id || commentOrReply.id;
        setReplyingTo({ id: topLevelId, topLevelId, user: commentOrReply.user, username: commentOrReply.username || '' });
        setCommentText(`@${commentOrReply.username || commentOrReply.user} `);
        setShowComments(true);
        setTimeout(() => commentInputRef.current?.focus(), 50);
    };

    // Handle touch-and-hold comment deletion with smooth inline undo button
    const handleDeleteComment = useCallback((commentId, commentObj, isReply = false, parentCommentId = null) => {
        vibrate(10);
        const targetParentId = parentCommentId || commentObj?.parent_comment_id || null;
        const actuallyReply = isReply || Boolean(targetParentId);

        // 1. Mark comment/reply with _isDeleted: true directly in local state
        if (actuallyReply && targetParentId) {
            setLocalComments(prev => prev.map(c => {
                if (c.id === targetParentId) {
                    return {
                        ...c,
                        replies: (c.replies || []).map(r => r.id === commentId ? { ...r, _isDeleted: true } : r)
                    };
                }
                return c;
            }));
        } else {
            setLocalComments(prev => prev.map(c => c.id === commentId ? { ...c, _isDeleted: true } : c));
        }

        // 2. Decrement comment count optimistically
        const nestedCount = (!actuallyReply && commentObj?.replies?.length) ? commentObj.replies.length : 0;
        setLocalCommentCount(prev => Math.max(0, prev - (1 + nestedCount)));

        // 3. Clear any existing timer for this commentId
        if (pendingDeleteTimersRef.current.has(commentId)) {
            clearTimeout(pendingDeleteTimersRef.current.get(commentId).timer);
        }

        // 4. Start 3-second timer to permanently commit deletion to DB and collapse from state
        const timer = setTimeout(async () => {
            pendingDeleteTimersRef.current.delete(commentId);

            // Collapse/remove from localComments completely
            if (actuallyReply && targetParentId) {
                setLocalComments(prev => prev.map(c => {
                    if (c.id === targetParentId) {
                        return {
                            ...c,
                            replies: (c.replies || []).filter(r => r.id !== commentId)
                        };
                    }
                    return c;
                }));
            } else {
                setLocalComments(prev => prev.filter(c => c.id !== commentId));
            }

            try {
                await deleteComment(commentId);
            } catch (err) {
                console.error('Failed to permanently delete comment:', err);
                window.dispatchEvent(new CustomEvent('toast', {
                    detail: { message: 'Could not delete comment', icon: 'AlertTriangle', isSuccess: false }
                }));
            }
        }, 3000);

        pendingDeleteTimersRef.current.set(commentId, {
            timer,
            commentId,
            commentObj,
            isReply: actuallyReply,
            parentCommentId: targetParentId,
            nestedCount
        });
    }, []);

    // Handle Undo comment deletion (smooth inline button)
    const handleUndoDelete = useCallback((commentId, isReply = false, parentCommentId = null) => {
        vibrate(10);
        const item = pendingDeleteTimersRef.current.get(commentId);
        if (item) {
            clearTimeout(item.timer);
            pendingDeleteTimersRef.current.delete(commentId);
        }

        const targetParentId = parentCommentId || item?.parentCommentId || null;
        const actuallyReply = isReply || item?.isReply || Boolean(targetParentId);

        // 1. Unmark _isDeleted so original comment body re-appears
        if (actuallyReply && targetParentId) {
            setLocalComments(prev => prev.map(c => {
                if (c.id === targetParentId) {
                    return {
                        ...c,
                        replies: (c.replies || []).map(r => r.id === commentId ? { ...r, _isDeleted: false } : r)
                    };
                }
                return c;
            }));
        } else {
            setLocalComments(prev => prev.map(c => c.id === commentId ? { ...c, _isDeleted: false } : c));
        }

        // 2. Increment comment count back
        const countToRestore = (item?.nestedCount || 0) + 1;
        setLocalCommentCount(prev => prev + countToRestore);
    }, []);

    // Detect @mention in comment input
    const handleCommentChange = (e) => {
        const val = e.target.value;
        setCommentText(val);
        // Find active @mention: look for @ before cursor (allowing full names with spaces)
        const cursor = e.target.selectionStart;
        const textUpToCursor = val.substring(0, cursor);
        const atMatch = textUpToCursor.match(/@([a-zA-Z0-9_. ]{1,30})$/);
        setMentionQuery(atMatch ? atMatch[1] : null);
    };

    // @mention autocomplete: insert selected user into text
    const handleMentionSelect = (user) => {
        const cursor = commentInputRef.current?.selectionStart || commentText.length;
        const textBeforeCursor = commentText.substring(0, cursor);
        const textAfterCursor = commentText.substring(cursor);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            const newTextBefore = textBeforeCursor.substring(0, atIndex) + '@' + user.username + ' ';
            setCommentText(newTextBefore + textAfterCursor);
            setMentionQuery(null);
            // Reset cursor position after React update
            setTimeout(() => {
                if (commentInputRef.current) {
                    const newPos = newTextBefore.length;
                    commentInputRef.current.focus();
                    commentInputRef.current.setSelectionRange(newPos, newPos);
                }
            }, 0);
        }
    };

    const handleShareClick = () => {
        vibrate(5);
        if (onShare) onShare(post);
    };

    const handleMoreAction = (action) => {
        if (action === 'edit' || action === 'delete' || action === 'bookmark') {
            if (isGuest) {
                if (onAuthRequired) onAuthRequired();
                return;
            }
        }
        vibrate(10);
        setShowMoreMenu(false);

        if (action === 'edit') {
            // Enforce one-time edit policy for published opinions
            if (!post.is_draft && post.is_edited) {
                window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinions can only be edited once.', icon: 'Lock', isSuccess: false } }));
                return;
            }
            if (onEdit) onEdit(post);
            else window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Edit feature coming soon!', icon: 'FileText', isSuccess: false } }));
        } else if (action === 'block_user') {
            if (isGuest) {
                if (onAuthRequired) onAuthRequired();
                return;
            }
            setBlockConfirmPost(true);
        } else if (action === 'delete') {
            // Show in-app delete confirm dialog (no native browser confirm)
            setDeleteConfirmPost(true);
        }
        else if (action === 'not_interested') {
            onRemove(post.id, 'Marked as not interested', 'not_interested');
        } else if (action === 'hide') {
            setIsHidden(true); // Immediate local hide
            onRemove(post.id, 'Opinion hidden', 'hide_post'); // Persist
        } else if (action === 'block_brand') {
            onRemove(post.id, `Posts from ${post.seenBy || 'Brand'} hidden`, 'mute_brand', post.seenBy);
        } else if (action === 'bookmark') {
            if (onBookmark) onBookmark(post.id, !isSaved);
        } else if (action === 'insight') {
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Insight feature coming soon!', icon: 'BarChart', isSuccess: false } }));
        } else if (action === 'report') {
            // Trigger Report Modal in Parent
            // We need a way to bubble this up specific for reporting
            if (onRemove) onRemove(post.id, 'Reported', 'REPORT_INTENT');
        }
    };

    const handleReport = async () => {
        if (isGuest) {
            if (onAuthRequired) onAuthRequired();
            return;
        }
        vibrate(10);
        const currentUser = await window.getCurrentUser();
        let reporterUsername = 'Anonymous';

        if (currentUser) {
            const { data: profile } = await window.supabase
                .from('profiles')
                .select('username')
                .eq('id', currentUser.id)
                .single();
            if (profile) reporterUsername = profile.username;
        }

        const additionalData = {
            reporter_username: reporterUsername,
            reported_username: post.username,
            post_url: `https://plusopinion.com/post/${post.id}`
        };

        if (onRemove) onRemove(post.id, 'Reported', 'REPORT_INTENT', null, additionalData);
    };

    // Simplified display logic - rely on parent prop which is realtime updated
    const displayComments = post.comments;

    const handleUnhide = async () => {
        vibrate(10);
        try {
            await window.unhideItem('post', post.id);
            setIsHidden(false);
            // Notify parent if needed
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { message: 'Opinion restored', icon: 'Eye', isSuccess: true }
            }));
        } catch (error) {
            console.error('Failed to unhide post:', error);
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { message: `Failed: ${error.message || 'Unknown error'}`, icon: 'AlertTriangle', isSuccess: false }
            }));
        }
    };

    if (isHidden) {
        return (
            <div className="glass-panel rounded-2xl p-4 mb-4 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                    <Icon icon="EyeOff" size={20} className="text-muted" />
                    <span className="text-sm text-gray-400">Opinion hidden</span>
                </div>
                <button onClick={handleUnhide} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-colors">
                    Unhide
                </button>
            </div>
        );
    }

    return (
        <>
            <div
            id={`post-${post.id}`}
            className={`glass-panel rounded-2xl p-4 mb-4 relative transition-all duration-300 animate-stagger ${showMoreMenu ? 'z-50' : 'z-0'}`}
            style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
        >
            {/* Share Popover - Attached to Share Icon */}

            {/* More Popover - Portal Implementation */}
            {showMoreMenu && ReactDOM.createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setShowMoreMenu(false); }}></div>
                    <div
                        className="absolute z-[9999] bg-[#1A1C2E] border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-56 animate-fade-in origin-top-right backdrop-blur-xl"
                        style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Differentiate owner's post vs other users' posts */}
                        {isPostOwner ? (
                            /* Owner Options */
                            <>
                                <button onClick={() => handleMoreAction('edit')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                    <Icon icon="FileText" size={16} className="text-muted" />
                                    <span>{post.is_draft ? 'Edit Draft' : 'Edit Opinion'}</span>
                                </button>
                                <button onClick={() => handleMoreAction('delete')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-red-400 group">
                                    <Icon icon="Trash" size={16} className="text-red-400" />
                                    <span>{post.is_draft ? 'Delete Draft' : 'Delete Opinion'}</span>
                                </button>
                                {!post.is_draft && (
                                    <>
                                        <div className="h-px bg-white/10 my-1"></div>
                                        <button onClick={() => handleMoreAction('bookmark')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                            <Icon icon="BookMark" size={16} className={isSaved ? "text-neon fill-neon" : "text-muted"} />
                                            <span>{isSaved ? 'Bookmarked' : 'Bookmark'}</span>
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            /* Non-Owner Options */
                            <>
                                <button onClick={() => handleMoreAction('not_interested')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                    <Icon icon="EyeOff" size={16} className="text-muted" />
                                    <span>Not interested in this post</span>
                                </button>
                                <button onClick={() => handleMoreAction('hide')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                    <Icon icon="X" size={16} className="text-muted" />
                                    <span>Hide this opinion</span>
                                </button>
                                <button onClick={() => handleMoreAction('block_brand')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                    <Icon icon="Flag" size={16} className="text-muted" />
                                    <span>Don't show posts from {post.seenBy || 'Brand'}</span>
                                </button>
                                <button onClick={() => handleMoreAction('bookmark')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                    <Icon icon="BookMark" size={16} className={isSaved ? "text-neon fill-neon" : "text-muted"} />
                                    <span>{isSaved ? 'Bookmarked' : 'Bookmark'}</span>
                                </button>
                                <button onClick={() => handleMoreAction('block_user')} className="flex items-center gap-3 p-3 hover:bg-red-500/10 rounded-lg text-left text-xs text-red-400">
                                    <Icon icon="Slash" size={16} className="text-red-400" />
                                    <span>Block @{post.username || 'user'}</span>
                                </button>
                            </>
                        )}
                        {/* Common Options */}
                        <div className="h-px bg-white/10 my-1"></div>
                        <button onClick={() => handleMoreAction('insight')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                            <Icon icon="BarChart" size={16} className="text-muted" />
                            <div className="flex flex-col items-start">
                                <span>View Insights</span>
                                <span className="text-[8px] text-neon font-bold tracking-wider">COMING SOON</span>
                            </div>
                        </button>
                    </div>
                </>,
                document.body
            )}

            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-3 w-full">
                    <div
                        className="group relative cursor-pointer active:scale-95 transition-transform"
                        onClick={() => { vibrate(5); window.navigateTo(`/profile?id=${post.user_id || post.profiles?.id}`); }}
                    >
                        {post.avatar ? (
                            <Avatar
                                src={post.avatar}
                                className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover"
                                fallbackSize={20}
                            />
                        ) : (
                            <img src={DEFAULT_AVATAR} className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" />
                        )}
                        <span className="delayed-label absolute top-12 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg">View Profile</span>
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2">
                            <div
                                className="group relative cursor-pointer hover:text-neon transition-colors"
                                onClick={() => { vibrate(5); window.navigateTo(`/profile?id=${post.user_id || post.profiles?.id}`); }}
                            >
                                <span className="font-heading font-bold text-white text-sm truncate">{post.name}</span>
                                <span className="delayed-label absolute bottom-6 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg">View Profile</span>
                            </div>
                            <div
                                className="group relative rqs-pill px-2 py-0.5 rounded-full flex items-center shrink-0 cursor-pointer"
                                onClick={() => { vibrate(5); window.navigateTo(`/profile?id=${post.user_id || post.profiles?.id}`); }}
                            >
                                <span className="font-heading font-bold text-[9px] text-white tracking-wide">RQS {post.rqs}</span>
                                <span className="delayed-label absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg">Review Quality Score</span>
                            </div>
                        </div>
                        <div
                            className="group relative inline-block cursor-pointer"
                            onClick={() => { vibrate(5); window.navigateTo(`/profile?id=${post.user_id || post.profiles?.id}`); }}
                        >
                            <div className="text-xs text-muted truncate hover:text-white transition-colors">@{post.username}</div>
                            <span className="delayed-label absolute top-5 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg">View Profile</span>
                        </div>
                    </div>
                </div>
                {!hideActions && (
                    <div className="absolute top-4 right-4 touch-scale text-muted/60 hover:text-white group z-10" onClick={toggleMoreMenu} ref={moreButtonRef}>
                        <Icon icon="MoreVertical" size={18} />
                    </div>
                )}
            </div>

            <div className="flex items-center flex-wrap gap-2 mb-3 mt-1">
                <div className="group relative border border-white/10 rounded-full px-3 py-1 flex items-center bg-white/5 text-[10px] text-white/80 font-medium">
                    <span className="text-neon">{post.category}</span>
                    <span className="mx-1.5 opacity-30">|</span>
                    <span>{post.product}</span>
                    <span className="delayed-label absolute -top-8 left-0 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg">Filter</span>
                </div>
                {/* Verified Badge - Renders if verified is true */}
                {post.verified && (
                    <div className="flex items-center text-accent-green touch-scale group relative ml-1" title="Verified Purchase">
                        <Icon icon="ShieldCheck" size={16} />
                    </div>
                )}
            </div>

            <p className="text-sm text-gray-200 leading-relaxed mb-3 font-light pr-2" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithMentions(post.text)}</p>

            {(post.media || (post.images && post.images.length > 0)) && (
                <SmartMedia
                    src={post.media}
                    type={post.media_type}
                    images={post.images}
                    onImageClick={onImageClick}
                />
            )}

            {post.is_draft ? (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-amber-400/90 font-medium bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                        <Icon icon="Lock" size={13} />
                        <span>Private Draft</span>
                    </div>
                    <button
                        onClick={() => {
                            vibrate(10);
                            if (onEdit) onEdit(post);
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all hover:scale-105 active:scale-95 border border-white/10"
                    >
                        <Icon icon="FileText" size={14} className="text-neon" />
                        <span>Edit Draft</span>
                    </button>
                </div>
            ) : !hideActions && (
                <>
                    <div className="flex items-end justify-between pt-3 mt-1 relative">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={handleLike}
                                className="flex items-center gap-1.5 touch-scale group relative"
                            >
                                <div className={isLiked ? "animate-pop" : ""}>
                                    {/* UPDATED: Agree Button - White Fill, 3D Drop Shadow, Visible Stroke */}
                                    <Icon icon="ThumbsUp" size={20}
                                        className={`transition-all duration-300 stroke-[1.5px] ${isLiked ? 'fill-white stroke-black/80 filter drop-shadow-[0_2px_0_rgba(255,255,255,0.4)]' : ''}`}
                                        style={isLiked ? {
                                            fill: 'white',
                                            stroke: '#000',
                                            strokeWidth: '1.5px',
                                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                                        } : {}}
                                    />
                                </div>
                                <span className="text-xs font-medium">{localLikes}</span>
                            </button>
                            <button className={`flex items-center gap-1.5 touch-scale transition-transform group relative ${showComments ? 'text-white' : 'text-muted hover:text-white'}`} onClick={toggleComments}>
                                <Icon icon="MessageCircle" size={20} className="stroke-[1.5]" />
                                {/* BUG FIX: Use localComments length if comments are loaded/shown, otherwise fallback to prop count which might be stale */}
                                <span className="text-xs font-medium">{showComments ? localComments.length : Math.max(localCommentCount, localComments.length)}</span>
                            </button>
                            <button className="text-muted hover:text-white transition-colors touch-scale group relative" onClick={handleShareClick}>
                                <Icon icon="Share" size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            {post.seenBy && (
                                <span className="group relative text-[9px] text-neon/80 font-medium tracking-wide bg-neon/5 px-2 py-0.5 rounded border border-neon/10 cursor-default flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_5px_var(--neon)]"></div>
                                    Seen by {post.seenBy}
                                </span>
                            )}
                            <button className="text-muted/40 hover:text-red-400 transition-colors touch-scale group relative" onClick={handleReport}>
                                <Icon icon="AlertTriangle" size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-muted/40 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Icon icon="Clock" size={12} />
                            <span>{post.time === 'Just now' ? 'Posted Just now' : `Posted ${post.time}`}</span>
                        </div>
                        {post.is_edited && (
                            <span className="text-[10px] text-muted/60 italic">(edited)</span>
                        )}
                    </div>
                </>
            )}

            {/* Inline Comment Section */}
            {showComments && (
                <div className="mt-4 pt-0 border-t border-white/5 animate-fade-in origin-top">
                    <div className="flex justify-between items-center mb-3 pt-2">
                        <span className="text-xs font-bold text-white">
                            Comments ({localComments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
                        </span>
                        {!isDetailView && (
                            <button onClick={() => { setShowComments(false); setReplyingTo(null); setMentionQuery(null); }} className="text-muted hover:text-white text-xs">Close</button>
                        )}
                    </div>

                    {/* Comments List */}
                    <div className={`space-y-4 mb-4 ${isDetailView ? '' : 'max-h-72 overflow-y-auto no-scrollbar'}`}>
                        {isLoadingComments && <div className="text-center text-muted text-xs py-2">Loading comments...</div>}

                        {localComments.map(c => (
                            <CommentItem
                                key={c.id}
                                comment={c}
                                onReply={handleReply}
                                onDelete={handleDeleteComment}
                                onUndo={handleUndoDelete}
                                isPostOwner={isPostOwner}
                                currentUserId={currentUserId}
                            />
                        ))}

                        {!isLoadingComments && localComments.length === 0 && (
                            <div className="text-center text-muted text-xs py-2">No comments yet. Be the first!</div>
                        )}
                    </div>

                    {/* Reply Banner */}
                    {replyingTo && (
                        <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 bg-neon/5 border border-neon/20 rounded-lg">
                            <span className="text-[10px] text-neon/80">Replying to <span className="font-bold">@{replyingTo.username || replyingTo.user}</span></span>
                            <button onClick={() => { setReplyingTo(null); setCommentText(''); setMentionQuery(null); }} className="text-muted hover:text-white">
                                <Icon icon="X" size={12} />
                            </button>
                        </div>
                    )}

                    {/* Input with @Mention Autocomplete */}
                    <div className="relative">
                        <MentionAutocomplete
                            query={mentionQuery}
                            onSelect={handleMentionSelect}
                        />
                        <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-neon/50 transition-colors">
                            <input
                                ref={commentInputRef}
                                value={commentText}
                                onChange={handleCommentChange}
                                placeholder={replyingTo ? `Reply to @${replyingTo.username || replyingTo.user}...` : "Add a comment or type @ to mention..."}
                                className="bg-transparent flex-1 text-xs text-white outline-none placeholder-white/30"
                                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                            />
                            <button onClick={handleSendComment} className={`${commentText.trim() ? 'text-neon' : 'text-muted'} transition-colors`}><Icon icon="Send" size={14} /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* ── In-App Delete Confirm Dialog (no native browser confirm) ── */}
        {deleteConfirmPost && ReactDOM.createPortal(
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                onClick={() => setDeleteConfirmPost(false)}
            >
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
                <div
                    style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, background: 'linear-gradient(135deg,#0d1117,#161b27)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 22, padding: '24px 20px 20px', boxShadow: '0 24px 60px rgba(0,0,0,0.85)' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                            <Icon icon="Trash" size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>
                            {post.is_draft ? 'Delete Draft?' : 'Delete Opinion?'}
                        </h3>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        {post.is_draft
                            ? 'This draft will be permanently deleted.'
                            : 'This will delete your opinion and store it in your deleted archive for 30 days before permanent deletion.'}
                    </p>
                    {post.text && (
                        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.text}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={() => setDeleteConfirmPost(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button
                            type="button"
                            onClick={() => {
                                setDeleteConfirmPost(false);
                                if (onRemove) onRemove(post.id, post.is_draft ? 'Draft deleted' : 'Opinion deleted', 'delete');
                            }}
                            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                        >{post.is_draft ? 'Delete Draft' : 'Delete'}</button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* ── In-App Block User Confirm Dialog ── */}
        {blockConfirmPost && ReactDOM.createPortal(
            <div
                style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                onClick={() => setBlockConfirmPost(false)}
            >
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />
                <div
                    style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, background: 'linear-gradient(135deg,#0d1117,#161b27)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 22, padding: '24px 20px 20px', boxShadow: '0 24px 60px rgba(0,0,0,0.85)' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                            <Icon icon="Slash" size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Block @{post.username || 'User'}?</h3>
                    </div>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                        Their posts, comments, profile, and messages will be completely hidden from your account until you unblock them from settings.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            type="button"
                            onClick={() => setBlockConfirmPost(false)}
                            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isBlocking}
                            onClick={async () => {
                                vibrate(10);
                                setIsBlocking(true);
                                try {
                                    const targetId = post.user_id || post.profiles?.id;
                                    await blockUser(targetId);
                                    setBlockConfirmPost(false);
                                    window.dispatchEvent(new CustomEvent('toast', {
                                        detail: { message: `Blocked @${post.username || 'user'}`, icon: 'Slash', isSuccess: true }
                                    }));
                                    if (onRemove) {
                                        onRemove(post.id, '', 'block_user', null, { blockedUserId: targetId });
                                    }
                                } catch (err) {
                                    console.error('Block failed:', err);
                                    window.dispatchEvent(new CustomEvent('toast', {
                                        detail: { message: 'Failed to block user', icon: 'AlertTriangle', isSuccess: false }
                                    }));
                                } finally {
                                    setIsBlocking(false);
                                }
                            }}
                            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: isBlocking ? 'not-allowed' : 'pointer', opacity: isBlocking ? 0.6 : 1 }}
                        >
                            {isBlocking ? 'Blocking...' : 'Block'}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        </>
    );
};

export default PostCard;

