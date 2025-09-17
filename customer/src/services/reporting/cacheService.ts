/**
 * Cache Service for Revenue Attribution Reporter
 * Reuses storage service for persistent caching
 */

import type { CachedReport } from './types';
import { CACHE_CONFIG } from './constants';
import { storageService } from '../shared/storageService';

export class CacheService {
    private memoryCache: Map<string, CachedReport> = new Map();
    private readonly cacheTimeout: number = CACHE_CONFIG.TIMEOUT;
    private readonly maxEntries: number = CACHE_CONFIG.MAX_ENTRIES;

    /**
     * Get cached report if available and not expired
     */
    getCachedReport(cacheKey: string): any {
        // Check memory cache first
        const memoryCached = this.memoryCache.get(cacheKey);
        if (memoryCached && this.isValidCache(memoryCached)) {
            return memoryCached.report;
        }

        // Check persistent storage
        const storageCached = storageService.getItem<CachedReport>(`report_cache_${cacheKey}`);
        if (storageCached && this.isValidCache(storageCached)) {
            // Update memory cache
            this.memoryCache.set(cacheKey, storageCached);
            return storageCached.report;
        }

        return null;
    }

    /**
     * Cache report with timestamp
     */
    cacheReport(cacheKey: string, report: any): void {
        const cachedReport: CachedReport = {
            report,
            timestamp: Date.now()
        };

        // Store in memory cache
        this.memoryCache.set(cacheKey, cachedReport);

        // Store in persistent storage
        storageService.setItem(`report_cache_${cacheKey}`, cachedReport);

        // Clean up old entries if needed
        this.cleanupCache();
    }

    /**
     * Check if cached report is still valid
     */
    private isValidCache(cached: CachedReport): boolean {
        return Date.now() - cached.timestamp < this.cacheTimeout;
    }

    /**
     * Clean up old cache entries
     */
    private cleanupCache(): void {
        if (this.memoryCache.size <= this.maxEntries) return;

        // Remove oldest entries
        const entries = Array.from(this.memoryCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        const entriesToRemove = entries.slice(0, entries.length - this.maxEntries);
        entriesToRemove.forEach(([key]) => {
            this.memoryCache.delete(key);
            storageService.removeItem(`report_cache_${key}`);
        });
    }

    /**
     * Clear all cached reports
     */
    clearCache(): void {
        this.memoryCache.clear();
        // Note: We don't clear all storage items as they might belong to other services
        console.log('Report cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            memoryCacheSize: this.memoryCache.size,
            maxEntries: this.maxEntries,
            cacheTimeout: this.cacheTimeout
        };
    }
}

export const cacheService = new CacheService();