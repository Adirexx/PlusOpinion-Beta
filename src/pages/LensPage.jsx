/**
 * LensPage.jsx — Explore / Search Page (Mobile-style Layered Architecture)
 * ========================================================================
 * A dedicated route (/lens) that handles search and exploration.
 * Sub-layers (Explore Profiles, Explore Products) open via nested paths
 * (e.g. /lens/explore) and render ON TOP of this base page, preserving
 * history state automatically just like native apps.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { formatTimeAgo } from '../lib/utils';
import { getForYouFeed, getTrendingPosts, getHighRQSContent, getVerifiedPosts } from '../lib/api/feed';
import { getTopReviewers, getAllProfiles } from '../lib/api/profiles';
import { getPopularProducts, searchProfiles, saveSearchQuery, getRecentSearches, deleteSearchQuery } from '../lib/api/search';
import { supabase } from '../lib/supabaseClient';
import { rewriteMediaUrl } from '../lib/api/media';
import { getCached, setCached, isStale } from '../lib/dataCache';
import Icon from '../components/ui/Icon';
import Avatar from '../components/ui/Avatar';
import PostCard from '../components/feed/PostCard';
import SkeletonPost from '../components/feed/SkeletonPost';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';

import { OrbitLoader } from '../components/ui/Icons';

const LENS_FILTERS = [
  { id: 'foryou',   label: 'For You',      icon: null },
  { id: 'trending', label: 'Trending',     icon: null },
  { id: 'verified', label: 'Verified Only', icon: 'ShieldCheck' },
  { id: 'highrqs',  label: 'High RQS',     icon: null },
];

const vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

// ── Layer Models ──────────────────────────────────────────────────

const ExploreProfilesLayer = ({ onClose }) => {
  const location = useLocation();
  const initialProfiles = location.state?.profiles || [];
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [isLoading, setIsLoading] = useState(initialProfiles.length === 0);
  const scrollRef = useRef(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const data = await getAllProfiles();
      if (Array.isArray(data)) setProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialProfiles.length === 0) {
      fetchProfiles();
    }
  }, [initialProfiles.length, fetchProfiles]);

  const ptr = usePullToRefresh(scrollRef, fetchProfiles);

  return (
    <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col animate-slide-in-right">
      <div className="header-glass flex items-center justify-between px-4 py-3 border-b border-white/[0.04] sticky top-0 bg-[#020205]/95 backdrop-blur-xl z-10 shrink-0">
        <button onClick={() => { vibrate(5); onClose(); }} className="p-2 -ml-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors active:scale-95">
          <Icon icon="ArrowLeft" size={22} />
        </button>
        <h2 className="text-[15px] font-bold text-white tracking-wide">Explore Profiles</h2>
        <div className="w-8" />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <PullToRefreshIndicator {...ptr.indicatorProps} />
        <div
          ref={scrollRef}
          className={`h-full overflow-y-auto p-4 no-scrollbar pb-24 ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
          style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/40">
              <OrbitLoader size={36} className="mb-3" />
              <p className="text-xs">Loading profiles...</p>
            </div>
          ) : profiles.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,255,255,0.06)] active:scale-95"
                  onClick={() => { vibrate(5); navigate(`/profile?id=${profile.id}`); }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Avatar src={profile.avatar_url} className="w-16 h-16 rounded-full border border-white/10 object-cover" fallbackSize={32} />
                    <div className="text-center w-full">
                      <h3 className="text-sm font-bold text-white truncate">{profile.full_name || 'Anonymous'}</h3>
                      <p className="text-[10px] text-gray-400 truncate">@{profile.username}</p>
                      <div className="rqs-pill px-2 py-0.5 rounded-full text-[10px] font-bold text-white mt-2 inline-block">
                        RQS {profile.rqs_score || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted">
              <Icon icon="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No profiles found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExploreProductsLayer = ({ onClose }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getPopularProducts(30);
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const ptr = usePullToRefresh(scrollRef, fetchProducts);

  return (
    <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col animate-slide-in-right">
      <div className="header-glass flex items-center justify-between px-4 py-3 border-b border-white/[0.04] sticky top-0 bg-[#020205]/95 backdrop-blur-xl z-10 shrink-0">
        <button onClick={() => { vibrate(5); onClose(); }} className="p-2 -ml-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors active:scale-95">
          <Icon icon="ArrowLeft" size={22} />
        </button>
        <h2 className="text-[15px] font-bold text-white tracking-wide">Explore Products</h2>
        <div className="w-8" />
      </div>
      <div className="relative flex-1 overflow-hidden">
        <PullToRefreshIndicator {...ptr.indicatorProps} />
        <div
          ref={scrollRef}
          className={`h-full overflow-y-auto p-4 no-scrollbar pb-24 ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
          style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/40">
              <OrbitLoader size={36} className="mb-3" />
              <p className="text-xs">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
              {products.map((product) => (
                <div
                  key={product.id || product.name}
                  className="group cursor-pointer active:scale-95 transition-all duration-300"
                  onClick={() => {
                    vibrate(5);
                    navigate(`/lens?q=${encodeURIComponent(product.name)}`);
                  }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#0B1221] border border-white/5 group-hover:border-white/20 transition-colors duration-300">
                    <img
                      src={product.image}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
                      alt={product.name}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <p className="text-[9px] text-neon font-bold uppercase mb-0.5 tracking-wider truncate">{product.brand}</p>
                      <h4 className="text-xs font-bold text-white leading-tight truncate">{product.name}</h4>
                      {product.agrees_count > 0 && (
                        <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                          <Icon icon="ThumbsUp" size={10} className="text-neon" /> {product.agrees_count} agrees
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted">
              <Icon icon="Package" size={48} className="mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Base Page Component ───────────────────────────────────────────

const LensPage = () => {
  const { user } = useAuth();
  const { openImage, openEdit, sharePost, reportPost, savedPosts, userProfile } = useActions();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [activeFilter, setActiveFilter] = useState('trending');

  const isExploreLayerOpen = path.includes('/explore');
  const isProductsLayerOpen = path.includes('/products');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [profileResults, setProfileResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickSearches, setQuickSearches] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [topReviewers, setTopReviewers] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);
  const contentRef = useRef(null);

  const handlePullRefresh = useCallback(async () => {
    await Promise.all([
      applyFilter(activeFilter),
      loadInitialData(),
    ]);
  }, [activeFilter]);

  const ptr = usePullToRefresh(contentRef, handlePullRefresh, {
    disabled: Boolean(isExploreLayerOpen || isProductsLayerOpen),
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!searchQuery && !isExploreLayerOpen && !isProductsLayerOpen) {
      applyFilter(activeFilter);
    }
  }, [activeFilter, searchQuery, isExploreLayerOpen, isProductsLayerOpen]);

  // Lock body scroll ONLY when a layer is open
  useEffect(() => {
    if (isExploreLayerOpen || isProductsLayerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isExploreLayerOpen, isProductsLayerOpen]);

  const loadInitialData = async () => {
    const pKey = 'lens_popular_products';
    const rKey = 'lens_top_reviewers';
    const cProducts = getCached(pKey);
    const cReviewers = getCached(rKey);

    if (cProducts) setPopularProducts(cProducts);
    if (cReviewers) setTopReviewers(cReviewers);

    if (user?.id) {
      const sKey = `lens_recent_searches_${user.id}`;
      const cSearches = getCached(sKey);
      if (cSearches) setQuickSearches(cSearches);
      
      getRecentSearches(user.id, 10).then(searches => {
        setQuickSearches(searches);
        setCached(sKey, searches);
      }).catch(console.error);
    }

    if (isStale(pKey) || isStale(rKey) || !cProducts || !cReviewers) {
      try {
        const [products, reviewers] = await Promise.all([
          getPopularProducts(10),
          getTopReviewers(5),
        ]);

        const formattedProducts = products.map(p => ({
          ...p,
          image: rewriteMediaUrl ? rewriteMediaUrl(p.image || p.media_url || '') : (p.image || p.media_url || '')
        }));

        setPopularProducts(formattedProducts);
        setTopReviewers(reviewers);
        
        setCached(pKey, formattedProducts);
        setCached(rKey, reviewers);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    }
  };

  const applyFilter = async (filter, forceRefresh = false) => {
    const cacheKey = `lens_feed_${filter}`;
    const cachedData = getCached(cacheKey);

    if (!forceRefresh && cachedData && !isStale(cacheKey)) {
      setResults(cachedData.results);
      if (cachedData.profiles) setProfileResults(cachedData.profiles);
      return;
    }

    setIsSearching(true);
    if (forceRefresh) setIsRefreshing(true);

    try {
      let data = [];
      let profiles = [];

      switch (filter) {
        case 'foryou':
          data = await getForYouFeed(user?.id, 15);
          break;
        case 'trending':
          data = await getTrendingPosts(15);
          break;
        case 'verified':
          data = await getVerifiedPosts(15);
          break;
        case 'highrqs':
          const highRQSData = await getHighRQSContent(15);
          data = highRQSData.posts || [];
          profiles = highRQSData.profiles || [];
          break;
        default:
          data = await getTrendingPosts(15);
      }

      const formattedResults = transformPosts(data);
      setResults(formattedResults);
      
      if (filter === 'highrqs') setProfileResults(profiles);

      setCached(cacheKey, { results: formattedResults, profiles });
    } catch (error) {
      console.error('Filter failed:', error);
      if (!cachedData) setResults([]);
    } finally {
      setIsSearching(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchQuery.trim()) {
      setProfileResults([]);
      if (!isExploreLayerOpen && !isProductsLayerOpen) applyFilter(activeFilter);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const q = searchQuery.toLowerCase();

        if (user?.id) {
          saveSearchQuery(user.id, q).catch(() => {});
          getRecentSearches(user.id, 10).then(searches => {
            setQuickSearches(searches);
            setCached(`lens_recent_searches_${user.id}`, searches);
          }).catch(() => {});
        }

        const [profiles, { data, error }] = await Promise.all([
          searchProfiles(q, 10),
          supabase
            .from('posts')
            .select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`)
            .or(`text_content.ilike.%${q}%,product_name.ilike.%${q}%,category.ilike.%${q}%,brand_name.ilike.%${q}%`)
            .eq('is_deleted', false)
            .eq('is_draft', false)
            .limit(20)
        ]);

        if (error) throw error;
        
        setProfileResults(profiles || []);
        setResults(data ? transformPosts(data) : []);
        
        if (contentRef.current) contentRef.current.scrollTop = 0;
      } catch (e) {
        console.error("Search failed:", e);
        setResults([]);
        setProfileResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, isExploreLayerOpen, isProductsLayerOpen]);

  const transformPosts = (rawPosts) => {
    return rawPosts.map(post => ({
      id: post.id,
      name: post.profiles?.full_name || 'User',
      username: post.profiles?.username || 'user',
      avatar: post.profiles?.avatar_url || "",
      rqs: post.profiles?.rqs_score || 0,
      verified: (post.is_verified_purchase === true) || (post.is_verified_purchase === null && !!post.media_url) || post.profiles?.is_verified,
      category: post.category,
      product: post.product_name,
      text: post.text_content,
      media: post.media_url,
      media_type: post.media_type || 'image',
      images: post.images || null,
      time: formatTimeAgo(post.created_at),
      agrees: post.agrees_count || 0,
      comments: post.comments_count || 0,
      seenBy: post.seen_by_brand,
      user_id: post.user_id,
      profiles: post.profiles
    }));
  };

  const handleRemovePost = useCallback((postId, reason, type) => {
    if (type === 'REPORT_INTENT') { reportPost(postId); return; }
    if (type === 'SHARE_INTENT') return;
    setResults(prev => prev.filter(p => p.id !== postId));
  }, [reportPost]);

  const handleSavePost = useCallback((postId) => {
    window.dispatchEvent(new CustomEvent('post:bookmarked', { detail: { postId } }));
  }, []);

  const handleAddComment = useCallback((postId) => {
    setResults(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
    ));
  }, []);

  const handleProfileClick = useCallback((profileId) => {
    vibrate(5);
    navigate(`/profile?id=${profileId}`);
  }, [navigate]);

  const handleScroll = () => {
    if (contentRef.current) {
      setShowScrollTop(contentRef.current.scrollTop > 300);
    }
  };

  const scrollToTop = () => {
    vibrate(5);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#020205] pb-[calc(var(--bottom-nav-total,56px)+24px)]">
        {/* ── STICKY HEADER ── */}
        <div className="header-glass sticky top-0 z-30 bg-[#020205]/95 backdrop-blur-xl border-b border-white/[0.04]">
          {/* Search Row */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isSearchFocused || searchQuery ? 'w-0 opacity-0 -ml-4' : 'w-[38px] opacity-100'}`}>
              <button 
                onClick={() => { vibrate(5); navigate(-1); }} 
                className="p-2 -ml-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors active:scale-95 whitespace-nowrap"
                aria-label="Back"
              >
                <Icon icon="ArrowLeft" size={22} />
              </button>
            </div>
            
            <div className="flex-1 relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none transition-colors group-focus-within:text-white/70">
                <Icon icon="Search" size={16} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opinions, profiles..."
                className="w-full bg-white/[0.04] border border-transparent rounded-full pl-10 pr-10 py-2.5 text-[15px] text-white placeholder-white/40 outline-none ring-0 appearance-none focus:outline-none focus:ring-0 focus:border-white/20 focus:bg-white/[0.06] transition-all duration-300 shadow-none"
                autoFocus={false}
              />
              {searchQuery && (
                <button 
                  onClick={() => { vibrate(5); setSearchQuery(''); inputRef.current?.focus(); }} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all"
                >
                  <Icon icon="X" size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Row (Pills) */}
          {!searchQuery && (
            <div className="px-4 pt-1 pb-4 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
              {LENS_FILTERS.map(filter => {
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => { vibrate(5); setActiveFilter(filter.id); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 ${
                      isActive 
                        ? 'bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)] scale-100' 
                        : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.12] hover:text-white hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,255,255,0.08)] border border-white/[0.04]'
                    }`}
                  >
                    {filter.icon && (
                      <Icon icon={filter.icon} size={14} className={isActive ? 'text-black/70' : 'text-white/40'} />
                    )}
                    {filter.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── SCROLL BODY ── */}
        <div className="relative flex-1 overflow-hidden">
          <PullToRefreshIndicator {...ptr.indicatorProps} topOffset={searchQuery ? 56 : 106} />
          <div 
            ref={contentRef} 
            onScroll={handleScroll}
            className={`h-full overflow-y-auto no-scrollbar bg-[#020205] pb-24 scroll-smooth ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
            style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
          >

          {/* ── Recent Searches (only when NOT searching) ── */}
          {!searchQuery && quickSearches.length > 0 && (
            <div className="px-4 py-6 border-b border-white/5">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4 pl-1">Recent Searches</h3>
              <div className="flex flex-wrap gap-2.5">
                {quickSearches.map((keyword, idx) => (
                  <div key={`${keyword}-${idx}`} className="group relative flex items-center bg-white/5 border border-white/10 rounded-full hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,255,255,0.06)]">
                    <button
                      className="pl-3.5 pr-2 py-2 text-[13px] font-medium text-white/80 flex items-center gap-1.5 hover:text-white active:scale-95 transition-all duration-200"
                      onClick={() => { vibrate(5); setSearchQuery(keyword); }}
                    >
                      <Icon icon="Clock" size={12} className="text-neon/70" /> {keyword}
                    </button>
                    <button
                      className="p-2 pr-3 text-white/30 hover:text-red-400 active:scale-90 transition-all duration-200"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        vibrate(5);
                        const newSearches = quickSearches.filter(k => k !== keyword);
                        setQuickSearches(newSearches);
                        if (user?.id) {
                          setCached(`lens_recent_searches_${user.id}`, newSearches);
                          try { await deleteSearchQuery(user.id, keyword); } 
                          catch (err) { console.error("Failed to delete query:", err); }
                        }
                      }}
                    >
                      <Icon icon="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Popular Products (only when NOT searching) ── */}
          {!searchQuery && popularProducts.length > 0 && (
            <div className="px-4 py-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white font-heading">Popular Products</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
                {popularProducts.slice(0, 5).map((product, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-32 group cursor-pointer snap-start active:scale-95 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(255,255,255,0.08)]"
                    onClick={() => { vibrate(5); setSearchQuery(product.name); }}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#0B1221] border border-white/5 group-hover:border-white/20 transition-colors duration-300">
                      <img src={product.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out" alt={product.name} loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-[9px] text-neon font-bold uppercase mb-0.5 tracking-wider truncate">{product.brand}</p>
                        <h4 className="text-xs font-bold text-white leading-tight truncate">{product.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  className="flex-shrink-0 w-24 flex flex-col items-center justify-center gap-2 snap-start cursor-pointer active:scale-95 group"
                  onClick={() => { vibrate(5); navigate('/lens/products'); }}
                >
                  <div className="w-14 h-14 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/50 group-hover:bg-white/[0.05] group-hover:text-white transition-all duration-300">
                    <div className="relative overflow-hidden w-5 h-5 flex items-center justify-center">
                      <Icon icon="ArrowRight" size={20} className="absolute transition-transform duration-300 ease-in-out group-hover:translate-x-6" />
                      <Icon icon="ArrowRight" size={20} className="absolute -translate-x-6 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
                    </div>
                  </div>
                  <span className="text-[10px] text-white/50 font-medium tracking-wide group-hover:text-white/80 transition-colors">Explore More</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Top Reviewers (only when NOT searching) ── */}
          {!searchQuery && topReviewers.length > 0 && (
            <div className="px-4 py-6 border-b border-white/5">
              <h3 className="text-sm font-bold text-white font-heading mb-4">Top Reviewers</h3>
              <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
                {topReviewers.map((reviewer) => (
                  <div
                    key={reviewer.id}
                    className="flex-shrink-0 w-16 flex flex-col items-center gap-2 snap-start cursor-pointer active:scale-95 transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => handleProfileClick(reviewer.id)}
                  >
                    <div className="relative pointer-events-none">
                      <Avatar
                        src={reviewer.avatar_url}
                        className="w-14 h-14 rounded-full border border-white/10 object-cover shrink-0 pointer-events-none"
                        fallbackSize={24}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 shadow-lg pointer-events-none">
                        <div className="rqs-pill px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white pointer-events-none">{reviewer.rqs_score}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-300 font-medium truncate w-full text-center pointer-events-none">@{reviewer.username}</span>
                  </div>
                ))}
                  <div
                  className="flex-shrink-0 w-24 flex flex-col items-center justify-center gap-2 snap-start cursor-pointer active:scale-95 group"
                  onClick={async () => {
                    vibrate(5);
                    const profiles = await getAllProfiles();
                    navigate('/lens/explore', { state: { profiles } });
                  }}
                >
                  <div className="w-14 h-14 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/50 group-hover:bg-white/[0.05] group-hover:text-white transition-all duration-300">
                    <div className="relative overflow-hidden w-5 h-5 flex items-center justify-center">
                      <Icon icon="ArrowRight" size={20} className="absolute transition-transform duration-300 ease-in-out group-hover:translate-x-6" />
                      <Icon icon="ArrowRight" size={20} className="absolute -translate-x-6 transition-transform duration-300 ease-in-out group-hover:translate-x-0" />
                    </div>
                  </div>
                  <span className="text-[10px] text-white/50 font-medium tracking-wide group-hover:text-white/80 transition-colors">Explore More</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Profile Search Results ── */}
          {searchQuery && profileResults.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Profiles</h3>
              </div>
              <div className="space-y-2 mb-6">
                {profileResults.map(profile => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-neon/30 hover:bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,255,255,0.05)] cursor-pointer active:scale-95"
                    onClick={() => handleProfileClick(profile.id)}
                  >
                    <Avatar
                      src={profile.avatar_url}
                      className="w-12 h-12 rounded-full border border-white/10 object-cover shrink-0"
                      fallbackSize={20}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{profile.full_name}</h4>
                        {profile.is_verified && <Icon icon="CheckCircle" size={14} className="text-neon shrink-0" />}
                      </div>
                      <p className="text-xs text-muted">@{profile.username}</p>
                    </div>
                    <div className="rqs-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-white shrink-0 flex items-center gap-1">
                      <span className="opacity-70">RQS</span>
                      <span>{profile.rqs_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Posts Results / Feed ── */}
          <div className="px-4 mt-6">
            <div className="flex justify-between items-center mb-5 px-1">
              <h3 className="text-sm font-extrabold text-white font-heading tracking-wide uppercase flex items-center gap-2.5">
                {!searchQuery && (
                  <>
                    {activeFilter === 'foryou' && (
                      <Avatar src={userProfile?.avatar_url} className="w-5 h-5 rounded-full border border-white/20 object-cover" fallbackSize={12} />
                    )}
                    {activeFilter === 'trending' && (
                      <span className="text-base leading-none">🔥</span>
                    )}
                    {activeFilter === 'verified' && (
                      <Icon icon="ShieldCheck" size={16} className="text-accent-green" />
                    )}
                    {activeFilter === 'highrqs' && (
                      <Icon icon="Sparkles" size={16} className="text-[#B188FF] fill-[#B188FF]/20" />
                    )}
                  </>
                )}
                {searchQuery
                  ? (profileResults.length > 0 ? 'Opinions' : `Results for "${searchQuery}"`)
                  : (activeFilter === 'foryou' ? 'For You' : activeFilter === 'verified' ? 'Verified Opinions' : activeFilter === 'highrqs' ? 'High RQS' : 'Trending Opinions')
                }
              </h3>
            </div>

            <div className="space-y-5">
              {isSearching ? (
                <>
                  <SkeletonPost delay="0ms" />
                  <SkeletonPost delay="150ms" />
                  <SkeletonPost delay="300ms" />
                </>
              ) : results.length > 0 ? (
                results.map((post, i) => (
                  <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                    <PostCard
                      post={post}
                      index={i}
                      userProfile={userProfile}
                      savedPosts={savedPosts}
                      comments={[]}
                      onComment={() => { }}
                      onShare={sharePost}
                      onMore={() => { }}
                      onSave={handleSavePost}
                      onAddComment={handleAddComment}
                      onImageClick={openImage}
                      onRemove={handleRemovePost}
                      onEdit={openEdit}
                      onBookmark={handleSavePost}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
                    <Icon icon={searchQuery ? 'SearchX' : 'LayoutList'} size={32} />
                  </div>
                  <h4 className="text-white font-bold text-lg mb-1">No results found</h4>
                  <p className="text-white/40 text-sm">
                    {searchQuery ? "Try searching for something else." : "Check back later for more content."}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom padding block to ensure scroll reaches end */}
          <div className="h-12 w-full"></div>
        </div>
      </div>

        {/* ── Scroll To Top Button ── */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg z-50 hover:bg-white/20 active:scale-90 transition-all"
            aria-label="Scroll to top"
          >
            <Icon icon="ArrowUp" size={20} />
          </button>
        )}
      </div>

      {/* Layer Sub-Pages */}
      {isExploreLayerOpen && <ExploreProfilesLayer onClose={() => navigate(-1)} />}
      {isProductsLayerOpen && <ExploreProductsLayer onClose={() => navigate(-1)} />}
    </>
  );
};

export default LensPage;
