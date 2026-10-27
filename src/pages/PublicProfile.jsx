/**
 * PublicProfile.jsx — Phase 6 Port
 * Standardized to match MyProfile.jsx UI/UX structure.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { useInbox } from '../context/InboxContext';
import {
  getUserProfile,
  getUserProfileByUsername,
  getUserPosts,
  getUserCommentedPosts
} from '../lib/api/profiles';
import {
  getUserBadgeNumber,
  deletePost,
  hideItem,
  getHiddenItems
} from '../lib/api/posts';
import { blockUser, unblockUser, isUserBlocked, reportUser, reportPost as reportPostToApi } from '../lib/api/moderation';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';
import { getCurrentUser } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import { formatTimeAgo } from '../lib/utils';
import { DEFAULT_AVATAR } from '../lib/constants';
import { getCached, setCached, isStale } from '../lib/dataCache';
import Icon from '../components/ui/Icon';
import PostCard from '../components/feed/PostCard';
import SkeletonPost from '../components/feed/SkeletonPost';
import { useModalHistory } from '../hooks/useModalHistory';

const vibrate = (ms = 5) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

const isUUID = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const ReportUserModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const reasons = [
    "Suspicious activity detected",
    "Something else"
  ];

  const handleSelected = (reason) => {
    onSubmit(reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#18181b] border-t sm:border border-white/10 rounded-t-3xl p-6 pt-4 shadow-2xl animate-slide-up overflow-hidden flex flex-col">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />

        <div className="flex justify-between items-center mb-6 shrink-0">
          <span className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <Icon icon="AlertTriangle" size={20} className="text-red-500" />
            Report Account
          </span>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
            <Icon icon="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          <p className="text-sm text-gray-400 mb-4">Why are you reporting this user's account?</p>
          <div className="space-y-2">
            {reasons.map((reason) => (
              <button
                key={reason}
                onClick={() => handleSelected(reason)}
                className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all flex justify-between items-center group"
              >
                <span className="text-sm text-white">{reason}</span>
                <Icon icon="ArrowRight" size={16} className="text-white/20 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PublicProfile() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { startConversation } = useInbox();

  const { user, profile: authProfile, isGuest } = useAuth();
  const {
    openAuth, openLens, openOpinion, openImage,
    sharePost, shareProfile, reportPost: reportPostAction,
    savedPosts, setSavedPosts, openEdit,
    userProfile: viewerProfile,
  } = useActions();

  const [targetUser, setTargetUser] = useState(null);
  const [targetPosts, setTargetPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [userBadge, setUserBadge] = useState(null);

  const [contentTab, setContentTab] = useState('opinions');
  const [slideDirection, setSlideDirection] = useState(1);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isReportUserModalOpen, setIsReportUserModalOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());

  useModalHistory(isMoreMenuOpen, () => setIsMoreMenuOpen(false));
  useModalHistory(isReportUserModalOpen, () => setIsReportUserModalOpen(false));
  useModalHistory(isBlockConfirmOpen, () => setIsBlockConfirmOpen(false));

  const scrollContainerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isScrollingVertical = useRef(false);
  const lastFetchedTarget = useRef(null);
  const targetUserIdRef = useRef(null);

  const handlePullRefresh = useCallback(async () => {
    const targetId = targetUser?.id || targetUserIdRef.current;
    if (!targetId) return;

    try {
      const [profileData, posts, commented] = await Promise.all([
        getUserProfile(targetId),
        getUserPosts(targetId),
        getUserCommentedPosts(targetId)
      ]);

      if (profileData) {
        setTargetUser(profileData);
        setCached(`profile_${targetId}`, profileData);
      }

      if (posts) {
        setTargetPosts(posts);
        setCached(`profile_posts_${targetId}`, posts);
      }

      if (commented || posts) {
        const commentedByUser = commented || [];
        const postsWithComments = posts ? posts.filter((p) => (p.comments_count || 0) > 0) : [];
        const allCommentedMap = new Map();
        commentedByUser.forEach((p) => allCommentedMap.set(p.id, p));
        postsWithComments.forEach((p) => allCommentedMap.set(p.id, p));
        const mergedComments = Array.from(allCommentedMap.values());
        setCommentedPosts(mergedComments);
        setCached(`profile_comments_${targetId}`, mergedComments);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, [targetUser]);

  const ptr = usePullToRefresh(scrollContainerRef, handlePullRefresh);

  const TABS = ['opinions', 'comments', 'brands'];

  useEffect(() => {
    const currentTarget = params.id || searchParams.get('id') || searchParams.get('username');
    if (lastFetchedTarget.current === currentTarget) return;
    lastFetchedTarget.current = currentTarget;

    // Reset loading state for new target
    setIsLoadingProfile(true);
    setIsLoadingContent(true);
    setNotFound(false);
    setTargetUser(null);
    setTargetPosts([]);
    setCommentedPosts([]);

    const initData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser && !isGuest) {
          try {
            const { data: bookmarks } = await supabase
              .from('bookmarks')
              .select('post_id')
              .eq('user_id', currentUser.id);
            if (bookmarks) {
              setSavedPosts(new Set(bookmarks.map((b) => String(b.post_id))));
            }
          } catch (e) { /* silent */ }

          try {
            const hidden = await getHiddenItems();
            if (hidden && hidden.posts) {
              setHiddenPostIds(new Set(hidden.posts.map((id) => String(id))));
            }
          } catch (e) { /* silent */ }
        }

        let targetId = searchParams.get('id');
        let targetUsername = searchParams.get('username');
        const pathParam = params.id;

        if (pathParam && !targetId && !targetUsername) {
          if (isUUID(pathParam)) {
            targetId = pathParam;
          } else {
            targetUsername = decodeURIComponent(pathParam);
          }
        }

        if (!targetId && targetUsername) {
          const cachedUserId = getCached(`username_to_id_${targetUsername}`);
          if (cachedUserId) {
            targetId = cachedUserId;
          } else {
            try {
              const resolvedProfile = await getUserProfileByUsername(targetUsername);
              if (resolvedProfile) {
                targetId = resolvedProfile.id;
                setCached(`username_to_id_${targetUsername}`, targetId);
              }
            } catch (err) {}
          }
        }

        if (targetId && currentUser && targetId === currentUser.id) {
          navigate('/myprofile', { replace: true });
          return;
        }

        if (targetId) {
          targetUserIdRef.current = targetId;

          // Check if blocked by current user
          const blocked = await isUserBlocked(targetId).catch(() => false);
          if (blocked) {
            setIsBlocked(true);
            const profileData = await getUserProfile(targetId).catch(() => null);
            if (profileData) setTargetUser(profileData);
            setIsLoadingProfile(false);
            setIsLoadingContent(false);
            return;
          }
          setIsBlocked(false);

          const profileCacheKey = `profile_${targetId}`;
          const postsCacheKey = `profile_posts_${targetId}`;
          const commentsCacheKey = `profile_comments_${targetId}`;

          const cachedProfile = getCached(profileCacheKey);
          if (cachedProfile) {
            setTargetUser(cachedProfile);
            setIsLoadingProfile(false);
          }

          const cachedPosts = getCached(postsCacheKey);
          const cachedComments = getCached(commentsCacheKey);
          if (cachedPosts && cachedComments) {
            setTargetPosts(cachedPosts);
            setCommentedPosts(cachedComments);
            setIsLoadingContent(false);
          }

          getUserBadgeNumber(targetId).then((num) => setUserBadge(num)).catch(() => {});

          const fetchProfile = async () => {
            const profileData = await getUserProfile(targetId);
            if (!profileData) {
              setNotFound(true);
              setIsLoadingProfile(false);
              setIsLoadingContent(false);
              return;
            }
            // If the account is deactivated, treat it as not visible
            if (profileData.is_deactivated === true || profileData.deletion_requested === true) {
              setIsDeactivated(true);
              setNotFound(true);
              setIsLoadingProfile(false);
              setIsLoadingContent(false);
              return;
            }
            setTargetUser(profileData);
            setCached(profileCacheKey, profileData);
            setIsLoadingProfile(false);
          };

          const fetchContent = async () => {
            const [posts, commented] = await Promise.all([
              getUserPosts(targetId),
              getUserCommentedPosts(targetId)
            ]);

            setTargetPosts(posts || []);
            setCached(postsCacheKey, posts || []);

            const commentedByUser = commented || [];
            const postsWithComments = posts ? posts.filter((p) => (p.comments_count || 0) > 0) : [];

            const allCommentedMap = new Map();
            commentedByUser.forEach((p) => allCommentedMap.set(p.id, p));
            postsWithComments.forEach((p) => allCommentedMap.set(p.id, p));

            const mergedComments = Array.from(allCommentedMap.values());
            setCommentedPosts(mergedComments);
            setCached(commentsCacheKey, mergedComments);
            setIsLoadingContent(false);
          };

          const tasks = [];
          if (!cachedProfile || isStale(profileCacheKey)) {
            tasks.push(fetchProfile());
          }
          if (!cachedPosts || !cachedComments || isStale(postsCacheKey) || isStale(commentsCacheKey)) {
            tasks.push(fetchContent());
          }
          
          if (tasks.length > 0) {
            await Promise.all(tasks);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        setNotFound(true);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Profile not found', icon: 'AlertTriangle' } }));
      } finally {
        setIsLoadingProfile(false);
        setIsLoadingContent(false);
      }
    };
    initData();
  }, [params.id, searchParams, isGuest, navigate, setSavedPosts]);

  const handleBlockUser = async (targetId) => {
    vibrate(10);
    try {
      await blockUser(targetId);
      setIsBlocked(true);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'User blocked', icon: 'Slash', isSuccess: true } }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to block user', icon: 'AlertTriangle' } }));
    }
  };

  const handleUnblockUser = async () => {
    vibrate(10);
    const targetId = targetUser?.id || targetUserIdRef.current;
    if (!targetId) return;
    setIsUnblocking(true);
    try {
      await unblockUser(targetId);
      setIsBlocked(false);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'User unblocked', icon: 'Check', isSuccess: true } }));
      handlePullRefresh();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to unblock user', icon: 'AlertTriangle' } }));
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleReportUser = async (reason) => {
    vibrate();
    try {
      const reporter = await getCurrentUser();
      await reportUser(targetUser.id, reason, {
        reported_username: targetUser.username,
        reporter_username: reporter?.username || 'anonymous',
        profile_url: window.location.href
      });
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'User Reported', icon: 'Flag', isSuccess: true } }));
      setIsReportUserModalOpen(false);
    } catch (err) {}
  };

  const toggleBookmark = async (postId, shouldSave) => {
    try {
      if (shouldSave) {
        await bookmarkPost(postId);
        setSavedPosts((prev) => new Set(prev).add(String(postId)));
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Added to Bookmarks', icon: 'BookMark', isSuccess: true } }));
      } else {
        await removeBookmark(postId);
        setSavedPosts((prev) => {
          const next = new Set(prev);
          next.delete(String(postId));
          return next;
        });
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Removed from Bookmarks', icon: 'BookMark', isSuccess: true } }));
      }
    } catch (err) {}
  };

  const handleRemove = async (postId, message, type, value) => {
    if (type === 'REPORT_INTENT') {
      reportPostAction(postId);
      return;
    }
    if (type === 'SHARE_INTENT') {
      if (value) sharePost(value);
      return;
    }
    if (type === 'delete') {
      try {
        await deletePost(postId);
        setTargetPosts((prev) => prev.filter((p) => p.id !== postId));
        setCommentedPosts((prev) => prev.filter((p) => p.id !== postId));
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Opinion deleted', icon: 'Trash', isSuccess: true } }));
      } catch (err) {}
      return;
    }
    try {
      await hideItem(type, value, postId);
      setHiddenPostIds((prev) => new Set(prev).add(String(postId)));
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: message, icon: 'EyeOff', isSuccess: true } }));
    } catch (err) {}
  };

  const handlePostShare = (post) => sharePost(post);

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isScrollingVertical.current = false;
  };

  const handleTouchMove = (e) => {
    if (isScrollingVertical.current || !e.touches || e.touches.length !== 1) return;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    if (dy > 8 && dy >= dx) {
      isScrollingVertical.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (isScrollingVertical.current || !e.changedTouches || e.changedTouches.length === 0) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Strictly accessible only on genuine horizontal swipes
    if (absX < 60 || absX <= absY * 2 || absY > 50) return;

    const currentIndex = TABS.indexOf(contentTab);

    if (deltaX > 0 && currentIndex < TABS.length - 1) {
      setSlideDirection(1);
      setContentTab(TABS[currentIndex + 1]);
      vibrate(5);
    } else if (deltaX < 0 && currentIndex > 0) {
      setSlideDirection(-1);
      setContentTab(TABS[currentIndex - 1]);
      vibrate(5);
    }
  };

  const lastY = useRef(0);
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const currentY = el.scrollTop;
    if (currentY <= 50) {
      window.dispatchEvent(new CustomEvent('nav:visibility', {
        detail: { visible: true }
      }));
    } else {
      const delta = currentY - lastY.current;
      if (Math.abs(delta) >= 6) {
        window.dispatchEvent(new CustomEvent('nav:visibility', {
          detail: { visible: delta < 0 }
        }));
      }
    }
    lastY.current = currentY;
  };

  const triggerMySpace = (section) => {
    if (isGuest) {
      openAuth();
      return;
    }
    vibrate();
    console.log(`Show tooltip for: ${section}`);
  };

  const mapPostForCard = useCallback((post) => ({
    ...post,
    isHidden: hiddenPostIds.has(String(post.id)),
    name: post.profiles?.full_name || 'User',
    username: post.profiles?.username || 'user',
    avatar: post.profiles?.avatar_url || DEFAULT_AVATAR,
    rqs: post.profiles?.rqs_score || 0,
    verified: post.is_verified_purchase,
    category: post.category,
    product: post.product_name || post.brand_name || 'Product',
    text: post.text_content,
    media: post.media_url || post.media || post.image_url || (post.images && post.images.length > 0 ? post.images[0] : null),
    media_type: post.media_type || 'image',
    images: post.images || null,
    time: formatTimeAgo(post.created_at),
    agrees: post.agrees_count || 0,
    comments: post.comments_count || 0,
    seenBy: post.brand_name
  }), [hiddenPostIds]);

  if (!isLoadingProfile && (notFound || !targetUser)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20 bg-[#020205] h-[100dvh]">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Icon icon={isDeactivated ? 'PauseCircle' : 'User'} size={40} className="text-white/10" />
        </div>
        <h2 className="text-xl font-heading font-bold text-white mb-2">
          {isDeactivated ? 'Account Deactivated' : 'Profile Not Found'}
        </h2>
        <p className="text-muted text-sm mb-8 max-w-[280px]">
          {isDeactivated
            ? 'This account has been deactivated by its owner.'
            : "This profile is either private or doesn't exist on PlusOpinion."}
        </p>
        <button
          onClick={() => navigate('/feed')}
          className="bg-neon text-white px-8 py-3 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(47,139,255,0.2)] active:scale-95 transition-transform"
        >
          Back to Opinions
        </button>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoadingContent) {
      return (
        <div className="px-4 mt-4">
          <SkeletonPost delay="0ms" />
          <SkeletonPost delay="100ms" />
        </div>
      );
    }

    if (isGuest) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center mt-4 opacity-80">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Icon icon="Lock" size={28} className="text-white/40" />
          </div>
          <h3 className="text-lg font-heading font-bold text-white mb-2">Opinions are Hidden</h3>
          <p className="text-sm text-muted mb-6">Sign in or create an account to view @{targetUser.username}'s complete opinions.</p>
          <button
            onClick={openAuth}
            className="bg-neon text-white px-8 py-3 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(47,139,255,0.2)]"
          >
            Sign In to View
          </button>
        </div>
      );
    }

    if (contentTab === 'brands') {
      return (
        <div className="h-40 flex flex-col items-center justify-center text-muted/30">
          <Icon icon="Grid" size={32} className="mb-2 opacity-50" />
          <span className="text-xs font-heading tracking-widest uppercase">No Activity Yet</span>
        </div>
      );
    }

    const currentList = contentTab === 'opinions' ? targetPosts : commentedPosts;

    if (!currentList || currentList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted/40">
          <Icon icon={contentTab === 'opinions' ? 'FileText' : 'MessageCircle'} size={40} className="mb-4 opacity-50" />
          <p className="font-heading tracking-widest text-sm uppercase">No {contentTab} yet</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4 pb-24">
        {currentList.map((post, i) => (
          <PostCard
            key={post.id}
            post={mapPostForCard(post)}
            index={i}
            onShare={handlePostShare}
            onBookmark={toggleBookmark}
            savedPosts={savedPosts}
            onRemove={handleRemove}
            onImageClick={openImage}
            onEdit={openEdit}
            userProfile={viewerProfile}
            isGuest={isGuest}
            onAuthRequired={openAuth}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020205] flex flex-col">
      <ReportUserModal isOpen={isReportUserModalOpen} onClose={() => setIsReportUserModalOpen(false)} onSubmit={handleReportUser} />

      {isBlockConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBlockConfirmOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-2xl animate-enter">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Icon icon="Slash" size={24} />
            </div>
            <h3 className="text-white font-bold text-lg text-center mb-2">Block @{targetUser?.username}?</h3>
            <p className="text-white/60 text-sm text-center mb-8">They won't be able to see your profile or posts, and you won't see theirs. This can be undone in Settings.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsBlockConfirmOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">Cancel</button>
              <button onClick={() => { setIsBlockConfirmOpen(false); handleBlockUser(targetUser.id); }} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20">Block</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="header-glass sticky top-0 z-40 transition-transform duration-400 ease-out shrink-0">
        <div className="w-full h-14 flex items-center justify-between px-4 relative">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors touch-scale z-10"
            onClick={() => { vibrate(); navigate(-1); }}
            aria-label="Back"
          >
            <Icon icon="ArrowLeft" size={18} className="text-white" />
          </button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <span className="font-heading font-bold text-sm tracking-widest text-white uppercase">Profile</span>
          </div>
          <div className="flex items-center gap-2 z-10">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              onClick={() => { vibrate(); openLens(); }}
              aria-label="Search"
            >
              <Icon icon="Search" size={18} className="text-white" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              onClick={() => { vibrate(); setIsMoreMenuOpen(true); }}
              aria-label="More options"
            >
              <Icon icon="MoreVertical" size={18} className="text-white" />
            </button>

            {isMoreMenuOpen && (
              <>
              <div className="fixed inset-0 z-30" onClick={() => setIsMoreMenuOpen(false)}></div>
              <div className="absolute top-12 right-4 w-48 bg-[#1A1C2E] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-40 overflow-hidden animate-enter backdrop-blur-xl">
                <button className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    vibrate();
                    shareProfile(targetUser);
                  }}>
                  <Icon icon="Share" size={16} /> Share Profile
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 border-t border-white/5"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    vibrate();
                    if (isGuest) { openAuth(); return; }
                    setIsReportUserModalOpen(true);
                  }}>
                  <Icon icon="Flag" size={16} /> Report Profile
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-3 border-t border-white/5"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    vibrate();
                    if (isGuest) { openAuth(); return; }
                    if (isBlocked) {
                      handleUnblockUser();
                    } else {
                      setIsBlockConfirmOpen(true);
                    }
                  }}>
                  <Icon icon="Slash" size={16} /> {isBlocked ? 'Unblock User' : 'Block User'}
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <PullToRefreshIndicator {...ptr.indicatorProps} />
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`h-full overflow-y-auto overflow-x-hidden bg-[#020205] hide-scrollbar pb-24 ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
          style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
        >
        {/* PROFILE HEADER */}
      <div className="relative mb-6">
        {/* Banner */}
        {targetUser?.banner_url ? (
          <div className="h-[140px] w-full relative overflow-hidden">
            <img src={targetUser.banner_url} className="w-full h-full object-cover" alt="Banner" />
          </div>
        ) : (
          <div className="h-[140px] w-full bg-gradient-to-tr from-blue-900/40 to-purple-900/40"></div>
        )}

        {/* Avatar */}
        <div className="absolute bottom-1.5 left-4 flex items-end z-10 cursor-pointer touch-scale"
          onClick={() => {
            const avatarSrc = targetUser?.avatar_url || DEFAULT_AVATAR;
            openImage(avatarSrc, 'avatar', [avatarSrc], 0);
          }}>
          <div className="w-[105px] h-[105px] rounded-full bg-black border-[2px] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
            <img
              src={targetUser?.avatar_url || DEFAULT_AVATAR}
              className="w-full h-full object-cover"
              alt="Avatar"
            />
          </div>
        </div>
      </div>

      <div className="px-5 mt-2 mb-8 relative">
        {isLoadingProfile ? (
          <div className="space-y-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-8 w-40 rounded skeleton-bg" />
                <div className="h-4 w-24 rounded skeleton-bg" />
              </div>
              <div className="w-14 h-14 rounded-xl skeleton-bg" />
            </div>
            <div className="h-4 w-3/4 rounded skeleton-bg" />
            <div className="flex gap-3">
              <div className="flex-1 h-10 rounded-full skeleton-bg" />
              <div className="flex-1 h-10 rounded-full skeleton-bg" />
              <div className="w-10 h-10 rounded-full skeleton-bg" />
            </div>
          </div>
        ) : (
          <>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-heading font-bold text-white leading-tight truncate">
              {targetUser?.full_name || 'User'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/60 flex-wrap mt-1">
              <span>@{targetUser?.username}</span>
              {targetUser?.location && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="flex items-center gap-1">
                    <Icon icon="MapPin" size={12} /> {targetUser.location}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Message / EST User Badge */}
          {userBadge !== null && (
            <button
              onClick={() => {
                vibrate(5);
                if (startConversation && targetUser?.id) {
                  startConversation(targetUser.id);
                } else {
                  window.dispatchEvent(new CustomEvent('toast', {
                    detail: { message: 'Messaging coming soon', icon: 'PlusOpinionInbox', isSuccess: false }
                  }));
                }
              }}
              className="flex flex-col items-center shrink-0 w-14 h-14 rounded-xl bg-[#020205] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),_0_1px_0_rgba(255,255,255,0.05)] group relative overflow-hidden active:scale-95 transition-transform"
              title={`Message User #${userBadge}`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] pointer-events-none group-hover:bg-white/[0.05] transition-colors z-10"></div>
              <div className="flex-1 w-full bg-[#2f8bff] flex items-center justify-center hover:bg-[#2f8bff]/90 transition-colors">
                <Icon icon="PlusOpinionInbox" size={22} className="text-white group-hover:scale-110 transition-transform duration-300 stroke-[2.5px]" />
              </div>
              <div className="h-[18px] w-full bg-[#020205] flex items-center justify-center border-t border-white/5">
                <span className="text-[7px] text-white/30 font-black uppercase tracking-widest leading-none pt-0.5" style={{ textShadow: '0 -1px 0 rgba(0,0,0,1)' }}>
                  EST <span className="text-white/40">#{userBadge}</span>
                </span>
              </div>
            </button>
          )}
        </div>

        <div className="mb-4">
          {targetUser?.bio ? (
            <p className="text-sm text-gray-300 font-light leading-relaxed">{targetUser.bio}</p>
          ) : (
            <p className="text-sm text-gray-500 font-light italic">This user prefers to keep their bio a mystery.</p>
          )}
        </div>

        {targetUser?.website && (
          <div className="flex items-center gap-2 text-sm text-neon mb-6">
            <Icon icon="Link" size={14} />
            <a href={targetUser.website.startsWith('http') ? targetUser.website : `https://${targetUser.website}`} target="_blank" rel="noreferrer" className="hover:underline">{targetUser.website.replace(/^https?:\/\//, '')}</a>
          </div>
        )}

        {/* REDESIGNED CREDIBILITY BLOCK (SERIOUS TRUST) */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => triggerMySpace('rqs')} className="flex-1 group relative overflow-hidden rounded-full p-[1px] shadow-[0_0_20px_rgba(47,139,255,0.15)] hover:shadow-[0_0_25px_rgba(47,139,255,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-95">
            <span className="absolute inset-0 bg-gradient-to-r from-[#2F8BFF] to-[#1A73E8] rounded-full opacity-100 group-hover:opacity-90 transition-opacity"></span>
            <div className="relative h-10 bg-inherit flex items-center justify-between px-1 rounded-full">
              <div className="flex items-center gap-2 pl-3">
                <Icon icon="Zap" className="text-white fill-white animate-pulse-slow" size={16} />
                <span className="text-white font-bold tracking-wider text-sm">RQS</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mr-1">
                <span className="text-white font-heading font-bold leading-none">{targetUser?.rqs_score || 0}</span>
              </div>
            </div>
          </button>

          <button onClick={() => triggerMySpace('verification')} className="flex-1 group relative overflow-hidden rounded-full bg-[#020205]/40 backdrop-blur-xl border border-accent-green/30 hover:border-accent-green/80 transition-all duration-300 hover:scale-[1.02] active:scale-95 h-10 shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <div className="relative h-full flex items-center justify-center gap-2 px-4">
              <Icon icon="ShieldCheck" className="text-accent-green group-hover:text-[#4ade80] transition-colors" size={18} />
              <div className="flex items-baseline gap-1.5">
                <span className="text-white font-bold text-sm tracking-wide">{targetUser?.verified_count || 0}</span>
                <span className="text-[10px] text-accent-green/80 uppercase font-bold tracking-wider whitespace-nowrap group-hover:text-accent-green transition-colors">Verified Opinions</span>
              </div>
            </div>
          </button>

          <button onClick={() => triggerMySpace('insights')} className="h-10 w-10 rounded-full bg-[#020205]/40 backdrop-blur-xl border border-white/10 hover:border-white/40 hover:bg-white/5 transition-all duration-300 hover:scale-110 active:scale-90 flex items-center justify-center group relative overflow-hidden shrink-0 shadow-lg">
            <Icon icon="BarChart" size={18} className="text-white/70 group-hover:text-neon transition-all relative z-10" />
          </button>
        </div>
        </>
        )}
      </div>

      {isBlocked ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
            <Icon icon="Slash" size={28} className="text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">You've Blocked @{targetUser?.username || 'User'}</h3>
          <p className="text-xs text-white/50 max-w-xs mb-6 leading-relaxed">
            Their opinions, comments, profile content, and direct messages are completely hidden from your view.
          </p>
          <button
            type="button"
            onClick={handleUnblockUser}
            disabled={isUnblocking}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all duration-200 active:scale-95 shadow-md"
          >
            {isUnblocking ? 'Unblocking...' : 'Unblock User'}
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex justify-between border-b border-white/10 w-full px-2 overflow-x-auto hide-scrollbar sticky top-0 bg-[#020205] z-30 pt-2">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => {
                  const currentIdx = TABS.indexOf(contentTab);
                  setSlideDirection(idx > currentIdx ? 1 : -1);
                  setContentTab(tab);
                  if (navigator.vibrate) navigator.vibrate(5);
                }}
                className={`flex-1 min-w-max px-2 py-3 text-[13px] font-semibold transition-colors relative capitalize flex justify-center ${contentTab === tab ? 'text-white' : 'text-muted hover:text-white'}`}
              >
                <div className="flex items-center gap-1.5">
                  {tab === 'opinions' && 'Opinions'}
                  {tab === 'comments' && 'Comments'}
                  {tab === 'brands' && 'Brand Engagement'}
                </div>
                {contentTab === tab && (
                  <motion.div layoutId="tabIndicatorPublicProfile" className="absolute bottom-0 left-0 right-0 mx-auto w-full h-[2px] bg-neon shadow-[0_0_10px_var(--neon)]" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            className="min-h-[50vh] overflow-x-hidden relative"
            data-tab-swipe
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={contentTab}
                initial={{ x: slideDirection * 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDirection * -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
      </div>
      </div>
    </div>
  );
}
