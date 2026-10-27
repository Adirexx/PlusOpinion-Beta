import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import { useModalHistory } from '../hooks/useModalHistory';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { bookmarkPost, removeBookmark } from '../lib/api/bookmarks';
import { deletePost } from '../lib/api/posts';
import Icon from '../components/ui/Icon';
import PostCard from '../components/feed/PostCard';
import SkeletonPost from '../components/feed/SkeletonPost';
import EditProfile from '../components/profile/EditProfile';
import { DEFAULT_AVATAR } from '../lib/constants';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';

export default function MyProfile() {
  const navigate = useNavigate();
  const {
    profile, posts, drafts, commentedPosts,
    loadingProfile, loadingContent, error, setPosts,
    refreshProfile, refreshContent, setDrafts, setCommentedPosts
  } = useProfile(); // No ID = self

  const vibrate = (ms) => {
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  const { isGuest } = useAuth();
  const { openAuth, openImage, openEdit, openMenu, openLens, reportPost, sharePost, shareProfile, savedPosts, setSavedPosts, userProfile } = useActions();

  const toggleSave = async (postId, shouldSave) => {
    const isSaving = shouldSave !== undefined ? shouldSave : !savedPosts.has(String(postId));
    const next = new Set(savedPosts);
    if (isSaving) {
      next.add(String(postId));
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Saved to Bookmarks', icon: 'BookMark', isSuccess: true } }));
      try { await bookmarkPost(postId); } catch (e) { console.error(e); }
    } else {
      next.delete(String(postId));
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Removed from Bookmarks', icon: 'BookMark', isSuccess: true } }));
      try { await removeBookmark(postId); } catch (e) { console.error(e); }
    }
    setSavedPosts(next);
    vibrate(10);
  };

  const handleRemovePost = async (postId, reason = 'Removed', type = 'delete', target = null) => {
    if (type === 'REPORT_INTENT') {
      reportPost(postId);
      return;
    }
    if (type === 'SHARE_INTENT') {
      if (target) sharePost(target);
      return;
    }
    // Remove from local state immediately across all tabs
    const filterFn = p => p.id !== postId && String(p.id) !== String(postId);
    setPosts(prev => prev.filter(filterFn));
    setCommentedPosts(prev => prev.filter(filterFn));
    setDrafts(prev => prev.filter(filterFn));

    window.dispatchEvent(new CustomEvent('toast', { detail: { message: reason, icon: type === 'delete' ? 'Trash' : 'EyeOff', isSuccess: true } }));

    // Actually delete from backend
    if (type === 'delete') {
      try { await deletePost(postId); } catch (e) { console.error('Delete failed', e); }
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      if (refreshContent) refreshContent(true);
    };
    window.addEventListener('post:published', handleUpdate);
    window.addEventListener('draft:saved', handleUpdate);
    return () => {
      window.removeEventListener('post:published', handleUpdate);
      window.removeEventListener('draft:saved', handleUpdate);
    };
  }, [refreshContent]);

  const [activeTab, setActiveTab] = useState('opinions'); // opinions, comments, drafts
  const [slideDirection, setSlideDirection] = useState(1);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  
  useModalHistory(isEditingProfile, () => setIsEditingProfile(false));
  useModalHistory(isMoreMenuOpen, () => setIsMoreMenuOpen(false));

  const scrollContainerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isScrollingVertical = useRef(false);

  const handlePullRefresh = React.useCallback(async () => {
    await Promise.all([
      refreshProfile ? refreshProfile() : Promise.resolve(),
      refreshContent ? refreshContent(true) : Promise.resolve(),
    ]);
  }, [refreshProfile, refreshContent]);

  const ptr = usePullToRefresh(scrollContainerRef, handlePullRefresh);
  const lastTapToTopRef = React.useRef(0);

  React.useEffect(() => {
    const handleNavTabReclick = (e) => {
      if (e.detail?.tab === 'profile') {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
        const now = Date.now();
        const currentScroll = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;

        if (currentScroll > 20) {
          if (now - lastTapToTopRef.current < 1200) {
            lastTapToTopRef.current = 0;
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
            ptr.triggerPTR();
          } else {
            lastTapToTopRef.current = now;
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
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

    const TABS = ['opinions', 'comments', 'seen', 'drafts'];
    const currentIndex = TABS.indexOf(activeTab);

    // Swipe left (next tab)
    if (deltaX > 0 && currentIndex < TABS.length - 1) {
      setSlideDirection(1);
      setActiveTab(TABS[currentIndex + 1]);
      if (navigator.vibrate) navigator.vibrate(5);
    }
    // Swipe right (prev tab)
    else if (deltaX < 0 && currentIndex > 0) {
      setSlideDirection(-1);
      setActiveTab(TABS[currentIndex - 1]);
      if (navigator.vibrate) navigator.vibrate(5);
    }
  };

  // Set up global nav dispatcher
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

  if (isGuest) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in h-full">
        <Icon icon="Lock" size={48} className="text-white/20 mb-4" />
        <h2 className="text-xl font-heading font-bold text-white mb-2">Sign in to view your profile</h2>
        <p className="text-sm text-muted mb-6">Create an account to manage your opinions and drafts.</p>
        <button onClick={openAuth} className="bg-white text-black px-8 py-3 rounded-full font-bold">
          Sign In
        </button>
      </div>
    );
  }

  const renderContent = () => {
    if (loadingContent) {
      return (
        <div className="p-4 space-y-4">
          <SkeletonPost />
          <SkeletonPost />
        </div>
      );
    }

    if (activeTab === 'seen') {
      return (
        <div className="h-40 flex flex-col items-center justify-center text-muted/30 animate-enter">
          <Icon icon="Grid" size={32} className="mb-2 opacity-50" />
          <span className="text-xs font-heading tracking-widest uppercase">Coming Soon</span>
        </div>
      );
    }

    const currentList = activeTab === 'opinions' ? posts
      : activeTab === 'comments' ? commentedPosts
        : drafts;

    if (!currentList || currentList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted/40">
          <Icon icon={activeTab === 'drafts' ? 'Lock' : 'MessageCircle'} size={40} className="mb-4 opacity-50" />
          <p className="font-heading tracking-widest text-sm uppercase">
            No {activeTab} yet
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4 pb-24">
        {activeTab === 'drafts' && (
          <div className="mb-2 flex items-center gap-2 p-3 rounded-xl bg-neon/5 border border-neon/10">
            <Icon icon="Lock" size={16} className="text-neon" />
            <p className="text-xs text-neon/80">These are private drafts visible only to you.</p>
          </div>
        )}
        {currentList.map(post => (
          <PostCard
            key={post.id}
            post={post}
            userProfile={userProfile}
            isOwner={activeTab === 'opinions' || activeTab === 'drafts'}
            savedPosts={savedPosts}
            isGuest={false}
            onAuthRequired={openAuth}
            onImageClick={(src, type, images, idx) => openImage(src, type, images, idx)}
            onBookmark={toggleSave}
            onShare={sharePost}
            onReport={reportPost}
            onEdit={openEdit}
            onRemove={handleRemovePost}
          />
        ))}
      </div>
    );
  };

  if (isEditingProfile) {
    return (
      <EditProfile
        currentProfile={profile}
        onClose={() => setIsEditingProfile(false)}
        onSave={() => {
          setIsEditingProfile(false);
          refreshProfile();
          refreshContent();
        }}
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020205] flex flex-col">
      {/* Top Bar */}
      <div className="header-glass sticky top-0 z-40 transition-transform duration-400 ease-out shrink-0">
        <div className="w-full h-14 flex items-center justify-between px-4 relative">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors touch-scale z-10"
            onClick={() => window.history.back()}
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
              onClick={openLens}
              aria-label="Search"
            >
              <Icon icon="Search" size={18} className="text-white" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setIsMoreMenuOpen(true)}
              aria-label="More options"
            >
              <Icon icon="MoreVertical" size={18} className="text-white" />
            </button>

            {isMoreMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsMoreMenuOpen(false)}></div>
                <div className="absolute top-12 right-0 w-48 bg-[#1A1C2E] border border-white/10 rounded-xl shadow-2xl z-40 overflow-hidden animate-enter">
                <button className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    shareProfile(profile);
                  }}>
                  <Icon icon="Share" size={16} /> Share Profile
                </button>
                <button className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-3 border-t border-white/5"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    navigate('/settings');
                  }}>
                  <Icon icon="Settings" size={16} /> Settings
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
          className={`h-full overflow-y-auto overflow-x-hidden bg-[#020205] hide-scrollbar pb-24 ${ptr.pullOffset > 0 ? (ptr.isAutoRefreshing ? 'ptr-content-auto-pull' : 'ptr-content-pulling') : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
          style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
        >
        {/* PROFILE HEADER */}
      <div className="relative mb-6">
        {/* Banner */}
        {profile?.banner_url ? (
          <div className="h-[140px] w-full relative overflow-hidden">
            <img src={profile.banner_url} className="w-full h-full object-cover" alt="Banner" />
          </div>
        ) : (
          <div className="h-[140px] w-full bg-gradient-to-tr from-blue-900/40 to-purple-900/40"></div>
        )}

        {/* Avatar */}
        <div className="absolute bottom-1.5 left-4 flex items-end z-10 cursor-pointer touch-scale"
          onClick={() => {
            const avatarSrc = profile?.avatar_url || profile?.avatar || DEFAULT_AVATAR;
            openImage(avatarSrc, 'avatar', [avatarSrc], 0);
          }}>
          <div className="w-[105px] h-[105px] rounded-full bg-black border-[2px] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
            <img
              src={profile?.avatar_url || profile?.avatar || DEFAULT_AVATAR}
              className="w-full h-full object-cover"
              alt="Avatar"
            />
          </div>
        </div>

        {/* Edit Profile Button over Banner */}
        <div className="absolute bottom-3 right-4 flex gap-2 z-10">
          <button
            className="bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
            onClick={() => {
              setIsEditingProfile(true);
            }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="px-5 mt-2 mb-8 relative">
        {loadingProfile ? (
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
                  {profile?.full_name || 'User'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-white/60 flex-wrap mt-1">
                  <span>@{profile?.username}</span>
                  {profile?.location && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="flex items-center gap-1">
                        <Icon icon="MapPin" size={12} /> {profile.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Message / EST User Badge */}
              <button
                className="flex flex-col items-center shrink-0 w-14 h-14 rounded-xl bg-[#020205] border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),_0_1px_0_rgba(255,255,255,0.05)] group relative overflow-hidden active:scale-95 transition-transform"
                title={`Inbox`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] pointer-events-none group-hover:bg-white/[0.05] transition-colors z-10"></div>
                <div className="flex-1 w-full bg-[#2f8bff] flex items-center justify-center hover:bg-[#2f8bff]/90 transition-colors">
                  <Icon icon="PlusOpinionInbox" size={22} className="text-white group-hover:scale-110 transition-transform duration-300 stroke-[2.5px]" />
                </div>
                <div className="h-[18px] w-full bg-[#020205] flex items-center justify-center border-t border-white/5">
                  <span className="text-[7px] text-white/30 font-black uppercase tracking-widest leading-none pt-0.5" style={{ textShadow: '0 -1px 0 rgba(0,0,0,1)' }}>
                    EST <span className="text-white/40">#86</span>
                  </span>
                </div>
              </button>
            </div>

            <div className="mb-4">
              {profile?.bio ? (
                <p className="text-sm text-gray-300 font-light leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-sm text-gray-500 font-light italic">This user prefers to keep their bio a mystery.</p>
              )}
            </div>

            {profile?.website && (
              <div className="flex items-center gap-2 text-sm text-neon mb-6">
                <Icon icon="Link" size={14} />
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="hover:underline">{profile.website.replace(/^https?:\/\//, '')}</a>
              </div>
            )}

            {/* REDESIGNED CREDIBILITY BLOCK (SERIOUS TRUST) */}
            <div className="flex items-center gap-3 mb-6">
              {/* RQS Badge - Blue Glass Gradient Pill */}
              <button className="flex-1 group relative overflow-hidden rounded-full p-[1px] shadow-[0_0_20px_rgba(47,139,255,0.15)] hover:shadow-[0_0_25px_rgba(47,139,255,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-95">
                <span className="absolute inset-0 bg-gradient-to-r from-[#2F8BFF] to-[#1A73E8] rounded-full opacity-100 group-hover:opacity-90 transition-opacity"></span>
                <div className="relative h-10 bg-inherit flex items-center justify-between px-1 rounded-full">
                  <div className="flex items-center gap-2 pl-3">
                    <Icon icon="Zap" className="text-white fill-white animate-pulse-slow" size={16} />
                    <span className="text-white font-bold tracking-wider text-sm">RQS</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mr-1">
                    <span className="text-white font-heading font-bold leading-none">{profile?.rqs || 0}</span>
                  </div>
                </div>
              </button>

              {/* Verified Badge - Dark Glass Pill */}
              <button className="flex-1 group relative overflow-hidden rounded-full bg-[#020205]/40 backdrop-blur-xl border border-accent-green/30 hover:border-accent-green/80 transition-all duration-300 hover:scale-[1.02] active:scale-95 h-10 shadow-[0_0_15px_rgba(34,197,94,0.05)] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <div className="relative h-full flex items-center justify-center gap-2 px-4">
                  <Icon icon="ShieldCheck" className="text-accent-green group-hover:text-[#4ade80] transition-colors" size={18} />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white font-bold text-sm tracking-wide">{profile?.verified_count || 0}</span>
                    <span className="text-[10px] text-accent-green/80 uppercase font-bold tracking-wider whitespace-nowrap group-hover:text-accent-green transition-colors">Verified Opinions</span>
                  </div>
                </div>
              </button>

              {/* Insight Tool - Glass Icon Pill */}
              <button className="h-10 w-10 rounded-full bg-[#020205]/40 backdrop-blur-xl border border-white/10 hover:border-white/40 hover:bg-white/5 transition-all duration-300 hover:scale-110 active:scale-90 flex items-center justify-center group relative overflow-hidden shrink-0 shadow-lg">
                <Icon icon="BarChart" size={18} className="text-white/70 group-hover:text-neon transition-all relative z-10" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-between border-b border-white/10 w-full px-2 overflow-x-auto hide-scrollbar sticky top-0 bg-[#020205] z-30 pt-2">
        {['opinions', 'comments', 'seen', 'drafts'].map((tab, idx) => (
          <button
            key={tab}
            onClick={() => {
              const TABS = ['opinions', 'comments', 'seen', 'drafts'];
              const currentIdx = TABS.indexOf(activeTab);
              setSlideDirection(idx > currentIdx ? 1 : -1);
              setActiveTab(tab);
              if (navigator.vibrate) navigator.vibrate(5);
            }}
            className={`flex-1 min-w-max px-2 py-3 text-[13px] font-semibold transition-colors relative capitalize flex justify-center ${activeTab === tab ? 'text-white' : 'text-muted hover:text-white'
              }`}
          >
            <div className="flex items-center gap-1.5">
              {tab === 'opinions' ? 'Your Opinions' : tab === 'comments' ? 'Comments' : tab === 'seen' ? 'Seen' : 'Drafts'}
              {tab === 'seen' && <Icon icon="Zap" size={12} className={activeTab === tab ? "text-neon" : ""} />}
              {tab === 'drafts' && <Icon icon="Lock" size={12} />}
            </div>
            {activeTab === tab && (
              <motion.div layoutId="tabIndicatorProfile" className="absolute bottom-0 left-0 right-0 mx-auto w-full h-[2px] bg-neon shadow-[0_0_10px_var(--neon)]" />
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
            key={activeTab}
            initial={{ x: slideDirection * 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDirection * -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
      </div>
    </div>
  );
}
