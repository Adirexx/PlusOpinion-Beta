/**
 * Feed.jsx — Main Feed Page
 *
 * Ported from HOMEPAGE_FINAL.compiled.js (App component, L3974-5360).
 * Route: /feed (public — viewable by guests)
 *
 * PHASE 4.2 PORT CHANGES:
 *   - React.createElement → JSX
 *   - window.location.href / goTo() → useNavigate() (9+ navigations replaced)
 *   - window.supabase.* → supabase import (realtime channel, bookmark fetch)
 *   - window.PlusOpinionActions → useActions() from ActionsContext
 *   - window.getCurrentUser → useAuth() from AuthContext
 *   - window.getFeed / getSmartFeed / etc. → imports from lib/api/feed
 *   - window.getPost / deletePost / etc. → imports from lib/api/posts
 *   - window.bookmarkPost / removeBookmark → imports from lib/api/bookmarks
 *   - window.getHiddenItems / hideItem → imports from lib/api/posts
 *   - window.getMyProfile → useAuth().profile
 *   - window.reportPost → import from lib/api/moderation
 *   - Hash listeners (#opinion, #category=) → useSearchParams / router state
 *   - window.PullToRefresh → silent no-op (carry-forward: Phase 5/6)
 *   - window.StateManager → silent no-op (carry-forward: Phase 5/6)
 *   - Feed caching via dataCache.js → shows cached posts on mount, background refresh
 *   - BottomNav removed (persistent in AppLayout)
 *   - All modals triggered via ActionsContext, not local state
 *
 * WINDOW.* DEPENDENCY DISCLOSURE:
 *   - window.openInbox: called when inbox icon clicked. Currently a no-op until
 *     InboxHost is wired in Phase 7.
 *   - window.closeInbox: called in openFullPost. Currently a no-op.
 *   - window.PullToRefresh: not ported. Pull-to-refresh is a carry-forward for Phase 5/6.
 *   - window.needsOnboarding: read in the onClick guard. Currently uses useAuth().needsOnboarding.
 *   - window.openFullPost / window.scrollToPost: still assigned for inbox's render_shared_post.
 *     Will be cleaned up when inbox is ported (Phase 7).
 *
 * DATA-PAGE CSS: Not needed. Home was the source of default token values.
 */

import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { useInbox } from '../context/InboxContext';
import { supabase } from '../lib/supabaseClient';
import {
  getCached,
  getCachedAsync,
  setCached,
  isStale,
  getScrollPosition,
  saveScrollPosition,
  isFeedSessionActive,
  markFeedSessionActive,
} from '../lib/dataCache';
import { formatTimeAgo } from '../lib/utils';

// API imports (replacing window.* globals)
import {
  getFeed, getSmartFeed, getTrendingFeed, getVerifiedFeed, getHighRQSFeed,
} from '../lib/api/feed';
import { getPost, deletePost, hideItem, getHiddenItems } from '../lib/api/posts';
import { bookmarkPost, removeBookmark, getUserBookmarkPostIds } from '../lib/api/bookmarks';
import { reportPost as apiReportPost, getBlockedUserIds } from '../lib/api/moderation';
import { getUserProfile } from '../lib/api/profiles';

// Shared components (imported, NOT redefined)
import PostCard from '../components/feed/PostCard';
import SkeletonPost from '../components/feed/SkeletonPost';
import Icon from '../components/ui/Icon';
import FullPostViewer from '../components/modals/FullPostViewer';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';
import { OrbitLoader } from '../components/ui/Icons';
import OnboardingTour from '../components/onboarding/OnboardingTour';

const vibrate = (ms) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

// ─── FEED CACHE KEY ───────────────────────────────────────────────
const FEED_CACHE_KEY = 'feed:posts';
const FEED_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes (standard SPA cache survival)

