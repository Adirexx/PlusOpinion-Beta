import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPost, deletePost } from '../lib/api/posts';
import { bookmarkPost, removeBookmark } from '../lib/api/bookmarks';
import { formatTimeAgo } from '../lib/utils';
import { useActions } from '../context/ActionsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PostCard from '../components/feed/PostCard';
import Icon from '../components/ui/Icon';
import SkeletonPost from '../components/feed/SkeletonPost';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/common/PullToRefreshIndicator';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuest } = useAuth();
  const { savedPosts, setSavedPosts, openAuth, openImage, reportPost, sharePost, openEdit, userProfile } = useActions();
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = React.useRef(null);

  const fetchPost = React.useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const raw = await getPost(id);
      if (!raw) {
        setError('Opinion not found');
        return;
      }

      const mappedPost = {
        id: raw.id,
        user_id: raw.user_id,
        name: raw.profiles?.full_name || 'User',
        username: raw.profiles?.username || 'user',
        avatar: raw.profiles?.avatar_url || '',
        rqs: raw.profiles?.rqs_score || 0,
        verified: raw.is_verified_purchase === true || (raw.is_verified_purchase === null && !!raw.media_url) || raw.profiles?.is_verified,
        category: raw.category,
        product: raw.product_name,
        text: raw.text_content,
        media: raw.media_url,
        media_type: raw.media_type || 'image',
        images: raw.images || null,
        time: formatTimeAgo(raw.created_at),
        agrees: raw.agrees_count || 0,
        comments: raw.comments_count || 0,
        seenBy: raw.seen_by_brand || null,
        is_edited: raw.is_edited
      };
      setPost(mappedPost);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch post details:', err);
      setError('Opinion not found or unavailable');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handlePullRefresh = React.useCallback(async () => {
    await fetchPost(false);
  }, [fetchPost]);

  const ptr = usePullToRefresh(scrollRef, handlePullRefresh);

  useEffect(() => {
    fetchPost(true);
  }, [fetchPost]);

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
    
    // For delete or hide
    if (reason) showToast(reason, type === 'delete' ? 'Trash' : 'EyeOff', true);
    if (type === 'delete') {
      try { await deletePost(postId); } catch (e) { console.error(e); }
    }
    // Auto navigate back on delete or hide
    handleBack();
  };

  const handleShare = (postToShare) => {
    sharePost(postToShare);
  };

  const handleBack = () => {
    if (location.key !== 'default' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/feed', { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Top Bar - Clean, Minimal Header */}
      <div className="header-glass sticky top-0 z-40 transition-transform duration-400 ease-out">
        <div className="w-full h-14 flex items-center justify-center px-4 relative">
          <button 
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors touch-scale absolute left-4 z-10"
            aria-label="Back"
          >
            <Icon icon="ArrowLeft" size={18} className="text-white" />
          </button>
          <h1 className="text-[17px] font-bold text-white tracking-wide">Opinion</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden">
        <PullToRefreshIndicator {...ptr.indicatorProps} />
        <div
          ref={scrollRef}
          className={`h-full overflow-y-auto p-4 pb-12 max-w-lg mx-auto w-full no-scrollbar ${ptr.pullOffset > 0 ? 'ptr-content-pulling' : ''} ${ptr.isRefreshing ? '' : ptr.pullOffset === 0 ? 'ptr-content-snapping' : ''}`}
          style={ptr.pullOffset > 0 || ptr.isRefreshing ? { transform: `translateY(${ptr.pullOffset}px)` } : undefined}
        >
          {loading ? (
            <SkeletonPost />
          ) : error ? (
            <div className="flex flex-col items-center justify-center mt-20 text-muted gap-4">
              <Icon icon="AlertCircle" size={48} className="text-white/20" />
              <p className="text-sm">{error}</p>
              <button 
                onClick={handleBack} 
                className="mt-2 px-6 py-2 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Go Back
              </button>
            </div>
          ) : post ? (
            <PostCard
              post={post}
              userProfile={userProfile}
              savedPosts={savedPosts}
              isGuest={isGuest}
              onAuthRequired={openAuth}
              isDetailView={true}
              hideActions={false}
              onImageClick={(src, type, images, idx) => openImage(src, type, images, idx)}
              onBookmark={toggleSave}
              onRemove={handleRemovePost}
              onShare={handleShare}
              onEdit={openEdit}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
