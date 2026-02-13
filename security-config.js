// =====================================================
// SECURITY CONFIGURATION
// =====================================================
// Centralized security utilities and development mode detection
// Load this file BEFORE other scripts in production

window.SecurityConfig = {
    // Detect development environment
    isDevelopment: window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '3000',

    /**
     * Safe logging wrapper - only logs in development
     * Usage: SecurityConfig.log('Debug info', data);
     */
    log: function (...args) {
        if (this.isDevelopment) {
            console.log(...args);
        }
    },

    /**
     * Safe error logging wrapper - only logs in development
     * Usage: SecurityConfig.error('Error occurred', error);
     */
    error: function (...args) {
        if (this.isDevelopment) {
            console.error(...args);
        }
    },

    /**
     * Safe warning logging wrapper - only logs in development
     * Usage: SecurityConfig.warn('Warning message');
     */
    warn: function (...args) {
        if (this.isDevelopment) {
            console.warn(...args);
        }
    },

    /**
     * XSS Prevention: Sanitize user input
     * Usage: const safe = SecurityConfig.sanitizeInput(userInput);
     */
    sanitizeInput: function (input) {
        if (typeof input !== 'string') return input;

        // Basic HTML entity encoding to prevent XSS
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    /**
     * Validate that we're using the correct Supabase key (anon only)
     * Service role key should NEVER be in frontend code
     */
    validateSupabaseKey: function (key) {
        if (!key) return false;

        // Anon keys typically start with 'eyJ' (JWT format)
        // Service role keys also start with 'eyJ' but should never be here
        // We check that the key is present and looks like a JWT
        const isJWT = key.startsWith('eyJ');

        if (!isJWT) {
            this.error('Invalid Supabase key format detected!');
            return false;
        }

        // Decode JWT to check role claim
        try {
            const payload = JSON.parse(atob(key.split('.')[1]));
            if (payload.role === 'service_role') {
                throw new Error('🚨 CRITICAL SECURITY ERROR: service_role key detected in frontend!');
            }
            return payload.role === 'anon';
        } catch (e) {
            this.error('Key validation error:', e);
            return false;
        }
    }
};

// Expose globally for easy access
window.safeLog = window.SecurityConfig.log.bind(window.SecurityConfig);
window.safeError = window.SecurityConfig.error.bind(window.SecurityConfig);
window.safeWarn = window.SecurityConfig.warn.bind(window.SecurityConfig);

// Production mode indicator
if (!window.SecurityConfig.isDevelopment) {
    // Disable console in production to prevent information leakage
    console.log = function () { };
    console.warn = function () { };
    console.error = function () { };
    console.info = function () { };
    console.debug = function () { };
}

// Log security config loaded (only in dev)
window.SecurityConfig.log('✅ Security configuration loaded');
