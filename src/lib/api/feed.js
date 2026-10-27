/**
 * feed.js — Feed API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { rewritePostUrls } from './media.js'
import { getHiddenItems } from './posts.js'

// Module-level feed cache (same pattern as old window._feedCacheStore)
let _feedCacheStore = {}

export function clearFeedCache() {
    _feedCacheStore = {}
}

if (typeof window !== 'undefined') {
    window.addEventListener('user_blocks_changed', () => {
        clearFeedCache()
    })
}

// Module-level fingerprint cache (ported from api.js lines 388-431)
let _fingerprintCache = null
let _fingerprintCacheTime = 0
const _FINGERPRINT_TTL = 10 * 60 * 1000 // 10 minutes

export async function getFeed(options = {}) {
    const {
        limit = 20,
        offset = 0,
        category = null,
        category_id = null,
        sub_category_id = null,
        brand_id = null,
        verifiedOnly = false
    } = options;

    if (offset === 0 && (!options.excludeIds || options.excludeIds.length === 0)) {
        const cacheKey = `feed_${category_id || category || 'all'}_${brand_id || 'all'}_${verifiedOnly}`;
        const cached = _feedCacheStore?.[cacheKey];
        if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
            return cached.data;
        }
    }

    if (!supabase || !supabase.from) throw new Error('Supabase client not initialized');

    let query = supabase
        .from('posts')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score,
        is_verified
      )
    `)
        .eq('is_deleted', false)
        .eq('is_draft', false);

    // --- FILTER RESOLUTION (Slug support) ---
    let actualCategoryId = category_id;
    let actualSubCategoryId = sub_category_id;

    try {
        // If category_id is a slug/name (e.g. 'technology'), find the UUID
        if (category_id && category_id.length < 30) {
            const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .ilike('title', category_id)
                .limit(1)
                .single();
            if (cat) actualCategoryId = cat.id;
        }
        // If sub_category_id is a slug/title, find the UUID
        if (sub_category_id && sub_category_id.length < 30) {
            const { data: sub } = await supabase
                .from('sub_categories')
                .select('id')
                .ilike('title', `%${sub_category_id}%`)
                .limit(1)
                .single();
            if (sub) actualSubCategoryId = sub.id;
        }
    } catch (e) { console.warn("Slug resolution failed:", e); }

    // Apply category filter (combined UUID + smart keyword matching using OR logic)
    // This ensures both legacy text-tagged posts and UUID-linked posts are found
    if (category_id) {
        // Smart keyword stem: strip trailing 's' to match singular/plural variations
        // "others" -> "other" will match both "Other" and "Others"
        const keyword = category_id.toLowerCase().replace(/s$/, '');
        if (actualCategoryId && actualCategoryId !== category_id) {
            // Found a UUID match - search by BOTH UUID AND text keyword (stem-based)
            query = query.or(`category_id.eq.${actualCategoryId},category.ilike.%${keyword}%`);
        } else {
            // No UUID found - use stem-based keyword matching on category text field
            query = query.ilike('category', `%${keyword}%`);
        }
    }

    // --- ID EXCLUSION (To prevent duplicates in random/shuffled feeds) ---
    if (options.excludeIds && Array.isArray(options.excludeIds) && options.excludeIds.length > 0) {
        // PostgREST syntax for NOT IN
        query = query.not('id', 'in', `(${options.excludeIds.join(',')})`);
    }

    // --- BLOCKED USERS FILTER ---
    const user = await getCurrentUser();
    if (user) {
        const { data: blocks } = await supabase
            .from('profile_blocks')
            .select('blocked_id')
            .eq('blocker_id', user.id);

        if (blocks && blocks.length > 0) {
            const blockedIds = blocks.map(b => b.blocked_id);
            query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
        }
    }

    if (actualSubCategoryId) query = query.eq('sub_category_id', actualSubCategoryId);
    if (brand_id) query = query.ilike('brand_name', `%${brand_id}%`);
    if (verifiedOnly) query = query.eq('is_verified_purchase', true);

    // --- SHUFFLE MODE (7:3 Recency Bias for Beta) ---
    if (options.shuffle) {
        // Fetch a pool of 50 most recent candidates after filters/exclusion
        const { data: pool, error: poolError } = await query
            .order('created_at', { ascending: false })
            .range(0, 49);

        if (poolError) throw poolError;
        if (!pool || pool.length === 0) return [];

        // Bucket Logic: 
        // Hot (Top 15 - Newest)
        // Cold (Next 35 - Depth)
        const hotPool = pool.slice(0, 15);
        const coldPool = pool.slice(15);

        // Selection: 70% Hot, 30% Cold
        let selection = [];
        const hotTarget = Math.ceil(limit * 0.7);
        const coldTarget = limit - hotTarget;

        // Shuffle buckets and pick
        const shuffledHot = [...hotPool].sort(() => Math.random() - 0.5);
        const shuffledCold = [...coldPool].sort(() => Math.random() - 0.5);

        selection.push(...shuffledHot.slice(0, hotTarget));
        selection.push(...shuffledCold.slice(0, coldTarget));

        // If pools were small, fill remaining slots from what's left
        if (selection.length < limit && pool.length > selection.length) {
            const seenIds = new Set(selection.map(p => p.id));
            const remaining = pool.filter(p => !seenIds.has(p.id));
            selection.push(...remaining.slice(0, limit - selection.length));
        }

        // Final randomized mix of the batch
        const shuffled = selection.sort(() => Math.random() - 0.5);
        // Rewrite all media URLs before returning (defense-in-depth vs ISP block)
        const finalResult = rewritePostUrls ? rewritePostUrls(shuffled) : shuffled;

        if (offset === 0 && (!options.excludeIds || options.excludeIds.length === 0)) {
            _feedCacheStore = _feedCacheStore || {};
            const cacheKey = `feed_${category_id || category || 'all'}_${brand_id || 'all'}_${verifiedOnly}`;
            _feedCacheStore[cacheKey] = {
                data: finalResult,
                timestamp: Date.now()
            };
        }

        return finalResult;
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    // Rewrite all media/avatar URLs so HTML never sees raw supabase.co URLs
    const posts = data || [];
    const finalResult = rewritePostUrls ? rewritePostUrls(posts) : posts;

    if (offset === 0 && (!options.excludeIds || options.excludeIds.length === 0)) {
        _feedCacheStore = _feedCacheStore || {};
        const cacheKey = `feed_${category_id || category || 'all'}_${brand_id || 'all'}_${verifiedOnly}`;
        _feedCacheStore[cacheKey] = {
            data: finalResult,
            timestamp: Date.now()
        };
    }

    return finalResult;
};

// ============================================
// ALGORITHM BRAIN — POST SCORING ENGINE (PSE)
// ============================================
// Calculates a composite score for each post.
// FinalScore = E_score(40%) + A_score(25%) + R_score(25%) + Q_score(10%)




export function _calcPostScore(post, fingerprint = null) {
    // E_score: Engagement (agrees + comments*2 + shares*3)
    const agrees = post.agrees_count || 0;
    const comments = post.comments_count || 0;
    const shares = post.shares_count || 0;
    const rawEngagement = agrees + (comments * 2) + (shares * 3);
    // Normalize to 0-100 using soft log scale (handles both tiny + viral posts gracefully)
    const E_score = Math.min(100, Math.log1p(rawEngagement) * 15);

    // A_score: Author Credibility
    const rqs = post.profiles?.rqs_score || 0;
    const isVerifiedAuthor = post.profiles?.is_verified ? 1 : 0;
    const A_score = Math.min(100, (rqs / 100) * 80 + isVerifiedAuthor * 20);

    // R_score: Recency Decay (exponential, half-life ~20 hours)
    const hoursOld = Math.max(0, (Date.now() - new Date(post.created_at).getTime()) / 3600000);
    const R_score = 100 * Math.exp(-0.035 * hoursOld);

    // Q_score: Content Quality Bonus
    const textLen = (post.text_content || '').length;
    const Q_score = (post.is_verified_purchase ? 30 : 0)
        + (post.media_url ? 15 : 0)
        + (textLen > 100 ? 10 : 0)
        + (textLen > 250 ? 10 : 0);

    // Weighted composite
    let baseScore = (E_score * 0.40) + (A_score * 0.25) + (R_score * 0.25) + (Q_score * 0.10);

    // Affinity Boost from User Fingerprint (personalization layer)
    if (fingerprint) {
        const catFreq = fingerprint.categories[post.category_id] || fingerprint.categories[post.category] || 0;
        const brandFreq = fingerprint.brands[post.brand_name] || 0;
        baseScore += (catFreq * 5) + (brandFreq * 3);
    }

    return baseScore;
};

// ============================================
// ALGORITHM BRAIN — USER SIGNAL FINGERPRINT (USF)
// ============================================
// Builds a lightweight interest map from user's last 30 interactions.
// Cached per session to avoid repeated DB calls.




_fingerprintCache = null;



_fingerprintCacheTime = 0;
// _FINGERPRINT_TTL already declared at module level (line 20)




export async function getUserFingerprint() {
    const now = Date.now();
    if (_fingerprintCache && (now - _fingerprintCacheTime) < _FINGERPRINT_TTL) {
        return _fingerprintCache;
    }

    const user = await getCurrentUser();
    if (!user) return null;

    try {
        // Fetch last 30 likes with post data (categories + brands)
        const { data: likes } = await supabase
            .from('post_likes')
            .select('posts(category_id, category, brand_name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30);

        const categories = {};
        const brands = {};

        (likes || []).forEach(like => {
            const p = like.posts;
            if (!p) return;
            const catKey = p.category_id || p.category;
            if (catKey) categories[catKey] = (categories[catKey] || 0) + 1;
            if (p.brand_name) brands[p.brand_name] = (brands[p.brand_name] || 0) + 1;
        });

        const sortedCats = Object.entries(categories).sort(([, a], [, b]) => b - a);
        const fingerprint = {
            categories,
            brands,
            topCategory: sortedCats[0]?.[0] || null,
            secondCategory: sortedCats[1]?.[0] || null,
            totalInteractions: likes?.length || 0
        };

        _fingerprintCache = fingerprint;
        _fingerprintCacheTime = now;
        return fingerprint;
    } catch (e) {
        console.warn('[Algorithm] Failed to build fingerprint:', e);
        return null;
    }
};

// ============================================
// ALGORITHM BRAIN — SMART FEED (FOR YOU TAB)
// ============================================
// Blends 4 buckets: Interest-Matched (35%) + High-Score Discovery (35%)
// + Serendipity (15%) + Recency Bonus (15%)
// All posts sorted by composite PSE score.




export async function getSmartFeed(limit = 20, excludeIds = []) {
    // Phase 4: Instant SPA Data Cache
    if (excludeIds.length === 0) {
        const cached = _feedCacheStore?.smartFeed;
        if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
            return cached.data;
        }
    }

    if (!supabase || !supabase.from) throw new Error('Supabase not initialized');

    // Get user fingerprint + hidden items in parallel
    const [fingerprint, hiddenData, user] = await Promise.all([
        window.getUserFingerprint().catch(() => null),
        window.getHiddenItems().catch(() => ({ posts: [], brands: [], categories: [] })),
        getCurrentUser().catch(() => null)
    ]);

    // Build exclusion set
    const excludeSet = new Set([
        ...excludeIds.map(String),
        ...(hiddenData?.posts || []).map(String)
    ]);

    // Get blocked user IDs
    let blockedUserIds = [];
    if (user) {
        try {
            const { data: blocks } = await supabase
                .from('profile_blocks')
                .select('blocked_id')
                .eq('blocker_id', user.id);
            blockedUserIds = (blocks || []).map(b => b.blocked_id);
        } catch (e) { /* ignore */ }
    }

    const mutedBrands = new Set(hiddenData?.brands || []);
    const mutedCategories = new Set(hiddenData?.categories || []);

    // Fetch a generous pool of recent posts for scoring
    let query = supabase
        .from('posts')
        .select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(0, 79); // Pool of 80 posts for the algorithm to work with

    if (blockedUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedUserIds.join(',')})`);
    }

    const { data: pool, error } = await query;
    if (error) throw error;
    if (!pool || pool.length === 0) return [];

    // Filter out excluded/muted/hidden (Safety check: only filter if values are truthy to prevent total feed death)
    const eligible = pool.filter(p =>
        !excludeSet.has(String(p.id)) &&
        !(p.brand_name && mutedBrands.has(p.brand_name)) &&
        !(p.category && mutedCategories.has(p.category))
    );

    // Score every post
    const scored = eligible.map(p => ({
        ...p,
        _score: _calcPostScore(p, fingerprint)
    }));

    // Sort by score descending
    scored.sort((a, b) => b._score - a._score);

    // Bucket A: Interest-matched (top category posts, 35%)
    const bucketA_size = Math.ceil(limit * 0.35);
    // Bucket B: High discovery (top scored from any category, 35%)
    const bucketB_size = Math.ceil(limit * 0.35);
    // Bucket C: Serendipity (random from lower-scored pool, 15%)
    const bucketC_size = Math.ceil(limit * 0.15);
    // Bucket D: Recency (newest posts not yet in A/B/C, 15%)
    const bucketD_size = limit - bucketA_size - bucketB_size - bucketC_size;

    let bucketA = [], bucketB = [], bucketC = [], bucketD = [];
    const usedIds = new Set();

    // Bucket A: posts from top-interest categories
    if (fingerprint?.topCategory) {
        const interestPosts = scored.filter(p =>
            (p.category_id === fingerprint.topCategory || p.category === fingerprint.topCategory ||
                p.category_id === fingerprint.secondCategory || p.category === fingerprint.secondCategory) &&
            !usedIds.has(p.id)
        );
        bucketA = interestPosts.slice(0, bucketA_size);
        bucketA.forEach(p => usedIds.add(p.id));
    }

    // Bucket B: top scored globally (discovery)
    const topScored = scored.filter(p => !usedIds.has(p.id));
    bucketB = topScored.slice(0, bucketB_size);
    bucketB.forEach(p => usedIds.add(p.id));

    // Bucket C: serendipity (random from remaining)
    const remaining = scored.filter(p => !usedIds.has(p.id));
    const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5);
    bucketC = shuffledRemaining.slice(0, bucketC_size);
    bucketC.forEach(p => usedIds.add(p.id));

    // Bucket D: newest (recency bonus)
    const byRecency = eligible.filter(p => !usedIds.has(p.id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    bucketD = byRecency.slice(0, Math.max(0, bucketD_size));

    // Interleave buckets for a varied feed feel (not grouped)
    const allBuckets = [bucketA, bucketB, bucketC, bucketD];
    const interleaved = [];
    const maxLen = Math.max(...allBuckets.map(b => b.length));
    for (let i = 0; i < maxLen; i++) {
        for (const bucket of allBuckets) {
            if (i < bucket.length) interleaved.push(bucket[i]);
        }
    }

    // Deduplicate and trim to limit
    const finalIds = new Set();
    const final = interleaved.filter(p => {
        if (finalIds.has(p.id)) return false;
        finalIds.add(p.id);
        return true;
    }).slice(0, limit);

    const finalResult = rewritePostUrls ? rewritePostUrls(final) : final;

    if (excludeIds.length === 0) {
        _feedCacheStore = _feedCacheStore || {};
        _feedCacheStore.smartFeed = {
            data: finalResult,
            timestamp: Date.now()
        };
    }

    return finalResult;
};

// ============================================
// ALGORITHM BRAIN — TRENDING FEED
// ============================================
// Posts gaining the most momentum RIGHT NOW.
// TrendScore = total_engagement / hours_old^0.8
// Higher decay exponent = faster drop-off = truly captures "right now"




export async function getTrendingFeed(limit = 20, excludeIds = []) {
    if (excludeIds.length === 0) {
        const cached = _feedCacheStore?.trendingFeed;
        if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
            return cached.data;
        }
    }

    if (!supabase || !supabase.from) throw new Error('Supabase not initialized');

    const [hiddenData, user] = await Promise.all([
        window.getHiddenItems().catch(() => ({ posts: [], brands: [], categories: [] })),
        getCurrentUser().catch(() => null)
    ]);

    const excludeSet = new Set([...excludeIds.map(String), ...(hiddenData?.posts || []).map(String)]);
    const mutedBrands = new Set(hiddenData?.brands || []);
    const mutedCategories = new Set(hiddenData?.categories || []);

    let blockedUserIds = [];
    if (user) {
        try {
            const { data: blocks } = await supabase
                .from('profile_blocks').select('blocked_id').eq('blocker_id', user.id);
            blockedUserIds = (blocks || []).map(b => b.blocked_id);
        } catch (e) { /* ignore */ }
    }

    // Fetch more recent posts for trending (last ~72 hours matters most)
    let query = supabase
        .from('posts')
        .select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(0, 99); // Bigger pool for trending

    if (blockedUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedUserIds.join(',')})`);
    }

    const { data: pool, error } = await query;
    if (error) throw error;
    if (!pool || pool.length === 0) return [];

    const eligible = pool.filter(p =>
        !excludeSet.has(String(p.id)) &&
        !mutedBrands.has(p.brand_name) &&
        !mutedCategories.has(p.category)
    );

    // Apply TrendScore formula
    const now = Date.now();
    const scored = eligible.map(p => {
        const hoursOld = Math.max(0.1, (now - new Date(p.created_at).getTime()) / 3600000);
        const totalEngagement = (p.agrees_count || 0) + (p.comments_count || 0) * 2 + (p.shares_count || 0) * 3;
        // Power decay — velocity-based, not just popularity
        const trendScore = totalEngagement / Math.pow(hoursOld, 0.8);
        return { ...p, _trendScore: trendScore };
    });

    // Sort by trend score — highest velocity wins
    scored.sort((a, b) => b._trendScore - a._trendScore);

    const final = scored.slice(0, limit);
    const finalResult = rewritePostUrls ? rewritePostUrls(final) : final;

    if (excludeIds.length === 0) {
        _feedCacheStore = _feedCacheStore || {};
        _feedCacheStore.trendingFeed = {
            data: finalResult,
            timestamp: Date.now()
        };
    }

    return finalResult;
};

