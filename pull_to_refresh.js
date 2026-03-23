/**
 * PullToRefresh - Flawless Native-Feel Web Implementation
 * 
 * Rebuilt to perfectly distinguish between horizontal scrolls, 
 * upward vertical scrolls, and genuine pull-to-refresh intents.
 */

class PullToRefresh {
    constructor(options = {}) {
        this.options = {
            threshold: 70,       // pixels required to trigger refresh
            maxPull: 130,        // soft limit for pull line
            resistance: 2.5,     // damping factor
            ...options
        };

        this.state = {
            pulling: false,
            pullDistance: 0,
            refreshing: false,
            
            // Gesture Tracking
            startY: 0,
            startX: 0,
            isIntentAnalyzed: false,
            isValidPTR: false, // true ONLY if user is definitively pulling down at top of page
            isLockedOut: false // true if user is scrolling up or horizontally
        };

        this.enabled = true; // Global toggle
        this.refreshHandler = null;
        this.indicator = null;

        // Bind for event listeners
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    init() {
        this.createIndicator();
        // Use passive: false for touchmove so we can preventDefault() and stop native scrolling when pulling
        document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
        console.log('✅ PullToRefresh (V2 Flawless) initialized');
    }

    createIndicator() {
        // Remove existing if any
        if (document.querySelector('.ptr-indicator')) {
            document.querySelector('.ptr-indicator').remove();
        }

        this.indicator = document.createElement('div');
        this.indicator.className = 'ptr-indicator';
        this.indicator.innerHTML = `
            <div class="ptr-spinner-circle">
                <svg viewBox="0 0 24 24" fill="none" class="ptr-spinner-icon" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                </svg>
            </div>
        `;
        document.body.appendChild(this.indicator);
        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('ptr-styles')) return;

        const style = document.createElement('style');
        style.id = 'ptr-styles';
        style.textContent = `
            .ptr-indicator {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                z-index: 10; /* Keep it below the main header (typically z-index > 50) */
                pointer-events: none;
                /* Starting position hidden behind the top header and scaled down */
                transform: translateY(10px) scale(0.4); 
                transition: transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.25s ease-out;
                opacity: 0;
            }

            .ptr-indicator.pulling {
                transition: none;
                /* Opacity handled dynamically via JS */
            }

            .ptr-indicator.refreshing {
                opacity: 1;
                /* Drop below the header and pop to full scale */
                transform: translateY(80px) scale(1) !important;
                transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            .ptr-spinner-circle {
                width: 36px;
                height: 36px;
                background: rgba(3, 4, 18, 0.9);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                color: #fff;
            }

            .ptr-spinner-icon {
                width: 18px;
                height: 18px;
                transform-origin: center;
                transition: transform 0.1s;
            }

            .ptr-indicator.refreshing .ptr-spinner-icon {
                animation: ptr-spin 0.8s linear infinite;
            }

            @keyframes ptr-spin {
                to { transform: rotate(360deg); }
            }

            body.ptr-active {
                /* When actively pulling, stop weird bounce effects */
                overscroll-behavior-y: contain;
            }
        `;
        document.head.appendChild(style);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) this.resetIndicator();
    }

    /**
     * Finds if the user is touching inside a container that handles its own scrolling.
     */
    getScrollableParent(node) {
        if (node == null) return null;
        if (node === document.body || node === document.documentElement) return null;
        
        const style = window.getComputedStyle(node);
        const overflowY = style.getPropertyValue('overflow-y');
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
        
        if (isScrollable) {
            return node;
        } else {
            return this.getScrollableParent(node.parentNode);
        }
    }

    handleTouchStart(e) {
        if (!this.enabled || this.state.refreshing) return;
        
        // Single touches only
        if (e.touches.length > 1) return;

        // Reset tracking state completely for the new gesture
        this.state.isIntentAnalyzed = false;
        this.state.isValidPTR = false;
        this.state.isLockedOut = false;
        this.state.pulling = false;
        this.state.pullDistance = 0;

        const target = e.target;

        // 1. GLOBAL IGNORE: Never trigger on horizontal carousels or explicitly ignored elements
        // Also don't trigger inside side-panels or context menus if they are open
        if (target.closest('.ptr-ignore, .carousel, .horizontal-scroll, .inbox-bottom-sheet')) {
            this.state.isLockedOut = true;
            return;
        }

        // 2. CHECK SCROLL POSITIONS
        const scrollableParent = this.getScrollableParent(target);
        const scrollTop = scrollableParent ? scrollableParent.scrollTop : (window.scrollY || document.documentElement.scrollTop);
        
        // If we are NOT perfectly at the top, lock out immediately
        if (scrollTop > 5) {
            this.state.isLockedOut = true;
            return;
        }

        // 3. STRICT BOUNDARY CHECK
        // PTR must be initiated from the upper 40% of the screen.
        // E.g. scrolling up from the bottom nav bar should NEVER trigger PTR.
        if (e.touches[0].clientY > window.innerHeight * 0.4) {
            this.state.isLockedOut = true;
            return;
        }

        // We passed the initial conditions lock!
        // Record starting coordinates
        this.state.startY = e.touches[0].clientY;
        this.state.startX = e.touches[0].clientX;
    }

    handleTouchMove(e) {
        // If disabled, locked out, or already refreshing, ignore entirely
        if (!this.enabled || this.state.refreshing || this.state.isLockedOut) return;

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const diffY = currentY - this.state.startY;
        const diffX = currentX - this.state.startX;

        // -----------------------------------------------------------------
        // PHASE 1: GESTURE INTENT ANALYSIS (Occurs strictly once per touch)
        // -----------------------------------------------------------------
        if (!this.state.isIntentAnalyzed) {
            // Give the user 7 pixels of leeway to establish direction
            if (Math.abs(diffY) < 7 && Math.abs(diffX) < 7) {
                return; // Wait for more movement to confidently judge
            }
            
            this.state.isIntentAnalyzed = true;

            // FLAWLESS RULE 1: Is this a HORIZONTAL swipe?
            // If the X movement is > 80% of the Y movement, it's a diagonal/horizontal swipe.
            if (Math.abs(diffX) > Math.abs(diffY) * 0.8) {
                this.state.isLockedOut = true;
                return;
            }

            // FLAWLESS RULE 2: Is this an UPWARD swipe? (Scrolling page down)
            if (diffY < 0) {
                this.state.isLockedOut = true;
                return;
            }

            // If we passed both rules, the user is definitively pulling straight down actively at scrollTop 0!
            this.state.isValidPTR = true;
        }

        // -----------------------------------------------------------------
        // PHASE 2: ACTIVE PULL HANDLING
        // -----------------------------------------------------------------
        if (this.state.isValidPTR && diffY > 0) {
            // STOP the browser from rubber-banding or natively scrolling
            if (e.cancelable) e.preventDefault();
            
            // Add tracking class to body
            if (!this.state.pulling) {
                this.state.pulling = true;
                document.body.classList.add('ptr-active');
            }

            // Apply friction physics
            let pullDistance = diffY / this.options.resistance;
            
            // Logarithmic damping for native-like extreme pulling limits
            if (pullDistance > this.options.maxPull) {
                const extra = pullDistance - this.options.maxPull;
                pullDistance = this.options.maxPull + Math.log(extra + 1) * 8;
            }

            this.state.pullDistance = pullDistance;
            this.updateIndicator(pullDistance);
        }
    }

    updateIndicator(pullDistance) {
        this.indicator.classList.add('pulling');

        // Translate downward from under the header based on pull progress
        const progress = Math.min(pullDistance / this.options.threshold, 1);
        
        // translateY maps cleanly to progress (10px -> 80px)
        const translateY = 10 + (progress * 70); 
        const finalY = Math.min(translateY, 90);
        
        // Scale maps from 0.5 to 1.0 based on pull intensity
        const scale = 0.5 + (progress * 0.5);

        this.indicator.style.transform = `translateY(${finalY}px) scale(${scale})`;
        this.indicator.style.opacity = progress.toString();

        const rotation = progress * 180; 
        const icon = this.indicator.querySelector('.ptr-spinner-icon');
        icon.style.transform = `rotate(${rotation}deg)`;
    }

    async handleTouchEnd(e) {
        // Only fire if we were actively pulling
        if (!this.state.pulling) return;

        this.state.pulling = false;
        document.body.classList.remove('ptr-active');

        // Check against threshold
        if (this.state.pullDistance >= this.options.threshold) {
            await this.triggerRefresh();
        } else {
            this.resetIndicator();
        }
    }

    async triggerRefresh() {
        this.state.refreshing = true;
        this.indicator.classList.remove('pulling');
        this.indicator.classList.add('refreshing');

        // Note: transform logic is handled by CSS .refreshing class (!important)
        
        try {
            if (this.refreshHandler) {
                // Execute their refresh callback (which should return a promise)
                await this.refreshHandler();
            }
            // Minimum guaranteed spin time for visual feedback purely
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
            console.error('[PTR] Refresh error:', error);
        }

        this.resetIndicator();
    }

    resetIndicator() {
        this.indicator.classList.remove('pulling', 'refreshing');
        this.indicator.style.transform = 'translateY(10px) scale(0.4)';
        this.indicator.style.opacity = '0';
        
        const icon = this.indicator.querySelector('.ptr-spinner-icon');
        icon.style.transform = 'rotate(0deg)';

        this.state.pullDistance = 0;
        this.state.refreshing = false;
        this.state.isLockedOut = false;
        this.state.isValidPTR = false;
    }

    /**
     * Interface to bind the callback
     */
    onRefresh(handler) {
        this.refreshHandler = handler;
        console.log('✅ PTR handler bounded');
    }

    /**
     * Programmatic trigger
     */
    async refresh() {
        if (this.state.refreshing) return;
        this.state.pullDistance = this.options.threshold;
        await this.triggerRefresh();
    }

    destroy() {
        if (this.indicator) {
            this.indicator.remove();
        }
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// Global initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PullToRefresh = new PullToRefresh();
        window.PullToRefresh.init();
    });
} else {
    window.PullToRefresh = new PullToRefresh();
    window.PullToRefresh.init();
}
