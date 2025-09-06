/**
 * TripAdvisor Utility Functions
 * Helper functions for logging, health checks, etc.
 */

import { supabase } from '../../lib/supabase';
import { TRIPADVISOR_CONFIG, validateConfig } from './config';
import { getCacheStatus } from './cache';

/**
 * Log API usage and performance metrics
 */
export function logApiMetrics(operation, metrics = {}) {
    const logData = {
        timestamp: new Date().toISOString(),
        service: 'TripAdvisor',
        operation,
        ...metrics
    };

    // In production, this could be sent to a logging service
    console.log('TripAdvisor API Metrics:', logData);
}

/**
 * Health check for TripAdvisor service
 */
export async function healthCheck() {
    const status = {
        service: 'TripAdvisor Reviews',
        timestamp: new Date().toISOString(),
        healthy: true,
        checks: {}
    };

    // Check configuration
    validateConfig();
    status.checks.apiKey = {
        configured: !!TRIPADVISOR_CONFIG.apiKey,
        message: TRIPADVISOR_CONFIG.apiKey ? 'API key configured' : 'API key missing'
    };

    status.checks.locationId = {
        configured: !!TRIPADVISOR_CONFIG.locationId,
        message: TRIPADVISOR_CONFIG.locationId ? 'Location ID configured' : 'Location ID missing'
    };

    // Check database connectivity
    try {
        const { error } = await supabase
            .from('tripadvisor_reviews_cache')
            .select('id')
            .limit(1);

        status.checks.database = {
            connected: !error,
            message: error ? `Database error: ${error.message}` : 'Database connected'
        };
    } catch (error) {
        status.checks.database = {
            connected: false,
            message: `Database connection failed: ${error.message}`
        };
    }

    // Check cache status if location ID is available
    if (TRIPADVISOR_CONFIG.locationId) {
        try {
            const cacheStatus = await getCacheStatus(TRIPADVISOR_CONFIG.locationId);
            status.checks.cache = {
                available: cacheStatus.cached,
                valid: cacheStatus.valid,
                message: cacheStatus.cached
                    ? `Cache ${cacheStatus.valid ? 'valid' : 'expired'}, age: ${cacheStatus.ageMinutes || 0} minutes`
                    : 'No cache data available'
            };
        } catch (error) {
            status.checks.cache = {
                available: false,
                valid: false,
                message: `Cache check failed: ${error.message}`
            };
        }
    }

    // Determine overall health
    status.healthy = Object.values(status.checks).every(check =>
        check.configured !== false && check.connected !== false
    );

    return status;
}

/**
 * Request deduplication helper
 */
export class RequestDeduplicator {
    constructor() {
        this.pendingRequests = new Map();
    }

    async deduplicate(key, requestFunction) {
        // Check if there's already a pending request for this key
        if (this.pendingRequests.has(key)) {
            logApiMetrics('request_deduplicated', { requestKey: key });
            return await this.pendingRequests.get(key);
        }

        // Create the request promise
        const requestPromise = requestFunction();

        // Store the promise for deduplication
        this.pendingRequests.set(key, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Clean up the pending request
            this.pendingRequests.delete(key);
        }
    }

    clear() {
        this.pendingRequests.clear();
    }
}

/**
 * Export configuration for debugging
 */
export const getDebugConfig = () => ({
    apiUrl: TRIPADVISOR_CONFIG.apiUrl,
    locationId: TRIPADVISOR_CONFIG.locationId,
    cacheDurationHours: TRIPADVISOR_CONFIG.cacheDurationHours,
    hasApiKey: !!TRIPADVISOR_CONFIG.apiKey,
    mockDataAvailable: true
});