/**
 * src/lib/api/index.js — Central re-export barrel
 *
 * Re-exports every function so `import { getFeed } from '@/lib/api'` works.
 * Also re-exports auth functions from src/lib/auth.js so callers have one import point.
 *
 * DUPLICATE RESOLUTION (§3.1):
 *   getCategories: FIRST copy (line 838) was: .order('title') + fallback list A
 *                  SECOND copy (line 2948) is: .order('order_rank') + fallback list B
 *                  SECOND (later) copy is effective and ported. First copy dropped.
 *
 *   getHiddenItems: FIRST copy (line 1519): has _hiddenItemsCache, returns { posts, brands, categories }
 *                   SECOND copy (line 2823): NO cache, returns { posts, brands, categories }
 *                   SECOND (later) copy is effective. First copy dropped.
 *                   ⚠ BEHAVIORAL DIFFERENCE: The first copy had an in-memory cache (_hiddenItemsCache)
 *                   that the hideItem function invalidated. The second copy has NO cache.
 *                   We port the second (winning) copy. The cache variable (_hiddenItemsCache) 
 *                   is declared in posts.js but only used by the FIRST copy's logic.
 *                   Phase 5 decision: if hide/show performance is a problem, re-add cache.
 *
 * CROSS-FILE DUPLICATES (§3.2):
 *   getUserProfile, getUserProfileByUsername, checkUsernameAvailable appeared in
 *   BOTH auth.js and api.js. api.js version wins (last load order in old HTML).
 *   Old auth.js versions live in src/lib/auth.js; api.js versions in api/profiles.js
 *   and api/auth.js. The api/profiles.js and api/auth.js versions are the effective ones.
 *
 * submitReport: Was `window.submitReport = window.reportPost` (alias). 
 *   Re-exported below as { submitReport: reportPost }.
 */

// Media utilities
export { rewriteMediaUrl, rewritePostUrls, uploadMedia, uploadVerificationProof } from './media.js'

// Feed functions
export {
  getFeed, getSmartFeed, getTrendingFeed, getVerifiedFeed,
  getHighRQSFeed, getForYouFeed, getTrendingPosts, getHighRQSContent,
  getVerifiedPosts, getUserFingerprint
} from './feed.js'

// Post functions
export {
  createPost, getPost, updatePost, editPost, deletePost,
  getMyDrafts, getMyCommentedPosts, likePost, unlikePost, hasLikedPost,
  hideItem, getHiddenItems, unhideItem, trackShare, getUserBadgeNumber
} from './posts.js'

// Comment functions
export {
  getComments, createComment, createReply, deleteComment, restoreComment,
  likeComment, unlikeComment, hasLikedComment, searchUsersForMention,
  notifyCommentReplied, notifyMentioned
} from './comments.js'

// Notification functions (from api.js + comprehensive notificationsService)
export {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, toggleNotificationBookmark, getBookmarkedNotifications,
  getUnreadCount, createNotification
} from './notifications.js'

export {
  sendWelcomeNotification,
  sendWelcomeBackNotification,
  sendFirstPostEncouragement,
  checkProfileCompletion,
  checkRQSScoreSuggestions,
  sendProfileVerifiedNotification,
  checkRQSMilestones,
  sendRQSUpdateNotification,
  getPartnerSignal,
  sendPartnerEligibilityNotification,
  sendPartnerProgressNotification,
  sendPartnerTierUpgradeNotification,
  sendBrandViewNotification,
  sendBrandInsightNotification,
  sendPostCreatedNotification,
  sendPostDeletedNotification,
  sendPostRemovedByAdminNotification,
  sendPasswordChangedNotification,
  sendPinChangedNotification,
  sendNewDeviceLoginNotification,
  sendReportSubmittedNotification,
  sendAdminAnnouncementNotification,
  runLoginNotificationChecks,
  // Legacy aliases
  sendPostDeletedNotification as notifyPostDeleted,
  sendWelcomeNotification as notifyWelcome,
  sendWelcomeBackNotification as notifyWelcomeBack,
  sendBrandViewNotification as notifyBrandView,
  sendBrandInsightNotification as notifyBrandInsight,
  checkRQSMilestones as checkRQSMilestone
} from './notificationsService.js'

// Profile functions
export {
  getMyProfile, getUserProfile, getUserProfileByUsername,
  getUserPosts, getUserCommentedPosts, getMyPosts, getMyStats,
  getAllProfiles, getTopReviewers
} from './profiles.js'

// Auth/profile helpers (from api.js)
export { acceptTerms, hasAcceptedTerms, checkUsernameAvailable, completeProfile } from './auth.js'

export {
  getMyEarnings, getMyBrandInteractions, getPartnerStats,
  getPartnerStatus, getPartnerApplication, applyForPartner, requestWithdrawal,
  submitPartnerApplication, uploadPartnerDocument, fetchLegalName
} from './earnings.js'

// Moderation functions
export {
  reportPost, reportUser, blockUser, unblockUser,
  isUserBlocked, getBlockedUsers, reportContent
} from './moderation.js'

// submitReport alias (was window.submitReport = window.reportPost in old code)
export { reportPost as submitReport } from './moderation.js'

// Bookmark functions
export { bookmarkPost, removeBookmark, isBookmarked, getBookmarks } from './bookmarks.js'

// Category functions
export {
  getCategories, getSubCategories, getPopularCategories,
  getRecommendedCategories, getBrandsByCategory
} from './categories.js'

// Search functions
export {
  searchProfiles, getPopularProducts, getTrendingKeywords,
  saveSearchQuery, getRecentSearches, deleteSearchQuery, clearSearchHistory
} from './search.js'