// ============================================
// ALGORITHM BRAIN — VERIFIED PURCHASE FEED
// ============================================
// Only posts where is_verified_purchase = true, ranked by PSE score.




export async function getVerifiedFeed(limit = 20, excludeIds = []) {
    if (excludeIds.length === 0) {
        const cached = _feedCacheStore?.verifiedFeed;
        if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
            return cached.data;
        }
    }

    if (!supabase || !supabase.from) throw new Error('Supabase not initialized');

    const [hiddenData, user] = await Promise.all([
        window.getHiddenItems().catch(() => ({ posts: [], brands: [], categories: [] })),
        getCurrentUser().catch(() => null)
    ]);

    const excludeSet = new Set([...excludeIds.map(String), ...(hiddenData?.posts || []).map(String)]);
    const mutedBrands = new Set(hiddenData?.brands || []);
    const mutedCategories = new Set(hiddenData?.categories || []);

    let blockedUserIds = [];
    if (user) {
        try {
            const { data: blocks } = await supabase
                .from('profile_blocks').select('blocked_id').eq('blocker_id', user.id);
            blockedUserIds = (blocks || []).map(b => b.blocked_id);
        } catch (e) { /* ignore */ }
    }

    let query = supabase
        .from('posts')
        .select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .eq('is_verified_purchase', true) // CRITICAL: Only verified purchases
        .order('created_at', { ascending: false })
        .range(0, 59);

    if (blockedUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedUserIds.join(',')})`);
    }

    const { data: pool, error } = await query;
    if (error) throw error;
    if (!pool || pool.length === 0) return [];

    const eligible = pool.filter(p =>
        !excludeSet.has(String(p.id)) &&
        !mutedBrands.has(p.brand_name) &&
        !mutedCategories.has(p.category)
    );

    // Score + sort by PSE (with Q_score bonus already baked in for verified purchases)
    const scored = eligible.map(p => ({ ...p, _score: _calcPostScore(p) }));
    scored.sort((a, b) => b._score - a._score);

    const final = scored.slice(0, limit);
    const finalResult = rewritePostUrls ? rewritePostUrls(final) : final;

    if (excludeIds.length === 0) {
        _feedCacheStore = _feedCacheStore || {};
        _feedCacheStore.verifiedFeed = {
            data: finalResult,
            timestamp: Date.now()
        };
    }

    return finalResult;
};

// ============================================
// ALGORITHM BRAIN — HIGH RQS FEED
// ============================================
// Posts from authors with the highest RQS scores.
// Sorted by a combination of author credibility + recency.




export async function getHighRQSFeed(limit = 20, excludeIds = []) {
    if (excludeIds.length === 0) {
        const cached = _feedCacheStore?.highRQSFeed;
        if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
            return cached.data;
        }
    }

    if (!supabase || !supabase.from) throw new Error('Supabase not initialized');

    const [hiddenData, user] = await Promise.all([
        window.getHiddenItems().catch(() => ({ posts: [], brands: [], categories: [] })),
        getCurrentUser().catch(() => null)
    ]);

    const excludeSet = new Set([...excludeIds.map(String), ...(hiddenData?.posts || []).map(String)]);
    const mutedBrands = new Set(hiddenData?.brands || []);
    const mutedCategories = new Set(hiddenData?.categories || []);

    let blockedUserIds = [];
    if (user) {
        try {
            const { data: blocks } = await supabase
                .from('profile_blocks').select('blocked_id').eq('blocker_id', user.id);
            blockedUserIds = (blocks || []).map(b => b.blocked_id);
        } catch (e) { /* ignore */ }
    }

    let query = supabase
        .from('posts')
        .select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .not('profiles.rqs_score', 'is', null) // Only posts from users with an RQS score
        .order('created_at', { ascending: false })
        .range(0, 79);

    if (blockedUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${blockedUserIds.join(',')})`);
    }

    const { data: pool, error } = await query;
    if (error) throw error;
    if (!pool || pool.length === 0) return [];

    const eligible = pool.filter(p =>
        !excludeSet.has(String(p.id)) &&
        !mutedBrands.has(p.brand_name) &&
        !mutedCategories.has(p.category) &&
        (p.profiles?.rqs_score || 0) > 0 // Extra guard
    );

    // RQS-weighted score: 70% author credibility, 30% recency
    const now = Date.now();
    const scored = eligible.map(p => {
        const rqs = p.profiles?.rqs_score || 0;
        const hoursOld = Math.max(0.1, (now - new Date(p.created_at).getTime()) / 3600000);
        const recencyScore = 100 * Math.exp(-0.035 * hoursOld);
        const rqsScore = (rqs / 100) * 100; // Already 0-100 scale assumed
        return { ...p, _rqsWeightedScore: (rqsScore * 0.70) + (recencyScore * 0.30) };
    });

    scored.sort((a, b) => b._rqsWeightedScore - a._rqsWeightedScore);

    const final = scored.slice(0, limit);
    const finalResult = rewritePostUrls ? rewritePostUrls(final) : final;

    if (excludeIds.length === 0) {
        _feedCacheStore = _feedCacheStore || {};
        _feedCacheStore.highRQSFeed = {
            data: finalResult,
            timestamp: Date.now()
        };
    }

    return finalResult;
};

