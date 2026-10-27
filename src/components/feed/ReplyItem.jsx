import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { renderTextWithMentions } from '../../utils/textFormatter';

const vibrate = (ms) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

const ReplyItem = ({ reply, onReply, canDelete, onDelete, onUndo, currentUserId, isPostOwner }) => {
    const instanceId = useId();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(reply.likes?.[0]?.count || 0);
    const [showDeletePrompt, setShowDeletePrompt] = useState(false);

    const isEligibleToDelete = canDelete !== undefined
        ? canDelete
        : Boolean(currentUserId && (String(reply.user_id) === String(currentUserId) || isPostOwner));

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
            if (window.hasLikedComment && typeof reply.id === 'string') {
                try { setIsLiked(await window.hasLikedComment(reply.id)); } catch (e) { }
            }
        };
        checkLike();
    }, [reply.id]);

    // Real-time like count for this reply
    useEffect(() => {
        if (!reply.id || reply.isPending) return;
        const ch = window.supabase.channel(`comment-likes-rt:${reply.id}-${instanceId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${reply.id}` },
                () => setLikesCount(p => p + 1))
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comment_likes', filter: `comment_id=eq.${reply.id}` },
                () => setLikesCount(p => Math.max(0, p - 1)))
            .subscribe();
        return () => window.supabase.removeChannel(ch);
    }, [reply.id]);

    const handleLike = async (e) => {
        e?.stopPropagation();
        vibrate(5);
        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLikesCount(p => newStatus ? p + 1 : Math.max(0, p - 1));
        try {
            if (newStatus) await window.likeComment(reply.id);
            else await window.unlikeComment(reply.id);
        } catch (e) {
            setIsLiked(!newStatus);
            setLikesCount(p => !newStatus ? p + 1 : Math.max(0, p - 1));
        }
    };

    if (reply._isDeleted) {
        return (
            <div className="flex items-center justify-between py-1.5 px-2.5 ml-7 pl-3 rounded-lg bg-white/[0.03] border border-white/5 my-1 animate-fade-in text-xs">
                <div className="flex items-center gap-1.5 text-muted">
                    <Icon icon="Trash2" size={11} className="text-red-400/80" />
                    <span className="text-[10px] text-gray-400 font-medium">Reply deleted</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onUndo) onUndo(reply.id, true);
                    }}
                    className="px-2 py-0.5 rounded bg-neon/15 hover:bg-neon/25 active:scale-95 border border-neon/30 text-neon text-[10px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                >
                    <Icon icon="RotateCcw" size={10} className="text-neon" />
                    <span>Undo</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`flex gap-2 text-sm animate-fade-in ml-7 pl-3 border-l border-white/10 mt-2 ${reply.isPending ? 'opacity-50' : ''}`}>
            <div className="flex-shrink-0" onTouchStart={(e) => e.stopPropagation()}>
                <Avatar
                    src={reply.avatar}
                    className="w-5 h-5 rounded-full border border-white/10 shrink-0 object-cover cursor-pointer"
                    fallbackSize={10}
                    onClick={(e) => { e.stopPropagation(); vibrate(5); if (reply.user_id) window.navigateTo(`/profile?id=${reply.user_id}`); }}
                />
            </div>
            <div
                className={`flex-1 rounded-lg transition-colors duration-150 select-none ${showDeletePrompt ? 'bg-white/[0.04] p-1.5 -m-1.5' : ''}`}
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
                <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5" onTouchStart={(e) => e.stopPropagation()}>
                        <span
                            className="font-bold text-white text-[11px] cursor-pointer hover:text-neon transition-colors"
                            onClick={(e) => { e.stopPropagation(); vibrate(5); if (reply.user_id) window.navigateTo(`/profile?id=${reply.user_id}`); }}
                        >{reply.user}</span>
                        <span className="text-[9px] text-muted">{reply.time}</span>
                    </div>
                    <button
                        onClick={handleLike}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}`}
                    >
                        <Icon icon="ThumbsUp" size={10} className={`stroke-[1.5px] ${isLiked ? 'fill-white' : ''}`} style={{ fill: isLiked ? 'white' : 'none' }} />
                        {likesCount > 0 && <span className="text-[9px]">{likesCount}</span>}
                    </button>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed mt-0.5" style={{ whiteSpace: 'pre-wrap' }}>{renderTextWithMentions(reply.text)}</p>

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
                                if (onDelete) onDelete(reply.id, reply);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 hover:bg-red-500/25 active:scale-95 border border-red-500/30 text-red-400 text-[10px] font-semibold transition-all shadow-sm"
                        >
                            <Icon icon="Trash2" size={10} className="text-red-400" />
                            <span>Delete</span>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeletePrompt(false);
                            }}
                            className="text-[9px] text-muted hover:text-white px-1 py-0.5"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                        <button
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onReply && onReply(reply); }}
                            className="text-[9px] text-muted hover:text-white transition-colors"
                        >Reply</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReplyItem;
