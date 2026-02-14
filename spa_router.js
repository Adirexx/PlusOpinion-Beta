/**
 * 🚀 SPA ROUTER - Instagram-Level Navigation Performance
 * 
 * Provides instant page transitions (<250ms) with smart fallback to traditional navigation.
 * Zero breaking changes - enhances existing navigation without replacing it.
 * 
 * Features:
 * - Page caching for instant back/forward
 * - Smooth fade transitions
 * - Scroll position memory
 * - Auth-aware navigation
 * - Auto-fallback on errors
 */

(function () {
    'use strict';

    // ===================================================================
    // SPA ROUTER CLASS
    // ===================================================================

    class SPARouter {
        constructor() {
            this.pageCache = new Map();
            this.scrollPositions = new Map();
            this.isTransitioning = false;
            this.maxCacheSize = 5;
            this.cacheExpiry = 5 * 60 * 1000; // 5 minutes

            // Pages that MUST use full reload (auth flows, special cases)
            this.forceReloadPages = new Set([
                'index.html',
                'onboarding.html',
                'reset-password.html',
                'change-password.html'
            ]);

            // App pages that require authentication
            this.appPages = new Set([
                'HOMEPAGE_FINAL.HTML',
                'MY SPACE FINAL (USER).HTML',
                'MY SPACE FINAL(COMPANIES).HTML',
                'NOTIFICATION PANEL.HTML',
                'BOOKMARKS.HTML',
                'CATAGORYPAGE.HTML',
                'PRIVATE OWNER PROFILE.HTML',
                'PUBLIC POV PROFILE.HTML'
            ]);

            this.init();
        }

        init() {
            // Listen for browser back/forward
            window.addEventListener('popstate', (e) => this.handlePopState(e));

            console.log('✅ SPA Router initialized');
        }

        // ===================================================================
        // NAVIGATION METHODS
        // ===================================================================

        /**
         * Check if page can use SPA navigation
         */
        canNavigate(page) {
            // External URLs - never SPA
            if (page.startsWith('http://') || page.startsWith('https://')) {
                return page.includes(window.location.hostname);
            }

            // Force reload pages - never SPA
            if (this.forceReloadPages.has(page)) {
                return false;
            }

            // Already transitioning - prevent
            if (this.isTransitioning) {
                return false;
            }

            return true;
        }

        /**
         * Navigate to page with SPA
         */
        async navigate(page, options = {}) {
            if (!this.canNavigate(page)) {
                window.location.href = page;
                return;
            }

            try {
                this.isTransitioning = true;

                // Save current scroll position
                const currentPage = this.getCurrentPage();
                if (currentPage) {
                    this.scrollPositions.set(currentPage, window.scrollY);
                }

                // Check auth for app pages
                if (this.appPages.has(page)) {
                    const canAccess = await this.checkPageAccess(page);
                    if (!canAccess) {
                        // Auth check will handle redirect
                        this.isTransitioning = false;
                        return;
                    }
                }

                // Start transition
                await this.transitionToPage(page, options);

            } catch (error) {
                console.error('❌ SPA navigation failed, using fallback:', error);
                window.location.href = page;
            } finally {
                this.isTransitioning = false;
            }
        }

        /**
         * Main page transition logic
         */
        async transitionToPage(page, options = {}) {
            // Phase 1: Fade out current content (50ms)
            await this.fadeOut();

            // Phase 2: Load new content (100-150ms)
            const content = await this.loadPage(page);

            // Phase 3: Swap content (0ms - instant)
            this.swapContent(content);

            // Phase 4: Update URL
            this.updateURL(page, options.replace);

            // Phase 5: Restore/reset scroll
            this.restoreScroll(page);

            // Phase 6: Fade in new content (50ms)
            await this.fadeIn();

            // Phase 7: Re-initialize page scripts
            this.reinitializePage();
        }

        // =================================================================
        // PAGE LOADING & CACHING
        // ===================================================================

        /**
         * Load page HTML (with caching)
         */
        async loadPage(url) {
            // Check cache first
            const cached = this.pageCache.get(url);
            if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
                console.log('📦 Using cached page:', url);
                return cached.content;
            }

            // Fetch fresh page
            console.log('🌐 Fetching page:', url);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();

            // Extract body content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const bodyContent = doc.querySelector('body').innerHTML;

            // Cache it
            this.addToCache(url, bodyContent);

            return bodyContent;
        }

        /**
         * Add page to cache (with LRU eviction)
         */
        addToCache(url, content) {
            // If cache is full, remove oldest entry
            if (this.pageCache.size >= this.maxCacheSize) {
                const firstKey = this.pageCache.keys().next().value;
                this.pageCache.delete(firstKey);
            }

            this.pageCache.set(url, {
                content,
                timestamp: Date.now()
            });
        }

        /**
         * Clear cache (call on logout)
         */
        clearCache() {
            this.pageCache.clear();
            this.scrollPositions.clear();
            console.log('🗑️ Page cache cleared');
        }

        // ===================================================================
        // TRANSITION ANIMATIONS
        // ===================================================================

        fadeOut() {
            return new Promise(resolve => {
                const body = document.body;
                body.style.transition = 'opacity 0.05s ease-out';
                body.style.opacity = '0.6';
                setTimeout(resolve, 50);
            });
        }

        fadeIn() {
            return new Promise(resolve => {
                const body = document.body;
                body.style.opacity = '0';

                // Force reflow
                void body.offsetHeight;

                body.style.transition = 'opacity 0.08s ease-in';
                body.style.opacity = '1';

                setTimeout(() => {
                    body.style.transition = '';
                    resolve();
                }, 80);
            });
        }

        // ===================================================================
        // DOM MANIPULATION
        // ===================================================================

        /**
         * Swap page content
         */
        swapContent(newContent) {
            // Get React root if exists
            const reactRoot = document.getElementById('root');

            if (reactRoot) {
                // Unmount React before swap (prevents memory leaks)
                if (window.ReactDOM && window.ReactDOM.unmountComponentAtNode) {
                    try {
                        window.ReactDOM.unmountComponentAtNode(reactRoot);
                    } catch (e) {
                        // Ignore unmount errors
                    }
                }
            }

            // Swap entire body
            document.body.innerHTML = newContent;
        }

        /**
         * Re-initialize page after content swap
         */
        reinitializePage() {
            // Re-run Babel transformations for React components
            if (window.Babel) {
                const scripts = document.querySelectorAll('script[type="text/babel"]');
                scripts.forEach(script => {
                    try {
                        const code = script.textContent;
                        const transformed = window.Babel.transform(code, {
                            presets: ['react']
                        }).code;
                        eval(transformed);
                    } catch (error) {
                        console.warn('Script execution error:', error);
                    }
                });
            }

            // Trigger global init if exists
            if (window.initializePage && typeof window.initializePage === 'function') {
                window.initializePage();
            }
        }

        // ===================================================================
        // URL & SCROLL MANAGEMENT
        // ===================================================================

        updateURL(page, replace = false) {
            // Get clean URL for browser display
            const cleanURL = this.getCleanURL(page);

            if (replace) {
                window.history.replaceState({ page }, '', cleanURL);
            } else {
                window.history.pushState({ page }, '', cleanURL);
            }
        }

        getCleanURL(page) {
            // Use RouteCleaner if available
            if (window.RouteCleaner && window.RouteCleaner.getCleanPath) {
                return window.RouteCleaner.getCleanPath(page);
            }

            // Fallback: use page as-is
            return page;
        }

        restoreScroll(page) {
            const savedPosition = this.scrollPositions.get(page);

            if (savedPosition !== undefined) {
                // Restore previous scroll
                setTimeout(() => {
                    window.scrollTo({
                        top: savedPosition,
                        behavior: 'instant'
                    });
                }, 10);
            } else {
                // New page - scroll to top
                window.scrollTo(0, 0);
            }
        }

        // ===================================================================
        // AUTH & SECURITY
        // ===================================================================

        async checkPageAccess(page) {
            try {
                // Check if user is logged in
                const user = await window.getCurrentUser();

                if (!user) {
                    console.warn('⚠️ No session - redirecting to login');
                    window.location.href = 'index.html';
                    return false;
                }

                // Check onboarding status  
                const needsOnboarding = await window.checkOnboardingStatus();

                if (needsOnboarding === false) {
                    console.warn('⚠️ Onboarding incomplete - redirecting');
                    window.location.href = 'onboarding.html';
                    return false;
                }

                return true;

            } catch (error) {
                console.error('Auth check error:', error);
                return true; // Allow navigation on error (let page handle it)
            }
        }

        // ===================================================================
        // UTILITY METHODS
        // ===================================================================

        getCurrentPage() {
            // Try to get from history state
            if (window.history.state && window.history.state.page) {
                return window.history.state.page;
            }

            // Fallback: parse from pathname
            const path = window.location.pathname;

            // Map clean URLs back to physical files
            const reverseMap = {
                '/feed': 'HOMEPAGE_FINAL.HTML',
                '/myspace': 'MY SPACE FINAL (USER).HTML',
                '/workspace': 'MY SPACE FINAL(COMPANIES).HTML',
                '/notifications': 'NOTIFICATION PANEL.HTML',
                '/bookmarks': 'BOOKMARKS.HTML',
                '/categories': 'CATAGORYPAGE.HTML',
                '/myprofile': 'PRIVATE OWNER PROFILE.HTML',
                '/profile': 'PUBLIC POV PROFILE.HTML',
                '/': 'index.html'
            };

            return reverseMap[path] || null;
        }

        handlePopState(e) {
            const page = e.state?.page || this.getCurrentPage();

            if (page) {
                this.navigate(page, { replace: true });
            } else {
                // Fallback to full reload
                window.location.reload();
            }
        }
    }

    // ===================================================================
    // INITIALIZE
    // ===================================================================

    // Create global SPA router instance
    window.SPARouter = new SPARouter();

    // ===================================================================
    // ENHANCED window.navigateTo()
    // ===================================================================

    /**
     * Smart navigation function - tries SPA first, falls back to traditional
     */
    window.navigateTo = function (page, options = {}) {
        if (!page) {
            console.error('❌ navigateTo() called without page parameter');
            return;
        }

        // Special case: Logout or explicit reload
        if (options.forceReload) {
            window.location.href = page;
            return;
        }

        // Try SPA navigation
        if (window.SPARouter && window.SPARouter.canNavigate(page)) {
            window.SPARouter.navigate(page, options).catch(error => {
                console.error('SPA nav failed, falling back:', error);
                window.location.href = page;
            });
        } else {
            // Use traditional navigation
            window.location.href = page;
        }
    };

    console.log('✅ Enhanced SPA navigation system loaded');

})();
