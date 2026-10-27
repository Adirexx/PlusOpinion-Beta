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
const _VIDEO_EXTS = /\.(mp4|mov|webm|ogg|avi|mkv|m4v|3gp)(\?|$)/i
const _IMAGE_EXTS = /\.(jpg|jpeg|png|gif|webp|heic|avif|svg|bmp|tiff)(\?|$)/i

export function rewriteMediaUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (!url.includes('ogqyemyrxogpnwitumsr.supabase.co')) return url;

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.local');

    const isVideo = _VIDEO_EXTS.test(url);

    if (isLocalhost) {
        if (isVideo) {
            // Videos MUST go through a real proxy that supports:
            // - HTTP Range requests (206 Partial Content — required for seeking)
            // - Proper Content-Type, Content-Length, Accept-Ranges headers
            // wsrv.nl cannot provide any of these for video files.
            return url.replace(_SUPABASE_ORIGIN, 'https://plusopinion.com/supabase-api');
        }
        // Images: wsrv.nl CDN — very fast, compresses to WebP
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=900&fit=cover&output=webp&q=82`;
    }

    // Production (Cloudflare Pages): same-origin proxy handles everything
    return url.replace(_SUPABASE_ORIGIN, window.location.origin + '/supabase-api');
};

/**
 * Post-process an array of post objects to rewrite all media URLs.
 * Call this after any API fetch that returns post data with media_url / avatar_url.
 * This ensures the HTML never even sees raw supabase.co URLs.
 */



export function rewritePostUrls(posts) {
    if (!posts || !rewriteMediaUrl) return posts;
    const rewrite = rewriteMediaUrl;
    return posts.map(post => ({
        ...post,
        media_url: post.media_url ? rewrite(post.media_url) : post.media_url,
        verification_proof_url: post.verification_proof_url ? rewrite(post.verification_proof_url) : post.verification_proof_url,
        profiles: post.profiles ? {
            ...post.profiles,
            avatar_url: post.profiles.avatar_url ? rewrite(post.profiles.avatar_url) : post.profiles.avatar_url
        } : post.profiles
    }));
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

    // Get public URL
    const { data } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

    return rewriteMediaUrl ? rewriteMediaUrl(data.publicUrl) : data.publicUrl;
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


