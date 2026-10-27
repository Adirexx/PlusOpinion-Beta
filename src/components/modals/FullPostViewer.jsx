/**
 * FullPostViewer.jsx — Full-screen post detail overlay
 *
 * Ported from HOMEPAGE_FINAL.compiled.js L1931-1970.
 * Displays a single post in a full-screen overlay (used for deep-linked/shared posts).
 *
 * Changes from old source:
 *   - React.createElement → JSX
 *   - window.vibrate → vibrate import
 */

import Icon from '../ui/Icon';
import PostCard from '../feed/PostCard';

const vibrate = (ms) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

const FullPostViewer = ({
  post,
  onClose,
  userProfile,
  savedPosts,
  toggleSave,
  handleRemovePost,
  handleEditPost,
  handleAddComment,
  handleShare,
  postComments,
  setViewingImage,
  setShowOnboardingModal,
  isGuest,
}) => {
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-[#070A12] animate-fade-in flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-[60px] border-b border-white/5 bg-[#070A12]/80 backdrop-blur-xl shrink-0">
        <button
          onClick={() => { vibrate(5); onClose(); }}
          className="text-white/60 hover:text-white transition-colors p-2 -ml-2 active:scale-90"
        >
          <Icon icon="ArrowLeft" size={24} className="stroke-[2.5px]" />
        </button>
        <span className="font-heading font-bold text-lg tracking-wide text-white">
          Opinions
        </span>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar pb-20">
        <div className="max-w-2xl mx-auto">
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
            onAuthRequired={() => setShowOnboardingModal(true)}
            onImageClick={(src, type, images, idx) =>
              setViewingImage({ src, type, images, initialIndex: idx || 0 })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default FullPostViewer;
