import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import ReplyItem from './ReplyItem';
import { renderTextWithMentions } from '../../utils/textFormatter';

const vibrate = (ms) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

const CommentItem = ({ comment, onReply, canDelete, onDelete, onUndo, currentUserId, isPostOwner }) => {
    const instanceId = useId();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(comment.likes?.[0]?.count || 0);
    const [showReplies, setShowReplies] = useState(true);
    const [showDeletePrompt, setShowDeletePrompt] = useState(false);

    const isEligibleToDelete = canDelete !== undefined
        ? canDelete
        : Boolean(currentUserId && (String(comment.user_id) === String(currentUserId) || isPostOwner));

    const touchTimerRef = useRef(null);
    const touchStartPos = useRef({ x: 0, y: 0 });

    const handleTouchStart = (e) => {
        if (!isEligibleToDelete) return;
        const touch = e.touches ? e.touches[0] : e;
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };

        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = setTimeout(() => {
            vibrate(20);
            setShowDeletePrompt(true);
        }, 450);
    };

    const handleTouchMove = (e) => {
        if (!touchTimerRef.current) return;
        const touch = e.touches ? e.touches[0] : e;
        const diffX = Math.abs(touch.clientX - touchStartPos.current.x);
        const diffY = Math.abs(touch.clientY - touchStartPos.current.y);
        if (diffX > 10 || diffY > 10) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
    };

    const handleContextMenu = (e) => {
        if (isEligibleToDelete) {
            e.preventDefault();
            vibrate(10);
            setShowDeletePrompt(true);
        }
    };

    // Auto-dismiss delete prompt if user taps outside
    useEffect(() => {
        if (!showDeletePrompt) return;
        const handleOutside = () => setShowDeletePrompt(false);
        const t = setTimeout(() => {
            window.addEventListener('click', handleOutside);
            window.addEventListener('touchstart', handleOutside, { passive: true });
        }, 100);
        return () => {
            clearTimeout(t);
            window.removeEventListener('click', handleOutside);
            window.removeEventListener('touchstart', handleOutside);
        };
    }, [showDeletePrompt]);

    useEffect(() => {
        const checkLike = async () => {
            if (window.hasLikedComment && typeof comment.id === 'string') {
                try {
                    const liked = await window.hasLikedComment(comment.id);
                    setIsLiked(liked);
                } catch (e) { }
            }
        };
        checkLike();
    }, [comment.id]);

    // Real-time like count via Supabase channel
    useEffect(() => {
        if (!comment.id || comment.isPending) return;
        const ch = window.supabase.channel(`comment-likes-rt:${comment.id}-${instanceId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${comment.id}` },
                () => setLikesCount(p => p + 1))
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${comment.id}` },
                () => setLikesCount(p => Math.max(0, p - 1)))
            .subscribe();
        return () => window.supabase.removeChannel(ch);
    }, [comment.id]);

    const handleLike = async (e) => {
        e?.stopPropagation();
        vibrate(5);
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLikesCount(p => newStatus ? p + 1 : Math.max(0, p - 1));

        try {
            if (newStatus) {
                await window.likeComment(comment.id);
            } else {
                await window.unlikeComment(comment.id);
            }
        } catch (e) {
            console.error('Comment like failed', e);
            setIsLiked(!newStatus);
            setLikesCount(p => !newStatus ? p + 1 : Math.max(0, p - 1));
        }
    };

    const replies = comment.replies || [];

    if (comment._isDeleted) {
        return (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 my-1.5 animate-fade-in text-xs">
                <div className="flex items-center gap-2 text-muted">
                    <Icon icon="Trash2" size={13} className="text-red-400/80" />
                    <span className="text-[11px] text-gray-400 font-medium">Comment deleted</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onUndo) onUndo(comment.id, false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neon/15 hover:bg-neon/25 active:scale-95 border border-neon/30 text-neon text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                >
                    <Icon icon="RotateCcw" size={11} className="text-neon" />
                    <span>Undo</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in ${comment.isPending ? 'opacity-50' : ''}`}>
            <div className="flex gap-3 text-sm group">
                <div className="flex-shrink-0" onTouchStart={(e) => e.stopPropagation()}>
                    <div
                        className="flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                        onClick={(e) => { e.stopPropagation(); vibrate(5); if (comment.user_id) window.navigateTo(`/profile?id=${comment.user_id}`); }}
                    >
                        <Avatar
                            src={comment.avatar}
                            className="w-6 h-6 rounded-full border border-white/10 shrink-0 object-cover cursor-pointer"
                            fallbackSize={12}
                            onClick={(e) => { e.stopPropagation(); vibrate(5); if (comment.user_id) window.navigateTo(`/profile?id=${comment.user_id}`); }}
                        />
                    </div>
                </div>
                <div
                    className={`flex-1 rounded-xl transition-colors duration-150 select-none ${showDeletePrompt ? 'bg-white/[0.04] p-2 -m-2' : ''}`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseMove={handleTouchMove}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    onContextMenu={handleContextMenu}
                >
                    <div className="flex items-baseline justify-between focus-within:ring-0">
                        <div
                            className="flex items-baseline gap-2 cursor-pointer group/name"
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); vibrate(5); if (comment.user_id) window.navigateTo(`/profile?id=${comment.user_id}`); }}
                        >
                            <span className="font-bold text-white text-xs group-hover/name:text-neon transition-colors">{comment.user}</span>
                            <span className="text-[10px] text-muted">{comment.time}</span>
                        </div>
                        <button
                            onClick={handleLike}
                            onTouchStart={(e) => e.stopPropagation()}
                            className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}`}
                        >
                            <Icon icon="ThumbsUp" size={12} className={`stroke-[1.5px] ${isLiked ? "fill-white" : ""}`} style={{ fill: isLiked ? 'white' : 'none', color: isLiked ? 'white' : 'inherit' }} />
                            {likesCount > 0 && <span className="text-[10px]">{likesCount}</span>}
                        </button>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed mt-0.5" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithMentions(comment.text)}</p>

                    {/* Minimal Delete Indication on Long Press */}
                    {showDeletePrompt ? (
                        <div
                            className="flex items-center gap-2 mt-1.5 animate-scale-in"
                            onTouchStart={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    vibrate(10);
                                    setShowDeletePrompt(false);
                                    if (onDelete) onDelete(comment.id, comment, false);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 hover:bg-red-500/25 active:scale-95 border border-red-500/30 text-red-400 text-[11px] font-semibold transition-all shadow-sm"
                            >
                                <Icon icon="Trash2" size={12} className="text-red-400" />
                                <span>Delete</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeletePrompt(false);
                                }}
                                className="text-[10px] text-muted hover:text-white px-2 py-1 rounded transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 mt-1">
                            <button
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); onReply && onReply(comment); }}
                                className="text-[10px] text-muted hover:text-white transition-colors font-medium"
                            >Reply{replies.length > 0 ? ` · ${replies.length}` : ''}</button>
                            {replies.length > 0 && (
                                <button
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); setShowReplies(p => !p); }}
                                    className="text-[10px] text-neon/70 hover:text-neon transition-colors font-medium"
                                >
                                    {showReplies ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {showReplies && replies.map(r => (
                <ReplyItem
                    key={r.id}
                    reply={r}
                    onReply={() => onReply && onReply(r, comment.id)}
                    onDelete={(replyId, replyObj) => onDelete && onDelete(replyId, replyObj, true, comment.id)}
                    onUndo={(replyId) => onUndo && onUndo(replyId, true, comment.id)}
                    isPostOwner={isPostOwner}
                    currentUserId={currentUserId}
                    canDelete={Boolean(currentUserId && (String(r.user_id) === String(currentUserId) || isPostOwner))}
                />
            ))}
        </div>
    );
};

export default CommentItem;
