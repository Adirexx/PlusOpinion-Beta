import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import Icon from '../components/ui/Icon';
import SkeletonPost from '../components/feed/SkeletonPost';
import PostCard from '../components/feed/PostCard';
import { NotificationBookmarkItem } from '../components/notifications/NotificationBookmarkItem';
import { formatTimeAgo } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import {
  getBookmarkedNotificationsWithProfiles,
  getBookmarkedMessages,
  deleteBookmarkById,
  getUserBookmarkPostIds,
  getBookmarks,
  bookmarkPost,
  removeBookmark,
} from '../lib/api/bookmarks';
import { getProfilesByIds } from '../lib/api/profiles';
import * as inboxCrypto from '../lib/inbox/inboxCrypto.js';
import { getCached, setCached, isStale, getScrollPosition, saveScrollPosition } from '../lib/dataCache';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';
import { OrbitLoader } from '../components/ui/Icons';

const CACHE_KEY = 'bookmarks:data';

// ─── Bookmarks Page ───────────────────────────────────────────────────────────
const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    sharePost,
    reportPost,
    openImage,
    openOpinion,
    openEdit,
    userProfile,
  } = useActions();

  // ── Loading / refresh ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(() => !getCached(CACHE_KEY));
  const [navVisible, setNavVisible] = useState(true);
  const navVisibleRef = useRef(true);

  // ── Post data ──────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState(() => getCached(CACHE_KEY) || []);
  const [isLoadingPosts, setIsLoadingPosts] = useState(() => !getCached(CACHE_KEY));
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [removedPosts, setRemovedPosts] = useState(new Set());

  // ── Notification bookmarks ─────────────────────────────────────────────────
  const [bookmarkedNotifs, setBookmarkedNotifs] = useState([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [bookmarkTab, setBookmarkTab] = useState('opinions');

  // ── Scroll ────────────────────────────────────────────────────────────────
  const scrollRef = useRef(null);
  const lastY = useRef(0);

  // ─────────────────────────────────────────────────────────────────────────
  //  DATA LOADING
  // ─────────────────────────────────────────────────────────────────────────
  const loadPosts = useCallback(async (currentOffset = 0, reset = false) => {
    if (isLoadingMore && !reset) return;

    try {
      if (reset) {
        setIsLoadingPosts(true);
        setOffset(0);
      } else {
        setIsLoadingMore(true);
      }

      const bookmarkedPosts = await getBookmarks({
        limit: 10,
        offset: reset ? 0 : currentOffset,
      });

      if (!bookmarkedPosts || bookmarkedPosts.length === 0) {
        if (reset) {
          setPosts([]);
          setSavedPosts(new Set());
        }
        setHasMore(false);
        setIsLoadingPosts(false);
        setIsLoadingMore(false);
        return;
      }

      setHasMore(bookmarkedPosts.length >= 10);

      const transformed = bookmarkedPosts.map(post => ({
        id: post.id,
        name: post.profiles?.full_name || 'User',
        username: post.profiles?.username || 'user',
        avatar: post.profiles?.avatar_url || '',
        rqs: post.profiles?.rqs_score || 0,
        verified:
          post.is_verified_purchase === true ||
          (post.is_verified_purchase === null && !!post.media_url) ||
          post.profiles?.is_verified,
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
      }));

      setPosts(prev => (reset ? transformed : [...prev, ...transformed]));
      setSavedPosts(prev => {
        const next = new Set(prev);
        transformed.forEach(p => next.add(String(p.id)));
        return next;
      });

      if (!reset) setOffset(currentOffset + 10);
      if (reset) setCached(CACHE_KEY, transformed);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoadingPosts(false);
      setIsLoadingMore(false);
    }
  }, [isLoadingMore]);

  const loadBookmarkedNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingNotifs(true);

      const notifs = await getBookmarkedNotificationsWithProfiles(user.id);
      const enriched = notifs.map(n => {
        const prof = n.profiles;
        if (prof) {
          if (!n.metadata) n.metadata = {};
          if (!n.metadata.actor_name) n.metadata.actor_name = prof.full_name || prof.username;
          if (!n.metadata.actor_avatar) n.metadata.actor_avatar = prof.avatar_url;
          if (!n.metadata.actor_id) n.metadata.actor_id = prof.id;
        }
        return n;
      });

      let msgBookmarks = [];
      try {
        msgBookmarks = await getBookmarkedMessages(user.id);
      } catch (msgErr) {
        console.error('Failed to load message bookmarks:', msgErr);
      }

      let profilesMap = {};
      const senderIds = [
        ...new Set((msgBookmarks || []).map(b => b.messages?.sender_id).filter(Boolean)),
      ];
      if (senderIds.length > 0) {
        const profilesData = await getProfilesByIds(senderIds);
        (profilesData || []).forEach(p => (profilesMap[p.id] = p));
      }

      const transformedMsgs = await Promise.all(
        (msgBookmarks || [])
          .filter(b => b.messages)
          .map(async b => {
            const msg = b.messages;
            const prof = profilesMap[msg.sender_id] || {};

            let displayContent = msg.content || 'Message';
            try {
              if (msg.content && msg.content_iv) {
                const conv = msg.conversations;
                const otherId =
                  conv?.participant_1_id === user.id
                    ? conv?.participant_2_id
                    : conv?.participant_1_id;
                if (otherId) {
                  const decrypted = await inboxCrypto.decryptFromUser(
                    msg.content,
                    msg.content_iv,
                    user.id,
                    otherId
                  );
                  if (decrypted) {
                    try {
                      const parsed = JSON.parse(decrypted);
                      displayContent = parsed.text || decrypted;
                    } catch {
                      displayContent = decrypted;
                    }
                  }
                }
              } else if (msg.content && !msg.content_iv) {
                try {
                  const parsed = JSON.parse(msg.content);
                  displayContent = parsed.text || msg.content;
                } catch {
                  displayContent = msg.content;
                }
              }
            } catch (e) {
              console.error('Decrypt error for bookmark', e);
              displayContent = '[Message encrypted — decryption failed]';
            }

            return {
              id: b.id,
              user_id: user.id,
              created_at: b.created_at,
              unread: false,
              related_user_id: prof.id,
              title: prof.full_name || prof.username || 'User',
              message: displayContent,
              tag: 'Message',
              metadata: {
                is_bookmarked: true,
                type: 'message_bookmark',
                message_id: msg.id,
                conversation_id: msg.conversation_id,
                actor_name: prof.full_name || prof.username,
                actor_avatar: prof.avatar_url,
                actor_id: prof.id,
              },
            };
          })
      );

      const combined = [...enriched, ...transformedMsgs].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setBookmarkedNotifs(combined);
    } catch (err) {
      console.error('Failed to load bookmarked notifications:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  }, [user]);

  const handlePullRefresh = useCallback(async () => {
    if (bookmarkTab === 'opinions') {
      await loadPosts(0, true);
    } else {
      await loadBookmarkedNotifications();
    }
  }, [bookmarkTab, loadPosts, loadBookmarkedNotifications]);

  const ptr = usePullToRefresh(scrollRef, handlePullRefresh);

  // ─────────────────────────────────────────────────────────────────────────
  //  INIT
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Seed saved-posts set from DB
    getUserBookmarkPostIds(user.id)
      .then(bms => {
        if (bms) setSavedPosts(new Set(bms.map(b => String(b.post_id))));
      })
      .catch(() => {});

    loadBookmarkedNotifications();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isStale(CACHE_KEY, 300_000) || posts.length === 0) {
      loadPosts(0, true);
    } else {
      setIsLoadingPosts(false);
      setLoading(false);
      setTimeout(() => loadPosts(0, true), 500);
    }
    // Restore scroll position
    const savedScroll = getScrollPosition(CACHE_KEY);
    if (savedScroll > 0) {
      setTimeout(() => {
        const el = document.querySelector('.bookmarks-scroll-container');
        if (el) el.scrollTop = savedScroll;
      }, 0);
    }
    setTimeout(() => setLoading(false), 2000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch on tab switch
  useEffect(() => {
    if (bookmarkTab === 'notifications') {
      loadBookmarkedNotifications();
    }
  }, [bookmarkTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  //  REAL-TIME SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !user) return;

    const postChannel = supabase
      .channel('bookmarks:posts')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, payload => {
        setPosts(prev => prev.filter(p => String(p.id) !== String(payload.old.id)));
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        payload => {
          setPosts(prev =>
            prev.map(p =>
              String(p.id) === String(payload.new.post_id) ? { ...p, agrees: p.agrees + 1 } : p
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        payload => {
          setPosts(prev =>
            prev.map(p =>
              String(p.id) === String(payload.old.post_id)
                ? { ...p, agrees: Math.max(0, p.agrees - 1) }
                : p
            )
          );
        }
      )
      .subscribe();

    const notifChannel = supabase
      .channel('bookmarks:notifs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        payload => {
          const relevant =
            (payload.new && payload.new.user_id === user.id) ||
            (payload.old && payload.old.user_id === user.id);
          if (relevant) loadBookmarkedNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for global report result so we can hide the reported post
  useEffect(() => {
    const handler = e => {
      const { postId, action } = e.detail || {};
      if (action === 'remove' && postId) {
        setRemovedPosts(prev => new Set(prev).add(postId));
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: 'Thanks! We will review this.', icon: 'Check', isSuccess: true },
          })
        );
      }
    };
    window.addEventListener('post:reported', handler);
    return () => window.removeEventListener('post:reported', handler);
  }, []);

  // Listen for new/updated posts from the opinion composer
  useEffect(() => {
    const handler = e => {
      if (!e.detail?.post) return;
      const { post: newPost, isUpdate } = e.detail;
      const uiPost = {
        id: newPost.id,
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
        setPosts(prev => prev.map(p => (p.id === uiPost.id ? { ...p, ...uiPost } : p)));
      } else {
        setPosts(prev => [uiPost, ...prev]);
      }
    };
    window.addEventListener('post:published', handler);
    return () => window.removeEventListener('post:published', handler);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const toggleSave = async (postId, shouldSave) => {
    const isSaving = shouldSave !== undefined ? shouldSave : !savedPosts.has(postId);
    const next = new Set(savedPosts);
    if (isSaving) {
      next.add(postId);
      try { await bookmarkPost(postId); } catch (e) { console.error(e); }
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Saved to Bookmarks', icon: 'BookmarkFilled', isSuccess: true } }));
    } else {
      next.delete(postId);
      try { await removeBookmark(postId); } catch (e) { console.error(e); }
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Removed from Bookmarks', icon: 'Bookmark', isSuccess: false } }));
      setPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
    }
    setSavedPosts(next);
  };

  const handleRemovePost = async (postId, reason = 'Removed', type = 'delete', target = null) => {
    if (type === 'REPORT_INTENT') {
      reportPost(postId); // global modal
      return;
    }
    if (type === 'SHARE_INTENT' && target) {
      sharePost(target); // global modal
      return;
    }

    setRemovedPosts(prev => new Set(prev).add(postId));
    if (reason) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: reason, icon: type === 'delete' ? 'Trash' : 'EyeOff', isSuccess: true },
      }));
    }

    try {
      if (type === 'hide_post' && window.hideItem) await window.hideItem('post', postId);
      else if (type === 'mute_brand' && window.hideItem) await window.hideItem('brand', target || 'Brand');
      else if (type === 'not_interested' && window.hideItem) await window.hideItem('category', target || 'General');
      else if (type === 'Deleted' && window.deletePost) await window.deletePost(postId);
    } catch (e) {
      console.error('Action persistence failed', e);
    }
  };

  const handleRemoveNotification = async notifId => {
    const targetItem = bookmarkedNotifs.find(n => n.id === notifId);
    setBookmarkedNotifs(prev => prev.filter(n => n.id !== notifId));
    try {
      if (targetItem?.metadata?.type === 'message_bookmark') {
        await deleteBookmarkById(notifId);
      } else {
        const { data: cur } = await supabase
          .from('notifications')
          .select('metadata')
          .eq('id', notifId)
          .single();
        const newMeta = { ...(cur?.metadata || {}), is_bookmarked: false };
        const { error } = await supabase
          .from('notifications')
          .update({ metadata: newMeta })
          .eq('id', notifId);
        if (error) throw error;
      }
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Removed from bookmarks', icon: 'Bookmark', isSuccess: false } }));
    } catch (err) {
      console.error('Failed to unbookmark notification:', err);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to remove', icon: 'AlertTriangle', isSuccess: false } }));
      loadBookmarkedNotifications();
    }
  };

  const handleAddComment = (postId) => {
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)));
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  SCROLL
  // ─────────────────────────────────────────────────────────────────────────
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
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

    if (scrollHeight - scrollTop - clientHeight < 300 && !isLoadingMore && hasMore) {
      loadPosts(offset, false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const visiblePosts = posts.filter(p => !removedPosts.has(p.id));

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#020205]">

      {/* TOP NAV */}
      <div
        className="header-glass sticky top-0 left-0 w-full z-40 bg-[#020205]/98 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="w-full h-14 flex items-center justify-between px-4 relative">
          <button
            className="p-2 -ml-1 text-white/80 hover:text-white transition-colors relative z-10 touch-scale rounded-full hover:bg-white/5 active:scale-90"
            onClick={() => (history.length > 1 ? history.back() : navigate('/feed'))}
            aria-label="Back"
          >
            <Icon icon="ChevronLeft" size={22} />
          </button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <span className="font-heading font-bold text-[16px] tracking-wide text-white">Bookmarks</span>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* MAIN SCROLL AREA */}
      <div className="relative flex-1 overflow-hidden">
        <PullToRefreshIndicator {...ptr.indicatorProps} />
        <div
          ref={scrollRef}
          className={`h-full overflow-y-auto pb-24 no-scrollbar smooth-scroll-container ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
          onScroll={handleScroll}
          style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
        >
        {loading ? (
          <div className="px-4 pt-4">
            <SkeletonPost delay="0ms" />
            <SkeletonPost delay="100ms" />
            <SkeletonPost delay="200ms" />
          </div>
        ) : (
          <div>
            {/* TABS */}
            <div className="sticky top-0 z-30 bg-[#020205] px-4 py-2 border-b border-white/[0.05]">
              <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <button
                  onClick={() => setBookmarkTab('opinions')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                    bookmarkTab === 'opinions'
                      ? 'bg-white text-black shadow-lg shadow-white/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Opinions ({posts.length})
                </button>
                <button
                  onClick={() => setBookmarkTab('notifications')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                    bookmarkTab === 'notifications'
                      ? 'bg-white text-black shadow-lg shadow-white/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Saved Alerts ({bookmarkedNotifs.length})
                </button>
              </div>
            </div>

            {/* OPINIONS TAB */}
            {bookmarkTab === 'opinions' ? (
              <div className="space-y-4 px-4 pb-32">
                {visiblePosts.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={idx}
                    onRemove={(reason, type, target) => handleRemovePost(post.id, reason, type, target)}
                    onSave={s => toggleSave(post.id, s)}
                    isSaved={true}
                    userProfile={userProfile}
                    onAddComment={handleAddComment}
                    onImageClick={(src, type, images, idx) => openImage(src, type, images, idx)}
                    onShare={post => sharePost(post)}
                    onReport={postId => reportPost(postId)}
                  />
                ))}

                {!isLoadingPosts && hasMore && (
                  <div className="flex justify-center py-8">
                    <button
                      onClick={() => loadPosts(offset, false)}
                      className="text-xs font-bold text-neon tracking-widest hover:opacity-80 transition-opacity"
                    >
                      LOAD MORE
                    </button>
                  </div>
                )}

                {isLoadingMore && (
                  <div className="flex justify-center py-6">
                    <OrbitLoader size={24} />
                  </div>
                )}

                {!isLoadingPosts && visiblePosts.length > 0 && !hasMore && (
                  <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent" />
                    <span className="text-[10px] tracking-[0.3em] font-heading text-neon">END OF FEED</span>
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent" />
                  </div>
                )}

                {!isLoadingPosts && visiblePosts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <Icon icon="Bookmark" size={48} className="text-muted mb-4 stroke-1" />
                    <p className="text-white font-heading font-bold text-lg">No Bookmarks Yet</p>
                    <p className="text-muted text-sm max-w-xs mt-2">Save opinions you want to read later.</p>
                    <button
                      onClick={() => navigate('/feed')}
                      className="mt-6 px-6 py-2 bg-white/10 rounded-full text-white text-xs font-bold border border-white/5 hover:bg-white/20 transition-colors"
                    >
                      Go to Feed
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* NOTIFICATIONS TAB */
              <div className="pb-32 min-h-[400px]">
                {isLoadingNotifs ? (
                  <div className="flex justify-center items-center py-20">
                    <OrbitLoader size={28} />
                  </div>
                ) : bookmarkedNotifs.length > 0 ? (
                  <div className="space-y-[1px]">
                    {bookmarkedNotifs.map(notif => (
                      <NotificationBookmarkItem
                        key={`notif-${notif.id}`}
                        data={notif}
                        onRemove={handleRemoveNotification}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center opacity-60 px-6">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Icon icon="Bell" size={32} className="text-muted stroke-1" />
                    </div>
                    <p className="text-white font-heading font-bold text-lg">No Saved Alerts</p>
                    <p className="text-muted text-sm max-w-[200px] mt-2 leading-relaxed font-light">
                      Swipe right on a notification to save it for later reference.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      {/* Global modals (ShareModal, ReportModal, LogoutModal, ImageViewer, AuthModal)
          are rendered once by ActionsContext — no local instances needed. */}
    </div>
  );
};

export default App;
