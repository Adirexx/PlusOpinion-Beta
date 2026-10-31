/**
 * media.js — Media API module
 *
 * Ported from api.js. Function names and signatures are IDENTICAL.
 * Only changes: import/export syntax; window.supabase → supabase import;
 * window.getCurrentUser → getCurrentUser import; window.location.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'

const _SUPABASE_ORIGIN = 'https://ogqyemyrxogpnwitumsr.supabase.co'
const _PROXY_ORIGIN = 'https://plusopinion.com/supabase-api'

/**
 * Recovers the direct, canonical Supabase URL from any proxied, CDN, or wsrv.nl URL.
 */
export function getDirectSupabaseUrl(url) {
    if (!url || typeof url !== 'string') return url;

    // Unwrap wsrv.nl if present
    if (url.includes('wsrv.nl/?url=')) {
        try {
            const raw = decodeURIComponent(url.split('url=')[1].split('&')[0]);
            return getDirectSupabaseUrl(raw);
        } catch (_) {}
    }

    // Revert /supabase-api proxy to direct supabase.co
    if (url.includes('/supabase-api')) {
        return url.replace(/https?:\/\/[^\/]+\/supabase-api/, _SUPABASE_ORIGIN);
    }

    return url;
}

/**
 * Rewrites any Supabase storage URL to the high-performance Cloudflare proxy,
 * ensuring ISP-level resilience across both web and native mobile apps without
 * relying on fragile third-party CDNs.
 */
export function rewriteMediaUrl(url) {
    if (!url || typeof url !== 'string') return url;

    // If it's wrapped in wsrv.nl, unwrap it first
    if (url.includes('wsrv.nl/?url=')) {
        url = getDirectSupabaseUrl(url);
    }

    const isSupabase = url.includes('ogqyemyrxogpnwitumsr.supabase.co');
    const isAlreadyProxied = url.includes('/supabase-api');

    if (!isSupabase && !isAlreadyProxied) return url;

    // In web production: use same-origin proxy (window.location.origin + '/supabase-api')
    // In Capacitor mobile app / dev: use absolute https://plusopinion.com/supabase-api
    const isWebProd = typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        !window.location.protocol.startsWith('capacitor');

    const targetProxy = isWebProd
        ? window.location.origin + '/supabase-api'
        : _PROXY_ORIGIN;

    if (isSupabase) {
        return url.replace(_SUPABASE_ORIGIN, targetProxy);
    }

    // Standardize existing proxy URLs if needed
    if (isAlreadyProxied && !url.startsWith(targetProxy)) {
        return url.replace(/https?:\/\/[^\/]+\/supabase-api/, targetProxy);
    }

    return url;
};

/**
 * Post-process an array of post objects to rewrite all media URLs.
 * Call this after any API fetch that returns post data with media_url / avatar_url / images.
 * This ensures the HTML never even sees raw supabase.co URLs.
 */
export function rewritePostUrls(posts) {
    if (!posts || !Array.isArray(posts)) return posts;
    const rewrite = rewriteMediaUrl;

    return posts.map(post => {
        const mediaUrl = post.media_url ? rewrite(post.media_url) : post.media_url;
        const media = post.media ? rewrite(post.media) : mediaUrl;
        const images = Array.isArray(post.images)
            ? post.images.map(img => (typeof img === 'string' ? rewrite(img) : img))
            : post.images;

        return {
            ...post,
            media_url: mediaUrl,
            media: media,
            images: images,
            verification_proof_url: post.verification_proof_url ? rewrite(post.verification_proof_url) : post.verification_proof_url,
            profiles: post.profiles ? {
                ...post.profiles,
                avatar_url: post.profiles.avatar_url ? rewrite(post.profiles.avatar_url) : post.profiles.avatar_url
            } : post.profiles
        };
    });
};

/**
 * Get current authenticated user
 */
// getCurrentUser is now defined globally in auth.js for consistency and silence
// getCurrentUser = async function () { ... } 

/**
 * Get user's engraved specific number (Badge)
 * Logic: Rank by created_at ascending + 4 (So 1st user gets #5)
 */

export async function uploadMedia(file) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in to upload media');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload file to 'post-media' bucket
    const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get canonical public URL to store in DB
    const { data } = supabase.storage
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



export async function uploadVerificationProof(file) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_proof.${fileExt}`;

    const { error: uploadError } = await supabase.storage
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


