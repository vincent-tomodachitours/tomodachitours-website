/**
 * TripAdvisor Cache Management
 * Handles both Supabase database cache and in-memory cache
 */

import { supabase } from '../../lib/supabase';
import { TRIPADVISOR_CONFIG } from './config';

// In-memory cache for quick access (fallback if Supabase cache fails)
let inMemoryCache = {
    reviews: null,
    timestamp: null,
    locationData: null
};

/**
 * Check if cached data is still valid
 */
export async function isCacheValid(locationId) {
    try {
        const { data, error } = await supabase
            .rpc('is_tripadvisor_cache_valid', { location_id_param: locationId });

        if (error) {
            console.error('Error checking cache validity:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('Error checking cache validity:', error);
        return false;
    }
}

/**
 * Get cached reviews from Supabase
 */
export async function getCachedReviews(locationId) {
    try {
        const { data, error } = await supabase
            .rpc('get_cached_tripadvisor_reviews', { location_id_param: locationId });

        if (error) {
            console.error('Error fetching cached reviews:', error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error fetching cached reviews:', error);
        return null;
    }
}

/**
 * Cache reviews data in Supabase
 */
export async function cacheReviews(locationId, reviewsData, locationData = {}) {
    try {
        const { data, error } = await supabase
            .rpc('upsert_tripadvisor_cache', {
                location_id_param: locationId,
                reviews_data_param: reviewsData,
                overall_rating_param: locationData.rating || null,
                total_reviews_param: locationData.num_reviews || 0,
                ranking_data_param: locationData.ranking_data || null,
                business_name_param: locationData.name || null,
                tripadvisor_url_param: locationData.web_url || null,
                cache_duration_hours: TRIPADVISOR_CONFIG.cacheDurationHours
            });

        if (error) {
            console.error('Error caching reviews:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error caching reviews:', error);
        return null;
    }
}

/**
 * Memory cache operations
 */
export const memoryCache = {
    get() {
        if (inMemoryCache.reviews && (Date.now() - inMemoryCache.timestamp) < TRIPADVISOR_CONFIG.cacheDurationMs * 2) {
            return {
                reviews: inMemoryCache.reviews,
                locationData: inMemoryCache.locationData,
                timestamp: inMemoryCache.timestamp
            };
        }
        return null;
    },

    set(reviews, locationData) {
        inMemoryCache = {
            reviews,
            locationData,
            timestamp: Date.now()
        };
    },

    clear() {
        inMemoryCache = {
            reviews: null,
            timestamp: null,
            locationData: null
        };
    }
};

/**
 * Clear all caches (memory and database)
 */
export async function clearCache(locationId) {
    try {
        // Clear memory cache
        memoryCache.clear();

        // Clear database cache by setting expiration to past
        const { error } = await supabase
            .from('tripadvisor_reviews_cache')
            .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
            .eq('location_id', locationId);

        if (error) {
            console.error('Error clearing database cache:', error);
            return false;
        }

        console.log(`TripAdvisor cache cleared for location: ${locationId}`);
        return true;
    } catch (error) {
        console.error('Error clearing cache:', error);
        return false;
    }
}

/**
 * Get cache status and statistics
 */
export async function getCacheStatus(locationId) {
    try {
        const { data, error } = await supabase
            .from('tripadvisor_reviews_cache')
            .select('cached_at, expires_at, total_reviews')
            .eq('location_id', locationId)
            .single();

        if (error || !data) {
            return {
                cached: false,
                valid: false,
                locationId
            };
        }

        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        const cachedAt = new Date(data.cached_at);

        return {
            cached: true,
            valid: expiresAt > now,
            locationId,
            cachedAt: cachedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            totalReviews: data.total_reviews,
            ageMinutes: Math.floor((now - cachedAt) / (1000 * 60)),
            timeToExpireMinutes: Math.floor((expiresAt - now) / (1000 * 60))
        };
    } catch (error) {
        console.error('Error getting cache status:', error);
        return {
            cached: false,
            valid: false,
            locationId,
            error: error.message
        };
    }
}