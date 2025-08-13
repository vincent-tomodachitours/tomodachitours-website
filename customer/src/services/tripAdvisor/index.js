/**
 * TripAdvisor Service - Main Entry Point
 * Orchestrates all TripAdvisor-related functionality
 */

import { TRIPADVISOR_CONFIG } from './config';
import { apiClient } from './apiClient';
import { isCacheValid, getCachedReviews, cacheReviews, memoryCache, clearCache, getCacheStatus } from './cache';
import { getRealBusinessReviews } from './fallbackService';
import { logApiMetrics, healthCheck, RequestDeduplicator, getDebugConfig } from './utils';
import {
    processReviewsData as processReviewsDataNew,
    processLocationData as processLocationDataNew
} from '../tripAdvisorDataProcessor';

// Request deduplication instance
const requestDeduplicator = new RequestDeduplicator();

/**
 * Get reviews for the business with caching and request deduplication
 */
export async function getBusinessReviews(options = {}) {
    const startTime = Date.now();
    const locationId = options.locationId || TRIPADVISOR_CONFIG.locationId;
    const forceRefresh = options.forceRefresh || false;

    if (!locationId) {
        throw new Error('TripAdvisor location ID not configured');
    }

    // Create a unique key for request deduplication
    const requestKey = `${locationId}-${forceRefresh}-${options.maxReviews || 10}-${options.language || 'en'}`;

    return await requestDeduplicator.deduplicate(requestKey, async () => {
        let cacheHit = false;
        let apiCalled = false;
        let errorType = null;

        try {
            // Check cache first (unless force refresh is requested)
            if (!forceRefresh) {
                const isValid = await isCacheValid(locationId);
                if (isValid) {
                    const cachedData = await getCachedReviews(locationId);
                    if (cachedData) {
                        cacheHit = true;
                        logApiMetrics('cache_hit', {
                            locationId,
                            duration: Date.now() - startTime,
                            reviewCount: cachedData.reviews_data?.length || 0
                        });

                        return {
                            reviews: cachedData.reviews_data || [],
                            businessInfo: {
                                locationId: locationId,
                                name: cachedData.business_name,
                                overallRating: parseFloat(cachedData.overall_rating) || 0,
                                totalReviews: cachedData.total_reviews || 0,
                                ranking: cachedData.ranking_data?.ranking_string || '',
                                tripAdvisorUrl: cachedData.tripadvisor_url || ''
                            },
                            cached: true,
                            cachedAt: cachedData.cached_at
                        };
                    }
                }
            }

            // Fetch fresh data from TripAdvisor API
            apiCalled = true;
            const apiStartTime = Date.now();

            const [reviewsResponse, locationResponse] = await Promise.all([
                apiClient.fetchReviews(locationId, {
                    limit: options.maxReviews || 10,
                    language: options.language || 'en'
                }),
                apiClient.fetchLocationDetails(locationId)
            ]);

            const apiDuration = Date.now() - apiStartTime;

            // Process the data using new validation functions
            const reviewsProcessingResult = processReviewsDataNew(reviewsResponse, {
                requireText: true,
                maxTextLength: 2000,
                minTextLength: 1
            });
            const processedReviews = reviewsProcessingResult.reviews;
            const processedLocation = processLocationDataNew(locationResponse);

            // Log processing statistics
            if (reviewsProcessingResult.statistics.errors.length > 0) {
                console.warn('TripAdvisor reviews processing errors:', reviewsProcessingResult.statistics.errors);
            }
            if (reviewsProcessingResult.statistics.warnings.length > 0) {
                console.warn('TripAdvisor reviews processing warnings:', reviewsProcessingResult.statistics.warnings);
            }

            // Cache the processed data
            const locationDataForCache = processedLocation ? {
                name: processedLocation.name,
                rating: processedLocation.overallRating,
                num_reviews: processedLocation.totalReviews,
                ranking_data: { ranking_string: processedLocation.ranking },
                web_url: processedLocation.tripAdvisorUrl
            } : {};
            await cacheReviews(locationId, processedReviews, locationDataForCache);

            // Update memory cache as backup
            memoryCache.set(processedReviews, processedLocation);

            logApiMetrics('api_success', {
                locationId,
                duration: Date.now() - startTime,
                apiDuration,
                reviewCount: processedReviews.length,
                forceRefresh
            });

            return {
                reviews: processedReviews,
                businessInfo: processedLocation,
                cached: false,
                fetchedAt: new Date().toISOString()
            };

        } catch (error) {
            // Categorize error types
            if (error.message.includes('rate limit')) {
                errorType = 'rate_limit';
            } else if (error.message.includes('authentication')) {
                errorType = 'auth_error';
            } else if (error.message.includes('not found')) {
                errorType = 'not_found';
            } else if (error.message.includes('network') || error.name === 'TypeError') {
                errorType = 'network_error';
            } else {
                errorType = 'unknown_error';
            }

            console.error('Error fetching TripAdvisor reviews:', error);

            // Try to return cached data as fallback
            const cachedData = await getCachedReviews(locationId);
            if (cachedData) {
                logApiMetrics('fallback_to_cache', {
                    locationId,
                    errorType,
                    duration: Date.now() - startTime,
                    reviewCount: cachedData.reviews_data?.length || 0
                });

                return {
                    reviews: cachedData.reviews_data || [],
                    businessInfo: {
                        locationId: locationId,
                        name: cachedData.business_name,
                        overallRating: parseFloat(cachedData.overall_rating) || 0,
                        totalReviews: cachedData.total_reviews || 0,
                        ranking: cachedData.ranking_data?.ranking_string || '',
                        tripAdvisorUrl: cachedData.tripadvisor_url || ''
                    },
                    cached: true,
                    cachedAt: cachedData.cached_at,
                    error: error.message
                };
            }

            // Try memory cache as last resort
            const memoryCacheData = memoryCache.get();
            if (memoryCacheData) {
                logApiMetrics('fallback_to_memory', {
                    locationId,
                    errorType,
                    duration: Date.now() - startTime,
                    reviewCount: memoryCacheData.reviews?.length || 0
                });

                return {
                    reviews: memoryCacheData.reviews,
                    businessInfo: memoryCacheData.locationData,
                    cached: true,
                    cachedAt: new Date(memoryCacheData.timestamp).toISOString(),
                    error: error.message,
                    source: 'memory'
                };
            }

            // Log the error and throw
            logApiMetrics('error', {
                locationId,
                errorType,
                duration: Date.now() - startTime,
                errorMessage: error.message,
                cacheHit,
                apiCalled
            });

            throw error;
        }
    });
}

