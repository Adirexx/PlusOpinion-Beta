/**
 * search.js — Search API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { rewriteMediaUrl } from './media.js'
import { getBlockedUserIds } from './moderation.js'

export async function searchProfiles(query, limit = 20) {
    if (!query || !query.trim()) return [];

    const searchTerm = query.trim().toLowerCase();

    try {
        // Fetch all potential matches
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, rqs_score, is_verified, banner_url')
            .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
            .limit(50); // Get more than needed for ranking

        if (error) throw error;
        if (!data || data.length === 0) return [];

        const blockedIds = new Set(await getBlockedUserIds().catch(() => []));
        const filteredData = blockedIds.size > 0
            ? data.filter(p => !blockedIds.has(String(p.id)))
            : data;

        if (filteredData.length === 0) return [];

        // Rank results by match quality
        const ranked = filteredData.map(profile => {
            const usernameLower = (profile.username || '').toLowerCase();
            const fullNameLower = (profile.full_name || '').toLowerCase();

            let rank = 4; // Default: partial match

            // Exact username match (highest priority)
            if (usernameLower === searchTerm) rank = 1;
            // Exact full name match
            else if (fullNameLower === searchTerm) rank = 2;
            // Username starts with query
            else if (usernameLower.startsWith(searchTerm)) rank = 3;
            // Full name starts with query
            else if (fullNameLower.startsWith(searchTerm)) rank = 3.5;

            return { ...profile, _rank: rank };
        });

        // Sort by rank, then by RQS score
        ranked.sort((a, b) => {
            if (a._rank !== b._rank) return a._rank - b._rank;
            return (b.rqs_score || 0) - (a.rqs_score || 0);
        });

        // Remove rank field and return top results
        return ranked.slice(0, limit).map(({ _rank, ...profile }) => profile);

    } catch (error) {
        console.error('Profile search failed:', error);
        return [];
    }
};

/**
 * Get personalized "For You" feed based on user's interaction history
 * Analyzes liked posts to find similar content
 */



export async function getPopularProducts(limit = 10) {
    try {
        // IMPORTANT: Only show products from posts that have images
        // Sort by positive interactions (agrees_count) only

        const { data: posts, error } = await supabase
            .from('posts')
            .select('id, product_name, brand_name, media_url, media_type, agrees_count')
            .eq('is_deleted', false)
            .eq('is_draft', false)
            .not('product_name', 'is', null)
            .not('media_url', 'is', null) // MUST have image
            .order('agrees_count', { ascending: false })
            .limit(100); // Get more for grouping

        if (error) throw error;

        // Return empty if no posts with images
        if (!posts || posts.length === 0) return [];

        // Group by product_name and track the highest-engagement post for each
        const productMap = new Map();

        posts.forEach(post => {
            const productKey = post.product_name.toLowerCase();

            if (!productMap.has(productKey)) {
                // First post for this product - use its data
                productMap.set(productKey, {
                    name: post.product_name,
                    brand: post.brand_name || 'General',
                    image: post.media_url,
                    media_type: post.media_type,
                    agrees: post.agrees_count || 0,
                    postId: post.id
                });
            } else {
                // Product already exists - update if this post has more agrees
                const existing = productMap.get(productKey);
                if ((post.agrees_count || 0) > existing.agrees) {
                    existing.image = post.media_url;
                    existing.media_type = post.media_type;
                    existing.agrees = post.agrees_count || 0;
                    existing.postId = post.id;
                }
            }
        });

        // Convert to array and sort by agrees (positive interactions)
        const products = Array.from(productMap.values());
        products.sort((a, b) => b.agrees - a.agrees);

        return products.slice(0, limit);

    } catch (error) {
        console.error('Popular products failed:', error);
        return [];
    }
};

/**
 * Get top reviewers based on RQS, activity, and engagement
 */



