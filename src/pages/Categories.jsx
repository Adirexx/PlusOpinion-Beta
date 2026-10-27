import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { getCategories, getPopularCategories, getRecommendedCategories, getPost } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { useInbox } from '../context/InboxContext';
import { getCached, setCached, isStale, getScrollPosition, saveScrollPosition } from '../lib/dataCache';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';

const CACHE_KEY = 'categories:data';

const vibrate = (pattern = 5) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

const CATEGORY_COLORS = {
    'technology': '#22D3EE',
    'tech': '#22D3EE',
    'electronics': '#22D3EE',
    'gaming': '#D946EF',
    'games': '#D946EF',
    'fashion': '#EC4899',
    'apparel': '#EC4899',
    'clothing': '#EC4899',
    'food': '#F97316',
    'food & drink': '#F97316',
    'food & bev': '#F97316',
    'beverage': '#F97316',
    'restaurants': '#F97316',
    'personal care': '#A855F7',
    'beauty': '#A855F7',
    'cosmetics': '#A855F7',
    'automotive': '#10B981',
    'cars': '#10B981',
    'vehicles': '#10B981',
    'home': '#EC4899',
    'home & living': '#EC4899',
    'furniture': '#EC4899',
    'travel': '#0EA5E9',
    'tourism': '#0EA5E9',
    'finance': '#3B82F6',
    'banking': '#3B82F6',
    'education': '#8B5CF6',
    'learning': '#8B5CF6',
    'office': '#6B7280',
    'business': '#6B7280',
    'work': '#6B7280',
    'movies': '#8B5CF6',
    'music': '#EC4899',
    'books': '#3B82F6',
    'entertainment': '#A855F7',
    'health': '#10B981',
    'fitness': '#22D3EE',
    'wellness': '#10B981',
    'beauty & skin care': '#F43F5E',
    'beauty-skincare': '#F43F5E',
    'sports': '#F97316',
    'outdoor': '#10B981',
    'photography': '#6B7280',
    'camera': '#6B7280',
    'pets': '#F97316',
    'animals': '#F97316',
    'science': '#3B82F6',
    'others': '#6B7280',
    'miscellaneous': '#6B7280',
    'default': '#6B7280'
};

const getCategoryColor = (category) => {
    if (category.color && (category.color.startsWith('#') || category.color.startsWith('rgb'))) {
        return category.color;
    }
    const name = category.name?.toLowerCase() || category.id?.toLowerCase() || '';
    return CATEGORY_COLORS[name] || CATEGORY_COLORS['default'];
};

