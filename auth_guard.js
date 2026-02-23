/**
 * Auth Guard - Simple Onboarding Enforcement
 * 
 * Logic:
 * - On auth pages (onboarding, reset-password, change-password): skip all checks
 * - No user logged in: redirect to index.html
 * - User logged in but onboarding incomplete: redirect to onboarding.html
 * - User logged in and onboarding complete: allow access
 */

window.checkOnboardingStatus = async function () {
    try {
        // Skip checks on auth pages - let them handle their own logic
        const path = window.location.pathname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const isPostDeepLink = searchParams.has('post') || path.startsWith('/post/');
        const isProfileDeepLink = path.startsWith('/profile/');

        if (path.includes('onboarding') ||
            path.includes('reset-password') ||
            path.includes('change-password') ||
            path.includes('index') ||
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

        // Check if onboarding is complete
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('terms_accepted, profile_completed, username, full_name')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            window.navigateTo('onboarding.html');
            return false;
        }

        const isComplete = profile.terms_accepted === true
            && profile.profile_completed === true
            && profile.username
            && profile.full_name;

        if (!isComplete) {
            window.navigateTo('onboarding.html');
            return false;
        }

        return true;

    } catch (err) {
        console.error('Auth guard error:', err);
        // On error, redirect to login - don't create loops
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
 * Accept terms for current user
 */
window.acceptTerms = async function () {
    try {
        const user = await window.getCurrentUser();
        if (!user) return false;

        const { error } = await window.supabase
            .from('profiles')
            .update({ terms_accepted: true })
            .eq('id', user.id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error accepting terms:', err);
        return false;
    }
};

/**
 * Get current user's profile
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
