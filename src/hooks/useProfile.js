import { useState, useEffect, useCallback } from 'react';
import { getMyProfile, getUserProfile, getMyPosts, getUserPosts, getUserCommentedPosts } from '../lib/api/profiles';
import { getCached, setCached } from '../lib/dataCache';
import { getPost } from '../lib/api/posts'; // Needed if we want to fetch specific posts
import { supabase } from '../lib/supabaseClient';
import { formatTimeAgo } from '../lib/utils';

/**
 * Unified hook for both My Profile and Public Profile.
 * Handles fetching profile info, posts, drafts (if self), and comments.
 * 
 * @param {string} userId - ID of the user. If null/undefined, fetches the authenticated user's own profile.
 */
export function useProfile(userId = null) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);

  const isSelf = !userId; // If no userId provided, it's MyProfile

  const fetchProfileData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingProfile(true);
    setError(null);
    try {
      const cacheKey = isSelf ? 'my_profile_data' : `profile_${userId}`;
      if (!isBackground) {
        const cached = getCached(cacheKey);
        if (cached) {
          setProfile(cached);
          setLoadingProfile(false);
        }
      }

      const data = isSelf ? await getMyProfile() : await getUserProfile(userId);
      if (data) {
        const profileObj = {
          id: data.id,
          full_name: data.full_name || "User",
          username: data.username || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          banner_url: data.banner_url || "",
          rqs: data.rqs_score || 0,
          verified_count: data.verified_count || 0,
          location: data.location || "",
          website: data.website || "",
          is_verified: data.is_verified || false
        };
        setProfile(profileObj);
        setCached(cacheKey, profileObj);
      } else {
        setError("Profile not found.");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [userId, isSelf]);

  const fetchContentData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingContent(true);
    try {
      let targetUserId = userId;
      if (isSelf) {
        const { getCurrentUser } = await import('../lib/auth');
        const user = await getCurrentUser();
        targetUserId = user?.id;
      }

      const postsCacheKey = isSelf ? 'my_profile_posts' : `profile_posts_${userId}`;
      const commentsCacheKey = isSelf ? 'my_profile_comments' : `profile_comments_${userId}`;
      const draftsCacheKey = 'my_profile_drafts';

      if (!isBackground) {
        const cachedPosts = getCached(postsCacheKey);
        if (cachedPosts) setPosts(cachedPosts);
        
        const cachedComments = getCached(commentsCacheKey);
        if (cachedComments) setCommentedPosts(cachedComments);

        if (isSelf) {
          const cachedDrafts = getCached(draftsCacheKey);
          if (cachedDrafts) setDrafts(cachedDrafts);
        }
      }

      // 1. Fetch Posts
      const fetchedPosts = isSelf ? await getMyPosts() : await getUserPosts(userId);
      if (fetchedPosts) {
        const mappedPosts = fetchedPosts.map(p => ({
            ...p,
            text: p.text_content,
            time: p.created_at ? formatTimeAgo(p.created_at) : 'Just now',
            category: p.category,
            product: p.product_name,
            media: p.media_url,
            media_type: p.media_type || 'image',
            images: p.images || null,
            verified: p.is_verified_purchase || p.profiles?.is_verified,
            agrees: p.agrees_count || 0,
            comments: p.comments_count || 0,
            name: p.profiles?.full_name || 'User',
            username: p.profiles?.username || 'user',
            avatar: p.profiles?.avatar_url || '',
            rqs: p.profiles?.rqs_score || 0
        }));
        setPosts(mappedPosts);
        setCached(postsCacheKey, mappedPosts);
      }

      // 2. Fetch Commented Posts (for the Comments tab)
      if (targetUserId) {
        const fetchedCommented = await getUserCommentedPosts(targetUserId);
        if (fetchedCommented) {
          const mappedComments = fetchedCommented.map(p => ({
              ...p,
              text: p.text_content,
              time: p.created_at ? formatTimeAgo(p.created_at) : 'Just now',
              category: p.category,
              product: p.product_name,
              media: p.media_url,
              media_type: p.media_type || 'image',
              images: p.images || null,
              verified: p.is_verified_purchase || p.profiles?.is_verified,
              agrees: p.agrees_count || 0,
              comments: p.comments_count || 0,
              name: p.profiles?.full_name || 'User',
              username: p.profiles?.username || 'user',
              avatar: p.profiles?.avatar_url || '',
              rqs: p.profiles?.rqs_score || 0
          }));
          setCommentedPosts(mappedComments);
          setCached(commentsCacheKey, mappedComments);
        }
      }

      // 3. Fetch Drafts (Only for Self)
      if (isSelf && targetUserId) {
        const { data: myDrafts } = await supabase
          .from('posts')
          .select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`)
          .eq('is_deleted', false)
          .eq('is_draft', true)
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (myDrafts) {
          const mappedDrafts = myDrafts.map(p => ({
            ...p,
            text: p.text_content,
            time: p.created_at ? formatTimeAgo(p.created_at) : 'Just now',
            category: p.category,
            product: p.product_name,
            media: p.media_url,
            media_type: p.media_type || 'image',
            images: p.images || null,
            verified: p.is_verified_purchase || p.profiles?.is_verified,
            agrees: p.agrees_count || 0,
            comments: p.comments_count || 0,
            name: p.profiles?.full_name || 'User',
            username: p.profiles?.username || 'user',
            avatar: p.profiles?.avatar_url || '',
            rqs: p.profiles?.rqs_score || 0
          }));
          setDrafts(mappedDrafts);
          setCached(draftsCacheKey, mappedDrafts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch content:", err);
    } finally {
      setLoadingContent(false);
    }
  }, [userId, isSelf]);

  useEffect(() => {
    fetchProfileData();
    fetchContentData();
  }, [fetchProfileData, fetchContentData]);

  return {
    profile,
    posts,
    drafts,
    commentedPosts,
    loadingProfile,
    loadingContent,
    error,
    refreshContent: () => fetchContentData(true),
    refreshProfile: () => fetchProfileData(true),
    setPosts,
    setDrafts,
    setCommentedPosts
  };
}
