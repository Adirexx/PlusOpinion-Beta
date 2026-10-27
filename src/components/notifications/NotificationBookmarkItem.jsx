import { DEFAULT_AVATAR } from '../../lib/constants';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';

export const getNotificationContent = (dbNotif) => {
    const metadata = dbNotif.metadata || {};
    return {
        tag: metadata.tag || null,
        title: dbNotif.title || 'Notification',
        message: dbNotif.message || dbNotif.desc || 'Interacted with your content.'
    };
};

export const NotificationBookmarkItem = ({ data, onRemove }) => {
    const navigate = useNavigate();
    const { title, message, tag } = getNotificationContent(data);
    const avatarUrl = data.metadata?.actor_avatar || DEFAULT_AVATAR;
    const actorId = data.related_user_id || data.metadata?.actor_id;

    const handleItemClick = () => {
        if (data.metadata?.type === 'message_bookmark') {
            // No redirect for message bookmarks, viewing only as requested
            return;
        }
        /* vibrate */
        navigate(`/notifications?highlight=${data.id}`);
    };

    const handleAvatarClick = (e) => {
        e.stopPropagation();
        if (actorId) {
            /* vibrate */
            navigate(`/profile/${actorId}`);
        }
    };

    return (
        <div
            className="relative py-5 px-4 flex items-start gap-4 border-b border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-all group cursor-pointer"
            onClick={handleItemClick}
        >
            <div
                className="shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/10 hover:border-neon/50 transition-colors"
                onClick={handleAvatarClick}
            >
                <img
                    src={avatarUrl}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = DEFAULT_AVATAR}
                    alt="Avatar"
                />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex justify-between items-start mb-1">
                    <h4
                        className={`text-[15px] leading-tight group-hover:text-neon transition-colors cursor-pointer ${data.unread ? 'text-white font-bold' : 'text-slate-300 font-semibold'}`}
                        onClick={handleAvatarClick}
                    >
                        {title}
                    </h4>
                    <div className="flex items-center justify-center">
                        <Icon icon="BookmarkFilled" size={18} className="text-neon fill-neon" />
                    </div>
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">{message}</p>
                <div className="mt-3 flex items-center justify-between">
                    {tag ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-white/5 text-neon border border-neon/20">{tag}</span>
                    ) : <div />}
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(data.id); }}
                        className="text-[11px] font-bold text-red-500/80 hover:text-red-500 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/5"
                    >
                        <Icon icon="Trash" size={14} /> REMOVE
                    </button>
                </div>
            </div>
        </div>
    );
};
