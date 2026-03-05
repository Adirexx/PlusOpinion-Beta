/**
 * Auth Guard - Onboarding Enforcement
 *
 * Logic:
 * - On auth pages (reset-password, change-password, index): skip all checks
 * - No user logged in: redirect to index.html
 * - User logged in but profile incomplete: redirect to index.html (profile setup overlay handles it)
 * - User logged in and profile complete: allow access
 */

window.checkOnboardingStatus = async function () {
    try {
        const path = window.location.pathname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const isPostDeepLink = searchParams.has('post') || path.startsWith('/post/');
        const isProfileDeepLink = path.startsWith('/profile/');

        // Skip checks on these pages — they handle their own logic
        const isIndexPage = path === '/' ||
            path === '/index.html' ||
            path === '/index';

        if (isIndexPage ||
            path.includes('reset-password') ||
            path.includes('change-password') ||
            isProfileDeepLink ||
            (isPostDeepLink && (path.includes('feed') || path.includes('homepage_final') || path.startsWith('/post/')))) {
            return true;
        }

        // Check if user is logged in
        const user = await window.getCurrentUser();
        if (!user) {
            window.navigateTo('index.html');
            return false;
        }

        // Check if profile is fully complete
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('terms_accepted, profile_completed, username, full_name')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            // Profile missing → go to index, profile setup overlay will show
            window.navigateTo('index.html');
            return false;
        }

        const isComplete = profile.terms_accepted === true
            && profile.profile_completed === true
            && profile.username
            && profile.full_name;

        if (!isComplete) {
            // Incomplete profile → go to index, overlay will detect and show profile setup
            window.navigateTo('index.html');
            return false;
        }

        return true;

    } catch (err) {
        console.error('[AuthGuard] Error:', err);
        window.navigateTo('index.html');
        return false;
    }
};

/**
 * Check if user has accepted terms
 */
window.hasAcceptedTerms = async function () {
    try {
        const user = await window.getCurrentUser();
        if (!user) return false;

        const { data: profile } = await window.supabase
            .from('profiles')
            .select('terms_accepted')
            .eq('id', user.id)
            .single();

        return profile?.terms_accepted === true;
    } catch (err) {
        return false;
    }
};

/**
 * Accept terms for current user — uses direct fetch() to bypass SW proxy CORS issues
 */
window.acceptTerms = async function () {
    try {
        const user = await window.getCurrentUser();
        if (!user) return false;

        const { data: sessionData } = await window.supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) return false;

        const SUPABASE_URL = 'https://ogqyemyrxogpnwitumsr.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncXllbXlyeG9ncG53aXR1bXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTA4MDAsImV4cCI6MjA4NTAyNjgwMH0.cyWTrBkbKdrgrm31k5EgefdTBOsEeBaHjsD4NgGVjCM';

        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    terms_accepted: true,
                    terms_accepted_at: new Date().toISOString()
                })
            }
        );

        return res.ok;
    } catch (err) {
        console.error('[AuthGuard] Error accepting terms:', err.message);
        return false;
    }
};


/**
 * Get current user's full profile
 */
window.getMyProfile = async function () {
    try {
        const user = await window.getCurrentUser();
        if (!user) return null;

        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return profile;
    } catch (err) {
        return null;
    }
};

console.log('✅ Auth Guard loaded');