const CategoryCard = ({ cat, onClick, type = 'standard' }) => {
    const color = getCategoryColor(cat);
    const iconName = (cat.name || cat.title)?.toLowerCase() === 'finance' ? 'Wallet' : cat.icon;

    return (
        <div
            onClick={() => { vibrate(5); onClick(cat); }}
            className="rounded-xl flex items-center gap-3.5 p-4 cursor-pointer group transition-all duration-300 hover:translate-y-[-5px] active:translate-y-[-1px] active:shadow-inner"
            style={{
                backgroundColor: '#161922',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: '3px solid rgba(0,0,0,0.3)',
                boxShadow: '0 6px 0 rgba(0,0,0,0.2), 0 10px 15px -3px rgba(0,0,0,0.5)',
                '--hover-shadow': `0 12px 24px -8px ${color}44`
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 4px 0 rgba(0,0,0,0.3), 0 15px 25px -10px ${color}44`}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,0.2), 0 10px 15px -3px rgba(0,0,0,0.5)'}
        >
            <div
                className="w-10 h-10 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{
                    backgroundColor: color,
                    borderRadius: '10px',
                    background: `linear-gradient(145deg, ${color} 0%, ${color}DD 100%)`,
                    boxShadow: `0 4px 12px -2px ${color}88, inset 0 2px 4px rgba(255,255,255,0.3)`
                }}
            >
                <Icon icon={iconName} size={18} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
                <h3 className="font-semibold text-white text-[13px] tracking-wide truncate">{cat.name || cat.title}</h3>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                    Explore
                </span>
            </div>
        </div>
    );
};

const ListItem = ({ cat, onClick }) => {
    const color = getCategoryColor(cat);
    const iconName = (cat.name || cat.title)?.toLowerCase() === 'finance' ? 'Wallet' : cat.icon;

    return (
        <div
            onClick={() => { vibrate(5); onClick(cat); }}
            className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.05] bg-[#12151C] transition-all duration-300 cursor-pointer group hover:translate-y-[-3px] hover:bg-white/[0.04] hover:shadow-lg"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
        >
            <div className="flex items-center gap-4">
                <div
                    className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{
                        backgroundColor: color,
                        borderRadius: '9px',
                        background: `linear-gradient(145deg, ${color} 0%, ${color}DD 100%)`,
                        boxShadow: `0 4px 10px -2px ${color}44`
                    }}
                >
                    <Icon icon={iconName} size={16} className="text-white" />
                </div>
                <span className="text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors">{cat.name || cat.title}</span>
            </div>
            <div className="w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                <Icon icon="ChevronRight" size={16} className="text-white/20 group-hover:text-white/50" />
            </div>
        </div>
    );
};

const SkeletonCard = () => (
    <div className="rounded-xl flex items-center gap-3.5 p-4 border border-white/5 bg-white/[0.02] animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-white/5 rounded" />
            <div className="h-2 w-1/3 bg-white/5 rounded" />
        </div>
    </div>
);

const SkeletonListItem = () => (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] animate-pulse">
        <div className="flex items-center gap-4 w-full">
            <div className="w-9 h-9 rounded-lg bg-white/5 shrink-0" />
            <div className="h-4 w-1/2 bg-white/5 rounded" />
        </div>
    </div>
);

const CategorySkeleton = () => (
    <div className="space-y-10">
        <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="w-1 h-5 bg-white/10 rounded-full" />
                <div className="h-4 w-32 bg-white/5 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(idx => <SkeletonCard key={idx} />)}
            </div>
        </section>
        <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="w-1 h-5 bg-white/10 rounded-full" />
                <div className="h-4 w-40 bg-white/5 rounded" />
            </div>
            <div className="h-32 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]" />
        </section>
        <section>
            <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="w-1 h-5 bg-white/10 rounded-full" />
                <div className="h-4 w-28 bg-white/5 rounded" />
            </div>
            <div className="grid grid-cols-1 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map(idx => <SkeletonListItem key={idx} />)}
            </div>
        </section>
    </div>
);

export default function Categories() {
    const { user, profile, isGuest } = useAuth();
    const { openMenu, openLens } = useActions();
    const { closeInbox } = useInbox();
    const navigate = useNavigate();

    const [sharedPostsToRender, setSharedPostsToRender] = useState({});
    const [categories, setCategories] = useState(() => getCached(CACHE_KEY)?.all || []);
    const [popularCats, setPopularCats] = useState(() => getCached(CACHE_KEY)?.popular || []);
    const [recommendedCats, setRecommendedCats] = useState(() => getCached(CACHE_KEY)?.recommended || []);
    const [loading, setLoading] = useState(() => !getCached(CACHE_KEY));
    const [navVisible, setNavVisible] = useState(true);
    const navVisibleRef = useRef(true);
    const lastY = useRef(0);
    const scrollRef = useRef(null);

    const handlePullRefresh = React.useCallback(async () => {
        try {
            const [all, popular, recommended] = await Promise.all([
                getCategories().catch(e => { console.warn("getCategories failed", e); return []; }),
                getPopularCategories(6).catch(e => { console.warn("getPopularCategories failed", e); return []; }),
                getRecommendedCategories(4).catch(e => { console.warn("getRecommendedCategories failed", e); return []; })
            ]);

            setCategories(all || []);
            setPopularCats(popular || []);
            setRecommendedCats(recommended || []);
            setCached(CACHE_KEY, { all, popular, recommended });
        } catch (e) {
            console.error("Failed to refresh categories", e);
        }
    }, []);

    const ptr = usePullToRefresh(scrollRef, handlePullRefresh);
    const lastTapToTopRef = useRef(0);

    useEffect(() => {
        const handleNavTabReclick = (e) => {
            if (e.detail?.tab === 'categories') {
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

    const handleScroll = (e) => {
        const { scrollTop } = e.target;
        const currentY = scrollTop;

        if (currentY <= 50) {
            if (!navVisibleRef.current) {
                navVisibleRef.current = true;
                setNavVisible(true);
                window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }));
            }
        } else {
            const delta = currentY - lastY.current;
            if (Math.abs(delta) >= 6) {
                if (delta > 0 && navVisibleRef.current) {
                    navVisibleRef.current = false;
                    setNavVisible(false);
                    window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: false } }));
                } else if (delta < 0 && !navVisibleRef.current) {
                    navVisibleRef.current = true;
                    setNavVisible(true);
                    window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }));
                }
            }
        }
        lastY.current = currentY;
        saveScrollPosition(CACHE_KEY, currentY);
    };

    const handleCategoryClick = (category) => {
        vibrate(5);
        const catName = (category.name || category.title || category.id)?.toLowerCase().trim();
        if (catName) {
            navigate(`/feed?category=${encodeURIComponent(catName)}`);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const loadAllData = async () => {
            if (!isMounted) return;

            // Only fetch if stale
            if (isStale(CACHE_KEY, 300_000) || categories.length === 0) {
                try {
                    const [all, popular, recommended] = await Promise.all([
                        getCategories().catch(e => { console.warn("getCategories failed", e); return []; }),
                        getPopularCategories(6).catch(e => { console.warn("getPopularCategories failed", e); return []; }),
                        getRecommendedCategories(4).catch(e => { console.warn("getRecommendedCategories failed", e); return []; })
                    ]);

                    if (isMounted) {
                        setCategories(all || []);
                        setPopularCats(popular || []);
                        setRecommendedCats(recommended || []);

                        setCached(CACHE_KEY, { all, popular, recommended });
                    }
                } catch (e) {
                    console.error("Failed to load categories", e);
                } finally {
                    if (isMounted) setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        loadAllData();
        return () => { isMounted = false; };
    }, []);

    useLayoutEffect(() => {
        if (!loading && categories.length > 0) {
            const savedScroll = getScrollPosition(CACHE_KEY);
            if (savedScroll > 0 && scrollRef.current) {
                const el = scrollRef.current;
                el.style.scrollBehavior = 'auto';
                el.scrollTop = savedScroll;
                requestAnimationFrame(() => {
                    if (el) el.style.scrollBehavior = '';
                });
            }
        }
    }, [loading]);

    useEffect(() => {
        const handleRenderSharedPost = async (e) => {
            const { postId, containerId } = e.detail;
            if (!postId || !containerId) return;

            setSharedPostsToRender(prev => ({ ...prev, [containerId]: { isLoading: true, post: null } }));

            try {
                const fullPost = await getPost(postId);
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
        
        window.openFullPost = async (postId) => {
            closeInbox();
            navigate(`/post/${postId}`);
        };
        window.scrollToPost = window.openFullPost;

        return () => window.removeEventListener('render_shared_post', handleRenderSharedPost);
    }, [navigate]);

    useEffect(() => {
        const setupPullToRefresh = () => {
            if (window.PullToRefresh) {
                window.PullToRefresh.onRefresh(async () => {
                    if (window.StateManager) {
                        window.StateManager.invalidate('categories');
                    }
                    navigate(0);
                });
            } else {
                setTimeout(setupPullToRefresh, 100);
            }
        };
        setTimeout(setupPullToRefresh, 200);
    }, []);

    const displayPopular = popularCats.length > 0 ? popularCats : categories.filter(c => c.section === 'popular').slice(0, 6);

    const allCats = React.useMemo(() =>
        [...categories].sort((a, b) => (a.name || a.title).localeCompare(b.name || b.title)),
        [categories]
    );

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            <div className={`fixed top-0 left-0 w-full top-nav-glass z-40 transition-transform duration-400 ease-out ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="w-full h-14 flex items-center justify-between px-4 relative">
                    <button onClick={() => openMenu()} className="touch-scale p-1.5 -ml-1 text-white/80 hover:text-white rounded-full hover:bg-white/5 active:scale-90 z-10" aria-label="Open menu">
                        <Icon icon="Menu" size={22} className="stroke-[2.2px]" />
                    </button>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                        <span className="font-heading font-extrabold text-[15px] tracking-[0.16em] text-white uppercase opacity-95">Categories</span>
                    </div>
                    <button onClick={() => openLens()} className="touch-scale p-1.5 -mr-1 text-white/80 hover:text-white rounded-full hover:bg-white/5 active:scale-90 z-10" aria-label="Search">
                        <Icon icon="Search" size={22} className="stroke-[2.2px]" />
                    </button>
                </div>
            </div>

            <PullToRefreshIndicator {...ptr.indicatorProps} />
            <div
                ref={scrollRef}
                className={`categories-scroll-container absolute inset-0 overflow-y-auto px-5 pt-[75px] pb-28 no-scrollbar ${ptr.pullOffset > 0 ? (ptr.isAutoRefreshing ? 'ptr-content-auto-pull' : 'ptr-content-pulling') : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
                onScroll={handleScroll}
                style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
            >
                {loading ? (
                    <CategorySkeleton />
                ) : (
                    <div className="space-y-10">
                        {displayPopular.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-1 h-5 bg-neon rounded-full"></div>
                                        <h2 className="text-sm font-heading font-semibold text-white/90 tracking-tight">Popular Right Now</h2>
                                    </div>
                                    <span className="text-[9px] font-medium text-neon/80 bg-neon/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Trending</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {displayPopular.slice(0, 4).map(cat => (
                                        <CategoryCard key={cat.id} cat={cat} onClick={handleCategoryClick} />
                                    ))}
                                </div>
                            </section>
                        )}

                        <section>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-5 bg-neon rounded-full"></div>
                                    <h2 className="text-sm font-heading font-semibold text-white/90 tracking-tight">Recommended Categories</h2>
                                </div>
                            </div>
                            <div className="group relative flex flex-col items-center justify-center py-10 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] transition-all duration-300 hover:bg-white/[0.03] hover:border-neon/30 active:scale-[0.98] cursor-pointer">
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon icon="Sparkles" size={16} className="text-white/40 group-hover:text-neon group-hover:animate-pulse transition-colors" />
                                    <span className="text-xs font-bold text-white/50 group-hover:text-white uppercase tracking-widest transition-colors">Personalized Recommendations</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] mt-2 transition-all group-hover:border-neon/20 group-hover:bg-neon/5">
                                    <span className="text-[9px] text-white/40 group-hover:text-neon font-bold uppercase tracking-widest">Post-Beta Feature</span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-1 h-5 bg-neon rounded-full"></div>
                                    <h2 className="text-sm font-heading font-semibold text-white/90 tracking-tight">All Categories</h2>
                                </div>
                                <Icon icon="Grid" size={14} className="text-muted/40" />
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                                {allCats.map(cat => (
                                    <ListItem key={cat.id} cat={cat} onClick={handleCategoryClick} />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
