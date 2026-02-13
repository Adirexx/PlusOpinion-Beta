/**
 * StateManager - Central State Management System
 * 
 * Provides in-memory caching with localStorage persistence,
 * event-based state updates, and cache invalidation strategies.
 */

class StateManager {
    constructor() {
        this.cache = new Map();
        this.subscribers = new Map();
        this.ttls = new Map();

        // Load persisted state from localStorage
        this.loadFromStorage();

        // Cleanup expired cache entries every minute
        setInterval(() => this.cleanupExpired(), 60000);
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {any} Cached value or null
     */
    get(key) {
        // Check if expired
        if (this.isExpired(key)) {
            this.invalidate(key);
            return null;
        }

        return this.cache.get(key) || null;
    }

    /**
     * Set cached data
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    set(key, value, ttl = null) {
        this.cache.set(key, value);

        if (ttl) {
            this.ttls.set(key, Date.now() + ttl);
        }

        // Persist to localStorage for important data
        if (this.shouldPersist(key)) {
            this.saveToStorage(key, value);
        }

        // Notify subscribers
        this.notify(key, value);
    }

    /**
     * Invalidate (clear) cached data
     * @param {string} key - Cache key to invalidate
     */
    invalidate(key) {
        this.cache.delete(key);
        this.ttls.delete(key);

        // Remove from localStorage
        try {
            localStorage.removeItem(`plusopinion_cache_${key}`);
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
        }

        this.notify(key, null);
    }

    /**
     * Clear all cache
     */
    clearAll() {
        this.cache.clear();
        this.ttls.clear();

        // Clear localStorage cache
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('plusopinion_cache_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} key - Cache key to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }

        this.subscribers.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            const subs = this.subscribers.get(key);
            if (subs) {
                subs.delete(callback);
            }
        };
    }

    /**
     * Check if cache entry is expired
     * @private
     */
    isExpired(key) {
        if (!this.ttls.has(key)) return false;
        return Date.now() > this.ttls.get(key);
    }

    /**
     * Cleanup expired entries
     * @private
     */
    cleanupExpired() {
        for (const [key, expiry] of this.ttls.entries()) {
            if (Date.now() > expiry) {
                this.invalidate(key);
            }
        }
    }

    /**
     * Notify subscribers of state change
     * @private
     */
    notify(key, value) {
        const subs = this.subscribers.get(key);
        if (subs) {
            subs.forEach(callback => {
                try {
                    callback(value);
                } catch (e) {
                    console.error('Subscriber callback error:', e);
                }
            });
        }
    }

    /**
     * Determine if key should be persisted to localStorage
     * @private
     */
    shouldPersist(key) {
        // Persist user profile, bookmarks, and settings
        const persistKeys = ['user_profile', 'bookmarks', 'hidden_items', 'app_settings'];
        return persistKeys.some(pk => key.startsWith(pk));
    }

    /**
     * Save to localStorage
     * @private
     */
    saveToStorage(key, value) {
        try {
            const data = {
                value,
                timestamp: Date.now(),
                ttl: this.ttls.get(key) || null
            };
            localStorage.setItem(`plusopinion_cache_${key}`, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    /**
     * Load from localStorage
     * @private
     */
    loadFromStorage() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(storageKey => {
                if (storageKey.startsWith('plusopinion_cache_')) {
                    const key = storageKey.replace('plusopinion_cache_', '');
                    const data = JSON.parse(localStorage.getItem(storageKey));

                    // Check if expired
                    if (data.ttl && Date.now() > data.ttl) {
                        localStorage.removeItem(storageKey);
                        return;
                    }

                    this.cache.set(key, data.value);
                    if (data.ttl) {
                        this.ttls.set(key, data.ttl);
                    }
                }
            });
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            entries: this.cache.size,
            subscribers: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
            ttlEntries: this.ttls.size
        };
    }
}

// Create global instance
window.StateManager = new StateManager();

console.log('✅ StateManager initialized');
