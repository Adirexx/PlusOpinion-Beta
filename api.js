// API Helper Functions for PlusOpinion
// This file provides clean API functions to interact with Supabase backend
// Import this in your HTML files after supabase.js

// ============================================
// AUTH / USER API
// ============================================

/**
 * Get current authenticated user
 */
// getCurrentUser is now defined globally in auth.js for consistency and silence
// window.getCurrentUser = async function () { ... } 


// ============================================
// POSTS API
// ============================================

/**
 * Create a new post/opinion
 */
window.createPost = async function (postData) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to create posts');
    if (!window.supabase || !window.supabase.from) throw new Error('Supabase client not initialized');

    const { data, error } = await window.supabase
        .from('posts')
        .insert({
            user_id: user.id,
            text_content: postData.text_content,
            category: postData.category,
            product_name: postData.product_name || null,
            brand_name: postData.brand_name || null,
            media_url: postData.media_url || null,
            media_type: postData.media_type || null,
            is_verified_purchase: postData.is_verified_purchase || false,
            verification_proof_url: postData.verification_proof_url || null,
            is_draft: postData.is_draft || false
        })
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
        .single();

    if (error) throw error;

    // Trigger notification for successful post creation
    if (data && !postData.is_draft && window.notifyPostCreated) {
        window.notifyPostCreated(data.id, user.id).catch(err =>
            console.error('Failed to send post creation notification:', err)
        );
    }

    return data;
};

/**
 * Get feed posts with pagination
 */