const Feed = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, isGuest, needsOnboarding } = useAuth();
  const {
    openOpinion, closeOpinion, openMenu, openLens, sharePost, reportPost,
    openAuth, openImage, openEdit, isMenuOpen, isLensOpen,
    isOpinionOpen, viewingImage, savedPosts, setSavedPosts,
    userProfile,
  } = useActions();
  const { openInbox, closeInbox, conversations: inboxConversations, unreadInboxCount: contextUnreadCount } = useInbox();

  const sessionActive = isFeedSessionActive();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // On cold start online: start with empty posts and loading=true to show skeletons
  // On tab return OR cold start offline: read cached data synchronously
  const initialCached = (sessionActive || !isOnline) ? getCached(FEED_CACHE_KEY) : undefined;
  const hasInitialCached = Array.isArray(initialCached) && initialCached.length > 0;

  // ── STATE ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(() => {
    if (!sessionActive && isOnline) return true;
    return !hasInitialCached;
  });
  const [navVisible, setNavVisible] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { post } | null
  const navVisibleRef = useRef(true);
  const [fabVisible, setFabVisible] = useState(true);
  const [deepLinkedPost, setDeepLinkedPost] = useState(null);
  const [feedFilters, setFeedFilters] = useState({ source: 'All', type: 'All', category: null });

  // Inbox unread badge — derived live from InboxContext
  const unreadInboxCount = contextUnreadCount !== undefined
    ? contextUnreadCount
    : (inboxConversations || []).filter(c => (c.unreadCount || 0) > 0).length;

  // ── DATA STATE ──────────────────────────────────────────────────
  const [posts, setPosts] = useState(() => {
    if (!sessionActive && isOnline) return [];
    return hasInitialCached ? initialCached : [];
  });
  const [isLoadingPosts, setIsLoadingPosts] = useState(() => {
    if (!sessionActive && isOnline) return true;
    return !hasInitialCached;
  });
  const [postComments, setPostComments] = useState({});
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [seenIds, setSeenIds] = useState(new Set());
  const [feedMode, setFeedMode] = useState('for-you');
  const seenIdsByMode = useRef({
    'for-you': new Set(), 'trending': new Set(),
    'verified': new Set(), 'high-rqs': new Set(),
  });
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());
  const [hiddenItems, setHiddenItems] = useState({ posts: [], brands: [], categories: [] });
  const activeFetchIdRef = useRef(0);
  const prevFeedModeRef = useRef(feedMode);
  const hasRestoredScrollRef = useRef(false);

  // Portals for internal messaging payloads
  const [sharedPostsToRender, setSharedPostsToRender] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [removedPosts, setRemovedPosts] = useState(new Set());

  // ── ONBOARDING TOUR & LOGO EFFECTS ──────────────────────────────
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [isNewUserTwinkle, setIsNewUserTwinkle] = useState(false);
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Gate 1: tour already completed — never show again
    const isTourDone = localStorage.getItem(`po_tour_completed_${user.id}`);
    if (isTourDone) return;

    // Gate 2: account age safeguard — if profile.created_at is known and
    // the account is older than 14 days, skip the tour silently.
    // This prevents nagging users who cleared localStorage.
    const createdAt = profile?.created_at;
    if (createdAt) {
      const ageMs = Date.now() - new Date(createdAt).getTime();
      const fourteenDays = 14 * 24 * 60 * 60 * 1000;
      if (ageMs > fourteenDays) return;
    }

    // New user — show logo twinkle and then the tour
    setIsNewUserTwinkle(true);
    const twinkleTimer = setTimeout(() => setIsNewUserTwinkle(false), 3500);

    // Wait for feed to settle before showing tour card
    const tourTimer = setTimeout(() => setShowOnboardingTour(true), 1200);

    return () => {
      clearTimeout(twinkleTimer);
      clearTimeout(tourTimer);
    };
  }, [user, profile]);

  // ── UI STATES ───────────────────────────────────────────────────
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [viewingFullPost, setViewingFullPost] = useState(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePostData, setSharePostData] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportData, setReportData] = useState({});
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);

  // ── CATEGORY FILTER (replaces hashchange listener) ─────────────
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setFeedFilters(prev => ({ ...prev, category: catParam }));
    }
  }, [searchParams]);

  // ── QUERY PARAM ACTIONS (replaces hash actions) ────────────────
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'compose' || action === 'opinion') {
      openOpinion();
      // Clear the param without reload
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'menu') {
      openMenu();
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    } else if (action === 'lens' || action === 'search') {
      if (isGuest) {
        openAuth();
      } else {
        openLens();
      }
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // Run once on mount

  // ── FETCH HIDDEN ITEMS ──────────────────────────────────────────
  useEffect(() => {
    const loadHiddenItems = async () => {
      try {
        let hidden = await getHiddenItems();
        if (!hidden || Array.isArray(hidden) || !hidden.posts) {
          hidden = { posts: [], brands: [], categories: [] };
        }
        setHiddenItems(hidden);
        if (hidden.posts && hidden.posts.length > 0) {
          setHiddenPostIds(prev => {
            const next = new Set(prev);
            hidden.posts.forEach(id => next.add(id));
            return next;
          });
        }
      } catch (e) { console.error('Failed to load hidden items', e); }
    };
    loadHiddenItems();
  }, []);

  // ── LOAD POSTS ──────────────────────────────────────────────────
  const loadPosts = useCallback(async (currentOffset = 0, reset = false) => {
    if (isLoadingMore && !reset) return;

    const currentFetchId = ++activeFetchIdRef.current;

    try {
      if (reset) {
        setIsLoadingPosts(true);
        setOffset(0);
        setSeenIds(new Set());
      } else {
        setIsLoadingMore(true);
      }

      // If offline, preserve cached posts without error
      if (!navigator.onLine) {
        const cachedOffline = await getCachedAsync(FEED_CACHE_KEY);
        if (cachedOffline && Array.isArray(cachedOffline) && cachedOffline.length > 0) {
          setPosts(cachedOffline);
        }
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
        return;
      }

      // Fetch hidden & blocked items for filtering
      let hiddenIds = new Set();
      let mutedBrands = new Set();
      let mutedCategories = new Set();
      let blockedUserIds = new Set();

      try {
        const [hItems, bIds] = await Promise.all([
          getHiddenItems().catch(() => null),
          getBlockedUserIds().catch(() => [])
        ]);
        if (hItems) {
          if (hItems.posts && Array.isArray(hItems.posts)) hItems.posts.forEach(id => hiddenIds.add(String(id)));
          if (hItems.brands && Array.isArray(hItems.brands)) hItems.brands.forEach(b => mutedBrands.add(b));
          if (hItems.categories && Array.isArray(hItems.categories)) hItems.categories.forEach(c => mutedCategories.add(c));
        }
        if (Array.isArray(bIds)) {
          bIds.forEach(id => blockedUserIds.add(String(id)));
        }
      } catch (e) { console.warn('Failed to fetch hidden/blocked items', e); }

      // Algorithm brain: route to correct feed function
      const currentSeenIds = seenIdsByMode.current[feedMode] || new Set();
      const excludeIdsList = Array.from(reset ? new Set() : currentSeenIds);
      let finalBatch = [];

      if (feedFilters.category) {
        finalBatch = await getFeed({
          limit: 10,
          offset: reset ? 0 : currentOffset,
          category_id: feedFilters.category,
          excludeIds: excludeIdsList,
          shuffle: true,
        });
      } else {
        switch (feedMode) {
          case 'trending':
            finalBatch = getTrendingFeed ? await getTrendingFeed(15, excludeIdsList) : await getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            break;
          case 'verified':
            finalBatch = getVerifiedFeed ? await getVerifiedFeed(15, excludeIdsList) : await getFeed({ limit: 15, verifiedOnly: true, excludeIds: excludeIdsList, shuffle: true });
            break;
          case 'high-rqs':
            finalBatch = getHighRQSFeed ? await getHighRQSFeed(15, excludeIdsList) : await getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            break;
          case 'for-you':
          default:
            finalBatch = getSmartFeed ? await getSmartFeed(15, excludeIdsList) : await getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            if (finalBatch.length === 0 && getSmartFeed) {
              finalBatch = await getFeed({ limit: 15, excludeIds: excludeIdsList, shuffle: true });
            }
            break;
        }
      }

      if (finalBatch.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (hiddenIds.size > 0) setHiddenPostIds(hiddenIds);

      // Filter: strictly exclude blocked users, hidden posts, muted brands/categories
      const filteredData = finalBatch.filter(post => {
        const postAuthorId = String(post.user_id || post.profiles?.id || '');
        if (postAuthorId && blockedUserIds.has(postAuthorId)) return false;
        if (mutedBrands.has(post.seen_by_brand || 'None')) return false;
        if (mutedCategories.has(post.category)) return false;
        return true;
      });

      const transformedPosts = filteredData.map(post => ({
        id: post.id,
        user_id: post.user_id,
        name: post.profiles?.full_name || 'User',
        username: post.profiles?.username || 'user',
        avatar: post.profiles?.avatar_url || '',
        rqs: post.profiles?.rqs_score || 0,
        verified: post.is_verified_purchase === true || (post.is_verified_purchase === null && !!post.media_url) || post.profiles?.is_verified,
        category: post.category,
        product: post.product_name,
        text: post.text_content,
        media: post.media_url,
        media_type: post.media_type || 'image',
        images: post.images || null,
        time: formatTimeAgo(post.created_at),
        isHidden: hiddenIds.has(String(post.id)),
        agrees: post.agrees_count || 0,
        comments: post.comments_count || 0,
        seenBy: post.seen_by_brand,
      }));

      // Shuffle only for 'for-you'
      const finalBatchOrdered = feedMode === 'for-you'
        ? [...transformedPosts].sort(() => Math.random() - 0.5)
        : transformedPosts;

      // Prevent stale fetches
      if (currentFetchId !== activeFetchIdRef.current) return;

      setPosts(prev => {
        const newPosts = reset ? finalBatchOrdered : [...prev, ...finalBatchOrdered];
        const modeSeenSet = seenIdsByMode.current[feedMode] || new Set();
        const nextSeen = new Set(reset ? [] : modeSeenSet);
        finalBatchOrdered.forEach(p => nextSeen.add(p.id));
        seenIdsByMode.current[feedMode] = nextSeen;
        setSeenIds(nextSeen);

        // Cache the posts for tab-switch survival & offline viewing
        setCached(FEED_CACHE_KEY, newPosts);
        markFeedSessionActive();

        return newPosts;
      });

      if (!reset) setOffset(currentOffset + 10);

    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      if (currentFetchId === activeFetchIdRef.current) {
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
      }
    }
  }, [feedMode, feedFilters.category, isLoadingMore]);

  // ── REALTIME SUBSCRIPTION ───────────────────────────────────────
  useEffect(() => {
    const channel = supabase.channel('public:plusopinion')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        if (payload.new.user_id !== user?.id) {
          try {
            const blockedList = await getBlockedUserIds().catch(() => []);
            if (blockedList.includes(String(payload.new.user_id))) return;
            const fullPost = await getPost(payload.new.id);
            const uiPost = {
              id: fullPost.id,
              user_id: fullPost.user_id,
              name: fullPost.profiles?.full_name || 'User',
              username: fullPost.profiles?.username || 'user',
              avatar: fullPost.profiles?.avatar_url || '',
              rqs: fullPost.profiles?.rqs_score || 0,
              verified: fullPost.is_verified_purchase || fullPost.profiles?.is_verified || (fullPost.is_verified_purchase === null && !!fullPost.media_url),
              category: fullPost.category,
              product: fullPost.product_name,
              text: fullPost.text_content,
              media: fullPost.media_url,
              media_type: fullPost.media_type || 'image',
              images: fullPost.images || null,
              time: 'Just now',
              agrees: 0,
              comments: 0,
              seenBy: null,
            };
            setPosts(prev => [uiPost, ...prev]);
            vibrate(5);
          } catch (e) { console.error('Realtime post fetch failed', e); }
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes' }, (payload) => {
        setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, agrees: p.agrees + 1 } : p));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'post_likes' }, (payload) => {
        setPosts(prev => prev.map(p => p.id === payload.old.post_id ? { ...p, agrees: Math.max(0, p.agrees - 1) } : p));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
        if (payload.new.user_id !== user?.id) {
          setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, comments: p.comments + 1 } : p));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ── LOAD BOOKMARKS ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const loadBookmarks = async () => {
      try {
        const ids = await getUserBookmarkPostIds(user.id);
        if (ids) {
          setSavedPosts(new Set(ids.map(id => String(id))));
        }
      } catch (e) { console.error('Failed to load bookmarks', e); }
    };
    loadBookmarks();
  }, [user, setSavedPosts]);

  // ── INITIAL LOAD ────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Check for deep-link post
      const postParam = searchParams.get('post');
      let postId = postParam;

      if (postId) {
        try {
          const post = await getPost(postId);
          if (post) {
            const uiPost = {
              id: post.id,
              user_id: post.user_id,
              name: post.profiles?.full_name || 'PlusOpinion User',
              username: post.profiles?.username || 'user',
              avatar: post.profiles?.avatar_url || '',
              rqs: post.profiles?.rqs_score || 0,
              verified: !!post.profiles?.is_verified,
              category: post.category,
              product: post.product_name,
              text: post.text_content,
              media: post.media_url,
              media_type: post.media_type || 'image',
              images: post.images || null,
              time: 'Recent',
              isHidden: false,
              agrees: post.agrees_count || 0,
              comments: post.comments_count || 0,
              seenBy: post.seen_by_brand,
            };
            setDeepLinkedPost(uiPost);
          }
        } catch (e) {
          console.error('Failed to load deep-linked post:', e);
        }
      }

      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const isSession = isFeedSessionActive();

      if (!isSession && isOnline) {
        // COLD LAUNCH ONLINE:
        // App was quit and freshly opened with internet connection.
        // Reset scroll position to top and fetch fresh content behind skeleton loader
        saveScrollPosition(FEED_CACHE_KEY, 0);
        setIsLoadingPosts(true);
        setLoading(true);
        try {
          await loadPosts(0, true);
          markFeedSessionActive();
        } catch (err) {
          console.warn('[Feed] Cold start fetch failed, falling back to cached posts:', err);
          const cachedOffline = await getCachedAsync(FEED_CACHE_KEY);
          if (cachedOffline && Array.isArray(cachedOffline) && cachedOffline.length > 0) {
            setPosts(cachedOffline);
          }
        } finally {
          setIsLoadingPosts(false);
          setLoading(false);
        }
        return;
      }

      // IN-SESSION TAB RETURN OR OFFLINE LAUNCH:
      // Read cached posts — first check L1 memory, then fallback to L2 IndexedDB
      let currentCached = getCached(FEED_CACHE_KEY);
      const hasMemoryCached = Array.isArray(currentCached) && currentCached.length > 0;

      if (!hasMemoryCached) {
        const cachedOffline = await getCachedAsync(FEED_CACHE_KEY);
        if (cachedOffline && Array.isArray(cachedOffline) && cachedOffline.length > 0) {
          currentCached = cachedOffline;
          setPosts(cachedOffline);
        }
      }

      markFeedSessionActive();
      setIsLoadingPosts(false);
      setLoading(false);
    };
    init();

    // Re-fetch fresh feed when connection comes back online
    const handleNetworkOnline = () => {
      loadPosts(0, true);
    };
    window.addEventListener('network:online', handleNetworkOnline);

    // Save scroll position when navigating away from Feed
    return () => {
      window.removeEventListener('network:online', handleNetworkOnline);
      if (scrollRef.current) {
        saveScrollPosition(FEED_CACHE_KEY, scrollRef.current.scrollTop);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reliable scroll restoration when cached posts are in DOM
  useLayoutEffect(() => {
    if (posts.length > 0 && !hasRestoredScrollRef.current) {
      const savedScroll = getScrollPosition(FEED_CACHE_KEY);
      if (savedScroll > 0 && scrollRef.current) {
        hasRestoredScrollRef.current = true;
        const el = scrollRef.current;
        el.style.scrollBehavior = 'auto';
        el.scrollTop = savedScroll;
        requestAnimationFrame(() => {
          if (el) el.scrollTop = savedScroll;
          requestAnimationFrame(() => {
            if (el && Math.abs(el.scrollTop - savedScroll) > 5) {
              el.scrollTop = savedScroll;
            }
            if (el) el.style.scrollBehavior = '';
          });
        });
      }
    }
  }, [posts.length]);

  // ── RELOAD ON CATEGORY FILTER CHANGE ────────────────────────────
  useEffect(() => {
    if (feedFilters.category !== null) {
      loadPosts(0, true);
    }
  }, [feedFilters.category]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── RELOAD ON FEED MODE CHANGE (only when user actively switches tabs, NOT on mount or return) ────
  useEffect(() => {
    if (prevFeedModeRef.current === feedMode) {
      return; // feedMode hasn't changed! Do NOT wipe cache on mount or return!
    }
    prevFeedModeRef.current = feedMode;
    seenIdsByMode.current[feedMode] = new Set();
    setSeenIds(new Set());
    loadPosts(0, true);
  }, [feedMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── EXPOSE openFullPost GLOBALLY (for inbox render_shared_post) ─
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
            avatar: fullPost.profiles?.avatar_url || '',
            rqs: fullPost.profiles?.rqs_score || 0,
            verified: fullPost.is_verified_purchase || fullPost.profiles?.is_verified,
            category: fullPost.category,
            product: fullPost.product_name,
            text: fullPost.text_content,
            media: fullPost.media_url,
            media_type: fullPost.media_type || 'image',
            images: fullPost.images || null,
            time: 'Shared',
            agrees: fullPost.agrees_count || 0,
            comments: fullPost.comments_count || 0,
            seenBy: fullPost.seen_by_brand,
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

    // Expose openFullPost globally for inbox
    window.openFullPost = async (postId) => {
      closeInbox();
      try {
        let post = posts.find(p => p.id === postId);
        if (!post) {
          const shared = Object.values(sharedPostsToRender).find(s => s.post?.id === postId);
          if (shared) post = shared.post;
        }
        if (!post) {
          const fullPost = await getPost(postId);
          if (fullPost) {
            post = {
              id: fullPost.id,
              user_id: fullPost.user_id,
              name: fullPost.profiles?.full_name || 'User',
              username: fullPost.profiles?.username || 'user',
              avatar: fullPost.profiles?.avatar_url || '',
              rqs: fullPost.profiles?.rqs_score || 0,
              verified: fullPost.is_verified_purchase || fullPost.profiles?.is_verified,
              category: fullPost.category,
              product: fullPost.product_name,
              text: fullPost.text_content,
              media: fullPost.media_url,
              media_type: fullPost.media_type || 'image',
              images: fullPost.images || null,
              time: 'Shared Post',
              agrees: fullPost.agrees_count || 0,
              comments: fullPost.comments_count || 0,
              seenBy: fullPost.seen_by_brand,
            };
          }
        }
        if (post) {
          setViewingFullPost(post);
        } else {
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { msg: 'Post not found', icon: 'AlertTriangle', isSuccess: false }
          }));
        }
      } catch (err) {
        console.error('Error opening full post:', err);
      }
    };
    window.scrollToPost = window.openFullPost;

    return () => {
      window.removeEventListener('render_shared_post', handleRenderSharedPost);
      delete window.openFullPost;
      delete window.scrollToPost;
    };
  }, [posts, sharedPostsToRender]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── LISTEN FOR POST:PUBLISHED FROM ActionsContext ───────────────
  useEffect(() => {
    const handler = (e) => {
      const { post: newPost, isUpdate } = e.detail;
      if (!newPost) return;
      const uiPost = {
        id: newPost.id,
        user_id: newPost.user_id,
        name: newPost.profiles?.full_name || 'You',
        username: newPost.profiles?.username || 'user',
        avatar: newPost.profiles?.avatar_url || '',
        rqs: newPost.profiles?.rqs_score || 0,
        verified: newPost.is_verified_purchase,
        category: newPost.category,
        product: newPost.product_name,
        text: newPost.text_content,
        media: newPost.media_url,
        media_type: newPost.media_type || 'image',
        images: newPost.images || null,
        time: 'Just now',
        agrees: newPost.agrees_count || 0,
        comments: newPost.comments_count || 0,
        seenBy: null,
      };
      if (isUpdate) {
        setPosts(prev => prev.map(p => p.id === uiPost.id ? { ...p, ...uiPost } : p));
      } else {
        setPosts(prev => [uiPost, ...prev]);
        setSeenIds(prev => { const next = new Set(prev); next.add(newPost.id); return next; });
      }
    };
    window.addEventListener('post:published', handler);
    return () => window.removeEventListener('post:published', handler);
  }, []);

  // ── LISTEN FOR POST:EDITED ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const { postId, text } = e.detail;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, text } : p));
    };
    window.addEventListener('post:edited', handler);
    return () => window.removeEventListener('post:edited', handler);
  }, []);

  // ── HANDLERS ────────────────────────────────────────────────────
  const showToast = (msg, icon = null, isSuccess = false, action = null) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: msg, icon, isSuccess, action } }));
  };

  const toggleOverlay = () => {
    vibrate(10);
    if (isOpinionOpen) {
      closeOpinion();
    } else {
      openOpinion();
    }
  };

  const handleShare = (post) => {
    sharePost(post);
  };

  const toggleSave = async (postId, shouldSave) => {
    const isSaving = shouldSave !== undefined ? shouldSave : !savedPosts.has(String(postId));
    const next = new Set(savedPosts);
    if (isSaving) {
      next.add(String(postId));
      showToast('Saved to Bookmarks', 'BookMark', true);
      try { await bookmarkPost(postId); } catch (e) { console.error(e); }
    } else {
      next.delete(String(postId));
      showToast('Removed from Bookmarks', 'BookMark');
      try { await removeBookmark(postId); } catch (e) { console.error(e); }
    }
    setSavedPosts(next);
    vibrate(10);
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (post.brand_name && hiddenItems?.brands?.includes(post.brand_name)) return false;
    if (post.seenBy && hiddenItems?.brands?.includes(post.seenBy)) return false;
    if (post.category && hiddenItems?.categories?.includes(post.category)) return false;
    if (feedFilters.source !== 'All') {
      if (feedFilters.source === 'Tagged (Apple)' && !post.product?.toLowerCase().includes('apple')) return false;
      if (feedFilters.source === 'Competitor' && !['Samsung', 'Google'].some(b => post.product?.includes(b))) return false;
    }
    return true;
  });

  const handleMoreAction = async (action, post) => {
    if (action === 'edit') {
      if (post.is_edited) {
        showToast('You can only edit a post once.', 'AlertTriangle');
        return;
      }
      openEdit(post);
    } else if (action === 'delete') {
      setDeleteConfirm({ post });
    } else if (action === 'insight') {
      showToast('Insights feature coming soon!', 'BarChart');
    } else if (action === 'not_interested' || action === 'hide') {
      try {
        await hideItem('post', post.id);
        setHiddenPostIds(prev => new Set(prev).add(post.id));
        showToast('Opinion hidden', 'EyeOff', true);
      } catch (e) {
        console.error(e);
        showToast('Failed to hide post', 'AlertTriangle', false);
      }
    } else if (action === 'block_brand') {
      try {
        const brand = post.seenBy || post.brand_name || 'Brand';
        await hideItem('brand', brand);
        setHiddenItems(prev => ({ ...prev, brands: [...prev.brands, brand] }));
        showToast(`You won't see posts from ${brand} anymore`, 'Flag', true);
      } catch (e) { console.error(e); }
    } else if (action === 'report') {
      reportPost(post.id);
    } else if (action === 'bookmark') {
      toggleSave(post.id);
    }
  };

  const handleRemovePost = async (postId, reason = 'Removed', type = 'delete', target = null, additionalData = {}) => {
    if (type === 'REPORT_INTENT') {
      reportPost(postId);
      return;
    }
    if (type === 'SHARE_INTENT') {
      if (target) sharePost(target);
      return;
    }
    if (type === 'block_user') {
      const blockedUid = String(additionalData?.blockedUserId || '');
      setPosts(prev => {
        const next = prev.filter(p => String(p.user_id) !== blockedUid);
        setCached(FEED_CACHE_KEY, next);
        return next;
      });
      return;
    }
    if (type !== 'hide_post') {
      setRemovedPosts(prev => new Set(prev).add(postId));
    }
    if (reason) showToast(reason, type === 'delete' ? 'Trash' : 'EyeOff', true);
    try {
      if (type === 'delete') await deletePost(postId);
    } catch (e) { console.error(e); }
  };

  const handleEditPost = (post) => {
    if (post.is_edited) {
      showToast('You can only edit a post once.', 'AlertTriangle');
      return;
    }
    openEdit(post);
  };

  const handleAddComment = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
  };

  // ── SCROLL LOGIC ────────────────────────────────────────────────
  const scrollRef = useRef(null);
  const lastY = useRef(0);

  // ── PULL-TO-REFRESH ─────────────────────────────────────────────
  const handlePullRefresh = useCallback(async () => {
    await loadPosts(0, true);
  }, [loadPosts]);

  const ptr = usePullToRefresh(scrollRef, handlePullRefresh);
  const lastTapToTopRef = useRef(0);

  // Handle header logo refresh click — triggers visual PTR with pulled screen
  const handleLogoClick = useCallback(() => {
    vibrate(10);
    setIsLogoSpinning(true);
    setTimeout(() => setIsLogoSpinning(false), 700);
    if (scrollRef.current && scrollRef.current.scrollTop > 0) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    ptr.triggerPTR();
  }, [ptr]);

  // Handle re-click on active nav tab (Home) for scroll-to-top / instant PTR
  useEffect(() => {
    const handleNavTabReclick = (e) => {
      if (e.detail?.tab === 'home') {
        vibrate(10);
        const now = Date.now();
        const currentScroll = scrollRef.current ? scrollRef.current.scrollTop : 0;

        if (currentScroll > 20) {
          // If already tapped to scroll to top recently (<1.2s), user is multi-clicking to refresh!
          if (now - lastTapToTopRef.current < 1200) {
            lastTapToTopRef.current = 0;
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
            ptr.triggerPTR();
          } else {
            // First tap while scrolled down: scroll to top smoothly
            lastTapToTopRef.current = now;
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        } else {
          // Already at top: instant PTR toggle
          lastTapToTopRef.current = 0;
          ptr.triggerPTR();
        }
      }
    };
    window.addEventListener('nav_tab_reclick', handleNavTabReclick);
    return () => window.removeEventListener('nav_tab_reclick', handleNavTabReclick);
  }, [ptr]);

  // Listen for global block/unblock events to keep feed updated
  useEffect(() => {
    const handleBlocksChanged = (e) => {
      const { action, targetUserId } = e.detail || {};
      if (action === 'block' && targetUserId) {
        setPosts(prev => {
          const next = prev.filter(p => String(p.user_id) !== String(targetUserId));
          setCached(FEED_CACHE_KEY, next);
          return next;
        });
      } else if (action === 'unblock') {
        loadPosts(0, true);
      }
    };
    window.addEventListener('user_blocks_changed', handleBlocksChanged);
    return () => window.removeEventListener('user_blocks_changed', handleBlocksChanged);
  }, [loadPosts]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const currentY = scrollTop;

    // Near top: ALWAYS show
    if (currentY <= 50) {
      if (!navVisibleRef.current) {
        navVisibleRef.current = true;
        setFabVisible(true);
        setNavVisible(true);
        window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }));
      }
    } else {
      const delta = currentY - lastY.current;
      if (Math.abs(delta) >= 6) {
        if (delta > 0 && navVisibleRef.current) {
          navVisibleRef.current = false;
          setFabVisible(false);
          setNavVisible(false);
          window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: false } }));
        } else if (delta < 0 && !navVisibleRef.current) {
          navVisibleRef.current = true;
          setFabVisible(true);
          setNavVisible(true);
          window.dispatchEvent(new CustomEvent('nav:visibility', { detail: { visible: true } }));
        }
      }
    }

    lastY.current = currentY;
    saveScrollPosition(FEED_CACHE_KEY, currentY);

    // Infinite scroll
    if (scrollHeight - scrollTop - clientHeight < 300) {
      if (!isLoadingMore && hasMore) {
        loadPosts(offset, false);
      }
    }
  };

  const isAnySidePanelOpen = isMenuOpen || isLensOpen;
  const getMainContentTransform = () => {
    if (isMenuOpen) return 'scale-95 opacity-50 translate-x-[60%] rounded-[32px] overflow-hidden blur-sm';
    if (isLensOpen) return 'scale-95 opacity-50 -translate-x-[60%] rounded-[32px] overflow-hidden blur-sm';
    if (isOpinionOpen || viewingImage) return 'blur-md opacity-60 pointer-events-none';
    return 'scale-100';
  };

  const visiblePosts = filteredPosts.filter(p => !removedPosts.has(p.id));

  // ── RENDER ──────────────────────────────────────────────────────
  return (
    <div
      className="flex-1 flex flex-col relative h-full overflow-hidden"
      onClick={(e) => {
        if (typeof navigator !== 'undefined' && navigator.onLine && needsOnboarding && !showOnboardingModal) {
          e.preventDefault();
          e.stopPropagation();
          openAuth();
        }
      }}
    >
      {/* Top Navigation Bar */}
      <div className={`fixed top-0 left-0 w-full top-nav-glass feed-header z-40 transition-transform duration-400 ease-out ${getMainContentTransform()} ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="w-full h-14 flex items-center justify-between px-4 relative">
          <div className="flex items-center z-10">
            <button
              className="text-white touch-scale transition-transform p-1.5 -ml-1 rounded-full hover:bg-white/5 active:scale-90"
              onClick={() => { vibrate(5); openMenu(); }}
              aria-label="Open menu"
            >
              <Icon icon="Menu" size={22} className="stroke-[2.2px]" />
            </button>
          </div>

          <button
            id="header-plusopinion-logo"
            type="button"
            onClick={handleLogoClick}
            aria-label="Refresh feed"
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-transparent border-0 p-1.5 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer z-10 select-none ${isLogoSpinning ? 'opacity-80 scale-95' : ''} ${isNewUserTwinkle ? 'animate-logo-twinkle' : ''}`}
            title="Tap to refresh feed"
          >
            <h1 className="font-heading font-extrabold text-[17px] tracking-wide text-white m-0 leading-none flex items-center gap-1.5">
              <span>PlusOpinion</span>
              {isLogoSpinning && (
                <svg className="animate-spin text-[#2f8bff]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
            </h1>
            <div className={`border border-[#2f8bff]/40 px-1.5 py-0.5 rounded-md bg-[#2f8bff]/15 shadow-[0_0_10px_rgba(47,139,255,0.15)] flex items-center justify-center transition-transform ${isLogoSpinning ? 'rotate-180' : ''}`}>
              <span className="text-[9px] font-bold text-[#2f8bff] tracking-[0.18em] uppercase leading-none">BETA</span>
            </div>
          </button>

          <div className="flex items-center gap-3 z-10">
            <button
              id="header-inbox-btn"
              className="relative touch-scale transition-transform text-white p-1.5 rounded-full hover:bg-white/5 active:scale-90 group"
              onClick={() => { vibrate(5); if (!isGuest) { openInbox(); } else { openAuth(); } }}
              aria-label="Open inbox"
            >
              <Icon icon={unreadInboxCount > 0 ? 'PlusOpinionInboxFilled' : 'PlusOpinionInbox'} size={22} className={`transition-all duration-300 ${unreadInboxCount > 0 ? '' : 'stroke-[1.6px] group-hover:stroke-[2.2px]'}`} />
              {unreadInboxCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] bg-[#ef4444] rounded-full border border-[#020205] z-50 animate-pulse-subtle shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  <span className="relative text-[9px] font-bold text-white px-1 leading-none">
                    {unreadInboxCount > 99 ? '99+' : unreadInboxCount}
                  </span>
                </div>
              )}
            </button>

            <button
              id="header-lens-btn"
              className="text-white touch-scale transition-transform p-1.5 rounded-full hover:bg-white/5 active:scale-90"
              onClick={() => { vibrate(5); openLens(); }}
              aria-label="Search"
            >
              <Icon icon="Search" size={22} className="stroke-[2.2px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      {feedFilters.category && (
        <div
          className={`fixed left-0 w-full feed-category-bar transition-transform duration-400 ease-out ${navVisible ? 'translate-y-0' : '-translate-y-[120px]'}`}
          style={{ zIndex: 39, top: 'var(--header-total)' }}
        >
          <div className="top-nav-glass border-b border-white/5 px-4 py-2 flex items-center justify-between gap-3">
            <span className="text-xs text-white/60 truncate">
              Showing: <span className="text-neon font-bold capitalize">{feedFilters.category}</span>
            </span>
            <button
              onClick={() => {
                setFeedFilters(prev => ({ ...prev, category: null }));
                searchParams.delete('category');
                setSearchParams(searchParams, { replace: true });
              }}
              className="shrink-0 text-[10px] text-white/40 hover:text-white border border-white/10 px-2 py-1 rounded-full transition-colors"
            >
              Clear ×
            </button>
          </div>
        </div>
      )}

      {/* Main Scrollable Content */}
      <PullToRefreshIndicator {...ptr.indicatorProps} />
      <div
        ref={scrollRef}
        className={`feed-scroll-container absolute inset-0 overflow-y-auto px-4 pt-[75px] pb-28 no-scrollbar smooth-scroll-container transition-app-shell origin-center ${getMainContentTransform()} ${ptr.pullOffset > 0 ? (ptr.isAutoRefreshing ? 'ptr-content-auto-pull' : 'ptr-content-pulling') : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
        onScroll={handleScroll}
        style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
      >
        <div className="flex-1 overflow-hidden relative touch-pan-y">
          {/* Loading Skeletons — only shown when actively fetching with no cached content */}
          {isLoadingPosts && posts.length === 0 && (
            <div className="space-y-4 pt-2">
              <SkeletonPost delay="0ms" />
              <SkeletonPost delay="100ms" />
              <SkeletonPost delay="200ms" />
            </div>
          )}

          {/* Guest Welcome Banner */}
          {isGuest && !deepLinkedPost && (
            <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-[#0F1627] to-[#1a2332] border border-white/10 shadow-2xl relative overflow-hidden group animate-fade-in">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-white tracking-tight font-heading mb-2">
                  Welcome to PlusOpinion!
                </h2>
                <p className="text-muted text-sm leading-relaxed mb-6 max-w-[280px]">
                  Join the future of consumer intelligence. Share opinions, earn rewards, and discover honest feedback.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => openAuth()}
                    className="flex-1 h-12 bg-neon text-white font-bold rounded-xl shadow-lg shadow-neon/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Join the Feed
                    <Icon icon="ArrowRight" size={16} />
                  </button>
                  <button
                    onClick={() => { vibrate(5); toggleOverlay(); }}
                    className="h-12 px-5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center"
                  >
                    <Icon icon="Info" size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Post List */}
          <div className="space-y-6 pb-20">
            {isGuest && deepLinkedPost ? (
              <div className="animate-fade-in">
                <PostCard
                  post={deepLinkedPost}
                  onRemove={handleRemovePost}
                  onEdit={() => { }}
                  onBookmark={() => openAuth()}
                  onShare={handleShare}
                  userProfile={userProfile}
                  savedPosts={savedPosts}
                  comments={postComments[deepLinkedPost.id] || []}
                  isGuest={isGuest}
                  onAuthRequired={() => openAuth()}
                  onImageClick={(src, type, images, idx) => openImage(src, type, images, idx)}
                />
                <div className="mt-12 p-8 rounded-3xl text-center bg-white/5 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-2">Want to see more?</h3>
                  <p className="text-muted text-xs mb-6 px-4">
                    Create an account to browse thousands of authentic opinions and earn rewards.
                  </p>
                  <button
                    onClick={() => openAuth()}
                    className="w-full h-12 bg-white text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Create Free Account
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Deep-linked post for logged-in user */}
                {!isGuest && deepLinkedPost && (
                  <div className="relative ring-2 ring-neon/50 rounded-3xl shadow-[0_0_30px_rgba(47,139,255,0.2)] mb-8 before:absolute before:inset-0 before:bg-neon/5 before:rounded-3xl before:pointer-events-none">
                    <div className="absolute -top-3 left-6 bg-neon text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10 tracking-widest uppercase flex items-center gap-1">
                      <Icon icon="Link" size={10} /> Shared Post
                    </div>
                    <PostCard
                      post={deepLinkedPost}
                      onRemove={handleRemovePost}
                      onEdit={handleEditPost}
                      onBookmark={toggleSave}
                      onShare={handleShare}
                      userProfile={userProfile}
                      savedPosts={savedPosts}
                      comments={postComments[deepLinkedPost.id] || []}
                      isGuest={false}
                      onAuthRequired={() => openAuth()}
                      onImageClick={(src, type, images, idx) => openImage(src, type, images, idx)}
                    />
                  </div>
                )}

                {/* Normal feed posts */}
                {visiblePosts
                  .filter(post => !deepLinkedPost || post.id !== deepLinkedPost.id)
                  .map((post, index) => (
                    <div key={post.id}>
                      <PostCard
                        post={post}
                        onRemove={handleRemovePost}
                        onEdit={handleEditPost}
                        onBookmark={toggleSave}
                        onShare={handleShare}
                        userProfile={userProfile}
                        savedPosts={savedPosts}
                        comments={postComments[post.id] || []}
                        isGuest={isGuest}
                        onAuthRequired={() => openAuth()}
                        onImageClick={(src, type, images, idx) => openImage(src, type, images, idx)}
                      />
                    </div>
                  ))}

                {/* Empty state for category filter */}
                {!loading && !isLoadingPosts && visiblePosts.length === 0 && feedFilters.category && (
                  <div className="flex flex-col items-center justify-center py-20 px-6 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                      <Icon icon="Search" size={32} className="text-white/20" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">No opinions found</h3>
                    <p className="text-muted text-sm text-center max-w-[240px] leading-relaxed">
                      There are no opinions in the <span className="text-neon capitalize">{feedFilters.category || 'selected'}</span> category yet.
                    </p>
                    <button
                      onClick={() => setFeedFilters(prev => ({ ...prev, category: null }))}
                      className="mt-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-all"
                    >
                      Back to Feed
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Loading more indicator */}
            {isLoadingMore && !deepLinkedPost && (
              <div className="py-4 flex justify-center">
                <OrbitLoader size={28} />
              </div>
            )}

            {/* End of feed */}
            {!hasMore && visiblePosts.length > 0 && !deepLinkedPost && (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-[60px] h-[1px] bg-gradient-to-r from-transparent via-[#2f8bff]/30 to-transparent" />
                <span className="text-[9px] font-medium tracking-[0.4em] uppercase text-[#2f8bff] opacity-50">
                  END OF FEED
                </span>
                <div className="w-[60px] h-[1px] bg-gradient-to-r from-transparent via-[#2f8bff]/30 to-transparent" />
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Full Post Viewer (for deep-link / inbox shared posts) */}
      {/* ── Native Delete Confirm Dialog (replaces browser confirm()) ── */}
      {deleteConfirm && ReactDOM.createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setDeleteConfirm(null)}
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
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>Delete Opinion?</h3>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              This will delete your opinion and store it in your deleted archive for 30 days before permanent deletion.
            </p>
            {deleteConfirm.post?.text && (
              <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {deleteConfirm.post.text}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  const p = deleteConfirm.post
                  setDeleteConfirm(null)
                  try {
                    await deletePost(p.id)
                    showToast('Opinion deleted', 'Trash', true)
                    setHiddenPostIds(prev => new Set(prev).add(p.id))
                  } catch (e) { console.error(e) }
                }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {viewingFullPost && (
        <FullPostViewer
          post={viewingFullPost}
          onClose={() => setViewingFullPost(null)}
          userProfile={userProfile}
          savedPosts={savedPosts}
          toggleSave={toggleSave}
          handleRemovePost={handleRemovePost}
          handleEditPost={handleEditPost}
          handleAddComment={handleAddComment}
          handleShare={handleShare}
          postComments={postComments}
          setViewingImage={(img) => openImage(img?.src, img?.type, img?.images, img?.initialIndex)}
          setShowOnboardingModal={() => openAuth()}
          isGuest={isGuest}
        />
      )}

      {/* Shared post portals for inbox */}
      {Object.entries(sharedPostsToRender).map(([containerId, data]) => {
        const el = document.getElementById(containerId);
        if (!el) return null;

        if (data.isLoading) {
          return ReactDOM.createPortal(
            <div className="p-4 text-center opacity-70 text-xs text-white">Loading post...</div>,
            el
          );
        }

        if (data.error || !data.post) {
          return ReactDOM.createPortal(
            <div className="p-4 text-center opacity-70 text-xs text-red-400">Post unavailable</div>,
            el
          );
        }

        return ReactDOM.createPortal(
          <div className="w-full shrink-0 pointer-events-auto" onClick={(e) => { e.stopPropagation(); if (window.scrollToPost) window.scrollToPost(data.post.id); }}>
            <PostCard
              post={data.post}
              isGuest={isGuest}
              onShare={handleShare}
              hideActions={true}
              onImageClick={(src, type, images, idx) => openImage(src, type, images, idx)}
            />
          </div>,
          el
        );
      })}

      {/* Guided 5-Step New User Spotlight Tour */}
      <OnboardingTour
        isOpen={showOnboardingTour}
        onClose={() => { setShowOnboardingTour(false); setIsNewUserTwinkle(false); }}
        onCompleteTour={() => {
          setShowOnboardingTour(false);
          setIsNewUserTwinkle(false);
          openOpinion();
        }}
        user={user}
      />
    </div>
  );
};

export default Feed;