export async function getTrendingKeywords(limit = 6) {
    try {
        // Get posts from last 30 days (beta-friendly window)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: posts, error } = await supabase
            .from('posts')
            .select('product_name, category, text_content')
            .eq('is_deleted', false)
            .eq('is_draft', false)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .limit(200);

        if (error) throw error;

        // Fallback to default categories if no data
        if (!posts || posts.length === 0) {
            return ['Electronics', 'Fashion', 'Lifestyle', 'Beauty', 'Tech', 'Home'];
        }

        // Common words to exclude
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
            'its', 'our', 'their', 'me', 'him', 'us', 'them', 'general', 'category',
            'product', 'opinion', 'review'
        ]);

        // Extract and count keywords
        const keywordCounts = new Map();

        posts.forEach(post => {
            // Extract from product_name (highest weight)
            if (post.product_name && post.product_name !== 'General') {
                const product = post.product_name.toLowerCase().trim();
                if (product.length > 2) {
                    keywordCounts.set(product, (keywordCounts.get(product) || 0) + 3);
                }
            }

            // Extract from category (medium weight)
            if (post.category && post.category !== 'Category') {
                const category = post.category.toLowerCase().trim();
                if (category.length > 2 && !stopWords.has(category)) {
                    keywordCounts.set(category, (keywordCounts.get(category) || 0) + 2);
                }
            }

            // Extract from text_content (low weight, only significant words)
            if (post.text_content) {
                const words = post.text_content.toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(w => w.length > 4 && !stopWords.has(w));

                words.forEach(word => {
                    keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
                });
            }
        });

        // Convert to array and sort by frequency
        const keywords = Array.from(keywordCounts.entries())
            .map(([keyword, count]) => ({ keyword, count }))
            .sort((a, b) => b.count - a.count);

        // Return top keywords
        return keywords.slice(0, limit).map(k => k.keyword);

    } catch (error) {
        console.error('Trending keywords failed:', error);
        return [];
    }
};

/**
 * ============================================
 * SEARCH HISTORY FUNCTIONS
 * ============================================
 */

/**
 * Save a search query to user's search history
 * @param {string} userId - User ID
 * @param {string} query - Search query text
 */



export async function saveSearchQuery(userId, query) {
    if (!userId || !query || query.trim().length === 0) return;

    try {
        // Trim and normalize the query
        const normalizedQuery = query.trim().toLowerCase();

        // Check if this exact query already exists recently (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { data: existing } = await supabase
            .from('search_history')
            .select('id')
            .eq('user_id', userId)
            .eq('search_query', normalizedQuery)
            .gte('created_at', oneDayAgo.toISOString())
            .limit(1);

        // If query already exists recently, don't duplicate
        if (existing && existing.length > 0) return;

        // Insert new search query
        const { error } = await supabase
            .from('search_history')
            .insert({
                user_id: userId,
                search_query: normalizedQuery
            });

        if (error) throw error;

        // Search query saved

    } catch (error) {
        console.error('Failed to save search query:', error);
    }
};

/**
 * Get user's recent search queries
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of searches to return
 * @returns {Array} Array of recent search queries
 */



export async function getRecentSearches(userId, limit = 10) {
    if (!userId) return [];

    try {
        const { data, error } = await supabase
            .from('search_history')
            .select('search_query, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Return unique queries (in case of duplicates from different times)
        const uniqueQueries = [...new Set(data?.map(item => item.search_query) || [])];

        return uniqueQueries.slice(0, limit);

    } catch (error) {
        console.error('Failed to get recent searches:', error);
        return [];
    }
};

/**
 * Delete a specific search query from user's history
 * @param {string} userId - User ID
 * @param {string} query - Search query to delete
 */



export async function deleteSearchQuery(userId, query) {
    if (!userId || !query) return;

    try {
        const { error } = await supabase
            .from('search_history')
            .delete()
            .eq('user_id', userId)
            .eq('search_query', query.toLowerCase().trim());

        if (error) throw error;

        // Search query deleted

    } catch (error) {
        console.error('Failed to delete search query:', error);
    }
};

/**
 * Clear user's search history
 * @param {string} userId - User ID
 */



export async function clearSearchHistory(userId) {
    if (!userId) return;

    try {
        const { error } = await supabase
            .from('search_history')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;

        // Search history cleared

    } catch (error) {
        console.error('Failed to clear search history:', error);
    }
};

// PlusOpinion API functions loaded



