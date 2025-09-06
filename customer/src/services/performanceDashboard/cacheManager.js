// Cache Manager - Handles caching of performance dashboard data
// Manages session storage for performance metrics and insights

class CacheManager {
    constructor() {
        this.cacheKey = 'performance_dashboard_cache';
        this.cacheExpirationMs = 5 * 60 * 1000; // 5 minutes
        this.maxCacheSize = 50; // Maximum number of cached items
    }

    /**
     * Get cached data if not expired
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getCachedData(key) {
        try {
            const cached = sessionStorage.getItem(`${this.cacheKey}_${key}`);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);

            if (Date.now() - timestamp > this.cacheExpirationMs) {
                sessionStorage.removeItem(`${this.cacheKey}_${key}`);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('Error retrieving cached data:', error);
            return null;
        }
    }

    /**
     * Set cached data with timestamp
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCachedData(key, data) {
        try {
            // Check cache size and clean up if necessary
            this.cleanupCache();

            const cacheData = {
                data,
                timestamp: Date.now()
            };

            sessionStorage.setItem(`${this.cacheKey}_${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache data:', error);
            // If storage is full, try to clear some space
            if (error.name === 'QuotaExceededError') {
                this.clearOldestCache();
                // Try again
                try {
                    sessionStorage.setItem(`${this.cacheKey}_${key}`, JSON.stringify({
                        data,
                        timestamp: Date.now()
                    }));
                } catch (retryError) {
                    console.warn('Failed to cache data after cleanup:', retryError);
                }
            }
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        try {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith(this.cacheKey)) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Error clearing cache:', error);
        }
    }

    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        try {
            const keys = Object.keys(sessionStorage);
            const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));

            cacheKeys.forEach(key => {
                try {
                    const cached = sessionStorage.getItem(key);
                    if (cached) {
                        const { timestamp } = JSON.parse(cached);
                        if (Date.now() - timestamp > this.cacheExpirationMs) {
                            sessionStorage.removeItem(key);
                        }
                    }
                } catch (error) {
                    // Remove corrupted cache entries
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Error during cache cleanup:', error);
        }
    }

    /**
     * Clear oldest cache entries when storage is full
     */
    clearOldestCache() {
        try {
            const keys = Object.keys(sessionStorage);
            const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));

            // Get cache entries with timestamps
            const cacheEntries = cacheKeys.map(key => {
                try {
                    const cached = sessionStorage.getItem(key);
                    if (cached) {
                        const { timestamp } = JSON.parse(cached);
                        return { key, timestamp };
                    }
                } catch (error) {
                    return { key, timestamp: 0 };
                }
                return null;
            }).filter(entry => entry !== null);

            // Sort by timestamp (oldest first)
            cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

            // Remove oldest 25% of entries
            const entriesToRemove = Math.ceil(cacheEntries.length * 0.25);
            for (let i = 0; i < entriesToRemove; i++) {
                sessionStorage.removeItem(cacheEntries[i].key);
            }
        } catch (error) {
            console.warn('Error clearing oldest cache:', error);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        try {
            const keys = Object.keys(sessionStorage);
            const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));

            let totalSize = 0;
            let validEntries = 0;
            let expiredEntries = 0;

            cacheKeys.forEach(key => {
                try {
                    const cached = sessionStorage.getItem(key);
                    if (cached) {
                        totalSize += cached.length;
                        const { timestamp } = JSON.parse(cached);
                        if (Date.now() - timestamp > this.cacheExpirationMs) {
                            expiredEntries++;
                        } else {
                            validEntries++;
                        }
                    }
                } catch (error) {
                    expiredEntries++;
                }
            });

            return {
                totalEntries: cacheKeys.length,
                validEntries,
                expiredEntries,
                totalSize,
                averageSize: cacheKeys.length > 0 ? Math.round(totalSize / cacheKeys.length) : 0
            };
        } catch (error) {
            console.warn('Error getting cache stats:', error);
            return {
                totalEntries: 0,
                validEntries: 0,
                expiredEntries: 0,
                totalSize: 0,
                averageSize: 0
            };
        }
    }

    /**
     * Check if cache key exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean} True if cache exists and is valid
     */
    isCached(key) {
        return this.getCachedData(key) !== null;
    }

    /**
     * Get cache expiration time for a key
     * @param {string} key - Cache key
     * @returns {number|null} Expiration timestamp or null if not cached
     */
    getCacheExpiration(key) {
        try {
            const cached = sessionStorage.getItem(`${this.cacheKey}_${key}`);
            if (!cached) return null;

            const { timestamp } = JSON.parse(cached);
            return timestamp + this.cacheExpirationMs;
        } catch (error) {
            return null;
        }
    }

    /**
     * Set cache expiration time
     * @param {number} expirationMs - Expiration time in milliseconds
     */
    setCacheExpiration(expirationMs) {
        this.cacheExpirationMs = expirationMs;
    }

    /**
     * Preload cache with commonly requested data
     * @param {Array} preloadKeys - Array of cache keys to preload
     * @param {Function} dataLoader - Function to load data for each key
     */
    async preloadCache(preloadKeys, dataLoader) {
        try {
            const preloadPromises = preloadKeys.map(async (key) => {
                if (!this.isCached(key)) {
                    try {
                        const data = await dataLoader(key);
                        this.setCachedData(key, data);
                    } catch (error) {
                        console.warn(`Failed to preload cache for key ${key}:`, error);
                    }
                }
            });

            await Promise.all(preloadPromises);
        } catch (error) {
            console.warn('Error during cache preload:', error);
        }
    }

    /**
     * Invalidate specific cache entries
     * @param {Array|string} keys - Cache key(s) to invalidate
     */
    invalidateCache(keys) {
        try {
            const keysArray = Array.isArray(keys) ? keys : [keys];

            keysArray.forEach(key => {
                sessionStorage.removeItem(`${this.cacheKey}_${key}`);
            });
        } catch (error) {
            console.warn('Error invalidating cache:', error);
        }
    }

    /**
     * Get all cached keys
     * @returns {Array} Array of cached keys
     */
    getCachedKeys() {
        try {
            const keys = Object.keys(sessionStorage);
            return keys
                .filter(key => key.startsWith(this.cacheKey))
                .map(key => key.replace(`${this.cacheKey}_`, ''));
        } catch (error) {
            console.warn('Error getting cached keys:', error);
            return [];
        }
    }
}

export default CacheManager;