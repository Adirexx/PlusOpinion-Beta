import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Avatar from '../ui/Avatar';
import { searchUsersForMention } from '../../lib/api/comments';

const MentionAutocomplete = ({ query, onSelect, onClose, direction = 'up', coords }) => {
            const [users, setUsers] = useState([]);
            const [loading, setLoading] = useState(false);

            useEffect(() => {
                if (!query || query.length < 1) { setUsers([]); return; }
                setLoading(true);
                const timer = setTimeout(async () => {
                    try {
                        const searchFn = searchUsersForMention || window.searchUsersForMention;
                        const results = await searchFn(query);
                        setUsers(results || []);
                    } catch (e) {
                        setUsers([]);
                    } finally {
                        setLoading(false);
                    }
                }, 200);
                return () => clearTimeout(timer);
            }, [query]);

            if (!query || (users.length === 0 && !loading)) return null;

            const positionClass = direction === 'down' ? 'top-full mt-2' : 'bottom-full mb-2';
            const style = coords ? {
                position: 'absolute',
                top: `${coords.top + 25}px`,
                left: `${coords.left}px`,
                width: '220px',
                zIndex: 100
            } : {};

            return (
                <div
                    style={style}
                    className={`${coords ? '' : 'absolute ' + positionClass + ' left-0 right-0'} bg-[#1A1C2E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in`}
                >
                    {loading && <div className="px-3 py-2 text-xs text-muted">Searching...</div>}
                    {users.map(u => (
                        <button
                            key={u.id}
                            onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        >
                            <Avatar src={u.avatar_url} className="w-7 h-7 rounded-full border border-white/10 object-cover flex-shrink-0" fallbackSize={13} />
                            <div className="flex-1 min-w-0">
                                <div className="text-white text-xs font-semibold truncate">{u.full_name}</div>
                                <div className="text-muted text-[10px] truncate">@{u.username}</div>
                            </div>
                            <span className="text-[9px] text-neon/60 font-bold shrink-0">RQS {u.rqs_score}</span>
                        </button>
                    ))}
                </div>
            );
        };

export default MentionAutocomplete;
