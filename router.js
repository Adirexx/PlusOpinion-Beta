/**
 * Router - Client-Side Navigation System
 * 
 * Provides SPA-style navigation without full page reloads,
 * using the History API and dynamic content loading.
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.scrollPositions = new Map();
        this.isNavigating = false;

        // Listen for browser back/forward
        window.addEventListener('popstate', (e) => this.handlePopState(e));

        // Intercept all link clicks
        document.addEventListener('click', (e) => this.handleLinkClick(e));

        console.log('✅ Router initialized');
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., '/home', '/profile/:id')
     * @param {Function} handler - Function to call when route is activated
     */
    register(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Navigate to a route
     * @param {string} path - Path to navigate to
     * @param {Object} state - State object to pass
     * @param {boolean} replace - Replace current history entry instead of push
     */
    async navigate(path, state = {}, replace = false) {
        if (this.isNavigating) {
            console.warn('Navigation already in progress');
            return;
        }

        this.isNavigating = true;

        try {
            // Save current scroll position
            if (this.currentRoute) {
                this.scrollPositions.set(this.currentRoute, window.scrollY);
            }

            // Find matching route
            const { handler, params } = this.matchRoute(path);

            if (!handler) {
                console.error('No route handler found for:', path);
                this.isNavigating = false;
                return;
            }

            // Get clean path for display
            const cleanPath = window.RouteCleaner ? window.RouteCleaner.getCleanPath(path) : path;

            // Update browser history
            if (replace) {
                window.history.replaceState({ path, ...state }, '', cleanPath);
            } else {
                window.history.pushState({ path, ...state }, '', cleanPath);
            }

            // Show loading state
            this.showLoadingState();

            // Call route handler
            await handler({ params, state, path });

            // Update current route
            this.currentRoute = path;

            // Restore or reset scroll position
            const savedScroll = this.scrollPositions.get(path);
            if (savedScroll !== undefined) {
                window.scrollTo(0, savedScroll);
            } else {
                window.scrollTo(0, 0);
            }

            // Hide loading state
            this.hideLoadingState();

        } catch (error) {
            console.error('Navigation error:', error);
            this.hideLoadingState();
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * Match path to registered route
     * @private
     */
    matchRoute(path) {
        for (const [pattern, handler] of this.routes.entries()) {
            const params = this.extractParams(pattern, path);
            if (params !== null) {
                return { handler, params };
            }
        }
        return { handler: null, params: null };
    }

    /**
     * Extract parameters from path
     * @private
     */
    extractParams(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                const paramName = patternParts[i].slice(1);
                params[paramName] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }

        return params;
    }

    /**
     * Handle browser back/forward
     * @private
     */
    async handlePopState(e) {
        const path = e.state?.path || window.location.pathname;
        await this.navigate(path, e.state || {}, true);
    }

    /**
     * Handle link clicks
     * @private
     */
    handleLinkClick(e) {
        // Check if it's a navigation link
        const link = e.target.closest('[data-route]');
        if (!link) return;

        e.preventDefault();
        const path = link.getAttribute('data-route');
        this.navigate(path);
    }

    /**
     * Show loading state during navigation
     * @private
     */
    showLoadingState() {
        // Add loading class to body
        document.body.classList.add('route-loading');

        // Dispatch event for custom loading UI
        window.dispatchEvent(new CustomEvent('route:loading'));
    }

    /**
     * Hide loading state
     * @private
     */
    hideLoadingState() {
        document.body.classList.remove('route-loading');
        window.dispatchEvent(new CustomEvent('route:loaded'));
    }

    /**
     * Get current route path
     */
    getCurrentPath() {
        return this.currentRoute || window.location.pathname;
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }
}

/**
 * RouteCleaner - Handles URL masking for professional appearance
 */
class RouteCleaner {
    constructor() {
        this.mapping = {
            '/index.html': '/',
            '/HOMEPAGE_FINAL.HTML': '/feed',
            '/BOOKMARKS.HTML': '/bookmarks',
            '/CATAGORYPAGE.HTML': '/categories',
            '/MY SPACE FINAL (USER).HTML': '/myspace',
            '/MY SPACE FINAL(COMPANIES).HTML': '/workspace',
            '/NOTIFICATION PANEL.HTML': '/notifications',
            '/PRIVATE OWNER PROFILE.HTML': '/myprofile',
            '/PUBLIC POV PROFILE.HTML': '/profile',
            '/onboarding.html': '/onboarding',
            '/reset-password.html': '/reset-password',
            '/change-password.html': '/change-password',
            '/ABOUT.HTML': '/about',
            '/SUPPORT.HTML': '/support',
            '/PRIVACY_POLICY.HTML': '/privacy-policy',
            '/TERMS_AND_CONDITIONS.HTML': '/t&c'
        };

        // Create reverse mapping for lookup
        this.reverseMapping = Object.fromEntries(
            Object.entries(this.mapping).map(([k, v]) => [v, k])
        );
    }

    /**
     * Clean current URL without reloading
     */
    cleanCurrentUrl() {
        // Skip on localhost to prevent 404s on refresh
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🏗️ Development mode: Skipping URL masking');
            return;
        }

        const fullPath = window.location.pathname;
        const decodedPath = decodeURIComponent(fullPath);
        const hash = window.location.hash;
        const search = window.location.search;

        // Find if current path is a physical file that needs masking
        for (const [file, cleanPath] of Object.entries(this.mapping)) {
            const decodedFile = decodeURIComponent(file);
            if (decodedPath.endsWith(decodedFile) || decodedPath === decodedFile) {
                const newUrl = cleanPath + search + hash;
                window.history.replaceState(null, '', newUrl);
                console.log(`✨ URL Cleaned: ${decodedFile} -> ${cleanPath}`);
                return;
            }
        }
    }

    /**
     * Get physical file for a clean path
     */
    getFileForPath(path) {
        return this.reverseMapping[path] || path;
    }

    /**
     * Get clean path for a physical file
     */
    getCleanPath(file) {
        // Skip on localhost to prevent navigations to non-existent clean paths
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return file;
        }

        // Normalize file path (remove leading dot/slash for comparison)
        const normalizedFile = file.startsWith('/') ? file : '/' + file;
        return this.mapping[normalizedFile] || file;
    }
}

// Create global instances
window.RouteCleaner = new RouteCleaner();
window.Router = new Router();

// Automatically clean URL on load
window.addEventListener('DOMContentLoaded', () => {
    window.RouteCleaner.cleanCurrentUrl();
});

// Add CSS for route transitions
const style = document.createElement('style');
style.textContent = `
    body.route-loading {
        pointer-events: none;
    }
    
    body.route-loading::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        animation: routeProgress 0.5s ease-in-out;
        z-index: 9999;
    }
    
    @keyframes routeProgress {
        from {
            transform: translateX(-100%);
        }
        to {
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Router styles loaded');
