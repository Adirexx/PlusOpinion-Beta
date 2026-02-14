/**
 * NAVIGATION SYSTEM - Production Ready for Cloudflare Pages
 * 
 * Unified navigation function that works seamlessly across the platform.
 * Uses physical filenames for reliability, lets Cloudflare _redirects handle clean URLs.
 * 
 * Usage: window.navigateTo('HOMEPAGE_FINAL.HTML')
 */

window.navigateTo = function (page) {
    // Production-ready navigation for Cloudflare Pages
    // Always use physical filename - Cloudflare _redirects will show clean URL

    if (!page) {
        console.error('❌ navigateTo() called without page parameter');
        return;
    }

    // Navigate to the physical file
    // Cloudflare's _redirects file handles URL masking and display
    window.location.href = page;
};

console.log('✅ Navigation system loaded - Production ready for Cloudflare Pages');