window.getFeed = async function (options = {}) {
    const {
        limit = 20,
        offset = 0,
        category = null,
        category_id = null,
        sub_category_id = null,
        brand_id = null,
        verifiedOnly = false
    } = options;

    if (!window.supabase || !window.supabase.from) throw new Error('Supabase client not initialized');

    let query = window.supabase
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
            const { data: cat } = await window.supabase
                .from('categories')
                .select('id')
                .ilike('title', category_id)
                .limit(1)
                .single();
            if (cat) actualCategoryId = cat.id;
        }
        // If sub_category_id is a slug/title, find the UUID
        if (sub_category_id && sub_category_id.length < 30) {
            const { data: sub } = await window.supabase
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

    // --- BLOCKED USERS FILTER ---
    const user = await window.getCurrentUser();
    if (user) {
        const { data: blocks } = await window.supabase
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

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
};

// ============================================
// CATEGORIES API
// ============================================

/**
 * Get all categories
 */
window.getCategories = async function () {
    try {
        const { data, error } = await window.supabase
            .from('categories')
            .select('*')
            .order('title', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
            // Normalize: add 'name' field from 'title' for consistent access
            return data.map(cat => ({ ...cat, name: cat.title || cat.name }));
        }

        throw new Error("No categories found in DB");
    } catch (err) {
        console.warn("Using fallback categories list");
        return [
            { id: 'electronics', name: 'Electronics', title: 'Electronics', icon: 'Zap', color: '#F59E0B' },
            { id: 'fashion', name: 'Fashion', title: 'Fashion', icon: 'Shirt', color: '#FF6B6B' },
            { id: 'food', name: 'Food & Bev', title: 'Food & Bev', icon: 'Coffee', color: '#F0A500' },
            { id: 'health', name: 'Health', title: 'Health', icon: 'Activity', color: '#10B981' },
            { id: 'gaming', name: 'Gaming', title: 'Gaming', icon: 'Gamepad', color: '#8b5cf6' },
            { id: 'fitness', name: 'Sports', title: 'Sports', icon: 'Dumbbell', color: '#F97316' },
            { id: 'tech', name: 'Technology', title: 'Technology', icon: 'Cpu', color: '#2f8bff' },
            { id: 'others', name: 'Others', title: 'Others', icon: 'MoreHorizontal', color: '#6B7280' }
        ].sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
    }
};

/**
/**
 * Get sub-categories for a category
 */
window.getSubCategories = async function (categoryId) {
    if (!window.supabase || !window.supabase.from) return getFallbackSubs(categoryId);

    try {
        const { data, error } = await window.supabase
            .from('sub_categories')
            .select('*')
            .eq('category_id', categoryId)
            .order('title', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) return data;
        return getFallbackSubs(categoryId);
    } catch (e) {
        console.warn("Using sub-category fallbacks due to error:", e);
        return getFallbackSubs(categoryId);
    }
};

function getFallbackSubs(catId) {
    const fallbacks = {
        'tech': [
            { id: 'smartphones', title: 'Smartphones' },
            { id: 'laptops', title: 'Laptops' },
            { id: 'ai-tools', title: 'AI Tools' },
            { id: 'gaming-pc', title: 'PC Gaming' }
        ],
        'finance': [
            { id: 'crypto', title: 'Cryptocurrency' },
            { id: 'banking', title: 'Banking' },
            { id: 'investments', title: 'Investments' }
        ],
        'fashion': [
            { id: 'sneakers', title: 'Sneakers' },
            { id: 'luxury', title: 'Luxury' },
            { id: 'streetwear', title: 'Streetwear' }
        ],
        'food': [
            { id: 'restaurants', title: 'Restaurants' },
            { id: 'fast-food', title: 'Fast Food' },
            { id: 'cafes', title: 'Cafes' }
        ]
    };
    // Match by ID or name
    const key = String(catId).toLowerCase();
    return fallbacks[key] || [];
}

/**
 * Get popular categories (Calculated by post volume globally)
 */
window.getPopularCategories = async function (limit = 6) {
    if (!window.supabase || !window.supabase.rpc) {
        // Fallback: Query categories table with 'popular' section manual flag 
        // OR count posts per category
        const { data, error } = await window.supabase
            .from('categories')
            .select('*')
            .eq('section', 'popular')
            .order('order_rank', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }

    // In a real production SQL, we might use a view or RPC for trending
    // For now, respect the 'section' column which the admin manages
    const { data, error } = await window.supabase
        .from('categories')
        .select('*')
        .eq('section', 'popular')
        .order('order_rank', { ascending: true })
        .limit(limit);

    if (error) throw error;
    return data || [];
};

/**
 * Get recommended categories for a specific user
 * based on their recent likes and comments
 */
window.getRecommendedCategories = async function (limit = 4) {
    const user = await window.getCurrentUser();
    if (!user) return []; // New users get nothing here, default to 'All'

    try {
        // 1. Get user's recent liked/commented category IDs
        // This is a naive recommendation: what you interact with the most
        const { data: interactions, error: iterError } = await window.supabase
            .from('post_likes')
            .select('posts(category_id)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (iterError) throw iterError;

        const categoryIds = interactions
            .map(i => i.posts?.category_id)
            .filter(id => id);

        if (categoryIds.length === 0) return [];

        // Count frequencies
        const counts = categoryIds.reduce((acc, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {});

        // Sort by frequency
        const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

        // 2. Fetch the actual categories
        const { data: cats, error: catsError } = await window.supabase
            .from('categories')
            .select('*')
            .in('id', sortedIds.slice(0, limit));

        if (catsError) throw catsError;
        return cats || [];
    } catch (e) {
        console.error("Failed to fetch recommendations", e);
        return [];
    }
};

/**
 * Get real brands/companies operating in a specific category or sub-category
 */
window.getBrandsByCategory = async function (categoryId, subCategoryId = null) {
    if (!window.supabase) throw new Error('Supabase not initialized');

    // 1. Get unique brand names from posts in this category/sub-category
    let query = window.supabase
        .from('posts')
        .select('brand_name')
        .eq('category_id', categoryId)
        .not('brand_name', 'is', null);

    if (subCategoryId) {
        query = query.eq('sub_category_id', subCategoryId);
    }

    const { data: activeBrands, error } = await query.limit(50);
    if (error) throw error;

    const uniqueBrandNames = [...new Set(activeBrands.map(p => p.brand_name))];

    if (uniqueBrandNames.length === 0) {
        // Resolve ID to name for better mapping
        let categoryName = String(categoryId).toLowerCase();
        let subCategoryName = subCategoryId ? String(subCategoryId).toLowerCase() : null;

        try {
            if (categoryId.length > 20) { // Likely a UUID
                const { data: cat } = await window.supabase.from('categories').select('id, name').eq('id', categoryId).single();
                if (cat) categoryName = cat.name.toLowerCase();
            }
            if (subCategoryId && subCategoryId.length > 20) {
                const { data: sub } = await window.supabase.from('sub_categories').select('id, title').eq('id', subCategoryId).single();
                if (sub) subCategoryName = sub.title.toLowerCase();
            }
        } catch (e) { console.warn("Could not resolve IDs to names", e); }

        return getFallbackBrands(categoryName, subCategoryName);
    }

    // 2. Fetch full company details for these brands from the 'companies' table
    const { data: companies } = await window.supabase
        .from('companies')
        .select('*')
        .in('name', uniqueBrandNames);

    return companies || [];
};

/**
 * Intelligent fallback brands with real logos (Clearbit/Google)
 */
function getFallbackBrands(cat, sub) {
    const brandLibrary = {
        // TECH
        'smartphones': [
            { name: 'Apple', logo_url: 'https://logo.clearbit.com/apple.com', verified: true },
            { name: 'Samsung', logo_url: 'https://logo.clearbit.com/samsung.com', verified: true },
            { name: 'Google', logo_url: 'https://logo.clearbit.com/google.com', verified: true },
            { name: 'OnePlus', logo_url: 'https://logo.clearbit.com/oneplus.com', verified: true },
            { name: 'Xiaomi', logo_url: 'https://logo.clearbit.com/mi.com', verified: true }
        ],
        'laptops': [
            { name: 'Apple', logo_url: 'https://logo.clearbit.com/apple.com', verified: true },
            { name: 'Dell', logo_url: 'https://logo.clearbit.com/dell.com', verified: true },
            { name: 'HP', logo_url: 'https://logo.clearbit.com/hp.com', verified: true },
            { name: 'Lenovo', logo_url: 'https://logo.clearbit.com/lenovo.com', verified: true },
            { name: 'ASUS', logo_url: 'https://logo.clearbit.com/asus.com', verified: true }
        ],
        'ai tools': [
            { name: 'OpenAI', logo_url: 'https://logo.clearbit.com/openai.com', verified: true },
            { name: 'Anthropic', logo_url: 'https://logo.clearbit.com/anthropic.com', verified: true },
            { name: 'Perplexity', logo_url: 'https://logo.clearbit.com/perplexity.ai', verified: true },
            { name: 'Google', logo_url: 'https://logo.clearbit.com/google.com', verified: true },
            { name: 'Microsoft', logo_url: 'https://logo.clearbit.com/microsoft.com', verified: true }
        ],
        // FINANCE
        'cryptocurrency': [
            { name: 'Binance', logo_url: 'https://logo.clearbit.com/binance.com', verified: true },
            { name: 'Coinbase', logo_url: 'https://logo.clearbit.com/coinbase.com', verified: true },
            { name: 'Kraken', logo_url: 'https://logo.clearbit.com/kraken.com', verified: true },
            { name: 'Ledger', logo_url: 'https://logo.clearbit.com/ledger.com', verified: true },
            { name: 'MetaMask', logo_url: 'https://logo.clearbit.com/metamask.io', verified: true }
        ],
        'banking': [
            { name: 'Chase', logo_url: 'https://logo.clearbit.com/chase.com', verified: true },
            { name: 'Revolut', logo_url: 'https://logo.clearbit.com/revolut.com', verified: true },
            { name: 'HSBC', logo_url: 'https://logo.clearbit.com/hsbc.com', verified: true },
            { name: 'N26', logo_url: 'https://logo.clearbit.com/n26.com', verified: true },
            { name: 'Barclays', logo_url: 'https://logo.clearbit.com/barclays.com', verified: true }
        ],
        // FOOD
        'fast food': [
            { name: 'McDonald\'s', logo_url: 'https://logo.clearbit.com/mcdonalds.com', verified: true },
            { name: 'Starbucks', logo_url: 'https://logo.clearbit.com/starbucks.com', verified: true },
            { name: 'KFC', logo_url: 'https://logo.clearbit.com/kfc.com', verified: true },
            { name: 'Subway', logo_url: 'https://logo.clearbit.com/subway.com', verified: true },
            { name: 'Burger King', logo_url: 'https://logo.clearbit.com/bk.com', verified: true }
        ],
        // FASHION
        'luxury': [
            { name: 'Gucci', logo_url: 'https://logo.clearbit.com/gucci.com', verified: true },
            { name: 'Louis Vuitton', logo_url: 'https://logo.clearbit.com/louisvuitton.com', verified: true },
            { name: 'Prada', logo_url: 'https://logo.clearbit.com/prada.com', verified: true },
            { name: 'Rolex', logo_url: 'https://logo.clearbit.com/rolex.com', verified: true },
            { name: 'Hermes', logo_url: 'https://logo.clearbit.com/hermes.com', verified: true }
        ],
        'sneakers': [
            { name: 'Nike', logo_url: 'https://logo.clearbit.com/nike.com', verified: true },
            { name: 'Adidas', logo_url: 'https://logo.clearbit.com/adidas.com', verified: true },
            { name: 'Puma', logo_url: 'https://logo.clearbit.com/puma.com', verified: true },
            { name: 'New Balance', logo_url: 'https://logo.clearbit.com/newbalance.com', verified: true },
            { name: 'ASICS', logo_url: 'https://logo.clearbit.com/asics.com', verified: true }
        ],
        'beauty': [
            { name: 'Sephora', logo_url: 'https://logo.clearbit.com/sephora.com', verified: true },
            { name: 'L\'Oréal', logo_url: 'https://logo.clearbit.com/loreal.com', verified: true },
            { name: 'MAC Cosmetics', logo_url: 'https://logo.clearbit.com/maccosmetics.com', verified: true },
            { name: 'Estée Lauder', logo_url: 'https://logo.clearbit.com/esteelauder.com', verified: true },
            { name: 'Fenty Beauty', logo_url: 'https://logo.clearbit.com/fentybeauty.com', verified: true }
        ]
    };

    // Try matching sub-category name
    if (sub && brandLibrary[sub]) return brandLibrary[sub];

    // Fuzzy match sub-category
    if (sub) {
        for (const [key, brands] of Object.entries(brandLibrary)) {
            if (sub.includes(key) || key.includes(sub)) return brands;
        }
    }

    // Try matching category name
    const categoryLower = cat.includes('tech') ? 'smartphones' :
        cat.includes('finance') ? 'banking' :
            cat.includes('food') ? 'fast food' :
                cat.includes('fashion') ? 'luxury' : 'global';

    if (brandLibrary[categoryLower]) return brandLibrary[categoryLower];

    // Global default
    return [
        { name: 'Amazon', logo_url: 'https://logo.clearbit.com/amazon.com', verified: true },
        { name: 'Google', logo_url: 'https://logo.clearbit.com/google.com', verified: true },
        { name: 'Meta', logo_url: 'https://logo.clearbit.com/meta.com', verified: true },
        { name: 'Microsoft', logo_url: 'https://logo.clearbit.com/microsoft.com', verified: true },
        { name: 'Netflix', logo_url: 'https://logo.clearbit.com/netflix.com', verified: true }
    ];
}

/**
 * Get a single post by ID
 */
window.getPost = async function (postId) {
    const { data, error } = await window.supabase
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
        .eq('id', postId)
        .eq('is_deleted', false)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Update a post
 */
window.updatePost = async function (postId, updates) {
    const { data, error } = await window.supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get current user's draft posts
 */
window.getMyDrafts = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await window.supabase
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
        .eq('user_id', user.id)
        .eq('is_draft', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Get posts that the current user has commented on
 */
window.getMyCommentedPosts = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // 1. Get all unique post IDs from user's comments
    const { data: comments, error: commentError } = await window.supabase
        .from('comments')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (commentError) throw commentError;

    if (!comments || comments.length === 0) return [];

    // Extract unique IDs
    const postIds = [...new Set(comments.map(c => c.post_id))];

    // 2. Fetch the actual posts
    const { data: posts, error: postsError } = await window.supabase
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
        .in('id', postIds)
        .eq('is_deleted', false)
        .eq('is_draft', false); // Don't show drafts even if commented (edge case)

    if (postsError) throw postsError;
    return posts;
};


/**
 * Delete a post by moving it to deleted_posts archive table
 * Posts are physically removed from posts table and archived for admin review
 */
window.deletePost = async function (postId, reason = null) {
    try {
        const user = await window.getCurrentUser();
        if (!user) throw new Error('Must be logged in');

        // 1. Fetch complete post data before deletion
        const { data: post, error: fetchError } = await window.supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (fetchError) throw fetchError;
        if (!post) throw new Error('Post not found');

        // 2. Insert into deleted_posts archive table (using upsert to avoid duplicate errors)
        const { error: insertError } = await window.supabase
            .from('deleted_posts')
            .upsert({
                // Copy all original post fields
                id: post.id,
                user_id: post.user_id,
                text_content: post.text_content,
                product_name: post.product_name,
                category: post.category,
                media_url: post.media_url,
                media_type: post.media_type,
                verification_proof: post.verification_proof,
                is_verified: post.is_verified,
                agrees_count: post.agrees_count,
                disagrees_count: post.disagrees_count,
                comments_count: post.comments_count,
                created_at: post.created_at,

                // Add deletion metadata
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
                deletion_reason: reason,
                original_data: post // Complete backup as JSONB
            }, { onConflict: 'id' });

        if (insertError) throw insertError;

        // 3. Permanently delete from posts table
        const { error: deleteError } = await window.supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (deleteError) {
            // Rollback: Remove from deleted_posts if main deletion fails
            await window.supabase
                .from('deleted_posts')
                .delete()
                .eq('id', postId);
            throw deleteError;
        }

        // 4. Send deletion notification
        if (post && window.notifyPostDeleted) {
            const preview = post.text_content?.substring(0, 50) + '...';
            window.notifyPostDeleted(user.id, preview).catch(err =>
                console.error('Failed to send deletion notification:', err)
            );
        }

        // Post deleted successfully (logging disabled for security)
        return { success: true, archived: true };

    } catch (error) {
        console.error('Delete post failed:', error);
        throw error;
    }
};

// ============================================
// LIKES API
// ============================================

/**
 * Like a post (agree)
 */
window.likePost = async function (postId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to like posts');

    const { data, error } = await window.supabase
        .from('post_likes')
        .insert({
            post_id: postId,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('You already liked this post');
        }
        throw error;
    }

    // Trigger notification for post author
    if (data && window.notifyPostLiked) {
        window.notifyPostLiked(postId, user.id).catch(err =>
            console.error('Failed to send like notification:', err)
        );
    }

    return data;
};

/**
 * Unlike a post
 */
window.unlikePost = async function (postId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

    if (error) throw error;

};

/**
 * Check if current user liked a post
 */
window.hasLikedPost = async function (postId) {
    const user = await window.getCurrentUser();
    if (!user) return false;

    const { data, error } = await window.supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) throw error;
    return !!data;
};

// ============================================
// COMMENTS API
// ============================================

/**
 * Edit a post (Only once allowed)
 */
window.editPost = async function (postId, newText) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // 1. Fetch post to check ownership and is_edited status
    const { data: post, error: fetchError } = await window.supabase
        .from('posts')
        .select('user_id, is_edited')
        .eq('id', postId)
        .single();

    if (fetchError) throw fetchError;

    if (post.user_id !== user.id) {
        throw new Error('Unauthorized: You can only edit your own posts');
    }

    if (post.is_edited) {
        throw new Error('You have already edited this post once. Further edits are not allowed.');
    }

    // 2. Update post
    const { data, error: updateError } = await window.supabase
        .from('posts')
        .update({
            text_content: newText,
            is_edited: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

    if (updateError) throw updateError;

    // Trigger notification for post edit
    if (data && window.notifyPostEdited) {
        window.notifyPostEdited(postId, user.id).catch(err =>
            console.error('Failed to send edit notification:', err)
        );
    }

    return data;
};

/**
 * Hide an item (Post, Brand, or Category)
 */
window.hideItem = async function (type, target, postId = null) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Normalize types
    let normalizedType = type;
    if (type === 'hide_post') normalizedType = 'post';
    if (type === 'mute_brand') normalizedType = 'brand';
    if (type === 'not_interested') normalizedType = 'category';
    if (type === 'mute_category') normalizedType = 'category';

    const payload = {
        user_id: user.id,
        type: normalizedType
    };

    if (normalizedType === 'post') payload.post_id = target || postId;
    else if (normalizedType === 'brand') {
        payload.brand_name = target;
        payload.post_id = postId; // Optional: track which post triggered the mute
    }
    else if (normalizedType === 'category') {
        payload.category = target;
        payload.post_id = postId; // Optional
    }

    const { error } = await window.supabase
        .from('hidden_items')
        .insert(payload);

    if (error) throw error;
    return true;
};

/**
 * Get all hidden items for current user (to filter feed)
 */
window.getHiddenItems = async function () {
    const user = await window.getCurrentUser();
    if (!user) return { posts: [], brands: [], categories: [] };

    const { data, error } = await window.supabase
        .from('hidden_items')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching hidden items:', error);
        return { posts: [], brands: [], categories: [] };
    }

    return {
        posts: data.filter(i => i.type === 'post').map(i => i.post_id),
        brands: data.filter(i => i.type === 'brand').map(i => i.brand_name),
        categories: data.filter(i => i.type === 'category').map(i => i.category)
    };
};


// ============================================
// REVENUE & ANALYTICS API
// ============================================

/**
 * Get user earnings logs
 */
window.getMyEarnings = async function () {
    const user = await window.getCurrentUser();
    if (!user) return { total: 0, lastMonth: 0, logs: [], breakdown: [] };

    // 1. Fetch Logs
    const { data: logs, error: logsError } = await window.supabase
        .from('earnings_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (logsError) {
        console.error("Error fetching earnings logs:", logsError);
    }

    // 2. Fetch Pending/Processing Withdrawals (to show in history before they are logged as Paid)
    const { data: withdrawals, error: withdrawalError } = await window.supabase
        .from('withdrawals')
        .select('id, amount, status, created_at, method')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

    if (withdrawalError) {
        console.error("Error fetching pending withdrawals:", withdrawalError);
    }

    // Combined logs list for the UI
    const allLogs = [
        ...(logs || []),
        ...(withdrawals || []).map(w => ({
            id: w.id,
            amount: -w.amount, // Negative for withdrawal
            source: 'Withdrawal',
            label: `Withdrawal (${w.method.toUpperCase()})`,
            status: w.status.charAt(0).toUpperCase() + w.status.slice(1),
            created_at: w.created_at,
            icon: 'Clock'
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 3. Fetch Profile Total (source of truth for total balance)
    const { data: profile } = await window.supabase
        .from('profiles')
        .select('total_earnings')
        .eq('id', user.id)
        .single();

    const total = profile?.total_earnings || 0;

    // 3. Calculate Last 30 Days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const lastMonth = allLogs
        .filter(l => new Date(l.created_at) >= thirtyDaysAgo)
        .reduce((sum, l) => sum + Number(l.amount), 0);

    // 4. Calculate Breakdown
    const sources = {};
    allLogs.forEach(l => {
        sources[l.source] = (sources[l.source] || 0) + Number(l.amount);
    });

    const breakdown = Object.keys(sources).map(key => ({
        label: key,
        amount: sources[key],
        percent: total > 0 ? Math.round((sources[key] / total) * 100) : 0,
        color: key === 'Brand Deal' ? '#2f8bff' : key === 'Ad Revenue' ? '#00E676' : '#FFD700'
    }));

    return {
        total,
        lastMonth,
        logs: allLogs.map(l => ({
            ...l,
            date: new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        })),
        breakdown
    };
};

/**
 * Get user brand interactions (Real-time)
 */
window.getMyBrandInteractions = async function () {
    const user = await window.getCurrentUser();
    if (!user) return [];

    // Fetch posts where seen_by_brand is NOT null
    const { data, error } = await window.supabase
        .from('posts')
        .select('id, brand_name, text_content, media_url, seen_by_brand, seen_by_brand_at, created_at')
        .eq('user_id', user.id)
        .not('seen_by_brand', 'is', null)
        .order('seen_by_brand_at', { ascending: false });

    if (error) {
        console.error("Error fetching brand interactions:", error);
        return [];
    }

    return data;
};

/**
 * Get analytics summary for partner program
 */
window.getPartnerStats = async function () {
    const user = await window.getCurrentUser();
    if (!user) return { verifiedCount: 0, interactionCount: 0, streakWeeks: 0, tier: 'None' };

    const { data, error } = await window.supabase
        .from('profiles')
        .select('rqs_score, lifetime_interactions, current_streak_weeks, partner_program_tier')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching partner stats:', error);
        return { verifiedCount: 0, interactionCount: 0, streakWeeks: 0, tier: 'None' };
    }

    // Return mapped data
    // verifiedCount is legacy for UI compatibility, mapped to streak for now or just 0
    return {
        verifiedCount: 0,
        interactionCount: data.lifetime_interactions || 0,
        streakWeeks: data.current_streak_weeks || 0,
        tier: data.partner_program_tier || 'None'
    };
};

/**
 * Track a post share for analytics and partner program
 */
window.trackShare = async function (postId) {
    if (!postId) return;
    try {
        const { error } = await window.supabase.rpc('track_post_share', { target_post_id: postId });
        if (error) throw error;
    } catch (err) {
        console.error('Error tracking share:', err);
    }
};


/**
 * Get comments for a post
 */
window.getComments = async function (postId) {
    const { data, error } = await window.supabase
        .from('comments')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score
      ),
      likes:comment_likes(count)
    `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

/**
 * Create a comment
 */
window.createComment = async function (postId, text) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to comment');

    const { data, error } = await window.supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: user.id,
            text_content: text
        })
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        username,
        avatar_url,
        rqs_score
      )
    `)
        .single();

    if (error) throw error;

    // Trigger notification for post author
    if (data && window.notifyPostCommented) {
        window.notifyPostCommented(postId, user.id, text).catch(err =>
            console.error('Failed to send comment notification:', err)
        );
    }

    return data;
};

/**
 * Delete a comment
 */
window.deleteComment = async function (commentId) {
    const { data: comment } = await window.supabase
        .from('comments')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select('post_id')
        .single();

    if (error) throw error;

};

/**
 * Like a comment
 */
window.likeComment = async function (commentId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await window.supabase
        .from('comment_likes')
        .insert({
            comment_id: commentId,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            // Already liked, ignore
            return null;
        }
        throw error;
    }

    // Trigger notification for comment author
    if (data && window.notifyCommentLiked) {
        window.notifyCommentLiked(commentId, user.id).catch(err =>
            console.error('Failed to send comment like notification:', err)
        );
    }

    return data;
};

/**
 * Unlike a comment
 */
window.unlikeComment = async function (commentId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('comment_likes')
        .delete()
        .match({ comment_id: commentId, user_id: user.id });

    if (error) throw error;
};

/**
 * Check if user liked a comment
 */
window.hasLikedComment = async function (commentId) {
    const user = await window.getCurrentUser();
    if (!user) return false;

    const { data, error } = await window.supabase
        .from('comment_likes')
        .select('id')
        .match({ comment_id: commentId, user_id: user.id })
        .maybeSingle();

    if (error) throw error;
    return !!data;
};

// ============================================
// NOTIFICATIONS API
// ============================================

/**
 * Get user's notifications
 */
window.getNotifications = async function (options = {}) {
    const { limit = 50, unreadOnly = false } = options;
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    let query = window.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (unreadOnly) {
        query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Mark notification as read
 */
window.markNotificationRead = async function (notificationId) {
    const { error } = await window.supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

    if (error) throw error;
};

/**
 * Mark all notifications as read
 */
window.markAllNotificationsRead = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) throw error;
};

window.deleteNotification = async function (notificationId) {
    if (!window.supabase) throw new Error('Supabase not initialized');

    // Deleting notification (logging disabled for security)
    const { error } = await window.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('❌ Failed to delete notification:', error);
        throw error;
    }
    // Notification deleted successfully
    return true;
};

/**
 * Toggle notification bookmark status (persisted in metadata JSONB)
 */
window.toggleNotificationBookmark = async function (notificationId, isBookmarked) {
    if (!window.supabase) throw new Error('Supabase not initialized');

    // 1. Get current metadata
    const { data: notif, error: fetchError } = await window.supabase
        .from('notifications')
        .select('metadata')
        .eq('id', notificationId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Update metadata with bookmark status
    const updatedMetadata = {
        ...(notif.metadata || {}),
        is_bookmarked: isBookmarked
    };

    const { data, error: updateError } = await window.supabase
        .from('notifications')
        .update({ metadata: updatedMetadata })
        .eq('id', notificationId)
        .select()
        .single();

    if (updateError) throw updateError;
    return data;
};

/**
 * Fetch all bookmarked notifications for current user
 */
window.getBookmarkedNotifications = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await window.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .contains('metadata', { is_bookmarked: true })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Get unread notification count
 */
window.getUnreadCount = async function () {
    const user = await window.getCurrentUser();
    if (!user) return 0;

    const { count, error } = await window.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) throw error;
    return count || 0;
};

// ============================================
// PROFILE API (Extended)
// ============================================

/**
 * Get current user's full profile
 */
window.getMyProfile = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get any user's profile by ID
 */
window.getUserProfile = async function (userId) {
    if (!window.supabase || !window.supabase.from) throw new Error('Supabase client not initialized');

    const { data, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get any user's profile by username
 */
window.getUserProfileByUsername = async function (username) {
    if (!window.supabase || !window.supabase.from) throw new Error('Supabase client not initialized');

    const { data, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get a user's posts
 */
window.getUserPosts = async function (userId, limit = 20) {
    if (!window.supabase || !window.supabase.from) throw new Error('Supabase client not initialized');

    const { data, error } = await window.supabase
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
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
};

/**
 * Get posts that a specific user has commented on (for public profile view)
 */
window.getUserCommentedPosts = async function (userId, limit = 20) {
    if (!window.supabase || !window.supabase.from) throw new Error('Supabase client not initialized');

    // 1. Get all unique post IDs from user's comments
    const { data: comments, error: commentError } = await window.supabase
        .from('comments')
        .select('post_id')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

    if (commentError) throw commentError;

    if (!comments || comments.length === 0) return [];

    // Extract unique IDs
    const postIds = [...new Set(comments.map(c => c.post_id))];

    // 2. Fetch the actual posts
    const { data: posts, error: postsError } = await window.supabase
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
        .in('id', postIds)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .limit(limit);

    if (postsError) throw postsError;
    return posts;
};


/**
 * Get current user's posts
 */
window.getMyPosts = async function (limit = 20) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await window.supabase
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
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
};

/**
 * Get user stats (for My Space page)
 */
window.getMyStats = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Get total posts
    const { count: totalPosts } = await window.supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

    // Get total likes received
    const { data: posts } = await window.supabase
        .from('posts')
        .select('agrees_count')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

    const totalLikes = posts?.reduce((sum, post) => sum + (post.agrees_count || 0), 0) || 0;

    // Get total comments received
    const { data: postsWithComments } = await window.supabase
        .from('posts')
        .select('comments_count')
        .eq('user_id', user.id)
        .eq('is_deleted', false);

    const totalComments = postsWithComments?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;

    return {
        totalPosts: totalPosts || 0,
        totalLikes,
        totalComments
    };
};

/**
 * Accept terms and privacy policy
 */
window.acceptTerms = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('profiles')
        .update({
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
            privacy_accepted: true,
            privacy_accepted_at: new Date().toISOString()
        })
        .eq('id', user.id);

    if (error) throw error;

    // Terms accepted successfully
    return true; // CRITICAL: Return true on success
};


/**
 * Check if user has accepted terms
 */
window.hasAcceptedTerms = async function () {
    const user = await window.getCurrentUser();
    if (!user) return false;

    const { data, error } = await window.supabase
        .from('profiles')
        .select('terms_accepted')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data?.terms_accepted || false;
};

/**
 * Check if username is available
 */
window.checkUsernameAvailable = async function (username) {
    const { data, error } = await window.supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

    if (error) throw error;
    return !data; // Returns true if available (no data found)
};

/**
 * Complete user profile setup
 */
window.completeProfile = async function (profileData) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('profiles')
        .update({
            username: profileData.username,
            avatar_url: profileData.avatar_url || null,
            banner_url: profileData.banner_url || null,
            bio: profileData.bio || null,
            profile_completed: true
        })
        .eq('id', user.id);

    if (error) {
        if (error.code === '23505') {
            throw new Error('Username already taken');
        }
        throw error;
    }
};


// ============================================
// PARTNER & REVENUE API
// ============================================

/**
 * Get Partner Program Application Status
 */
window.getPartnerStatus = async function () {
    const user = await window.getCurrentUser();
    if (!user) return 'none';

    const { data } = await window.supabase
        .from('profiles')
        .select('partner_application_status')
        .eq('id', user.id)
        .single();

    return data?.partner_application_status || 'none';
};

/**
 * Apply for Partner Program
 */
window.applyForPartner = async function () {
    const { data, error } = await window.supabase
        .rpc('apply_for_partner_program');

    if (error) throw error;
    return data; // 'success', 'already_pending', etc.
};

/**
 * Request Withdrawal
 * @param {number} amount - Amount to withdraw (₹100-₹3000)
 * @param {string} method - Payment method ('upi' or 'bank')
 * @returns {Promise} Withdrawal request result
 */
window.requestWithdrawal = async function (amount, method) {
    const { data, error } = await window.supabase.rpc('handle_withdrawal_request', {
        p_amount: amount,
        p_method: method
    });

    if (error) {
        console.error('🔴 Withdrawal Error:', error);
        throw new Error(error.message || 'Failed to submit withdrawal request');
    }

    if (data && data.error) {
        throw new Error(data.error);
    }

    return data;
};

/**
 * Upload media for a post
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
window.uploadMedia = async function (file) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to upload media');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload file to 'post-media' bucket
    const { error: uploadError } = await window.supabase.storage
        .from('post-media')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = window.supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

    return data.publicUrl;
};

/**
 * Helper to manually increment/decrement counters (Postgres RPC simulation)
 * Used because we don't have backend triggers set up for counts yet.
 */


/**
 * Upload verification proof (private bucket)
 */
window.uploadVerificationProof = async function (file) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_proof.${fileExt}`;

    const { error: uploadError } = await window.supabase.storage
        .from('verified-purchase-proofs')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    // For private buckets, we usually create a signed URL, but here the user wants the direct path
    // OR a signed URL valid for a long time if admins need to see it.
    // However, keeping it simple: just return the path for now, or a signed URL.
    // User said "won't be visible to anyone except platform admin", so path is enough for DB reference.

    return fileName;
};


/**
 * Unhide an item (remove from hidden_items)
 */
window.unhideItem = async function (type, target) {
    const user = await window.getCurrentUser();
    if (!user) {
        console.error("Unhide failed: No user found");
        throw new Error('Must be logged in');
    }

    let normalizedType = type;
    if (type === 'hide_post') normalizedType = 'post';
    else if (type === 'mute_brand') normalizedType = 'brand';
    // 'category' is already category

    // Unhiding item (debug logging disabled for security)

    let query = window.supabase
        .from('hidden_items')
        .delete()
        .eq('user_id', user.id)
        .eq('type', normalizedType);

    if (normalizedType === 'post') {
        query = query.eq('post_id', target);
    } else if (normalizedType === 'brand') {
        query = query.eq('brand_name', target);
    } else if (normalizedType === 'category') {
        query = query.eq('category', target);
    }

    const { error } = await query;
    if (error) {
        console.error("Supabase Unhide Error Detail:", JSON.stringify(error, null, 2));
        throw error;
    }

    // Unhide successful
    return true;
};


// ============================================
// ADVANCED INTERACTIONS API
// ============================================

/**
 * Report a post
 */
window.reportPost = async function (postId, reason, action = 'pending', additionalData = {}) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to report');

    const payload = {
        user_id: user.id,
        post_id: postId,
        reason: reason,
        action_taken: action,
        reporter_username: additionalData.reporter_username || null,
        reported_username: additionalData.reported_username || null,
        post_url: additionalData.post_url || null
    };

    const { error } = await window.supabase
        .from('reports')
        .insert(payload);

    if (error) {
        console.error('Report failed:', error);
        throw error;
    }
    return true;
};

/**
 * Report a user
 */
window.reportUser = async function (targetUserId, reason, additionalData = {}) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to report');

    const payload = {
        user_id: user.id,
        reported_user_id: targetUserId,
        reason: reason,
        action_taken: 'pending',
        reporter_username: additionalData.reporter_username || null,
        reported_username: additionalData.reported_username || null
    };

    const { error } = await window.supabase
        .from('reports')
        .insert(payload);

    if (error) {
        console.error('User report failed:', error);
        throw error;
    }
    return true;
};

/**
 * Block a user
 */
window.blockUser = async function (targetUserId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to block');

    const { error } = await window.supabase
        .from('profile_blocks')
        .insert({
            blocker_id: user.id,
            blocked_id: targetUserId
        });

    if (error && error.code !== '23505') { // Ignore if already blocked
        console.error('Block failed:', error);
        throw error;
    }
    return true;
};

/**
 * Unblock a user
 */
window.unblockUser = async function (targetUserId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('profile_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId);

    if (error) throw error;
    return true;
};

/**
 * Check if a user is blocked
 */
window.isUserBlocked = async function (targetUserId) {
    const user = await window.getCurrentUser();
    if (!user) return false;

    const { data, error } = await window.supabase
        .from('profile_blocks')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};

/**
 * Get list of users blocked by the current user
 */
window.getBlockedUsers = async function () {
    const user = await window.getCurrentUser();
    if (!user) return [];

    const { data, error } = await window.supabase
        .from('profile_blocks')
        .select(`
            blocked_id,
            profiles:blocked_id (
                id,
                full_name,
                username,
                avatar_url
            )
        `)
        .eq('blocker_id', user.id);

    if (error) {
        console.error('Error fetching blocked users:', error);
        return [];
    }

    return (data || []).map(b => b.profiles).filter(p => p !== null);
};

// Alias for consistency with component calls
window.submitReport = window.reportPost;

// window.hideItem moved to top for consistency and fixed.
// Previous duplicate removed.

/**
 * Get user's hidden items (for filtering feed)
 */
window.getHiddenItems = async function () {
    const user = await window.getCurrentUser();
    if (!user) return [];

    const { data, error } = await window.supabase
        .from('hidden_items')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching hidden items:', error);
        return { posts: [], brands: [], categories: [] };
    }

    return {
        posts: data.filter(i => i.type === 'post').map(i => i.post_id),
        brands: data.filter(i => i.type === 'brand').map(i => i.brand_name),
        categories: data.filter(i => i.type === 'category').map(i => i.category)
    };
};

/**
 * Bookmark a post
 */
window.bookmarkPost = async function (postId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('bookmarks')
        .insert({
            user_id: user.id,
            post_id: postId
        });

    if (error && error.code !== '23505') { // Ignore unique violation
        throw error;
    }

    // Trigger notification for post author (optional)
    if (window.notifyPostBookmarked) {
        window.notifyPostBookmarked(postId, user.id).catch(err =>
            console.error('Failed to send bookmark notification:', err)
        );
    }

    return true;
};

/**
 * Remove bookmark
 */
window.removeBookmark = async function (postId) {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await window.supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

    if (error) throw error;
    return true;
};

/**
 * Check if post is bookmarked
 */
window.isBookmarked = async function (postId) {
    const user = await window.getCurrentUser();
    if (!user) return false;

    const { data, error } = await window.supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};

/**
 * Get user's bookmarked posts
 */
window.getBookmarks = async function () {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // Join with posts and profiles
    const { data, error } = await window.supabase
        .from('bookmarks')
        .select(`
            post_id,
            posts:post_id (
                *,
                profiles:user_id (
                    id,
                    full_name,
                    username,
                    avatar_url,
                    rqs_score,
                    is_verified
                )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out null posts (deleted ones) or where join failed
    return data
        .map(item => item.posts)
        .filter(post => post && !post.is_deleted);
};


/**
 * Get all categories
 */
window.getCategories = async function () {
    if (!window.supabase || !window.supabase.from) throw new Error('Supabase client not initialized');

    // Try fetching from 'categories' table if it exists
    const { data, error } = await window.supabase
        .from('categories')
        .select('*')
        .order('order_rank', { ascending: true });

    if (!error && data && data.length > 0) {
        return data;
    }

    // Fallback to static list if table empty or error (for safety during dev)
    console.warn("Using fallback categories list");
    return [
        { id: 'tech', name: 'Technology', icon: 'Cpu', section: 'popular', color: 'from-blue-500 to-cyan-500' },
        { id: 'gaming', name: 'Gaming', icon: 'Gamepad', section: 'popular', color: 'from-purple-500 to-pink-500' },
        { id: 'fashion', name: 'Fashion', icon: 'ShoppingBag', section: 'popular', color: 'from-pink-500 to-rose-500' },
        { id: 'food', name: 'Food & Drink', icon: 'Coffee', section: 'popular', color: 'from-orange-500 to-yellow-500' },
        { id: 'travel', name: 'Travel', icon: 'MapPin', section: 'popular', color: 'from-green-500 to-emerald-500' },
        { id: 'music', name: 'Music', icon: 'Music', section: 'growing', color: 'from-indigo-500 to-purple-500' },
        { id: 'movies', name: 'Movies', icon: 'Film', section: 'growing', color: 'from-red-500 to-orange-500' },
        { id: 'books', name: 'Books', icon: 'Book', section: 'growing', color: 'from-amber-500 to-yellow-500' },
        { id: 'sports', name: 'Sports', icon: 'Activity', section: 'growing', color: 'from-emerald-500 to-green-500' },
        { id: 'health', name: 'Health', icon: 'Heart', section: 'all', color: 'from-rose-500 to-red-500' },
        { id: 'fitness', name: 'Fitness', icon: 'Zap', section: 'all', color: 'from-cyan-500 to-blue-500' },
        { id: 'cars', name: 'Automotive', icon: 'Truck', section: 'all', color: 'from-slate-500 to-gray-500' },
        { id: 'finance', name: 'Finance', icon: 'DollarSign', section: 'all', color: 'from-green-600 to-emerald-600' },
        { id: 'education', name: 'Education', icon: 'BookOpen', section: 'all', color: 'from-blue-600 to-indigo-600' },
        { id: 'art', name: 'Art', icon: 'PenTool', section: 'all', color: 'from-purple-600 to-fuchsia-600' },
        { id: 'photography', name: 'Photography', icon: 'Camera', section: 'all', color: 'from-pink-600 to-rose-600' },
        { id: 'diy', name: 'DIY', icon: 'Tool', section: 'all', color: 'from-orange-600 to-amber-600' },
        { id: 'pets', name: 'Pets', icon: 'GitHub', section: 'all', color: 'from-amber-700 to-orange-700' },
        { id: 'news', name: 'News', icon: 'Radio', section: 'all', color: 'from-red-700 to-rose-700' },
        { id: 'science', name: 'Science', icon: 'Atom', section: 'all', color: 'from-blue-700 to-cyan-700' }
    ];
};

/**
 * Report content (post or user)
 */
window.reportContent = async function (targetType, targetId, reason, description = '') {
    const user = await window.getCurrentUser();
    if (!user) throw new Error('Must be logged in to report content');

    try {
        // Submit report to database
        const { data, error } = await window.supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                target_type: targetType,
                target_id: targetId,
                reason: reason,
                description: description,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Send confirmation notification
        if (window.notifyReportSubmitted) {
            window.notifyReportSubmitted(user.id, targetType, targetId, reason)
                .catch(err => console.error('Failed to send report notification:', err));
        }

        return data;
    } catch (err) {
        console.error('Error submitting report:', err);
        throw err;
    }
};

// ============================================
// UNIVERSAL SEARCH (LENS) API
// ============================================

/**
 * Search profiles by username or full name with intelligent ranking
 * Ranking: Exact username match > Exact full name match > Partial matches
 * @param {string} query - Search query
 * @param {number} limit - Maximum results (default: 20)
 */
window.searchProfiles = async function (query, limit = 20) {
    if (!query || !query.trim()) return [];

    const searchTerm = query.trim().toLowerCase();

    try {
        // Fetch all potential matches
        const { data, error } = await window.supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, rqs_score, is_verified, banner_url')
            .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
            .limit(50); // Get more than needed for ranking

        if (error) throw error;
        if (!data || data.length === 0) return [];

        // Rank results by match quality
        const ranked = data.map(profile => {
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
window.getForYouFeed = async function (userId, limit = 15) {
    if (!userId) return [];

    try {
        // 1. Get user's recent liked posts to analyze preferences
        const { data: likedPosts, error: likesError } = await window.supabase
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
        const { data: userLikes } = await window.supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId);

        const likedPostIds = userLikes?.map(l => l.post_id) || [];

        // 4. Fetch posts from favorite categories/brands that user hasn't seen
        let query = window.supabase
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
window.getTrendingPosts = async function (limit = 15) {
    try {
        const { data, error } = await window.supabase
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
window.getHighRQSContent = async function (limit = 15) {
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
        const { data: profiles, error: profileError } = await window.supabase
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
        const { data, error } = await window.supabase
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
 * Get popular products based on engagement in last 30 days
 * Returns products with highest engagement scores
 */
window.getPopularProducts = async function (limit = 10) {
    try {
        // IMPORTANT: Only show products from posts that have images
        // Sort by positive interactions (agrees_count) only

        const { data: posts, error } = await window.supabase
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
window.getTopReviewers = async function (limit = 5) {
    try {
        // Get profiles ordered by RQS (beta-friendly, no strict filters)
        const { data: profiles, error } = await window.supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, rqs_score, is_verified, verified_count, lifetime_interactions')
            .not('rqs_score', 'is', null)
            .order('rqs_score', { ascending: false })
            .limit(100);

        if (error) throw error;
        if (!profiles || profiles.length === 0) return [];

        // Calculate composite score using available data
        // RQS: 70%, Verified Reviews: 20%, Lifetime Interactions: 10%
        const scoredProfiles = profiles.map(profile => ({
            ...profile,
            _score: (profile.rqs_score || 0) * 0.7 +
                (profile.verified_count || 0) * 10 * 0.2 +
                (profile.lifetime_interactions || 0) * 0.1
        }));

        // Sort by composite score
        scoredProfiles.sort((a, b) => b._score - a._score);

        // Return top reviewers without internal score
        return scoredProfiles.slice(0, limit).map(({ _score, ...profile }) => profile);

    } catch (error) {
        console.error('Top reviewers failed:', error);
        return [];
    }
};

/**
 * Get all profiles on the platform in shuffled order
 * For the "Explore More" section
 */
window.getAllProfiles = async function () {
    try {
        const { data: profiles, error } = await window.supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, rqs_score')
            .not('username', 'is', null)
            .order('created_at', { ascending: false }); // Get newest first, then shuffle

        if (error) throw error;
        if (!profiles || profiles.length === 0) return [];

        // Shuffle the profiles for variety
        const shuffled = profiles.sort(() => Math.random() - 0.5);

        return shuffled;

    } catch (error) {
        console.error('Get all profiles failed:', error);
        return [];
    }
};

/**
 * Get trending keywords from recent posts
 * Analyzes product names, categories, and text content
 */
window.getTrendingKeywords = async function (limit = 6) {
    try {
        // Get posts from last 30 days (beta-friendly window)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: posts, error } = await window.supabase
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
window.saveSearchQuery = async function (userId, query) {
    if (!userId || !query || query.trim().length === 0) return;

    try {
        // Trim and normalize the query
        const normalizedQuery = query.trim().toLowerCase();

        // Check if this exact query already exists recently (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { data: existing } = await window.supabase
            .from('search_history')
            .select('id')
            .eq('user_id', userId)
            .eq('search_query', normalizedQuery)
            .gte('created_at', oneDayAgo.toISOString())
            .limit(1);

        // If query already exists recently, don't duplicate
        if (existing && existing.length > 0) return;

        // Insert new search query
        const { error } = await window.supabase
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
window.getRecentSearches = async function (userId, limit = 10) {
    if (!userId) return [];

    try {
        const { data, error } = await window.supabase
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
window.deleteSearchQuery = async function (userId, query) {
    if (!userId || !query) return;

    try {
        const { error } = await window.supabase
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
window.clearSearchHistory = async function (userId) {
    if (!userId) return;

    try {
        const { error } = await window.supabase
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

