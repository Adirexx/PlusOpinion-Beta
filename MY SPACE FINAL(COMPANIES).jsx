
        const { useState, useEffect, useRef, useMemo } = React;
        const { motion, AnimatePresence } = window.Motion;

        // 🔗 GLOBAL NAVIGATION FUNCTION (PASTE HERE)
        const goTo = (page) => {
            window.scrollTo(0, 0);
            window.location.href = page;
        };

        function dispatchAction(action) {
            if (window.PlusOpinionActions && window.PlusOpinionActions[action]) {
                // Already on homepage
                window.PlusOpinionActions[action]();
            } else {
                // On another page → redirect with hash
                window.location.href = `HOMEPAGE_FINAL.HTML#${action.replace('open', '').toLowerCase()}`;
            }
        }

        const triggerAction = (action) => {
            if (window.PlusOpinionActions?.[action]) {
                window.PlusOpinionActions[action]();
            } else {
                window.location.href = `HOMEPAGE_FINAL.HTML#${action.replace('open', '').toLowerCase()}`;
            }
        };

        // 🔁 PAGE → TAB MAP (GLOBAL)
        const PAGE_TAB_MAP = {
            'HOMEPAGE_FINAL.HTML': 'home',
            'CATAGORYPAGE.HTML': 'categories',
            'MY SPACE FINAL (USER).HTML': 'myspace',
            'NOTIFICATION PANEL.HTML': 'notifs',
            'PRIVATE OWNER PROFILE.HTML': 'profile'
        };

        // --- ICONS ---
        const Icons = {
            Smile: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
            Running: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4a2 2 0 10-4 0 2 2 0 004 0z"/><path d="M10 7l-2 4 4 2-1 6"/><path d="M12 13l4-1 2-4"/><path d="M8 7l-2 0 2 3"/></svg>, 

            Home: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
            Grid: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>,
            User: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
            Bell: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
            MySpaceLogo: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3L3 22" strokeLinejoin="bevel" /><path d="M21 22L11 3" strokeLinejoin="bevel" /><path d="M22 8L4 18" className="myspace-swoosh" style={{ stroke: 'var(--neon)', opacity: 1, transform: 'translateX(0) translateY(0)' }} /></svg>,
            Dashboard: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
            Sentiment: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 10.06 10.06 0 0 0-9.87 7.7 2.05 2.05 0 0 0 .13.85A10 10 0 0 0 12 2Z" /><path d="M12 12a5 5 0 1 0 5 5 5 5 0 0 0-5-5Z" /></svg>,
            Performance: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
            Competitor: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>,
            Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
            Filter: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
            ShieldCheck: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>,
            MessageCircle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>,
            Share: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>,
            WhatsApp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>,
            Instagram: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>,
            ThumbsUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>,
            Clock: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
            AlertTriangle: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>,
            MoreVertical: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>,
            MoreHorizontal: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
            Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
            Activity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
            TrendingUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
            Target: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
            Users: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
            X: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
            PanelLeftClose: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" /></svg>,
            PanelLeftOpen: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /><path d="m14 15 3-3-3-3" /></svg>,
            FileText: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>,
            Zap: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
            ChevronUp: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>,
            ChevronDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>,
            BookMark: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
            BarChart: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>,
        };

        const Icon = ({ icon, size = 20, className = "" }) => {
            const Component = Icons[icon];
            if (!Component) return null;
            return <Component width={size} height={size} className={className} />;
        };

        const renderTextWithMentions = (text) => {
            if (!text) return text;
            const parts = text.split(/(@[\w.]+)/g);
            return parts.map((part, i) => {
                if (/@[\w.]+/.test(part)) {
                    const username = part.slice(1);
                    return (
                        <span key={i} className="text-neon font-semibold cursor-pointer hover:underline"
                            onClick={(e) => {
                                e.stopPropagation(); vibrate(5);
                                window.location.href = `PUBLIC POV PROFILE.HTML?username=${username}`;
                            }}>
                            {part}
                        </span>
                    );
                }
                return part;
            });
        };

        const MentionAutocomplete = ({ query, onSelect, direction = 'up', coords }) => {
            const [users, setUsers] = useState([]);
            const [loading, setLoading] = useState(false);

            useEffect(() => {
                if (!query || query.length < 1) { setUsers([]); return; }
                setLoading(true);
                const timer = setTimeout(async () => {
                    try {
                        const results = await window.searchUsersForMention(query);
                        setUsers(results);
                    } catch (e) {
                        setUsers([]);
                    } finally {
                        setLoading(false);
                    }
                }, 250);
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

        const ReplyItem = ({ reply, onReply }) => {
            const [isLiked, setIsLiked] = useState(false);
            const [likesCount, setLikesCount] = useState(reply.likes_count || 0);

            const handleLike = async (e) => {
                e.stopPropagation(); vibrate(5);
                const next = !isLiked;
                setIsLiked(next);
                setLikesCount(p => next ? p + 1 : p - 1);
                try {
                    if (next) await window.likeComment(reply.id);
                    else await window.unlikeComment(reply.id);
                } catch (err) {
                    setIsLiked(!next); setLikesCount(p => !next ? p + 1 : p - 1);
                }
            };

            const userAvatar = reply.avatar || (reply.profiles?.avatar_url);
            const userName = reply.user || (reply.profiles?.full_name);
            const userHandle = reply.username || (reply.profiles?.username);

            return (
                <div className={`flex gap-2 text-sm mt-3 pl-4 border-l border-white/5 ${reply.isPending ? 'opacity-50' : ''}`}>
                    <div className="flex-shrink-0">
                        <img
                            src={userAvatar || DEFAULT_AVATAR}
                            className="w-5 h-5 rounded-full border border-white/10 shrink-0 object-cover cursor-pointer"
                            onClick={() => { if (reply.user_id) window.location.href = `PUBLIC POV PROFILE.HTML?id=${reply.user_id}`; }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                                <span className="font-bold text-white text-[11px] truncate cursor-pointer hover:text-neon"
                                    onClick={() => { if (reply.user_id) window.location.href = `PUBLIC POV PROFILE.HTML?id=${reply.user_id}`; }}
                                >{userName}</span>
                                <span className="text-[9px] text-muted truncate">@{userHandle}</span>
                                <span className="text-[9px] text-muted/50 font-mono shrink-0">{reply.time || 'now'}</span>
                            </div>
                            <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}`}>
                                <Icon icon="ThumbsUp" size={10} className={`stroke-[1.5px] ${isLiked ? 'fill-white' : ''}`} style={{ fill: isLiked ? 'white' : 'none' }} />
                                {likesCount > 0 && <span className="text-[9px]">{likesCount}</span>}
                            </button>
                        </div>
                        <p className="text-gray-300 text-[11px] leading-relaxed mb-1">{renderTextWithMentions(reply.text)}</p>
                        <button
                            onClick={() => onReply && onReply(reply)}
                            className="text-[9px] text-muted hover:text-white transition-colors flex items-center gap-1 font-medium"
                        >Reply</button>
                    </div>
                </div>
            );
        };

        const vibrate = (pattern = 5) => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(pattern); } catch (e) { }
            }
        };

        // --- DATA ---
        const BRAND = {
            name: "Apple",
            logo: "https://cdn.simpleicons.org/apple/white",
            verified: true,
            rqs: 92,
            products: ["iPhone 15 Pro", "MacBook Air M3", "Vision Pro"]
        };

        // Expanded Live Feed Data
        const FEEDBACK_DATA = [
            {
                id: 1,
                name: "TechReviewer_X",
                username: "tech_x",
                avatar: "https://i.pravatar.cc/150?u=12",
                rqs: 96,
                verified: true,
                product: "iPhone 15 Pro",
                category: "Electronics",
                text: "The titanium frame actually makes a huge difference in weight. Heat dissipation seems better in the new batch compared to launch units.",
                sentiment: "Positive",
                tag: "Tagged",
                time: "2h ago",
                agrees: 342,
                comments: 2,
                media: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop",
                comments_list: [
                    { id: 101, user: "AppleFan_99", user_id: "mock_id_1", avatar: "https://i.pravatar.cc/150?u=20", text: "Totally agree! The weight distribution is perfect now.", time: "1h ago" },
                    { id: 102, user: "TechGuru", user_id: "mock_id_2", avatar: "https://i.pravatar.cc/150?u=25", text: "Have you noticed any throttling during gaming?", time: "30m ago" }
                ]
            },
            { id: 2, name: "Sarah Design", username: "sarah_d", avatar: "https://i.pravatar.cc/150?u=30", rqs: 88, verified: true, product: "Vision Pro", category: "Wearables", text: "Eye tracking is magical but the weight distribution causes fatigue after 45 mins. Needs a better strap included in the box for this price point.", sentiment: "Problem", tag: "Tagged", time: "4h ago", agrees: 890, comments: 120, comments_list: [] },
            { id: 3, name: "AndroidFan99", username: "andy_99", avatar: "https://i.pravatar.cc/150?u=8", rqs: 75, verified: false, product: "Samsung S24 Ultra", category: "Competitor", text: "Comparing the anti-reflective screen to the iPhone, Samsung wins this round comfortably. Apple needs to adopt this coating.", sentiment: "Neutral", tag: "Competitor", time: "5h ago", agrees: 156, comments: 88 },
            { id: 4, name: "MarketPulse", username: "market_watch", avatar: "https://i.pravatar.cc/150?u=5", rqs: 99, verified: true, product: "Smartphone Market", category: "Insight", text: "Consumers are shifting preference towards on-device AI capabilities over raw camera megapixels in 2025. Privacy is becoming a key differentiator.", sentiment: "Insight", tag: "General", time: "8h ago", agrees: 1200, comments: 56 },
            { id: 5, name: "CodeNinja", username: "dev_ops", avatar: "https://i.pravatar.cc/150?u=60", rqs: 92, verified: true, product: "MacBook Air M3", category: "Computers", text: "For dev work, the M3 Air is surprisingly capable. Docker containers run smooth. 16GB RAM is the new minimum though, don't buy the 8GB model.", sentiment: "Positive", tag: "Tagged", time: "1d ago", agrees: 450, comments: 32 },
            { id: 6, name: "Lisa Wong", username: "lisa_w", avatar: "https://i.pravatar.cc/150?u=44", rqs: 85, verified: true, product: "Apple Watch S9", category: "Wearables", text: "Double tap gesture is a lifesaver when my hands are full. Battery life still needs to be 2 days solid though.", sentiment: "Positive", tag: "Tagged", time: "1d ago", agrees: 210, comments: 15 },
            { id: 7, name: "David Chen", username: "dchen_dev", avatar: "https://i.pravatar.cc/150?u=33", rqs: 95, verified: true, product: "MacBook Pro M3 Max", category: "Computers", text: "Space Black is stunning but yes, it catches fingerprints. Performance is overkill for web dev but compiles are instant.", sentiment: "Positive", tag: "Tagged", time: "2d ago", agrees: 500, comments: 80 },
            { id: 8, name: "PhotoGeek", username: "shutter_speed", avatar: "https://i.pravatar.cc/150?u=58", rqs: 94, verified: false, product: "iPhone 15 Pro Max", category: "Electronics", text: "The 5x zoom is good, but I wish it had the 10x periscope from the S24 Ultra. Low light video is unbeatable though.", sentiment: "Neutral", tag: "Tagged", time: "2d ago", agrees: 300, comments: 50 },
            { id: 9, name: "UX_Guru", username: "ux_design", avatar: "https://i.pravatar.cc/150?u=22", rqs: 91, verified: true, product: "iOS 18 Beta", category: "Software", text: "Control Center customization is finally here! A bit buggy in beta 1 but the flexibility is what we've wanted for years.", sentiment: "Positive", tag: "Tagged", time: "2d ago", agrees: 600, comments: 100 },
            { id: 10, name: "SammyFan", username: "galaxy_quest", avatar: "https://i.pravatar.cc/150?u=9", rqs: 78, verified: false, product: "Samsung Z Fold 6", category: "Competitor", text: "The crease is almost invisible now. Multitasking on this screen makes the iPhone look like a toy.", sentiment: "Negative", tag: "Competitor", time: "3d ago", agrees: 120, comments: 40 }
        ];

        // --- COMPONENTS ---

        // 0. COMMENT ITEM
        const CommentItem = ({ comment, onReply }) => {
            const [isLiked, setIsLiked] = useState(false);
            const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
            const [showReplies, setShowReplies] = useState(false);
            const replies = comment.replies || [];

            const handleLike = async (e) => {
                e.stopPropagation(); vibrate(5);
                const next = !isLiked;
                setIsLiked(next);
                setLikesCount(p => next ? p + 1 : p - 1);
                try {
                    if (next) await window.likeComment(comment.id);
                    else await window.unlikeComment(comment.id);
                } catch (err) {
                    setIsLiked(!next); setLikesCount(p => !next ? p + 1 : p - 1);
                }
            };

            const userAvatar = comment.avatar || (comment.profiles?.avatar_url);
            const userName = comment.user || (comment.profiles?.full_name);
            const userId = comment.user_id || (comment.profiles?.id);

            return (
                <div className={`flex gap-3 text-sm animate-fade-in group py-2 ${comment.isPending ? 'opacity-50' : ''}`}>
                    <div className="flex-shrink-0">
                        <img
                            src={userAvatar || DEFAULT_AVATAR}
                            className="w-6 h-6 rounded-full border border-white/10 shrink-0 object-cover cursor-pointer"
                            onClick={() => { if (userId) window.location.href = `PUBLIC POV PROFILE.HTML?id=${userId}`; }}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-0.5">
                            <div className="flex items-baseline gap-2 cursor-pointer group/name"
                                onClick={() => { if (userId) window.location.href = `PUBLIC POV PROFILE.HTML?id=${userId}`; }}
                            >
                                <span className="font-bold text-white text-xs group-hover/name:text-neon transition-colors">{userName}</span>
                                <span className="text-[10px] text-muted">{comment.time || 'now'}</span>
                            </div>
                            <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-white' : 'text-muted'}`}>
                                <Icon icon="ThumbsUp" size={12} className={`stroke-[1.5px] ${isLiked ? "fill-white" : ""}`} style={{ fill: isLiked ? 'white' : 'none' }} />
                                {likesCount > 0 && <span className="text-[10px]">{likesCount}</span>}
                            </button>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed mb-2">{renderTextWithMentions(comment.text)}</p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onReply && onReply(comment)}
                                className="text-[10px] text-muted hover:text-white transition-colors font-medium flex items-center gap-1"
                            >Reply{replies.length > 0 ? ` · ${replies.length}` : ''}</button>
                            {replies.length > 0 && (
                                <button onClick={() => setShowReplies(p => !p)} className="text-[10px] text-neon/70 hover:text-neon transition-colors font-medium">
                                    {showReplies ? 'Hide replies' : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                                </button>
                            )}
                        </div>

                        {showReplies && replies.length > 0 && (
                            <div className="mt-1 space-y-1">
                                {replies.map(r => (
                                    <ReplyItem key={r.id} reply={r} onReply={() => onReply && onReply(r, comment.id)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        // 1. NAV ITEM
        const NavItem = ({ icon, label, isActive, onClick, isMySpace }) => (
            <button
                onClick={() => { vibrate(5); onClick(); }}
                className="flex-1 flex flex-col items-center justify-center gap-1 group relative touch-scale transition-transform h-full"
            >
                <div className={`relative ${isMySpace ? 'myspace-trigger' : ''} p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/5 scale-105' : ''}`}>
                    <Icon icon={icon} size={24} className={`transition-all duration-300 ${isActive ? 'text-white glow-white stroke-[2.5px]' : 'text-muted group-hover:text-white stroke-[1.5px]'}`} />
                    <span className="delayed-label absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-[10px] text-white px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
                        {label}
                    </span>
                </div>
            </button>
        );

        // 2. BOTTOM NAV
        const BottomNav = ({ activeTab, setActiveTab, isVisible = true }) => {
            return (
                <div id="bottom-nav-bar" className={`nav-glass fixed bottom-0 left-0 w-full h-[65px] px-2 pb-2 flex justify-between items-center z-40 transition-transform duration-500 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                    <NavItem icon="Home" label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <NavItem icon="Grid" label="Categories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                    <NavItem icon="MySpaceLogo" label="My Space" isActive={activeTab === 'myspace'} onClick={() => setActiveTab('myspace')} isMySpace={true} />
                    <NavItem icon="Bell" label="Notifications" isActive={activeTab === 'notifs'} onClick={() => setActiveTab('notifs')} />
                    <NavItem icon="User" label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                </div>
            );
        };

        // 3. HEADER
        const Header = ({ onSettings, isSidebarOpen, toggleSidebar, isVisible = true }) => (
            <div className={`header-glass fixed top-0 left-0 w-full z-50 px-4 h-[65px] flex items-center justify-between transition-transform duration-500 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="absolute left-4 z-20">
                    <button onClick={toggleSidebar} className="text-white hover:text-neon transition-colors active:scale-95">
                        <Icon icon={isSidebarOpen ? "PanelLeftClose" : "PanelLeftOpen"} size={24} />
                    </button>
                </div>

                {/* Center - Truly Centered */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img src={BRAND.logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="font-heading font-bold text-lg text-white leading-none tracking-wide">{BRAND.name}</h1>
                        <p className="text-[9px] text-muted font-medium tracking-widest uppercase flex items-center gap-1 justify-center">
                            Enterprise <Icon icon="ShieldCheck" size={10} className="text-neon" />
                        </p>
                    </div>
                </div>

                <div className="absolute right-4 z-20">
                    <button onClick={onSettings} className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors active:scale-95">
                        <Icon icon="Settings" size={18} className="text-muted" />
                    </button>
                </div>
            </div>
        );

        // 4. LEFT NAVIGATION DOCK
        const LeftNav = ({ activeTool, setTool, isOpen }) => {
            const tools = [
                { id: 'dashboard', icon: 'Dashboard', label: 'Dash' },
                { id: 'sentiment', icon: 'Activity', label: 'Mood' },
                { id: 'performance', icon: 'Performance', label: 'Growth' },
                { id: 'competitor', icon: 'Competitor', label: 'Rivals' },
            ];

            return (
                <div
                    className={`left-nav-panel fixed left-0 top-[65px] bottom-[65px] flex flex-col items-center py-4 gap-6 no-scrollbar transition-all duration-300 ease-in-out ${isOpen ? 'w-[65px] translate-x-0' : 'w-[0px] -translate-x-full opacity-0 overflow-hidden'}`}
                >
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => { vibrate(5); setTool(tool.id); }}
                            className={`flex flex-col items-center gap-1 group relative w-full px-1 transition-opacity duration-200 ${activeTool === tool.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                        >
                            <div className={`p-3 rounded-2xl transition-all duration-300 active:scale-90 ${activeTool === tool.id ? 'bg-neon/20 text-neon shadow-[0_0_15px_rgba(47,139,255,0.3)] ring-1 ring-neon/50' : 'bg-transparent text-white'}`}>
                                <Icon icon={tool.icon} size={22} />
                            </div>
                            <span className="text-[9px] font-medium tracking-wide text-white">{tool.label}</span>

                            {/* Tooltip Fix */}
                            <div className="tool-tip transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                                {tool.label} Tool
                            </div>

                            {activeTool === tool.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon rounded-r-full shadow-[0_0_10px_var(--neon)]"></div>
                            )}
                        </button>
                    ))}
                </div>
            );
        };

        // 5. POST CARD (Homepage Exact Replica - Correct Green Shield)
        // PREMIUM ZOOMABLE MEDIA COMPONENT (Instagram Style)
        // ─── SMART MEDIA RATIO DETECTION HELPER ────────────────────────────────────
        // Decodes the image/video ratio and returns CSS aspect-ratio class
        const getAspectClass = (ratio) => {
            if (ratio >= 1.55) return 'aspect-[16/9]';      // Landscape → 16:9
            if (ratio >= 0.89) return 'aspect-square';       // Square / near-square → 1:1
            return 'aspect-[4/5]';                           // Portrait → 4:5 (covers tall too)
        };

        // ─── SMART MEDIA COMPONENT ─────────────────────────────────────────────────
        // Replaces ZoomableMedia. Handles: single image, single video, multi-image carousel
        // Props: src (string), type ('image'|'video'), images (string[]), onImageClick
        const SmartMedia = ({ src, type, images, onImageClick }) => {
            const isVideo = type === 'video' || type?.startsWith('video/') || src?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);
            const isMulti = images && images.length > 1;
            const imageList = isMulti ? images : [src].filter(Boolean);

            // Global mute state
            const [isMuted, setIsMuted] = useState(() => {
                const stored = localStorage.getItem('globalVideoMuted');
                return stored ? stored === 'true' : false; // default unmuted
            });
            const [isInView, setIsInView] = useState(false);

            useEffect(() => {
                const handleMuteChange = (e) => setIsMuted(e.detail.isMuted);
                window.addEventListener('globalMuteToggle', handleMuteChange);
                return () => window.removeEventListener('globalMuteToggle', handleMuteChange);
            }, []);

            useEffect(() => {
                if (!isVideo || !containerRef.current) return;
                const observer = new IntersectionObserver(([entry]) => {
                    setIsInView(entry.isIntersecting);
                }, { threshold: 0.6 });

                observer.observe(containerRef.current);
                return () => observer.disconnect();
            }, [isVideo]);

            const toggleMute = (e) => {
                e.stopPropagation();
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                localStorage.setItem('globalVideoMuted', newMuted);
                window.dispatchEvent(new CustomEvent('globalMuteToggle', { detail: { isMuted: newMuted } }));
            };

            // Aspect ratio state (determined after first media loads)
            const [aspectClass, setAspectClass] = useState('aspect-[4/5]');
            const [ratioDetected, setRatioDetected] = useState(false);

            // Carousel state
            const [activeIdx, useState__activeIdx] = useState(0);
            const setActiveIdx = useState__activeIdx; // Keep variable accessible
            const [dragDelta, setDragDelta] = useState(0);
            const [isDragging, setIsDragging] = useState(false);
            const dragStart = useRef(null);
            const containerRef = useRef(null);

            // Pinch-zoom state (single media only)
            const [scale, setScale] = useState(1);
            const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
            const [isPinching, setIsPinching] = useState(false);
            const initialDist = useRef(null);

            // Detect ratio from the first image/video
            const handleMediaLoad = (e) => {
                if (ratioDetected) return;
                const el = e.target;
                const w = el.naturalWidth || el.videoWidth || el.clientWidth;
                const h = el.naturalHeight || el.videoHeight || el.clientHeight;
                if (w && h) {
                    setAspectClass(getAspectClass(w / h));
                    setRatioDetected(true);
                }
            };

            // ── Carousel touch/drag handlers ──────────────────────────────────────
            const SWIPE_THRESHOLD = 40;

            const onCarouselTouchStart = (e) => {
                e.stopPropagation();
                if (e.touches.length !== 1) return;
                dragStart.current = e.touches[0].clientX;
                setIsDragging(true);
            };

            const onCarouselTouchMove = (e) => {
                e.stopPropagation();
                if (!isDragging || dragStart.current === null) return;
                const delta = e.touches[0].clientX - dragStart.current;
                // Clamp: don't allow dragging past edges
                if ((activeIdx === 0 && delta > 0) || (activeIdx === imageList.length - 1 && delta < 0)) {
                    setDragDelta(delta * 0.2); // Rubber-band
                } else {
                    setDragDelta(delta);
                }
            };

            const onCarouselTouchEnd = () => {
                if (!isDragging) return;
                setIsDragging(false);
                if (dragDelta < -SWIPE_THRESHOLD && activeIdx < imageList.length - 1) {
                    setActiveIdx(i => i + 1);
                } else if (dragDelta > SWIPE_THRESHOLD && activeIdx > 0) {
                    setActiveIdx(i => i - 1);
                }
                setDragDelta(0);
                dragStart.current = null;
            };

            // ── Pinch-zoom handlers (single media) ──────────────────────────────────
            const onSingleTouchStart = (e) => {
                if (e.touches.length === 2) {
                    setIsPinching(true);
                    const t1 = e.touches[0], t2 = e.touches[1];
                    initialDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                        const mx = (t1.pageX + t2.pageX) / 2;
                        const my = (t1.pageY + t2.pageY) / 2;
                        setPinchOrigin({ x: ((mx - rect.left) / rect.width) * 100, y: ((my - rect.top) / rect.height) * 100 });
                    }
                }
            };
            const onSingleTouchMove = (e) => {
                if (e.touches.length === 2 && isPinching && initialDist.current) {
                    e.preventDefault();
                    const t1 = e.touches[0], t2 = e.touches[1];
                    const d = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    setScale(Math.min(Math.max(d / initialDist.current, 1), 4));
                }
            };
            const onSingleTouchEnd = () => { setIsPinching(false); setScale(1); initialDist.current = null; };

            const handleClick = () => {
                if (isPinching || (isMulti && Math.abs(dragDelta) > 5)) return;
                if (isMulti) onImageClick(null, 'images', imageList, activeIdx);
                else onImageClick(src, type);
            };

            // ── Desktop Mouse Drag handlers ───────────────────────────────────────
            const onCarouselMouseDown = (e) => {
                if (e.button !== 0) return; // Only left click
                dragStart.current = e.clientX;
                setIsDragging(true);
            };

            const onCarouselMouseMove = (e) => {
                if (!isDragging || dragStart.current === null) return;
                const delta = e.clientX - dragStart.current;
                if ((activeIdx === 0 && delta > 0) || (activeIdx === imageList.length - 1 && delta < 0)) {
                    setDragDelta(delta * 0.2);
                } else {
                    setDragDelta(delta);
                }
            };

            const onCarouselMouseUp = () => {
                if (!isDragging) return;
                setIsDragging(false);
                if (dragDelta < -SWIPE_THRESHOLD && activeIdx < imageList.length - 1) {
                    setActiveIdx(i => i + 1);
                } else if (dragDelta > SWIPE_THRESHOLD && activeIdx > 0) {
                    setActiveIdx(i => i - 1);
                }
                setDragDelta(0);
                dragStart.current = null;
            };

            // ── Render ──────────────────────────────────────────────────────────────
            return (
                <div
                    ref={containerRef}
                    className={`w-full rounded-xl mb-3 border border-white/5 relative bg-black overflow-hidden cursor-pointer select-none media-zoom-effect ${aspectClass}`}
                    style={{ zIndex: isPinching ? 50 : 1 }}
                    onClick={handleClick}
                >
                    {isVideo ? (
                        /* ── SINGLE VIDEO ─────────────────────────────── */
                        <div
                            className="absolute inset-0"
                            onTouchStart={onSingleTouchStart}
                            onTouchMove={onSingleTouchMove}
                            onTouchEnd={onSingleTouchEnd}
                            style={{ transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' }}
                        >
                            <video
                                src={src}
                                className="w-full h-full object-cover pointer-events-none"
                                playsInline loop muted={isMuted || !isInView} autoPlay
                                onLoadedMetadata={handleMediaLoad}
                            />
                            {/* Mute/Unmute button */}
                            <button
                                onClick={toggleMute}
                                className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white transition-all z-10 pointer-events-auto">
                                {isMuted ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                )}
                            </button>
                        </div>
                    ) : isMulti ? (
                        /* ── MULTI-IMAGE CAROUSEL ──────────────────────── */
                        <>
                            <div
                                className="absolute inset-0 flex"
                                style={{
                                    transform: `translateX(calc(${-activeIdx * (100 / imageList.length)}% + ${dragDelta}px))`,
                                    transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
                                    width: `${imageList.length * 100}%`
                                }}
                                onTouchStart={onCarouselTouchStart}
                                onTouchMove={onCarouselTouchMove}
                                onTouchEnd={onCarouselTouchEnd}
                                onMouseDown={onCarouselMouseDown}
                                onMouseMove={onCarouselMouseMove}
                                onMouseUp={onCarouselMouseUp}
                                onMouseLeave={onCarouselMouseUp}
                            >
                                {imageList.map((imgSrc, idx) => (
                                    <div key={idx} className="h-full flex-shrink-0" style={{ width: `${100 / imageList.length}%` }}>
                                        <img
                                            src={imgSrc}
                                            alt={`Image ${idx + 1}`}
                                            loading={idx === 0 ? 'eager' : 'lazy'}
                                            className="w-full h-full object-cover pointer-events-none"
                                            onLoad={idx === 0 ? handleMediaLoad : undefined}
                                            draggable="false"
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Dot indicators */}
                            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
                                {imageList.map((_, idx) => (
                                    <div key={idx} className="transition-all duration-300" style={{
                                        width: idx === activeIdx ? '18px' : '6px',
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: idx === activeIdx ? 'white' : 'rgba(255,255,255,0.4)'
                                    }} />
                                ))}
                            </div>
                            {/* Image count badge */}
                            <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] text-white font-bold pointer-events-none z-10">
                                {activeIdx + 1}/{imageList.length}
                            </div>
                        </>
                    ) : (
                        /* ── SINGLE IMAGE ──────────────────────────────── */
                        <div
                            className="absolute inset-0"
                            onTouchStart={onSingleTouchStart}
                            onTouchMove={onSingleTouchMove}
                            onTouchEnd={onSingleTouchEnd}
                            style={{ transform: `scale(${scale})`, transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`, transition: isPinching ? 'none' : 'transform 0.3s' }}
                        >
                            <img
                                src={src}
                                alt="Post media"
                                loading="lazy"
                                className="w-full h-full object-cover pointer-events-none"
                                onLoad={handleMediaLoad}
                                draggable="false"
                            />
                        </div>
                    )}
                </div>
            );
        };

        // ─── FULL-SCREEN IMAGE VIEWER (multi-image swipe + pinch-zoom) ─────────────
        const ImageViewer = ({ src, type, images, initialIndex = 0, onClose }) => {
            // Normalize: images[] takes priority; fall back to single src
            const imgList = (images && images.length > 0) ? images : (src && type !== 'video' ? [src] : []);
            const isVideo = type === 'video' && (!images || images.length === 0);
            const isMulti = imgList.length > 1;

            const [currentIdx, setCurrentIdx] = useState(initialIndex || 0);
            const [scale, setScale] = useState(1);
            const [position, setPosition] = useState({ x: 0, y: 0 });
            const [isPinching, setIsPinching] = useState(false);
            const [isDragging, setIsDragging] = useState(false);
            const [dragDelta, setDragDelta] = useState(0);
            const initialDist = useRef(null);
            const lastScale = useRef(1);
            const lastTouch = useRef({ x: 0, y: 0 });
            const dragStart = useRef(null);
            const SWIPE_THRESHOLD = 50;

            if (!src && imgList.length === 0) return null;

            const resetZoom = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

            // ── Touch handlers (pinch + pan + swipe) ────────────────────────────────
            const handleTouchStart = (e) => {
                if (e.touches.length === 2) {
                    setIsPinching(true);
                    const t1 = e.touches[0], t2 = e.touches[1];
                    initialDist.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    lastScale.current = scale;
                } else if (e.touches.length === 1) {
                    if (scale > 1) {
                        lastTouch.current = { x: e.touches[0].pageX - position.x, y: e.touches[0].pageY - position.y };
                    } else if (isMulti) {
                        dragStart.current = e.touches[0].clientX;
                        setIsDragging(true);
                    }
                }
            };

            const handleTouchMove = (e) => {
                if (e.touches.length === 2 && isPinching && initialDist.current) {
                    e.preventDefault();
                    const t1 = e.touches[0], t2 = e.touches[1];
                    const d = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                    setScale(Math.min(Math.max((d / initialDist.current) * lastScale.current, 1), 5));
                } else if (e.touches.length === 1 && scale > 1) {
                    const newX = e.touches[0].pageX - lastTouch.current.x;
                    const newY = e.touches[0].pageY - lastTouch.current.y;
                    const limitX = (scale - 1) * (window.innerWidth / 2);
                    const limitY = (scale - 1) * (window.innerHeight / 2);
                    setPosition({ x: Math.min(Math.max(newX, -limitX), limitX), y: Math.min(Math.max(newY, -limitY), limitY) });
                } else if (e.touches.length === 1 && isDragging && isMulti && scale <= 1) {
                    const delta = e.touches[0].clientX - dragStart.current;
                    if ((currentIdx === 0 && delta > 0) || (currentIdx === imgList.length - 1 && delta < 0)) {
                        setDragDelta(delta * 0.2);
                    } else {
                        setDragDelta(delta);
                    }
                }
            };

            const handleTouchEnd = () => {
                setIsPinching(false);
                if (scale <= 1) setPosition({ x: 0, y: 0 });
                if (isDragging) {
                    setIsDragging(false);
                    if (dragDelta < -SWIPE_THRESHOLD && currentIdx < imgList.length - 1) {
                        setCurrentIdx(i => i + 1);
                        resetZoom();
                    } else if (dragDelta > SWIPE_THRESHOLD && currentIdx > 0) {
                        setCurrentIdx(i => i - 1);
                        resetZoom();
                    }
                    setDragDelta(0);
                    dragStart.current = null;
                }
            };

            const handleDoubleTap = (e) => {
                e.stopPropagation();
                if (scale > 1) { resetZoom(); } else { setScale(2.5); }
            };

            return (
                <div
                    className="fixed inset-0 z-[100] bg-black animate-fade-in overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-5 right-5 p-2.5 bg-white/10 rounded-full text-white z-50 backdrop-blur-sm"
                        onClick={onClose}
                    >
                        <Icon icon="X" size={22} />
                    </button>

                    {/* Counter */}
                    {isMulti && (
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white font-bold z-50">
                            {currentIdx + 1} / {imgList.length}
                        </div>
                    )}

                    {isVideo ? (
                        /* ── Full-screen video ─────────── */
                        <div className="w-full h-full flex items-center justify-center p-4" onClick={onClose}>
                            <video
                                src={src}
                                className="max-w-full max-h-full object-contain"
                                controls autoPlay
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    ) : isMulti ? (
                        /* ── Multi-image swipeable fullscreen ── */
                        <>
                            <div
                                className="absolute inset-0 flex items-center"
                                style={{
                                    transform: `translateX(calc(${-currentIdx * (100 / imgList.length)}% + ${dragDelta}px))`,
                                    transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
                                    width: `${imgList.length * 100}%`
                                }}
                            >
                                {imgList.map((imgSrc, idx) => (
                                    <div key={idx} className="h-full flex items-center justify-center flex-shrink-0" style={{ width: `${100 / imgList.length}%` }}>
                                        <img
                                            src={imgSrc}
                                            alt={`Image ${idx + 1}`}
                                            className="max-w-full max-h-full object-contain select-none p-2"
                                            style={idx === currentIdx ? { transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s' } : {}}
                                            onDoubleClick={idx === currentIdx ? handleDoubleTap : undefined}
                                            draggable="false"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Dot indicators */}
                            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-none z-50">
                                {imgList.map((_, idx) => (
                                    <div key={idx} style={{
                                        width: idx === currentIdx ? '20px' : '6px',
                                        height: '6px', borderRadius: '3px',
                                        background: idx === currentIdx ? 'white' : 'rgba(255,255,255,0.4)',
                                        transition: 'all 0.3s'
                                    }} />
                                ))}
                            </div>
                        </>
                    ) : (
                        /* ── Single image ──────────────── */
                        <div
                            className="w-full h-full flex items-center justify-center"
                            onClick={onClose}
                        >
                            <img
                                src={imgList[0] || src}
                                className="max-w-full max-h-full object-contain p-2 select-none"
                                style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isPinching ? 'none' : 'transform 0.1s ease-out' }}
                                onDoubleClick={handleDoubleTap}
                                onClick={e => e.stopPropagation()}
                                draggable="false"
                            />
                        </div>
                    )}
                </div>
            );
        };

        const PostCard = ({ post, onShare, onReport, userProfile, onBookmark, savedPosts, onRemove, onImageClick }) => {
            const [isLiked, setIsLiked] = useState(false);
            const [localLikes, setLocalLikes] = useState(post.agrees || 0);
            const [showMoreMenu, setShowMoreMenu] = useState(false);
            const [showComments, setShowComments] = useState(false);
            const [isHidden, setIsHidden] = useState(false);
            const isSaved = savedPosts?.has(String(post.id));
            const [localCommentCount, setLocalCommentCount] = useState(post.comments || 0);

            // Social Integration States
            const [comments, setComments] = useState([]);
            const [commentText, setCommentText] = useState('');
            const [isSubmitting, setIsSubmitting] = useState(false);
            const [replyingTo, setReplyingTo] = useState(null);
            const [mentionQuery, setMentionQuery] = useState('');
            const commentInputRef = useRef(null);

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

            const toggleComments = async () => {
                vibrate(5);
                const nextState = !showComments;
                setShowComments(nextState);
                if (nextState && comments.length === 0) {
                    await fetchComments();
                }
            };

            const fetchComments = async () => {
                try {
                    const data = await window.getComments(post.id);
                    setComments(data || []);
                } catch (err) {
                    console.error('Failed to fetch comments', err);
                }
            };

            const handleCommentChange = (e) => {
                const val = e.target.value;
                setCommentText(val);

                // Mention logic (same as feed pages)
                const cursor = e.target.selectionStart;
                const atMatch = val.substring(0, cursor).match(/@([\w.]*)$/);
                setMentionQuery(atMatch ? atMatch[1] : null);
            };

            const handleMentionSelect = (user) => {
                const cursor = commentInputRef.current?.selectionStart || commentText.length;
                const textBeforeCursor = commentText.substring(0, cursor);
                const textAfterCursor = commentText.substring(cursor);
                const atIndex = textBeforeCursor.lastIndexOf('@');

                if (atIndex !== -1) {
                    const newTextBefore = textBeforeCursor.substring(0, atIndex) + '@' + user.username + ' ';
                    setCommentText(newTextBefore + textAfterCursor);
                    setMentionQuery(null);
                    setTimeout(() => {
                        if (commentInputRef.current) {
                            const newPos = newTextBefore.length;
                            commentInputRef.current.focus();
                            commentInputRef.current.setSelectionRange(newPos, newPos);
                        }
                    }, 0);
                }
            };

            const submitComment = async () => {
                if (!commentText.trim() || isSubmitting) return;
                setIsSubmitting(true); vibrate(10);
                try {
                    const tempId = Date.now();
                    const newComment = {
                        id: tempId,
                        text: commentText,
                        user: userProfile?.full_name || 'Me',
                        username: userProfile?.username || 'me',
                        avatar: userProfile?.avatar_url || DEFAULT_AVATAR,
                        user_id: userProfile?.id,
                        time: 'now',
                        likes_count: 0,
                        replies: [],
                        isPending: true
                    };

                    if (replyingTo) {
                        setComments(prev => prev.map(c => {
                            if (c.id === replyingTo.topLevelId) return { ...c, replies: [...(c.replies || []), newComment] };
                            return c;
                        }));
                        const currentReplyingTo = replyingTo;
                        setCommentText(''); setReplyingTo(null);
                        await window.createReply(post.id, currentReplyingTo.topLevelId, commentText);
                    } else {
                        setComments(prev => [newComment, ...prev]);
                        setCommentText(''); setReplyingTo(null);
                        await window.createComment(post.id, commentText);
                    }

                    await fetchComments();
                } catch (err) {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to post', isSuccess: false } }));
                } finally {
                    setIsSubmitting(false);
                }
            };

            const handleLike = async () => {
                vibrate(10);
                const newLiked = !isLiked;
                setIsLiked(newLiked);
                setLocalLikes(prev => newLiked ? prev + 1 : prev - 1);

                try {
                    if (newLiked) await window.likePost(post.id);
                    else await window.unlikePost(post.id);
                } catch (err) {
                    console.error('Like action failed', err);
                    setIsLiked(!newLiked);
                    setLocalLikes(prev => !newLiked ? prev + 1 : prev - 1);
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: err.message || 'Action failed', icon: 'AlertTriangle', isSuccess: false } }));
                }
            };

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

            useEffect(() => {
                const channel = window.supabase.channel(`post-likes:${post.id}`)
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

            const toggleMoreMenu = (e) => {
                e.stopPropagation();
                vibrate(5);
                setShowMoreMenu(!showMoreMenu);
            };

            const handleMoreAction = (action) => {
                vibrate(10);
                setShowMoreMenu(false);

                if (action === 'edit') {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Edit feature coming soon!', icon: 'FileText' } }));
                } else if (action === 'delete') {
                    if (confirm('Are you sure you want to delete this opinion?')) {
                        if (onRemove) onRemove(post.id, 'Deleted', 'delete');
                    }
                } else if (action === 'not_interested') {
                    if (onRemove) onRemove(post.id, 'Marked as not interested', 'not_interested', post.category);
                } else if (action === 'hide') {
                    setIsHidden(true);
                    if (onRemove) onRemove(post.id, 'Opinion hidden', 'hide_post');
                } else if (action === 'block_brand') {
                    if (onRemove) onRemove(post.id, `Posts from ${post.seenBy || 'Brand'} hidden`, 'mute_brand', post.seenBy);
                } else if (action === 'bookmark') {
                    const nextState = !isSaved;
                    if (onBookmark) onBookmark(post.id, nextState);
                } else if (action === 'insight') {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Insight feature coming soon!', icon: 'BarChart' } }));
                }
            };

            if (isHidden) {
                return (
                    <div className="glass-panel rounded-2xl p-4 mb-4 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3">
                            <Icon icon="EyeOff" size={20} className="text-muted" />
                            <span className="text-sm text-gray-400">Opinion hidden</span>
                        </div>
                        <button onClick={() => setIsHidden(false)} className="underline text-neon text-xs">Undo</button>
                    </div>
                );
            }

            return (
                <div className="glass-panel p-4 rounded-2xl mb-4 relative transition-all duration-300 animate-slide-in group active:scale-[0.99]">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-3 w-full">
                            <div className="relative group cursor-pointer active:scale-95 transition-transform" onClick={() => { vibrate(5); window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id || post.id}`; }}>
                                <img src={post.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" />
                            </div>

                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-heading font-bold text-white text-sm truncate cursor-pointer hover:text-neon transition-colors" onClick={() => { vibrate(5); window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id || post.id}`; }}>{post.name}</span>
                                    <div className="bg-gradient-to-r from-neon to-blue-600 px-2 py-0.5 rounded-full flex items-center shrink-0 shadow-[0_0_8px_rgba(47,139,255,0.3)]">
                                        <span className="font-heading font-bold text-[9px] text-white tracking-wide">RQS {post.rqs}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-muted truncate cursor-pointer hover:text-white transition-colors" onClick={() => { vibrate(5); window.location.href = `PUBLIC POV PROFILE.HTML?id=${post.user_id || post.id}`; }}>@{post.username}</div>
                            </div>
                        </div>
                        <div className="absolute top-4 right-4 touch-scale text-muted/60 hover:text-white group z-10" onClick={toggleMoreMenu} ref={moreButtonRef}>
                            <Icon icon="MoreVertical" size={18} />
                        </div>
                    </div>

                    {showMoreMenu && ReactDOM.createPortal(
                        <>
                            <div className="fixed inset-0 z-[9998]" onClick={(e) => { e.stopPropagation(); setShowMoreMenu(false); }}></div>
                            <div
                                className="absolute z-[9999] bg-[#1A1C2E] border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-56 animate-fade-in origin-top-right backdrop-blur-xl"
                                style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {userProfile && userProfile.id === (post.user_id || post.profiles?.id) ? (
                                    /* Owner Options */
                                    <>
                                        <button onClick={() => handleMoreAction('edit')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                            <Icon icon="FileText" size={16} className="text-muted" />
                                            <span>Edit Opinion</span>
                                        </button>
                                        <button onClick={() => handleMoreAction('delete')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-red-400 group">
                                            <Icon icon="Trash" size={16} className="text-red-400" />
                                            <span>Delete Opinion</span>
                                        </button>
                                        <div className="h-px bg-white/10 my-1"></div>
                                        <button onClick={() => handleMoreAction('bookmark')} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left text-xs text-white">
                                            <Icon icon="BookMark" size={16} className={isSaved ? "text-neon" : "text-muted"} />
                                            <span>{isSaved ? 'Bookmarked' : 'Bookmark'}</span>
                                        </button>
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
                                            <Icon icon="BookMark" size={16} className={isSaved ? "text-neon" : "text-muted"} />
                                            <span>{isSaved ? 'Bookmarked' : 'Bookmark'}</span>
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

                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-2 mb-3 mt-1">
                        <div className="border border-white/10 rounded-full px-3 py-1 flex items-center bg-white/5 text-[10px] text-white/80 font-medium">
                            <span className="text-neon">{post.category}</span>
                            <span className="mx-1.5 opacity-30">|</span>
                            <span>{post.product}</span>
                        </div>
                        {post.verified && (
                            <div className="flex items-center gap-1 text-[#00E676]"> {/* FIXED: Correct Green */}
                                <Icon icon="ShieldCheck" size={16} />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-200 leading-relaxed mb-3 font-light pr-2">{renderTextWithMentions(post.text)}</p>

                    {(post.media || (post.images && post.images.length > 0)) && (
                        <SmartMedia
                            src={post.media}
                            type={post.media_type}
                            images={post.images}
                            onImageClick={onImageClick}
                        />
                    )}

                    {/* Footer */}
                    <div className="flex items-end justify-between pt-3 mt-1 relative">
                        <div className="flex items-center gap-6">
                            <button
                                className={`flex items-center gap-1.5 touch-scale transition-colors ${isLiked ? 'text-neon' : 'text-muted hover:text-neon'}`}
                                onClick={handleLike}
                            >
                                <div className={isLiked ? "animate-pop" : ""}>
                                    <Icon icon="ThumbsUp" size={20} className={isLiked ? 'fill-neon/20' : ''} />
                                </div>
                                <span className="text-xs font-medium">{localLikes}</span>
                            </button>
                            <button className={`flex items-center gap-1.5 touch-scale transition-transform hover:text-white ${showComments ? 'text-white' : 'text-muted'}`} onClick={toggleComments}>
                                <Icon icon="MessageCircle" size={20} />
                                <span className="text-xs font-medium">{localCommentCount}</span>
                            </button>
                            <button
                                className="text-muted hover:text-white transition-colors touch-scale"
                                onClick={() => { vibrate(5); if (onShare) onShare(post); }}
                            >
                                <Icon icon="Share" size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[9px] text-neon/80 font-medium tracking-wide bg-neon/5 px-2 py-0.5 rounded border border-neon/10 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_5px_var(--neon)]"></div>
                                Seen by {BRAND.name}
                            </span>
                            <button
                                className="text-muted/40 hover:text-red-400 transition-colors touch-scale"
                                onClick={() => { vibrate(5); if (onReport) onReport(post.id); }}
                            >
                                <Icon icon="AlertTriangle" size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-muted/40 font-medium">
                        <Icon icon="Clock" size={12} />
                        <span>Posted {post.time}</span>
                    </div>

                    {/* Enhanced Comment Section */}
                    {showComments && (
                        <div className="mt-4 pt-0 border-t border-white/5 animate-fade-in origin-top">
                            <div className="flex justify-between items-center mb-3 pt-4">
                                <span className="text-xs font-bold text-white">Comments ({localCommentCount})</span>
                                <button onClick={() => setShowComments(false)} className="text-muted hover:text-white text-xs">Close</button>
                            </div>

                            {/* Input Area */}
                            <div className="relative mb-4">
                                {replyingTo && (
                                    <div className="flex items-center justify-between bg-white/5 p-2 rounded-t-xl border-x border-t border-white/10 animate-slide-up">
                                        <span className="text-[10px] text-muted truncate">Replying to <span className="text-neon font-bold">@{replyingTo.username || replyingTo.user}</span></span>
                                        <button onClick={() => setReplyingTo(null)} className="text-muted hover:text-white"><Icon icon="X" size={12} /></button>
                                    </div>
                                )}
                                <div className={`relative flex items-center gap-2 bg-white/5 p-2 ${replyingTo ? 'rounded-b-xl border-x border-b' : 'rounded-xl border'} border-white/10 focus-within:border-neon/30 transition-colors`}>
                                    <input
                                        ref={commentInputRef}
                                        type="text"
                                        value={commentText}
                                        onChange={handleCommentChange}
                                        placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                                        className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-muted/50 py-1"
                                        onKeyPress={(e) => e.key === 'Enter' && submitComment()}
                                    />
                                    <button
                                        onClick={submitComment}
                                        disabled={!commentText.trim() || isSubmitting}
                                        className={`p-1.5 rounded-lg transition-all ${commentText.trim() ? 'bg-neon/20 text-neon shadow-[0_0_10px_rgba(47,139,255,0.2)]' : 'text-muted/30 cursor-not-allowed'}`}
                                    >
                                        <Icon icon="Send" size={14} />
                                    </button>
                                </div>
                                <MentionAutocomplete query={mentionQuery} onSelect={handleMentionSelect} />
                            </div>

                            {/* Comments List */}
                            <div className="space-y-1 mb-2 max-h-80 overflow-y-auto no-scrollbar scroll-smooth">
                                {comments.length > 0 ? (
                                    comments.map(c => (
                                        <CommentItem key={c.id} comment={c} onReply={(target, topLevelId = null) => { setReplyingTo({ ...target, topLevelId: topLevelId || target.id }); commentInputRef.current?.focus(); }} />
                                    ))
                                ) : (
                                    <div className="text-center text-muted text-[11px] py-8 border border-dashed border-white/5 rounded-xl">
                                        No comments yet. Be the first to share your thoughts!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        // 6. DASHBOARD VIEW (Enhanced Analytics & Time Periods)
        const DashboardView = ({ onFilter, activeFilters, onShare, onReport, hiddenPostIds = new Set(), userProfile, onBookmark, savedPosts, onRemove, onImageClick }) => {
            const [metricMode, setMetricMode] = useState(0);
            const [timePeriod, setTimePeriod] = useState('30D');
            const [showSummary, setShowSummary] = useState(false);
            const [showMarketPrediction, setShowMarketPrediction] = useState(false);

            // X-AXIS LABELS LOGIC
            const xAxisLabels = {
                'Today': ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
                '7D': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                '30D': ['1', '5', '10', '15', '20', '25', '30'],
                '6M': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                '1Y': ['Jul', 'Sep', 'Nov', 'Jan', 'Mar', 'May'] // Assuming start from mid-year
            };

            const currentXLabels = xAxisLabels[timePeriod];

            // DATA SETS: Unique paths for metrics + time-based Mentions/Share
            const timeData = {
                'Today': { mentions: "0.8K", mentionsWidth: "5%", share: "41.5%", shareWidth: "41.5%" },
                '7D': { mentions: "4.2K", mentionsWidth: "25%", share: "41.8%", shareWidth: "41.8%" },
                '30D': { mentions: "12.5K", mentionsWidth: "60%", share: "42.0%", shareWidth: "42%" },
                '6M': { mentions: "78K", mentionsWidth: "85%", share: "44.2%", shareWidth: "44.2%" },
                '1Y': { mentions: "154K", mentionsWidth: "100%", share: "46.5%", shareWidth: "46.5%" }
            };

            const currentBaseData = timeData[timePeriod];

            // METRIC MODES - Unique curves for EACH mode
            const tpIndex = ['Today', '7D', '30D', '6M', '1Y'].indexOf(timePeriod);
            const pathModifier = tpIndex * 15;

            // Base Curve (Total Impact) - Smooth Upward
            const impactPath = `M0,${160 - pathModifier} Q80,${150 - pathModifier} 160,${100 + pathModifier} T240,${80 - pathModifier} T320,${60 - pathModifier} T400,20`;

            // Engagement Curve - Spiky/Volatile
            const engagePath = `M0,${180 - pathModifier} Q40,${170 - pathModifier} 80,100 T120,150 T200,60 T280,110 T360,50 T400,80`;

            // Conversion Curve - Flatter, lower
            const convertPath = `M0,${140 + pathModifier} Q100,140 200,${120 - pathModifier} T300,115 T400,105`;

            const metrics = [
                {
                    label: "Total Impact",
                    value: (92.4 + (tpIndex * 0.5)).toFixed(1),
                    trend: "+1.2%",
                    path: `${impactPath} L400,220 L0,220 Z`,
                    stroke: impactPath,
                    high: { x: 400, y: 20, val: "Peak" }, low: { x: 0, y: 160 - pathModifier, val: "Start" },
                    prediction: "+0.2% projected"
                },
                {
                    label: "Engagement",
                    value: (45 + (tpIndex * 5)) + "K",
                    trend: "+5.8%",
                    path: `${engagePath} L400,220 L0,220 Z`,
                    stroke: engagePath,
                    high: { x: 200, y: 60, val: "Viral" }, low: { x: 120, y: 150, val: "Dip" },
                    prediction: "+0.5% predicted"
                },
                {
                    label: "Conversion",
                    value: (3.2 + (tpIndex * 0.1)).toFixed(1) + "%",
                    trend: "-0.4%",
                    path: `${convertPath} L400,220 L0,220 Z`,
                    stroke: convertPath,
                    high: { x: 400, y: 105, val: "Max" }, low: { x: 0, y: 140 + pathModifier, val: "Min" },
                    prediction: "Stable outlook"
                }
            ];

            const currentMetric = metrics[metricMode];

            // Filter Logic
            const filteredFeed = useMemo(() => {
                return FEEDBACK_DATA.filter(post => {
                    if (hiddenPostIds.has(post.id)) return false; // Strict Filtering
                    if (activeFilters.source !== 'All') {
                        if (activeFilters.source === 'Tagged (Apple)' && post.tag !== 'Tagged') return false;
                        if (activeFilters.source === 'Competitor' && post.tag !== 'Competitor') return false;
                        if (activeFilters.source === 'General Market' && post.tag !== 'General') return false;
                    }
                    if (activeFilters.type !== 'All') {
                        if (activeFilters.type === 'Positive' && post.sentiment !== 'Positive') return false;
                        if (activeFilters.type === 'Negative' && post.sentiment !== 'Negative') return false;
                        if (activeFilters.type === 'Problem' && post.sentiment !== 'Problem') return false;
                        if (activeFilters.type === 'Solution' && post.sentiment !== 'Solution') return false;
                    }
                    return true;
                });
            }, [activeFilters, hiddenPostIds]);

            // GENERATE REAL SUMMARY
            const getSummary = () => {
                const metricName = currentMetric.label;
                const filterContext = activeFilters.source !== 'All' ? `for ${activeFilters.source}` : 'across all sources';

                if (timePeriod === 'Today') {
                    return `Real-time Analysis: ${metricName} is showing volatility today. A distinct spike occurred at 2PM, likely driven by recent social media activity. Current momentum suggests a positive close for the day ${filterContext}.`;
                } else if (timePeriod === '7D') {
                    return `Weekly Report: ${metricName} has stabilized after a mid-week fluctuation. The weekend trend indicates growing user interest. Key drivers include positive reception of recent software updates ${filterContext}.`;
                } else if (timePeriod === '30D') {
                    return `Monthly Overview: Consistent growth in ${metricName} observed. The 12th of the month marked a significant milestone, correlating with the new product announcement. Overall sentiment remains bullish ${filterContext}.`;
                } else if (timePeriod === '6M') {
                    return `Bi-Annual Review: ${metricName} has seen substantial organic growth. Seasonal trends in Q2 negatively impacted early metrics, but recovery in Q3 was strong ${filterContext}.`;
                } else {
                    return `Annual Strategic View: ${metricName} demonstrates a robust upward trajectory over the last year. Peaks align with major holiday sales and product cycles, confirming strong market positioning ${filterContext}.`;
                }
            };

            return (
                <div className="p-4 pb-20 space-y-4">
                    {/* Analytics Card */}
                    <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col gap-4">

                        {/* Time Period Selectors */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 z-20 relative">
                            {['Today', '7D', '30D', '6M', '1Y'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => { vibrate(5); setTimePeriod(period); }}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border ${timePeriod === period ? 'bg-neon/20 text-neon border-neon/50' : 'bg-white/5 text-muted border-transparent hover:bg-white/10'}`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h2 className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold mb-1">{currentMetric.label}</h2>
                                <div className="flex items-baseline gap-2">
                                    <span className="font-heading text-4xl font-bold text-white transition-all duration-300">{currentMetric.value}</span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${currentMetric.trend.includes('+') ? 'text-accent-green bg-accent-green/10 border-accent-green/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>
                                        {currentMetric.trend}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => { vibrate(5); setMetricMode((prev) => (prev + 1) % 3); }}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-transform hover:bg-white/10 group"
                            >
                                <Icon icon="TrendingUp" size={20} className="text-white group-hover:text-neon transition-colors" />
                            </button>
                        </div>

                        {/* Chart Area - Expanded Height & Padding */}
                        <div className="w-full relative h-64 mt-4 mb-2">
                            {/* Y-Axis Grid & Labels - Left Aligned */}
                            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none z-0 pr-4">
                                {[100, 75, 50, 25, 0].map((val, i) => (
                                    <div key={i} className="flex items-center w-full">
                                        <span className="text-[9px] text-muted/30 font-mono w-6 text-right pr-2">{val}</span>
                                        <div className="h-px bg-white/5 w-full"></div>
                                    </div>
                                ))}
                            </div>

                            {/* SVG Chart */}
                            <svg className="w-full h-full overflow-visible relative z-10 pl-8 pb-8" viewBox="0 0 400 200" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2f8bff" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#2f8bff" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <motion.path
                                    d={currentMetric.path}
                                    fill="url(#areaGradient)"
                                    animate={{ d: currentMetric.path }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                />
                                <motion.path
                                    d={currentMetric.stroke}
                                    fill="none"
                                    stroke="var(--neon)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    animate={{ d: currentMetric.stroke }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                />
                                {/* High/Low Points */}
                                <motion.g animate={{ x: currentMetric.high.x, y: currentMetric.high.y }} transition={{ duration: 0.6 }}>
                                    <circle r="4" fill="#020205" stroke="#00E676" strokeWidth="2" />
                                    <text y="-8" textAnchor="middle" fill="#00E676" fontSize="10" fontWeight="bold">{currentMetric.high.val}</text>
                                </motion.g>
                                <motion.g animate={{ x: currentMetric.low.x, y: currentMetric.low.y }} transition={{ duration: 0.6 }}>
                                    <circle r="4" fill="#020205" stroke="#FF5252" strokeWidth="2" />
                                    <text y="14" textAnchor="middle" fill="#FF5252" fontSize="10" fontWeight="bold">{currentMetric.low.val}</text>
                                </motion.g>
                            </svg>

                            {/* X-Axis Labels - Absolute Bottom Padding */}
                            <div className="absolute bottom-0 left-0 w-full flex justify-between pl-10 pr-2 pb-1 text-[9px] text-muted font-mono pointer-events-none z-0 opacity-60">
                                {currentXLabels.map((label, idx) => (
                                    <span key={idx}>{label}</span>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats - Dynamic Data */}
                        <div className="grid grid-cols-2 gap-3 mt-2 border-t border-white/5 pt-4">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="text-[9px] text-muted uppercase font-bold mb-1">Mentions</div>
                                <div className="text-lg font-bold text-white transition-all">{currentBaseData.mentions}</div>
                                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: currentBaseData.mentionsWidth }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {/* MARKET SHARE CARD with Prediction Overlay */}
                            <div
                                className="bg-white/5 rounded-xl p-3 border border-white/5 relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
                                onClick={() => setShowMarketPrediction(!showMarketPrediction)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="text-[9px] text-muted uppercase font-bold mb-1">Market Share</div>
                                    <div className="bg-neon/10 rounded-md px-1 py-0.5 flex items-center gap-1">
                                        <Icon icon="Zap" size={8} className="text-neon" />
                                        <span className="text-[8px] font-bold text-neon">AI</span>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-white transition-all">{currentBaseData.share}</div>
                                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-[#FFD700]"
                                        initial={{ width: 0 }}
                                        animate={{ width: currentBaseData.shareWidth }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>

                                {/* PREDICTION OVERLAY */}
                                <AnimatePresence>
                                    {showMarketPrediction && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-[#020205]/95 backdrop-blur-md flex flex-col justify-center items-center text-center p-2 z-10"
                                        >
                                            <span className="text-[9px] text-muted uppercase font-bold mb-1">Predicted Impact</span>
                                            <span className="text-sm font-bold text-accent-green">{currentMetric.prediction}</span>
                                            <span className="text-[8px] text-muted leading-tight mt-1">Based on {currentMetric.label} Trend</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* SUMMARISE CHART FEATURE */}
                    <div className="glass-panel p-0 rounded-2xl overflow-hidden border border-white/10">
                        <button
                            onClick={() => setShowSummary(!showSummary)}
                            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-neon/10 text-neon"><Icon icon="FileText" size={18} /></div>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">AI Chart Summary</span>
                            </div>
                            <Icon icon={showSummary ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted" />
                        </button>
                        <AnimatePresence>
                            {showSummary && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-4 pb-4 bg-black/20"
                                >
                                    <div className="pt-2 text-xs text-gray-300 leading-relaxed border-t border-white/5 font-mono">
                                        {getSummary()}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* LIVE OPINION */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1 sticky top-0 bg-[#020205]/90 backdrop-blur-md py-2 z-20">
                            <h3 className="font-heading text-lg font-bold text-white">Live Opinion</h3>
                            <button onClick={onFilter} className="text-neon hover:text-white transition-colors bg-neon/10 p-2 rounded-lg border border-neon/20 active:scale-95">
                                <Icon icon="Filter" size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {filteredFeed.length > 0 ? (
                                filteredFeed.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onShare={onShare}
                                        onReport={onReport}
                                        userProfile={userProfile}
                                        onBookmark={onBookmark}
                                        savedPosts={savedPosts}
                                        onRemove={onRemove}
                                        onImageClick={onImageClick}
                                    />
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted text-sm border border-dashed border-white/10 rounded-2xl">
                                    No opinions found for these filters.
                                </div>
                            )}
                            <div className="text-center py-6">
                                <div className="inline-block w-6 h-6 border-2 border-white/20 border-t-neon rounded-full animate-spin"></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        // RESTORED TOOLS VIEWS
        const SentimentView = () => (
            <div className="p-4 space-y-6 pb-20 animate-fade">
                <div className="glass-panel p-6 rounded-3xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon/10 to-transparent"></div>
                    <div className="relative z-10">
                        <h2 className="font-heading text-2xl font-bold text-white mb-2">Sentiment Pulse</h2>
                        <div className="flex justify-center items-center my-6">
                            <div className="w-40 h-40 rounded-full border-[10px] border-white/5 relative flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--neon)" strokeWidth="10" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" />
                                </svg>
                                <div className="text-center">
                                    <span className="block text-3xl font-bold text-white">76</span>
                                    <span className="text-[10px] text-muted uppercase">NPS Score</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-6 text-xs font-bold">
                            <span className="text-accent-green">Positive 65%</span>
                            <span className="text-white">Neutral 20%</span>
                            <span className="text-red-500">Negative 15%</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3 px-1">Voice of Customer (Cloud)</h3>
                    <div className="flex flex-wrap gap-2">
                        {["Battery Life", "Titanium Frame", "Overheating", "Price", "Ecosystem", "USB-C", "Zoom", "Action Button", "Dynamic Island"].map((word, i) => (
                            <span key={i} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-transform hover:scale-105 cursor-default ${i % 3 === 0 ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : i % 3 === 1 ? 'bg-white/5 border-white/10 text-white' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );

        const PerformanceView = () => (
            <div className="p-4 space-y-6 pb-20 animate-fade">
                <div className="glass-panel p-5 rounded-3xl border border-white/10 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Icon icon="Performance" size={32} className="text-black" />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-white">Market Leader</h2>
                    <p className="text-xs text-muted mt-1">Top Performer in "Premium Smartphones"</p>
                </div>

                <div className="space-y-4">
                    <div className="glass-panel p-4 rounded-2xl">
                        <h3 className="text-sm font-bold text-white mb-4">Conversion Funnel</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] w-12 text-muted">View</span>
                                <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden relative">
                                    <div className="h-full bg-neon w-full"></div>
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-black">100%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] w-12 text-muted">Engage</span>
                                <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden relative">
                                    <div className="h-full bg-neon w-[65%]"></div>
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white">65%</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] w-12 text-muted">Buy</span>
                                <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden relative">
                                    <div className="h-full bg-accent-green w-[12%]"></div>
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white">12%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-4 rounded-2xl">
                        <h3 className="text-sm font-bold text-white mb-3">Retention Cohorts</h3>
                        <div className="grid grid-cols-5 gap-1 text-center text-[9px] font-mono">
                            <div className="col-span-1 text-muted">Week 1</div>
                            <div className="col-span-4 bg-neon/80 rounded py-1 text-black font-bold">98%</div>
                            <div className="col-span-1 text-muted">Week 4</div>
                            <div className="col-span-3 bg-neon/60 rounded py-1 text-white">85%</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-1 text-muted">Week 12</div>
                            <div className="col-span-2 bg-neon/40 rounded py-1 text-white">72%</div>
                            <div className="col-span-2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );

        const CompetitorView = () => (
            <div className="p-4 space-y-6 pb-20 animate-fade">
                <div className="glass-panel p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
                    <h2 className="font-heading text-xl font-bold text-white mb-1">War Room</h2>
                    <p className="text-xs text-red-300">Direct Comparison • Samsung • Google</p>
                </div>

                {/* Comparison Table */}
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-4 bg-white/5 p-3 text-[9px] font-bold text-muted uppercase tracking-wider">
                        <div className="col-span-1">Metric</div>
                        <div className="col-span-1 text-center text-white">Apple</div>
                        <div className="col-span-1 text-center">Samsung</div>
                        <div className="col-span-1 text-center">Google</div>
                    </div>
                    <div className="divide-y divide-white/5 text-xs font-medium text-white">
                        <div className="grid grid-cols-4 p-3">
                            <div className="text-muted">RQS</div>
                            <div className="text-center font-bold text-neon">92</div>
                            <div className="text-center">88</div>
                            <div className="text-center">85</div>
                        </div>
                        <div className="grid grid-cols-4 p-3">
                            <div className="text-muted">Share</div>
                            <div className="text-center font-bold text-neon">42%</div>
                            <div className="text-center">28%</div>
                            <div className="text-center">12%</div>
                        </div>
                        <div className="grid grid-cols-4 p-3">
                            <div className="text-muted">Sentiment</div>
                            <div className="text-center font-bold text-accent-green">Pos</div>
                            <div className="text-center text-white">Neu</div>
                            <div className="text-center text-white">Pos</div>
                        </div>
                    </div>
                </div>

                {/* Switching Reasons */}
                <div className="glass-panel p-4 rounded-2xl">
                    <h3 className="text-sm font-bold text-white mb-4">Why Users Switch?</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-red-400">Lost to Samsung</span>
                                <span className="text-white">Price, Zoom</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full"><div className="w-[30%] h-full bg-red-500 rounded-full"></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-accent-green">Gained from Google</span>
                                <span className="text-white">Ecosystem, App Quality</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full"><div className="w-[45%] h-full bg-accent-green rounded-full"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        );

        // 8. FILTER MODAL (Functional)
        const FilterModal = ({ isOpen, onClose, filters, setFilters }) => {
            const [localSource, setLocalSource] = useState(filters.source);
            const [localType, setLocalType] = useState(filters.type);

            useEffect(() => {
                if (isOpen) {
                    setLocalSource(filters.source);
                    setLocalType(filters.type);
                }
            }, [isOpen, filters]);

            const apply = () => {
                setFilters({ source: localSource, type: localType });
                onClose();
            };

            return (
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed bottom-0 left-0 w-full bg-[#0a0e18] border-t border-white/10 rounded-t-3xl z-[70] p-6 max-w-[480px] mx-auto right-0"
                            >
                                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                                <h3 className="font-heading text-lg font-bold text-white mb-6">Filter Feedback</h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-3 block">Source</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['All', 'Tagged (Apple)', 'Competitor', 'General Market'].map(src => (
                                                <button
                                                    key={src}
                                                    onClick={() => { vibrate(5); setLocalSource(src); }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${localSource === src ? 'bg-neon text-black border-neon' : 'bg-white/5 border-white/10 text-white'}`}
                                                >
                                                    {src}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider mb-3 block">Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => setLocalType('All')} className={`px-4 py-3 rounded-xl border text-xs flex justify-between items-center transition-all ${localType === 'All' ? 'bg-white/10 border-neon text-white' : 'bg-white/5 border-white/10 text-white'}`}>All Types</button>
                                            <button onClick={() => setLocalType('Positive')} className={`px-4 py-3 rounded-xl border text-xs flex justify-between items-center transition-all ${localType === 'Positive' ? 'bg-white/10 border-neon text-white' : 'bg-white/5 border-white/10 text-white'}`}>Positive <div className="w-2 h-2 rounded-full bg-accent-green"></div></button>
                                            <button onClick={() => setLocalType('Negative')} className={`px-4 py-3 rounded-xl border text-xs flex justify-between items-center transition-all ${localType === 'Negative' ? 'bg-white/10 border-neon text-white' : 'bg-white/5 border-white/10 text-white'}`}>Negative <div className="w-2 h-2 rounded-full bg-red-500"></div></button>
                                            <button onClick={() => setLocalType('Problem')} className={`px-4 py-3 rounded-xl border text-xs flex justify-between items-center transition-all ${localType === 'Problem' ? 'bg-white/10 border-neon text-white' : 'bg-white/5 border-white/10 text-white'}`}>Problem</button>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={apply} className="w-full mt-8 bg-white text-black font-bold py-4 rounded-xl text-sm active:scale-95 transition-transform shadow-lg shadow-white/10">
                                    Apply Filters
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            );
        };

        // 9. SETTINGS MODAL
        const SettingsModal = ({ isOpen, onClose }) => (
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 w-full bg-[#0a0e18] border-t border-white/10 rounded-t-3xl z-[70] p-6 max-w-[480px] mx-auto right-0"
                        >
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                            <h3 className="font-heading text-lg font-bold text-white mb-6">Space Settings</h3>

                            <div className="space-y-3">
                                <button onClick={() => vibrate(5)} className="w-full p-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white flex justify-between items-center active:scale-[0.98] transition-all group">
                                    <span className="font-medium group-hover:text-neon transition-colors">Brand Profile</span> <Icon icon="User" size={18} className="text-muted group-hover:text-white" />
                                </button>
                                <button onClick={() => vibrate(5)} className="w-full p-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white flex justify-between items-center active:scale-[0.98] transition-all group">
                                    <span className="font-medium group-hover:text-neon transition-colors">Team Members</span> <Icon icon="Users" size={18} className="text-muted group-hover:text-white" />
                                </button>
                                <button onClick={() => vibrate(5)} className="w-full p-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white flex justify-between items-center active:scale-[0.98] transition-all">
                                    <span className="font-medium">Subscription</span> <span className="text-[10px] bg-neon/20 text-neon px-2 py-0.5 rounded font-bold border border-neon/30">PRO</span>
                                </button>
                            </div>

                            <button onClick={onClose} className="w-full mt-8 bg-white/10 text-white font-bold py-4 rounded-xl text-sm active:scale-95 transition-transform border border-white/10">
                                Close
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );

        // --- SHARE MODAL ---
        const ShareModal = ({ isOpen, onClose, post }) => {

            const [internalContacts, setInternalContacts] = useState([]);
            const [internalLoadingContacts, setInternalLoadingContacts] = useState(false);
            const [internalSelectedContacts, setInternalSelectedContacts] = useState(new Set());
            const [internalSending, setInternalSending] = useState(false);

            useEffect(() => {
                const fetchInternalContacts = async () => {
                    if (!isOpen || !window.getCurrentUser) return;
                    setInternalLoadingContacts(true);
                    try {
                        const user = await window.getCurrentUser();
                        if (!user) return;
                        const { data } = await window.supabase
                            .from('conversations')
                            .select('id, participant_1_id, participant_2_id')
                            .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
                            .order('last_message_at', { ascending: false })
                            .limit(10);
                        if (data && data.length > 0) {
                            const otherIds = [...new Set(data.map(c => c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id))];
                            const { data: profiles } = await window.supabase
                                .from('profiles').select('id, full_name, avatar_url, username').in('id', otherIds);
                            if (profiles) {
                                const profileMap = {};
                                profiles.forEach(p => profileMap[p.id] = p);
                                const contacts = data.map(c => {
                                    const otherId = c.participant_1_id === user.id ? c.participant_2_id : c.participant_1_id;
                                    const profile = profileMap[otherId];
                                    if (!profile) return null;
                                    return { convId: c.id, ...profile };
                                }).filter(Boolean);
                                if (window.rewriteMediaUrl) contacts.forEach(c => { if (c.avatar_url) c.avatar_url = window.rewriteMediaUrl(c.avatar_url); });
                                setInternalContacts(contacts);
                            }
                        }
                    } catch (e) { console.error('Failed to load contacts', e); }
                    finally { setInternalLoadingContacts(false); }
                };
                fetchInternalContacts();
            }, [isOpen]);

            const handleInternalSend = async () => {
                if (internalSelectedContacts.size === 0 || internalSending) return;
                if (!window.sendPostToUser) {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Sharing system initializing...', icon: 'Clock', isSuccess: false } }));
                    return;
                }
                setInternalSending(true);
                const contactsToSend = internalContacts.filter(c => internalSelectedContacts.has(c.id));
                const shareTarget = post || user;
                let successCount = 0;
                for (const contact of contactsToSend) {
                    try { await window.sendPostToUser(contact.convId, contact.id, contact.full_name || contact.username, contact.avatar_url, shareTarget); successCount++; }
                    catch (e) { console.error(`Failed to send to ${contact.username}`, e); }
                }
                window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Shared with ${successCount} profile${successCount > 1 ? 's' : ''}`, icon: 'Send', isSuccess: true } }));
                setInternalSending(false);
                onClose();
            };


            if (!isOpen || !post) return null;

            const shareUrl = `https://plusopinion.com/post/${post.id || 'demo'}`;
            const shareText = `Check out this feedback on PlusOpinion by @${post.username}`;

            const handleCopy = async () => {
                try {
                    const cleanText = `Check out this customer feedback on PlusOpinion:\n\n"${post.text ? post.text.substring(0, 100) + '...' : ''}"\n\nRead more at: ${shareUrl}`;
                    await navigator.clipboard.writeText(cleanText);
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link & Preview copied', icon: 'Link', isSuccess: true } }));
                    onClose();
                } catch (err) { console.error(err); }
            };

            const handleWhatsApp = () => {
                const waText = `🔥 *New Customer POV on PlusOpinion!*\n\n"@${post.username}: ${post.text ? post.text.substring(0, 80) : ''}..."\n\nRead full feedback here:\n${shareUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
                onClose();
            };

            const handleInstagram = async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({ title: 'Top Feedback', text: shareText, url: shareUrl });
                        onClose();
                    } catch (e) { }
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link copied! Open Instagram to share.', icon: 'Instagram', isSuccess: true } }));
                    setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1000);
                    onClose();
                }
            };

            const handleNativeShare = async () => {
                if (navigator.share) {
                    try {
                        await navigator.share({ title: 'PlusOpinion Feedback', text: shareText, url: shareUrl });
                        onClose();
                    } catch (err) { }
                } else {
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Sharing not supported', icon: 'AlertTriangle' } }));
                }
            };

            return (
                <div className="fixed inset-0 z-[60] flex items-end justify-center sm:px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
                    <div className="relative w-full sm:max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col">
                        {/* Drag Bar */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>

                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <span className="text-white font-heading font-bold text-lg">Share Feedback</span>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                                <Icon icon="X" size={20} />
                            </button>
                        </div>

                        {/* Post Preview Card - EXACT PLATFORM REPLICA */}
                        <div className="glass-panel rounded-2xl p-5 mb-6 border border-white/5 relative overflow-hidden group flex flex-col animate-fade-in shadow-2xl">
                            {/* Platform Logo - Top Right (Perfectly Zoomed and Enlarged) */}
                            <div className="absolute top-5 right-5 w-12 h-12 rounded-full border border-white/20 shadow-[0_0_25px_rgba(0,0,0,0.6)] overflow-hidden z-20 bg-[#121212] flex items-center justify-center">
                                <img src="icon-192.png" className="w-full h-full object-cover" alt="PlusOpinion Logo" />
                            </div>

                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-3 w-full">
                                    <div className="relative">
                                        <img src={post.avatar || DEFAULT_AVATAR} className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover" />
                                        {post.verified && (
                                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-[#121212]">
                                                <Icon icon="Check" size={8} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-heading font-bold text-white text-sm truncate">{post.name}</span>
                                            <div className="rqs-pill px-2 py-0.5 rounded-full flex items-center shrink-0">
                                                <span className="font-heading font-bold text-[9px] text-white tracking-wide">RQS {post.rqs || 0}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted truncate">@{post.username}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center flex-wrap gap-2 mb-3 mt-1">
                                <div className="border border-white/10 rounded-full px-3 py-1 flex items-center bg-white/5 text-[10px] text-white/80 font-medium whitespace-nowrap overflow-hidden max-w-full">
                                    <span className="text-neon truncate">{post.product || post.category || 'Product'}</span>
                                    <span className="mx-1.5 opacity-30">|</span>
                                    <span className="truncate">plus opinion</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-200 leading-relaxed mb-3 font-light line-clamp-3">{post.text}</p>

                            <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center gap-1.5 text-muted">
                                        <Icon icon="ThumbsUp" size={18} />
                                        <span className="text-xs font-medium">{post.agrees || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted">
                                        <Icon icon="MessageCircle" size={18} />
                                        <span className="text-xs font-medium">{post.comments || 0}</span>
                                    </div>
                                </div>

                                <span className="text-[9px] text-neon/80 font-medium tracking-wide bg-neon/5 px-2 py-0.5 rounded border border-neon/10 flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-neon shadow-[0_0_5px_var(--neon)]"></div>
                                    Verified Interaction
                                </span>
                            </div>

                            <div className="flex items-center justify-end mt-3 text-[9px] text-muted/40 font-medium uppercase tracking-widest">
                                <div className="text-white/20 font-bold">PLUSOPINION.COM</div>
                            </div>
                        </div>


                        {/* Internal Share — Send in Chat */}
                        <div className="mb-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Share to Profiles</span>
                                {internalSelectedContacts.size > 0 && (
                                    <button onClick={() => setInternalSelectedContacts(new Set())} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors uppercase">Clear ({internalSelectedContacts.size})</button>
                                )}
                            </div>
                            <div className="flex gap-4 overflow-x-auto select-none custom-scrollbar pb-2 px-1">
                                <button
                                    onClick={() => {
                                        onClose();
                                        if (window.toggleInbox) { window.toggleInbox(true); }
                                        else if (window.openInbox) { window.openInbox(); }
                                        setTimeout(() => {
                                            if (window._inboxBootPhase1 && window._inboxBootPhase1.openSearchOverlay) window._inboxBootPhase1.openSearchOverlay();
                                        }, 500);
                                    }}
                                    className="flex flex-col items-center gap-2 group min-w-[64px] shrink-0"
                                >
                                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-lg">
                                        <Icon icon="Search" size={24} className="text-white/70 group-hover:text-white" />
                                    </div>
                                    <span className="text-[10px] text-white/70 group-hover:text-white truncate w-14 text-center">Search</span>
                                </button>

                                {internalLoadingContacts && <div className="text-white/40 text-xs py-3 px-4">Loading...</div>}
                                {!internalLoadingContacts && internalContacts.map(c => {
                                    const isSelected = internalSelectedContacts.has(c.id);
                                    return (
                                        <button key={c.id} onClick={() => {
                                            const next = new Set(internalSelectedContacts);
                                            if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                                            setInternalSelectedContacts(next);
                                        }} className="flex flex-col items-center gap-2 group min-w-[64px] shrink-0">
                                            <div className={`w-14 h-14 rounded-full border-2 transition-all duration-300 relative ${isSelected ? 'border-blue-500 scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10 hover:border-white/30'}`}>
                                                <img src={c.avatar_url || DEFAULT_AVATAR} className="w-full h-full rounded-full object-cover" onError={e => { e.target.src = DEFAULT_AVATAR; }} />
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-[#121212]">
                                                        <Icon icon="Check" size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-white/70 truncate w-14 text-center">{c.full_name || c.username}</span>
                                        </button>
                                    );
                                })}
                                {!internalLoadingContacts && internalContacts.length === 0 && (
                                    <div className="text-white/30 text-xs py-3 px-4 flex items-center gap-2">
                                        <Icon icon="MessageCircle" size={14} /><span>No conversations yet</span>
                                    </div>
                                )}
                            </div>

                            {internalSelectedContacts.size > 0 && (
                                <button
                                    onClick={handleInternalSend}
                                    disabled={internalSending}
                                    className="mt-4 w-full py-3 rounded-2xl bg-[#2f8bff] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1a7bf0] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <Icon icon={internalSending ? "Clock" : "Send"} size={16} />
                                    {internalSending ? 'Sending...' : `Send to ${internalSelectedContacts.size} Profile${internalSelectedContacts.size > 1 ? 's' : ''}`}
                                </button>
                            )}
                        </div>

                        {/* Share Grid */}
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <button onClick={handleCopy} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                    <Icon icon="Link" size={24} className="text-white" />
                                </div>
                                <span className="text-xs text-muted">Copy Link</span>
                            </button>
                            <button onClick={handleWhatsApp} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                    <Icon icon="WhatsApp" size={24} className="text-white" />
                                </div>
                                <span className="text-xs text-muted">WhatsApp</span>
                            </button>
                            <button onClick={handleInstagram} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                    <Icon icon="Instagram" size={24} className="text-white" />
                                </div>
                                <span className="text-xs text-muted">Instagram</span>
                            </button>
                            <button onClick={handleNativeShare} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 transition-all">
                                    <Icon icon="Share" size={24} className="text-white" />
                                </div>
                                <span className="text-xs text-muted">More</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        // --- REPORT MODAL ---
        const ReportModal = ({ isOpen, onClose, onSubmit }) => {
            const [step, setStep] = useState(1);
            const [selectedReason, setSelectedReason] = useState(null);

            if (!isOpen) return null;

            const reasons = [
                "It's spam",
                "Nudity or sexual activity",
                "Hate speech or symbols",
                "Violence or dangerous organizations",
                "Bullying or harassment",
                "Selling illegal or regulated goods",
                "Intellectual property violations",
                "Suicide or self-injury",
                "False information"
            ];

            const handleSubmit = (action) => {
                if (onSubmit) onSubmit(selectedReason, action);
                onClose();
                setStep(1);
                setSelectedReason(null);
            };

            return (
                <div className="fixed inset-0 z-[70] flex items-end justify-center sm:px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
                    <div className="relative w-full sm:max-w-md bg-[#18181b] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col">
                        {/* Drag Bar */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0"></div>

                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <span className="text-white font-heading font-bold text-lg flex items-center gap-2">
                                <Icon icon="AlertTriangle" size={20} className="text-red-500" />
                                {step === 1 ? 'Report Opinion' : 'What would you like to do?'}
                            </span>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors"><Icon icon="X" size={20} /></button>
                        </div>

                        {step === 1 && (
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <p className="text-sm text-gray-400 mb-4">Why are you reporting this post?</p>
                                <div className="space-y-2">
                                    {reasons.map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={() => { setSelectedReason(reason); setStep(2); }}
                                            className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex justify-between items-center group"
                                        >
                                            <span className="text-sm text-white">{reason}</span>
                                            <Icon icon="ArrowRight" size={16} className="text-white/20 group-hover:text-white transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 mb-6">You've selected: <span className="text-white font-medium">{selectedReason}</span></p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleSubmit('remove')}
                                            className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-3 group"
                                        >
                                            <div className="p-2 rounded-full bg-red-500/20 text-red-500"><Icon icon="EyeOff" size={20} /></div>
                                            <div className="text-left">
                                                <div className="text-white font-bold text-sm">Remove from my feed</div>
                                                <div className="text-xs text-gray-400">I don't want to see this anymore</div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleSubmit('keep')}
                                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-3"
                                        >
                                            <div className="p-2 rounded-full bg-white/10 text-white"><Icon icon="ShieldCheck" size={20} /></div>
                                            <div className="text-left">
                                                <div className="text-white font-bold text-sm">Just report it</div>
                                                <div className="text-xs text-gray-400">Let support review it, but keep seeing it</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setStep(1)} className="mt-6 text-xs text-muted hover:text-white text-center w-full">Back</button>
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        // --- MAIN APP COMPONENT ---
        const App = () => {

            const [sharedPostsToRender, setSharedPostsToRender] = useState({});

            const [isGuest, setIsGuest] = useState(false);
            const [showAuthModal, setShowAuthModal] = useState(false);
            const [activeTool, setActiveTool] = useState('dashboard');
            const [activeTab, setActiveTab] = useState('myspace');
            const [isFilterOpen, setIsFilterOpen] = useState(false);
            const [isSettingsOpen, setIsSettingsOpen] = useState(false);
            const [isSidebarOpen, setIsSidebarOpen] = useState(true);
            const [navVisible, setNavVisible] = useState(true);
            const lastY = useRef(0);

            const handleScroll = (e) => {
                const currentY = e.target.scrollTop;
                const isScrollingDown = currentY > lastY.current;

                if (isScrollingDown && currentY > 50) {
                    setNavVisible(false);
                } else {
                    setNavVisible(true);
                }
                lastY.current = currentY;
            };
            const [feedFilters, setFeedFilters] = useState({ source: 'All', type: 'All' });
            const [hiddenPostIds, setHiddenPostIds] = useState(new Set());
            const [userProfile, setUserProfile] = useState(null);
            const [savedPosts, setSavedPosts] = useState(new Set());
            const [viewingImage, setViewingImage] = useState(null);

            const handleImageClick = (src, type, images, idx) => {
                vibrate(5);
                setViewingImage({ src, type, images, initialIndex: idx || 0 });
            };

            useEffect(() => {
                const initUser = async () => {
                    const user = await window.getCurrentUser();
                    if (!user) {
                        setIsGuest(true);
                        setShowAuthModal(true);
                        return;
                    }
                    setIsGuest(false);
                    const { data: profile } = await window.supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    setUserProfile(profile);

                    // Load bookmarks
                    const { data: bookmarks } = await window.supabase
                        .from('bookmarks')
                        .select('post_id')
                        .eq('user_id', user.id);
                    if (bookmarks) {
                        setSavedPosts(new Set(bookmarks.map(b => String(b.post_id))));
                    }
                };
                initUser();
            }, []);

            // Listen for internal chat post rendering
            useEffect(() => {
                const handleRenderSharedPost = async (e) => {
                    const { postId, containerId } = e.detail;
                    if (!postId || !containerId) return;

                    setSharedPostsToRender(prev => ({ ...prev, [containerId]: { isLoading: true, post: null } }));

                    try {
                        const fullPost = await window.getPost(postId);
                        if (fullPost && fullPost.id) {
                            const uiPost = {
                                id: fullPost.id,
                                user_id: fullPost.user_id,
                                name: fullPost.profiles?.full_name || 'User',
                                username: fullPost.profiles?.username || 'user',
                                avatar: fullPost.profiles?.avatar_url || "",
                                rqs: fullPost.profiles?.rqs_score || 0,
                                verified: fullPost.is_verified_purchase || fullPost.profiles?.is_verified,
                                category: fullPost.category,
                                product: fullPost.product_name,
                                text: fullPost.text_content,
                                media: fullPost.media_url,
                                media_type: fullPost.media_type || 'image',
                                images: fullPost.images || null,
                                time: "Shared",
                                agrees: fullPost.agrees_count || 0,
                                comments: fullPost.comments_count || 0,
                                seenBy: fullPost.seen_by_brand
                            };
                            setSharedPostsToRender(prev => ({ ...prev, [containerId]: { isLoading: false, post: uiPost } }));
                        } else {
                            setSharedPostsToRender(prev => ({ ...prev, [containerId]: { isLoading: false, error: true } }));
                        }
                    } catch (err) {
                        setSharedPostsToRender(prev => ({ ...prev, [containerId]: { isLoading: false, error: true } }));
                    }
                };
                window.addEventListener('render_shared_post', handleRenderSharedPost);
                
                // Expose openFullPost globally
                window.openFullPost = async (postId) => {
                    if (window.closeInbox) window.closeInbox();
                    window.location.href = `HOMEPAGE_FINAL.HTML?postId=${postId}`;
                };
                window.scrollToPost = window.openFullPost;

                return () => window.removeEventListener('render_shared_post', handleRenderSharedPost);
            }, []);

            const toggleBookmark = async (postId, shouldSave) => {
                try {
                    if (shouldSave) {
                        await window.bookmarkPost(postId);
                        setSavedPosts(prev => new Set(prev).add(postId));
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Added to Bookmarks', icon: 'BookMark', isSuccess: true } }));
                    } else {
                        await window.removeBookmark(postId);
                        setSavedPosts(prev => {
                            const next = new Set(prev);
                            next.delete(postId);
                            return next;
                        });
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Removed from Bookmarks', icon: 'BookMark', isSuccess: true } }));
                    }
                } catch (err) {
                    console.error('Bookmark toggle failed', err);
                }
            };

            const handleRemove = async (postId, message, type, value) => {
                // Shared removal logic (Hide, Not interested, block brand, delete)
                if (type === 'delete') {
                    try {
                        const { error } = await window.supabase.from('posts').delete().eq('id', postId);
                        if (error) throw error;
                        setHiddenPostIds(prev => new Set(prev).add(postId));
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion deleted', icon: 'Trash', isSuccess: true } }));
                    } catch (err) {
                        console.error('Delete failed', err);
                    }
                    return;
                }

                // Others use window.hideItem
                try {
                    await window.hideItem(type, value, postId);
                    setHiddenPostIds(prev => new Set(prev).add(postId));
                    window.dispatchEvent(new CustomEvent('toast', { detail: { message: message, icon: 'EyeOff', isSuccess: true } }));
                } catch (err) {
                    console.error('Action failed', err);
                }
            };

            // Shared/Report State
            const [isShareModalOpen, setIsShareModalOpen] = useState(false);
            const [sharePostData, setSharePostData] = useState(null);
            const [isReportModalOpen, setIsReportModalOpen] = useState(false);
            const [reportPostId, setReportPostId] = useState(null);

            const handleShare = (post) => {
                setSharePostData(post);
                setIsShareModalOpen(true);
            };

            const handleReport = (postId) => {
                setReportPostId(postId);
                setIsReportModalOpen(true);
            };

            const submitReport = async (reason, action) => {
                const post = FEEDBACK_DATA.find(p => String(p.id) === String(reportPostId));
                if (post) {
                    try {
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

                        // Use default action 'pending' if not 'remove'
                        const actionTaken = action === 'remove' ? 'remove' : 'pending';

                        // Call the API
                        await window.reportPost(post.id, reason, actionTaken, additionalData);

                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Report submitted', icon: 'Check', isSuccess: true } }));
                    } catch (err) {
                        console.error('Report submission failed', err);
                        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Report failed', icon: 'AlertTriangle', isSuccess: false } }));
                    }
                }

                if (action === 'remove' && reportPostId) {
                    setHiddenPostIds(prev => new Set(prev).add(reportPostId));
                }
                setIsReportModalOpen(false);
                setReportPostId(null);
            };

            return (
                <div className="flex flex-col h-full relative bg-[#020205] overflow-hidden">
                    <Header
                        onSettings={() => { vibrate(10); setIsSettingsOpen(true); }}
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={() => { vibrate(10); setIsSidebarOpen(!isSidebarOpen); }}
                        isVisible={navVisible}
                    />

                    <div className="absolute inset-0 flex overflow-hidden">
                        {/* LEFT NAV PANEL */}
                        <LeftNav activeTool={activeTool} setTool={setActiveTool} isOpen={isSidebarOpen} />

                        {/* MAIN SCROLLABLE AREA */}
                        <div
                            className={`flex-1 overflow-y-auto bg-[#020205] relative no-scrollbar transition-all duration-300 ease-in-out pt-[65px] pb-[65px] ${isSidebarOpen ? 'ml-[65px]' : 'ml-0'}`}
                            onScroll={handleScroll}
                        >
                            {activeTool === 'dashboard' && (
                                <DashboardView
                                    onFilter={() => setIsFilterOpen(true)}
                                    activeFilters={feedFilters}
                                    onShare={handleShare}
                                    onReport={handleReport}
                                    hiddenPostIds={hiddenPostIds}
                                    userProfile={userProfile}
                                    onBookmark={toggleBookmark}
                                    savedPosts={savedPosts}
                                    onRemove={handleRemove}
                                    onImageClick={handleImageClick}
                                />
                            )}
                            {activeTool === 'sentiment' && <SentimentView />}
                            {activeTool === 'competitor' && <CompetitorView />}
                            {activeTool === 'performance' && <PerformanceView />}
                        </div>
                    </div>

                    <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isVisible={navVisible} />

                    {/* MODALS */}
                    <FilterModal
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        filters={feedFilters}
                        setFilters={setFeedFilters}
                    />
                    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                    <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} post={sharePostData} />
                    <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={submitReport} />

                    {/* Auth Modal for Guests */}
                    <AuthModal
                        isOpen={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                        isClosable={!isGuest}
                    />

                    {/* Image Viewer Overlay */}
                    {viewingImage && (
                        <ImageViewer
                            src={viewingImage.src}
                            type={viewingImage.type}
                            images={viewingImage.images}
                            initialIndex={viewingImage.initialIndex || 0}
                            onClose={() => setViewingImage(null)}
                        />
                    )}
                </div>
            );
        };

        // AUTH MODAL (Login/Signup) - Mirrored from HOMEPAGE_FINAL
        const AuthModal = ({ isOpen, onClose, isClosable = true }) => {
            const [mode, setMode] = useState('login'); // 'login' or 'signup'
            const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState(null);
            const [inlineEmailError, setInlineEmailError] = useState(null);

            if (!isOpen) return null;

            const handleSubmit = async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                setInlineEmailError(null);
                vibrate(10);

                if (mode === 'signup' && formData.password !== formData.confirmPassword) {
                    setError("Passwords don't match");
                    setLoading(false);
                    return;
                }

                try {
                    await window.authReadyPromise;
                    if (mode === 'signup') {
                        const signupData = await window.signUpUser(formData.email, formData.password, formData.name);
                        if (signupData.error) throw signupData.error;

                        if (signupData?.session) {
                            window.location.href = 'onboarding.html';
                        } else {
                            window.dispatchEvent(new CustomEvent('toast', {
                                detail: { message: 'Verification email sent!', icon: 'Mail', isSuccess: true }
                            }));
                            onClose();
                        }
                    } else {
                        const user = await window.signInUser(formData.email, formData.password);
                        if (user) {
                            if (user.onboardingRequired) {
                                window.location.href = 'onboarding.html';
                            } else {
                                window.location.reload();
                            }
                        }
                    }
                } catch (err) {
                    const msg = err.message || 'Authentication failed';
                    const isSignupEmailErr = mode === 'signup' && (err.status === 422 || msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('duplicate'));
                    const isLoginEmailErr = mode === 'login' && (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('user not found'));

                    if (isSignupEmailErr) {
                        setInlineEmailError('This email is already registered. Please log in.');
                    } else if (isLoginEmailErr) {
                        setInlineEmailError('Email not registered or incorrect password.');
                    } else {
                        setError(msg);
                    }
                } finally {
                    setLoading(false);
                }
            };

            const handleGoogleLogin = async () => {
                setLoading(true);
                setError(null);
                try {
                    await window.signInWithProvider('google');
                } catch (err) {
                    setError(err.message);
                    setLoading(false);
                }
            };

            const handleForgotPassword = async () => {
                if (!formData.email) {
                    setError("Please enter your email first");
                    return;
                }
                setLoading(true);
                try {
                    await window.resetPassword(formData.email);
                    window.dispatchEvent(new CustomEvent('toast', {
                        detail: { message: 'Reset link sent to your email!', icon: 'Mail', isSuccess: true }
                    }));
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            return (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => isClosable && onClose()}></div>
                    <div className="w-full max-w-md bg-[#0A0E1A] p-8 rounded-3xl shadow-2xl relative border border-white/10" onClick={e => e.stopPropagation()}>
                        {isClosable && (
                            <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
                                <Icon icon="X" size={24} />
                            </button>
                        )}

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-heading">
                                {mode === 'login' ? 'Welcome Back' : 'Sign Up'}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                {mode === 'login' ? 'Login to access your account' : 'Join the future of consumer intelligence.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {mode === 'signup' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase">Full Name</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase">Email Address</label>
                                <input
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    type="email"
                                    placeholder="john@example.com"
                                    className="w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase">Password</label>
                                <input
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all"
                                />
                            </div>

                            {mode === 'signup' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-2 mb-1 block uppercase">Confirm Password</label>
                                    <input
                                        required
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full bg-[#050a15] border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-blue-500/50 text-white text-sm transition-all"
                                    />
                                </div>
                            )}

                            {mode === 'login' && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold tracking-wide transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? 'PROCESSING...' : (mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT')}
                                <Icon icon="ArrowRight" size={18} />
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">OR</span>
                                <div className="flex-grow border-t border-slate-700"></div>
                            </div>

                            <div className="google-sso-container" data-action="signin"></div>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-400">
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => { vibrate(5); setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                                className="text-blue-400 hover:text-blue-300 font-bold ml-1 active:scale-95 transition-transform"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Log In'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        const root = window.ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    