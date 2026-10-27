/**
 * categories.js — Categories API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'

export async function getCategories() {
    if (!supabase || !supabase.from) throw new Error('Supabase client not initialized');

    // Try fetching from 'categories' table if it exists
    const { data, error } = await supabase
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
        { id: 'beauty-skincare', name: 'Beauty & Skin Care', icon: 'Smile', section: 'all', color: 'from-pink-400 to-rose-400' },
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



export async function getSubCategories(categoryId) {
    if (!supabase || !supabase.from) return getFallbackSubs(categoryId);

    try {
        const { data, error } = await supabase
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



export async function getPopularCategories(limit = 6) {
    if (!supabase || !supabase.rpc) {
        // Fallback: Query categories table with 'popular' section manual flag 
        // OR count posts per category
        const { data, error } = await supabase
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
    const { data, error } = await supabase
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



export async function getRecommendedCategories(limit = 4) {
    const user = await getCurrentUser();
    if (!user) return []; // New users get nothing here, default to 'All'

    try {
        // 1. Get user's recent liked/commented category IDs
        // This is a naive recommendation: what you interact with the most
        const { data: interactions, error: iterError } = await supabase
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
        const { data: cats, error: catsError } = await supabase
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



export async function getBrandsByCategory(categoryId, subCategoryId = null) {
    if (!supabase) throw new Error('Supabase not initialized');

    // 1. Get unique brand names from posts in this category/sub-category
    let query = supabase
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
                const { data: cat } = await supabase.from('categories').select('id, name').eq('id', categoryId).single();
                if (cat) categoryName = cat.name.toLowerCase();
            }
            if (subCategoryId && subCategoryId.length > 20) {
                const { data: sub } = await supabase.from('sub_categories').select('id, title').eq('id', subCategoryId).single();
                if (sub) subCategoryName = sub.title.toLowerCase();
            }
        } catch (e) { console.warn("Could not resolve IDs to names", e); }

        return getFallbackBrands(categoryName, subCategoryName);
    }

    // 2. Fetch full company details for these brands from the 'companies' table
    const { data: companies } = await supabase
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