/**
 * Refresh cache for a specific location
 */
export async function refreshCache(locationId = TRIPADVISOR_CONFIG.locationId) {
    return await getBusinessReviews({ locationId, forceRefresh: true });
}

/**
 * Warm up cache by pre-fetching reviews
 */
export async function warmCache(locationId = TRIPADVISOR_CONFIG.locationId, options = {}) {
    try {
        console.log(`Warming TripAdvisor cache for location: ${locationId}`);

        // Force refresh to get fresh data
        await getBusinessReviews({
            locationId,
            forceRefresh: true,
            maxReviews: options.maxReviews || 10,
            language: options.language || 'en'
        });

        console.log(`TripAdvisor cache warmed successfully for location: ${locationId}`);
        return true;
    } catch (error) {
        console.error('Error warming cache:', error);
        return false;
    }
}

// Re-export everything needed by components
export {
    apiClient,
    clearCache,
    getCacheStatus,
    healthCheck,
    getDebugConfig as config,
    getRealBusinessReviews
};

// Export the enhanced version with fallback
export async function getBusinessReviewsWithFallbackWrapper(options = {}) {
    try {
        // Try real API first
        const result = await getBusinessReviews(options);

        // If we get real data but no reviews, supplement with real collected reviews for display
        if (result.reviews.length === 0 && result.businessInfo) {
            console.log('📊 Real business data retrieved, supplementing with manually collected reviews');

            // Use real business info but add manually collected reviews
            const { getRealReviews } = await import('../../data/realTripAdvisorReviews');
            const realReviews = getRealReviews(options.maxReviews || 6);

            return {
                ...result,
                reviews: realReviews,
                source: 'hybrid', // Real business data + manually collected reviews
                note: realReviews.length === 0
                    ? 'No reviews available - add real reviews to display them'
                    : `Displaying ${realReviews.length} manually collected reviews`
            };
        }

        return result;
    } catch (error) {
        console.warn('TripAdvisor API failed, using manually collected reviews:', error.message);

        // Check if it's a 403 error (API key/domain issue)
        if (error.message.includes('403') || error.message.includes('forbidden')) {
            console.warn('API access forbidden - likely domain registration or API key issue');
        }

        return await getRealBusinessReviews(options);
    }
}