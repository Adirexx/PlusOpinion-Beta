/**
 * Authentication Guard for PlusOpinion
 * 
 * This module provides universal onboarding status checking.
 * Ensures NO user can access the platform without completing:
 * 1. Terms & Conditions acceptance
 * 2. Profile setup (username, full name, bio, avatar)
 * 
 * Usage: Import this file on any protected page
 */

/**
 * Check if user has completed full onboarding
 * Redirects to appropriate page if not
 * 
 * @returns {Promise<boolean>} true if onboarding complete, false if redirected
 */
window.checkOnboardingStatus = async function () {
    try {
        // 🚨 CRITICAL: Prevent redirect loop on authentication-related pages
        const currentPage = window.location.pathname;
        const isOnAuthPage = currentPage.includes('onboarding') ||
            currentPage === '/onboarding' ||
            currentPage.includes('reset-password') ||
            currentPage === '/reset-password' ||
            currentPage.includes('change-password') ||
            currentPage === '/change-password';

        // 1. Check if user is logged in
        const user = await window.getCurrentUser();

        if (!user) {
            // Not logged in → redirect to landing page
            console.warn('⚠️ No user session - redirecting to login');
            window.navigateTo('index.html');
            return false;
        }

        // 2. Check onboarding status in database
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('terms_accepted, profile_completed, username, full_name')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('❌ Error checking profile:', error);
            // If profile doesn't exist, redirect to onboarding (ONLY if not on auth pages)
            if (!isOnAuthPage) {
                window.navigateTo('onboarding.html');
            }
            return false;
        }

        if (!profile) {
            console.warn('⚠️ No profile found - redirecting to onboarding');
            // Redirect only if not on auth pages
            if (!isOnAuthPage) {
                window.navigateTo('onboarding.html');
            }
            return false;
        }

        // 3. Check if onboarding is complete
        const onboardingComplete = profile.terms_accepted === true
            && profile.profile_completed === true
            && profile.username !== null
            && profile.username !== ''
            && profile.full_name !== null
            && profile.full_name !== '';

        if (!onboardingComplete) {
            console.warn('⚠️ Onboarding incomplete - redirecting to onboarding');
            console.log('Onboarding status:', {
                terms_accepted: profile.terms_accepted,
                profile_completed: profile.profile_completed,
                has_username: !!profile.username,
                has_full_name: !!profile.full_name
            });
            // Redirect only if not on auth pages
            if (!isOnAuthPage) {
                window.navigateTo('onboarding.html');
            }
            return false;
        }

        // ✅ All checks passed - onboarding is complete
        console.log('✅ Onboarding complete - access granted');
        return true;

    } catch (err) {
        console.error('❌ Error in onboarding check:', err);
        // On error, redirect to onboarding to be safe (ONLY if not on auth pages)
        const currentPage = window.location.pathname;
        const isOnAuthPage = currentPage.includes('onboarding') ||
            currentPage === '/onboarding' ||
            currentPage.includes('reset-password') ||
            currentPage === '/reset-password' ||
            currentPage.includes('change-password') ||
            currentPage === '/change-password';
        if (!isOnAuthPage) {
            window.navigateTo('onboarding.html');
        }
        return false;
    }
};

/**
 * Check if user has accepted terms (for onboarding page flow)
 * @returns {Promise<boolean>}
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
        console.error('Error checking terms acceptance:', err);
        return false;
    }
};

/**
 * Mark terms as accepted
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
window.acceptTerms = async function (userId) {
    try {
        const { error } = await window.supabase
            .from('profiles')
            .update({ terms_accepted: true })
            .eq('id', userId);

        if (error) throw error;

        // Terms accepted for user
        return true;
    } catch (err) {
        console.error('❌ Error accepting terms:', err);
        return false;
    }
};

/**
 * Get my profile data
 * @returns {Promise<Object>}
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
        console.error('Error getting profile:', err);
        return null;
    }
};

console.log('✅ Auth Guard loaded - onboarding enforcement active');
