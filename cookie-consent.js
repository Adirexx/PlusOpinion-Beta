/**
 * PlusOpinion Cookie Consent Manager
 * GDPR/CCPA Compliant Cookie Consent System
 * 
 * Features:
 * - Manages user consent for analytics cookies
 * - Controls Google Analytics loading
 * - Stores consent preferences in localStorage
 * - Fully compliant with GDPR, CCPA, and ePrivacy Directive
 */

(function () {
    'use strict';

    // Configuration
    const CONSENT_KEY = 'plusopinion_cookie_consent';
    const CONSENT_VERSION = '1.0';
    const GA_ID = 'G-D42E61TP4M';

    // Consent Manager
    const CookieConsent = {
        /**
         * Initialize consent system
         */
        init: function () {
            // Check if user already has a valid consent record
            const consent = this.getConsent();

            if (consent && consent.version === CONSENT_VERSION) {
                // User has already made a choice
                if (consent.accepted) {
                    this.loadGoogleAnalytics();
                }
                // Don't show banner
            } else {
                // First visit or outdated consent - show banner
                this.showBanner();
            }
        },

        /**
         * Get stored consent from localStorage
         */
        getConsent: function () {
            try {
                const stored = localStorage.getItem(CONSENT_KEY);
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                console.error('Failed to read consent:', e);
                return null;
            }
        },

        /**
         * Save consent to localStorage
         */
        saveConsent: function (accepted) {
            const consent = {
                accepted: accepted,
                timestamp: new Date().toISOString(),
                version: CONSENT_VERSION,
                userAgent: navigator.userAgent
            };

            try {
                localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
            } catch (e) {
                console.error('Failed to save consent:', e);
            }
        },

        /**
         * Show consent banner
         */
        showBanner: function () {
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) {
                // Trigger animation after a small delay
                setTimeout(() => {
                    banner.classList.add('show');
                }, 100);
            }
        },

        /**
         * Hide consent banner
         */
        hideBanner: function () {
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) {
                banner.classList.remove('show');
                // Remove from DOM after animation
                setTimeout(() => {
                    banner.remove();
                }, 300);
            }
        },

        /**
         * Handle accept action
         */
        acceptCookies: function () {
            this.saveConsent(true);
            this.loadGoogleAnalytics();
            this.hideBanner();

            // Optional: Track consent acceptance (without GA)
            console.log('Cookie consent: Accepted');
        },

        /**
         * Handle reject action
         */
        rejectCookies: function () {
            this.saveConsent(false);
            this.hideBanner();

            // Optional: Track consent rejection (without GA)
            console.log('Cookie consent: Rejected');
        },

        /**
         * Load Google Analytics
         */
        loadGoogleAnalytics: function () {
            // Check if already loaded
            if (window.gtag) {
                console.log('Google Analytics already loaded');
                return;
            }

            // Create and inject GA script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
            document.head.appendChild(script);

            // Initialize GA
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', GA_ID, {
                'anonymize_ip': true, // GDPR compliance
                'cookie_flags': 'SameSite=None;Secure' // Security best practice
            });

            console.log('Google Analytics loaded');
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            CookieConsent.init();
        });
    } else {
        CookieConsent.init();
    }

    // Expose to window for button handlers
    window.CookieConsent = CookieConsent;
})();
