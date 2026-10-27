/**
 * api/auth.js — Profile/Auth helper functions from api.js
 *
 * These are the profile-related helpers that appeared in api.js
 * (acceptTerms, hasAcceptedTerms, checkUsernameAvailable, completeProfile).
 * They are separate from src/lib/auth.js which contains the full auth flows.
 *
 * DUPLICATION NOTE: getUserProfile, getUserProfileByUsername, checkUsernameAvailable
 * appeared in BOTH auth.js and api.js in the old codebase. api.js version wins
 * (last-definition-wins). The auth.js versions are in src/lib/auth.js.
 * These api/auth.js versions are what api.js exported; they match the api.js body.
 */

import { supabase } from '../supabaseClient.js'
import { getCurrentUser } from '../auth.js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env.js'

/**
 * Accept terms — CORS workaround preserved.
 * Uses raw fetch() to PATCH profiles — see src/lib/auth.js CORS note.
 * This is the api.js version (also appears in auth_guard.js; behavior is identical).
 */
export async function acceptTerms() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    // CORS workaround: use raw fetch() instead of supabase.from().update()
    // See note in src/lib/auth.js — preserved as-is per §1 parity rules.
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error('No session token');

    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                terms_accepted: true,
                terms_accepted_at: new Date().toISOString(),
                privacy_accepted: true,
                privacy_accepted_at: new Date().toISOString()
            })
        }
    );

    if (!res.ok) throw new Error(`Terms accept failed: HTTP ${res.status}`);
    return true;
}

export async function hasAcceptedTerms() {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('profiles')
        .select('terms_accepted')
        .eq('id', user.id)
        .single();

    if (error) throw error;
    return data?.terms_accepted || false;
}

export async function checkUsernameAvailable(username) {
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

    if (error) throw error;
    return !data;
}

export async function completeProfile(profileData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
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
}
