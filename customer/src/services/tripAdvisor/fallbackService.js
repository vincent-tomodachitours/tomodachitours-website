/**
 * TripAdvisor Fallback Service
 * Handles fallback to real manually collected reviews
 */

import { getRealBusinessInfoWithAPI, getRealReviews } from '../../data/realTripAdvisorReviews';

/**
 * Fallback function when TripAdvisor API is unavailable - uses real reviews
 */
export async function getRealBusinessReviews(options = {}) {
    const maxReviews = options.maxReviews || 6;
    const tourId = options.tourId || null;
    const realReviews = getRealReviews(maxReviews, tourId);

    // Try to get business info with real API data first
    const businessInfo = await getRealBusinessInfoWithAPI();

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
        reviews: realReviews,
        businessInfo: businessInfo,
        cached: false,
        fetchedAt: new Date().toISOString(),
        source: businessInfo.totalReviews > realReviews.length ? 'hybrid_api' : 'real_manual',
        note: businessInfo.totalReviews > realReviews.length
            ? `Showing ${realReviews.length} manually collected reviews from ${businessInfo.totalReviews} total TripAdvisor reviews`
            : (realReviews.length === 0 ? 'No real reviews added yet' : `Showing ${realReviews.length} real reviews`)
    };
}

/**
 * Enhanced getBusinessReviews with fallback to real reviews
 */
export async function getBusinessReviewsWithFallback(getBusinessReviews, options = {}) {
    try {
        // Try real API first
        const result = await getBusinessReviews(options);

        // If we get real data but no reviews, supplement with real collected reviews for display
        if (result.reviews.length === 0 && result.businessInfo) {
            // Use real business info but add manually collected reviews
            const realReviews = getRealReviews(options.maxReviews || 6, options.tourId);

            return {
                ...result,
                reviews: realReviews,
                source: 'hybrid', // Real business data + manually collected reviews
                note: result.businessInfo.totalReviews > realReviews.length
                    ? `Displaying ${realReviews.length} manually collected reviews from ${result.businessInfo.totalReviews} total TripAdvisor reviews`
                    : (realReviews.length === 0
                        ? 'No reviews available - add real reviews to display them'
                        : `Displaying ${realReviews.length} manually collected reviews`)
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