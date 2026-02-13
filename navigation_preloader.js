/**
 * Navigation Preloader
 * 
 * Preloads pages on hover to make navigation feel instant
 */

class NavigationPreloader {
    constructor() {
        this.preloadedPages = new Set();
        this.hoverTimeout = null;

        // Listen for link hovers
        document.addEventListener('mouseover', (e) => this.handleHover(e));
        document.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: true });

        console.log('✅ Navigation Preloader initialized');
    }

    handleHover(e) {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!this.shouldPreload(href)) return;

        // Debounce: only preload if hovering for 100ms
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => {
            this.preloadPage(href);
        }, 100);
    }

    handleTouch(e) {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        if (this.shouldPreload(href)) {
            this.preloadPage(href);
        }
    }

    shouldPreload(href) {
        if (!href) return false;

        // Only preload internal HTML pages
        if (href.startsWith('http') && !href.includes(window.location.host)) return false;
        if (!href.endsWith('.HTML') && !href.endsWith('.html')) return false;
        if (this.preloadedPages.has(href)) return false;

        return true;
    }

    preloadPage(href) {
        if (this.preloadedPages.has(href)) return;

        console.log('🔄 Preloading:', href);
        this.preloadedPages.add(href);

        // Create prefetch link
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        link.as = 'document';
        document.head.appendChild(link);

        // Also preload critical resources
        this.preloadResources(href);
    }

    preloadResources(pageHref) {
        // Preload common resources that all pages need
        const resources = [
            './api.js',
            './supabase.js',
            './state_manager.js',
            './pull_to_refresh.js'
        ];

        resources.forEach(resource => {
            if (!this.preloadedPages.has(resource)) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = resource;
                link.as = 'script';
                document.head.appendChild(link);
                this.preloadedPages.add(resource);
            }
        });
    }

    // Preload specific pages programmatically
    preload(href) {
        this.preloadPage(href);
    }
}

// Create global instance
window.NavigationPreloader = new NavigationPreloader();

// Preload common pages immediately
setTimeout(() => {
    // Preload most common navigation targets
    const commonPages = [
        'HOMEPAGE_FINAL.HTML',
        'BOOKMARKS.HTML',
        'NOTIFICATION PANEL.HTML'
    ];

    commonPages.forEach(page => {
        if (window.location.pathname !== `/${page}`) {
            window.NavigationPreloader.preload(page);
        }
    });
}, 2000); // Wait 2 seconds after page load

console.log('✅ Navigation Preloader ready');
