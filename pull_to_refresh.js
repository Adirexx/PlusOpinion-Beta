/**
 * PullToRefresh - Simple & Clean Pull-to-Refresh
 * 
 * Minimal white circular spinner design
 */

class PullToRefresh {
    constructor(options = {}) {
        this.options = {
            threshold: 60,
            maxPull: 90,
            resistance: 2.5,
            ...options
        };

        this.state = {
            pulling: false,
            pullDistance: 0,
            refreshing: false,
            canPull: false,
            startY: 0,
            startX: 0
        };

        this.refreshHandler = null;
        this.indicator = null;
    }

    init() {
        this.createIndicator();
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        console.log('✅ PullToRefresh initialized');
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'ptr-indicator';
        this.indicator.innerHTML = `
            <div class="ptr-spinner"></div>
        `;
        document.body.appendChild(this.indicator);
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ptr-indicator {
                position: fixed;
                top: 0;
                left: 50%;
                transform: translateX(-50%) translateY(0);
                z-index: 5;
                pointer-events: none;
                transition: transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.25s ease-out;
                opacity: 0;
            }

            .ptr-indicator.pulling {
                transition: none;
                opacity: 1;
            }

            .ptr-indicator.refreshing {
                opacity: 1;
            }

            .ptr-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top-color: #ffffff;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }

            .ptr-indicator.refreshing .ptr-spinner {
                animation: ptr-spin 0.8s linear infinite;
            }

            @keyframes ptr-spin {
                to { transform: rotate(360deg); }
            }

            body.ptr-active {
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }

    handleTouchStart(e) {
        const windowScrollTop = window.scrollY || document.documentElement.scrollTop;
        const bodyScrollTop = document.body.scrollTop;
        let scrollTop = windowScrollTop || bodyScrollTop;

        const target = e.target;
        let scrollableParent = target.closest('.overflow-y-auto, .overflow-auto, [style*="overflow-y"], [style*="overflow:"]');
        if (scrollableParent) {
            scrollTop = scrollableParent.scrollTop;
        }

        if (scrollTop === 0 && !this.state.refreshing) {
            // Only allow pull from upper half of the screen
            if (e.touches[0].clientY < window.innerHeight / 2) {
                this.state.canPull = true;
                this.state.startY = e.touches[0].clientY;
                this.state.startX = e.touches[0].clientX;
            }
        }
    }

    handleTouchMove(e) {
        if (!this.state.canPull || this.state.refreshing) return;

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const diff = currentY - this.state.startY;
        const diffX = currentX - this.state.startX;

        // Prevent activation during horizontal swipes (prioritize vertical movement)
        if (Math.abs(diffX) > Math.abs(diff)) {
            this.state.canPull = false;
            return;
        }

        if (diff > 0) {
            e.preventDefault();

            const pullDistance = Math.min(
                diff / this.options.resistance,
                this.options.maxPull
            );

            this.state.pulling = true;
            this.state.pullDistance = pullDistance;
            this.updateIndicator(pullDistance);
            document.body.classList.add('ptr-active');
        }
    }

    updateIndicator(pullDistance) {
        this.indicator.classList.add('pulling');

        // Move indicator down based on pull distance
        // Starting from translateY(20px) which is hidden behind the 60px header
        const translateY = 20 + pullDistance;
        this.indicator.style.transform = `translateX(-50%) translateY(${translateY}px)`;

        // Rotate spinner based on pull progress
        const rotation = (pullDistance / this.options.threshold) * 360;
        const spinner = this.indicator.querySelector('.ptr-spinner');
        spinner.style.transform = `rotate(${rotation}deg)`;
    }

    async handleTouchEnd(e) {
        if (!this.state.pulling) return;

        this.state.pulling = false;
        this.state.canPull = false;
        document.body.classList.remove('ptr-active');

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

        // Keep indicator visible below header (80px from top)
        this.indicator.style.transform = `translateX(-50%) translateY(80px)`;

        try {
            if (this.refreshHandler) {
                await this.refreshHandler();
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Refresh error:', error);
        }

        this.resetIndicator();
    }

    resetIndicator() {
        this.indicator.classList.remove('pulling', 'refreshing');
        this.indicator.style.transform = 'translateX(-50%) translateY(0)';

        const spinner = this.indicator.querySelector('.ptr-spinner');
        spinner.style.transform = 'rotate(0deg)';

        this.state.pullDistance = 0;
        this.state.refreshing = false;
    }

    onRefresh(handler) {
        this.refreshHandler = handler;
        console.log('✅ Pull-to-refresh handler set');
    }

    async refresh() {
        if (this.state.refreshing) return;
        this.state.pullDistance = this.options.threshold;
        await this.triggerRefresh();
    }

    destroy() {
        if (this.indicator) {
            this.indicator.remove();
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PullToRefresh = new PullToRefresh();
        window.PullToRefresh.init();
        console.log('✅ PullToRefresh ready');
    });
} else {
    window.PullToRefresh = new PullToRefresh();
    window.PullToRefresh.init();
    console.log('✅ PullToRefresh ready');
}
