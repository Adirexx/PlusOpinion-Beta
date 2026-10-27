/**
 * ActionsContext.jsx — Global action dispatchers
 *
 * Replaces window.PlusOpinionActions from old HOMEPAGE_FINAL.HTML.
 *
 * Phase 4.2: All functions are now REAL wired dispatchers. Modals are mounted
 * ONCE in the provider, so every page can trigger them without local state.
 *
 * Architecture:
 *   - ActionsProvider wraps the app inside AuthProvider
 *   - It pulls user/profile/isGuest from useAuth()
 *   - Pages call useActions().openOpinion(), sharePost(), etc.
 *   - Modals react to state changes and render here, not in pages
 *
 * Cross-page communication:
 *   - post:published event — fired when OpinionModal creates/updates a post
 *   - post:edited event — fired when EditModal saves an edit
 *   Pages listen to these events to update their local post arrays.
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useInbox } from './InboxContext'
import { useModalHistory } from '../hooks/useModalHistory'
import AuthModal from '../components/modals/AuthModal'
import ShareModal from '../components/modals/ShareModal'
import ReportModal from '../components/modals/ReportModal'
import OpinionModal from '../components/modals/OpinionModal'
import LogoutModal from '../components/modals/LogoutModal'
import ImageViewer from '../components/modals/ImageViewer'
import EditModal from '../components/modals/EditModal'
import MenuDrawer from '../components/overlays/MenuDrawer'

const ActionsContext = createContext(null)

export function ActionsProvider({ children }) {
  const { user, profile, isGuest, logout } = useAuth()

  // Build userProfile shape matching old code expectations
  const userProfile = user && profile ? {
    id: profile.id || user.id,
    full_name: profile.full_name || 'User',
    username: profile.username || '',
    avatar_url: profile.avatar_url || '',
    banner_url: profile.banner_url || '',
    rqs_score: profile.rqs_score || 0,
  } : {
    id: null,
    full_name: 'Guest User',
    username: 'guest',
    avatar_url: '',
    banner_url: '',
    rqs: 0,
  }

  // ── Inbox status ────────────────────────────────────────────────
  const { isOpen: isInboxOpen } = useInbox()

  // ── Opinion modal (composer) ────────────────────────────────────
  const [isOpinionOpen, setOpinionOpen] = useState(false)
  const [opinionInitialPost, setOpinionInitialPost] = useState(null)
  const openOpinion = useCallback((initialPost = null) => {
    setOpinionInitialPost(initialPost)
    setOpinionOpen(true)
  }, [])
  const closeOpinion = useCallback(() => {
    setOpinionOpen(false)
    setOpinionInitialPost(null)
  }, [])

  // ── Auth modal ──────────────────────────────────────────────────
  const [isAuthModalOpen, setAuthModalOpen] = useState(false)
  const openAuth = useCallback(() => {
    closeOpinion()
    setAuthModalOpen(true)
  }, [closeOpinion])
  const closeAuth = useCallback(() => setAuthModalOpen(false), [])

  // ── Menu drawer ─────────────────────────────────────────────────
  const [isMenuOpen, setMenuOpen] = useState(false)
  const openMenu = useCallback(() => {
    closeOpinion()
    setMenuOpen(true)
  }, [closeOpinion])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // ── Lens overlay (search) ───────────────────────────────────────
  const isLensOpen = false;
  const openLens = useCallback(() => {
    closeOpinion()
    if (window.navigateTo) window.navigateTo('/lens')
    else window.location.href = '/lens'
  }, [closeOpinion])
  const closeLens = useCallback(() => {}, [])

  // ── Share modal ─────────────────────────────────────────────────
  const [isShareOpen, setShareOpen] = useState(false)
  const [shareData, setShareData] = useState(null)
  const sharePost = useCallback((post) => {
    closeOpinion()
    setShareData({ type: 'post', data: post })
    setShareOpen(true)
  }, [closeOpinion])
  const shareProfile = useCallback((profile) => {
    closeOpinion()
    setShareData({ type: 'profile', data: profile })
    setShareOpen(true)
  }, [closeOpinion])
  const closeShare = useCallback(() => {
    setShareOpen(false)
    setTimeout(() => setShareData(null), 300)
  }, [])

  // ── Report modal ────────────────────────────────────────────────
  const [isReportOpen, setReportOpen] = useState(false)
  const [reportPostId, setReportPostId] = useState(null)
  const reportPost = useCallback((postId) => {
    closeOpinion()
    setReportPostId(postId)
    setReportOpen(true)
  }, [closeOpinion])
  const closeReport = useCallback(() => {
    setReportOpen(false)
    setReportPostId(null)
  }, [])

  // ── Logout modal ────────────────────────────────────────────────
  const [isLogoutOpen, setLogoutOpen] = useState(false)
  const openLogout = useCallback(() => {
    closeOpinion()
    setLogoutOpen(true)
  }, [closeOpinion])
  const closeLogout = useCallback(() => setLogoutOpen(false), [])

  // ── Image viewer ────────────────────────────────────────────────
  const [viewingImage, setViewingImage] = useState(null)
  const openImage = useCallback((src, type, images, idx) => {
    closeOpinion()
    setViewingImage({ src, type, images, initialIndex: idx || 0 })
  }, [closeOpinion])
  const closeImage = useCallback(() => setViewingImage(null), [])

  // ── Edit modal (routes to Opinion Composer) ───────────────────
  const [isEditOpen, setEditOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const openEdit = useCallback((post) => {
    if (post && !post.is_draft && post.is_edited) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'You can only edit a post once.', icon: 'Lock', isSuccess: false }
      }))
      return
    }
    setEditingPost(post)
    openOpinion(post)
  }, [openOpinion])
  const closeEdit = useCallback(() => {
    setEditOpen(false)
    setEditingPost(null)
    closeOpinion()
  }, [closeOpinion])

  // ── Overall overlay tracking ────────────────────────────────────
  const isOtherOverlayOpen = Boolean(
    isAuthModalOpen ||
    isMenuOpen ||
    isInboxOpen ||
    isShareOpen ||
    isReportOpen ||
    isLogoutOpen ||
    isEditOpen ||
    Boolean(viewingImage)
  )

  // Auto-close opinion if any other overlay or modal opens
  useEffect(() => {
    if (isOtherOverlayOpen && isOpinionOpen) {
      closeOpinion()
    }
  }, [isOtherOverlayOpen, isOpinionOpen, closeOpinion])

  // ── Explore profiles ───────────────────────────────────────────
  const isExploreOpen = false;
  const setExploreProfiles = useCallback(() => {}, []);
  const openExplore = useCallback((profiles = []) => {
    if (window.navigateTo) window.navigateTo('/lens/explore', { state: { profiles } })
    else window.location.href = '/lens/explore'
  }, [])
  const closeExplore = useCallback(() => {}, [])

  // ── Saved posts (shared state for bookmark operations) ──────────
  const [savedPosts, setSavedPosts] = useState(new Set())

  useModalHistory(isAuthModalOpen, closeAuth)
  useModalHistory(isOpinionOpen, closeOpinion)
  useModalHistory(isMenuOpen, closeMenu)
  useModalHistory(isShareOpen, closeShare)
  useModalHistory(isReportOpen, closeReport)
  useModalHistory(isLogoutOpen, closeLogout)
  useModalHistory(!!viewingImage, closeImage)
  useModalHistory(isEditOpen, closeEdit)

  // ── Context value ──────────────────────────────────────────────
  const value = {
    // Auth
    openAuth, closeAuth, isAuthModalOpen,
    // Opinion/Composer
    openOpinion, closeOpinion, isOpinionOpen,
    // Menu
    openMenu, closeMenu, isMenuOpen,
    // Lens/Search
    openLens, closeLens, isLensOpen,
    // Share
    sharePost, shareProfile, closeShare, isShareOpen,
    // Report
    reportPost, closeReport, isReportOpen,
    // Logout
    openLogout, closeLogout, isLogoutOpen,
    // Image viewer
    openImage, closeImage, viewingImage, setViewingImage,
    // Edit
    openEdit, closeEdit, isEditOpen,
    // Explore profiles
    openExplore, closeExplore, isExploreOpen,
    setExploreProfiles,
    // Saved posts
    savedPosts, setSavedPosts,
    // Overlay tracking
    isOtherOverlayOpen,
    // Profile info
    userProfile,
  }

  return (
    <ActionsContext.Provider value={value}>
      {children}

      {/* ── Global modals — mounted ONCE, controlled via context ── */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuth} />

      <OpinionModal
        isOpen={isOpinionOpen && !isOtherOverlayOpen}
        onClose={closeOpinion}
        userProfile={userProfile}
        initialPost={opinionInitialPost}
        onPublished={(newPost, isUpdate) => {
          // Dispatch event so Feed (or any page) can add/update the post locally
          window.dispatchEvent(new CustomEvent('post:published', {
            detail: { post: newPost, isUpdate }
          }))
          closeOpinion()
        }}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={closeShare}
        shareData={shareData}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={closeReport}
        onSubmit={(reason, action) => {
          // Dispatch event so page can react (e.g. hide the reported post)
          window.dispatchEvent(new CustomEvent('post:reported', {
            detail: { postId: reportPostId, reason, action }
          }))
          closeReport()
        }}
      />

      <LogoutModal
        isOpen={isLogoutOpen}
        onCancel={closeLogout}
        onConfirm={async () => {
          try {
            closeLogout()
            closeMenu()
            await logout()
            if (window.navigateTo) window.navigateTo('/login?mode=login', { replace: true })
            else window.location.href = '/login?mode=login'
          } catch (error) {
            console.error('Logout error:', error)
            closeLogout()
            closeMenu()
          }
        }}
      />

      <ImageViewer
        src={viewingImage?.src}
        type={viewingImage?.type}
        images={viewingImage?.images}
        initialIndex={viewingImage?.initialIndex || 0}
        onClose={closeImage}
      />

      {isEditOpen && (
        <EditModal
          isOpen={isEditOpen}
          onClose={closeEdit}
          post={editingPost}
          onSave={(postId, text) => {
            window.dispatchEvent(new CustomEvent('post:edited', {
              detail: { postId, text }
            }))
            closeEdit()
          }}
        />
      )}

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onLogout={openLogout}
        userProfile={userProfile}
        isGuest={isGuest}
        onAuthRequired={() => { closeMenu(); openAuth(); }}
      />
    </ActionsContext.Provider>
  )
}

export function useActions() {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useActions must be used inside ActionsProvider')
  return ctx
}