// ============================================
// CATEGORIES API
// ============================================

/**
 * Get all categories
 */



export async function getForYouFeed(userId, limit = 15) {
    if (!userId) return [];

    try {
        // 1. Get user's recent liked posts to analyze preferences
        const { data: likedPosts, error: likesError } = await supabase
            .from('post_likes')
            .select('posts(category, brand_name, product_name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(30);

        if (likesError) throw likesError;

        if (!likedPosts || likedPosts.length === 0) {
            // New user - return trending instead
            return await window.getTrendingPosts(limit);
        }

        // 2. Extract favorite categories and brands
        const categories = new Set();
        const brands = new Set();

        likedPosts.forEach(like => {
            if (like.posts?.category) categories.add(like.posts.category);
            if (like.posts?.brand_name) brands.add(like.posts.brand_name);
        });

        const favoriteCategories = Array.from(categories).slice(0, 5);
        const favoriteBrands = Array.from(brands).slice(0, 5);

        // 3. Get posts user has already liked (to exclude)
        const { data: userLikes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId);

        const likedPostIds = userLikes?.map(l => l.post_id) || [];

        // 4. Fetch posts from favorite categories/brands that user hasn't seen
        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (
                    id, full_name, username, avatar_url, rqs_score, is_verified
                )
            `)
            .eq('is_deleted', false)
            .eq('is_draft', false);

        // Exclude already liked posts
        if (likedPostIds.length > 0) {
            query = query.not('id', 'in', `(${likedPostIds.join(',')})`);
        }

        // Filter by favorite categories or brands
        if (favoriteCategories.length > 0 || favoriteBrands.length > 0) {
            const conditions = [];
            if (favoriteCategories.length > 0) {
                conditions.push(`category.in.(${favoriteCategories.map(c => `"${c}"`).join(',')})`);
            }
            if (favoriteBrands.length > 0) {
                conditions.push(`brand_name.in.(${favoriteBrands.map(b => `"${b}"`).join(',')})`);
            }
            query = query.or(conditions.join(','));
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];

    } catch (error) {
        console.error('For You feed failed:', error);
        // Fallback to trending
        return await window.getTrendingPosts(limit);
    }
};

/**
 * Get trending posts sorted by engagement (agrees_count)
 */



export async function getTrendingPosts(limit = 15) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (
                    id, full_name, username, avatar_url, rqs_score, is_verified
                )
            `)
            .eq('is_deleted', false)
            .eq('is_draft', false)
            .order('agrees_count', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Trending posts failed:', error);
        return [];
    }
};

/**
 * Get posts from high RQS users (RQS > 75)
 * Prioritizes verified purchases
 */



export async function getHighRQSContent(limit = 15) {
    /**
     * Algorithm: Dynamic Top RQS Content & Profiles
     * Returns both posts AND profiles from users in the top 20% RQS bracket.
     * This allows users to discover both high-quality content and top reviewers.
     * 
     * Steps:
     * 1. Get all active users' RQS scores
     * 2. Calculate the 80th percentile (top 20%)
     * 3. Fetch posts from users above that threshold
     * 4. Return top user profiles as well
     * 5. Sort by verified purchase, then by RQS score
     */
    try {
        // Step 1: Get all users with their RQS scores
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, rqs_score, is_verified')
            .not('rqs_score', 'is', null)
            .order('rqs_score', { ascending: false });

        if (profileError) throw profileError;

        if (!profiles || profiles.length === 0) {
            // No users yet, return empty
            return { posts: [], profiles: [] };
        }

        // Step 2: Calculate the 80th percentile (top 20% of users)
        const percentileIndex = Math.floor(profiles.length * 0.2);
        const minRQS = profiles[Math.min(percentileIndex, profiles.length - 1)]?.rqs_score || 0;

        // Dynamic quality floor: Use 50 for mature platforms, or 50% of max RQS for early platforms
        const maxRQS = profiles[0]?.rqs_score || 0;
        const qualityFloor = maxRQS >= 50 ? 50 : Math.floor(maxRQS * 0.5);

        const threshold = Math.max(minRQS, qualityFloor);

        // High RQS threshold calculated (logging disabled for security)

        // Step 3: Get top user IDs and profiles
        const topProfiles = profiles
            .filter(p => p.rqs_score >= threshold)
            .slice(0, 10); // Return top 10 profiles

        const topUserIds = topProfiles.map(p => p.id);

        if (topUserIds.length === 0) {
            return { posts: [], profiles: [] };
        }

        // Step 4: Fetch posts from top RQS users
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id (
                    id, full_name, username, avatar_url, rqs_score, is_verified
                )
            `)
            .eq('is_deleted', false)
            .eq('is_draft', false)
            .in('user_id', topUserIds)
            .order('is_verified_purchase', { ascending: false })
            .limit(limit * 2); // Fetch more to ensure variety

        if (error) throw error;

        // Step 5: Sort posts by RQS score in JavaScript
        const sortedPosts = (data || [])
            .sort((a, b) => {
                // First by verified purchase
                if (a.is_verified_purchase !== b.is_verified_purchase) {
                    return b.is_verified_purchase ? 1 : -1;
                }
                // Then by RQS score (highest first)
                return (b.profiles?.rqs_score || 0) - (a.profiles?.rqs_score || 0);
            })
            .slice(0, limit);

        return {
            posts: sortedPosts,
            profiles: topProfiles
        };
    } catch (error) {
        console.error('High RQS content failed:', error);
        return { posts: [], profiles: [] };
    }
};

/**
 * Get verified-purchase posts for the Lens "Verified Only" filter.
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getVerifiedPosts(limit = 15) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`*, profiles:user_id (id, full_name, username, avatar_url, rqs_score, is_verified)`)
            .eq('is_verified_purchase', true)
            .eq('is_deleted', false)
            .eq('is_draft', false)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Verified posts failed:', error);
        return [];
    }
}
