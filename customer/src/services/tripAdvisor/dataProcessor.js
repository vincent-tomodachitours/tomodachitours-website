/**
 * TripAdvisor Data Processing
 * Transforms API responses to internal format
 */

/**
 * Transform TripAdvisor API response to internal format
 */
export function processReviewsData(apiResponse) {
    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
        return [];
    }

    return apiResponse.data.map(review => ({
        id: review.id,
        title: review.title || '',
        text: review.text || '',
        rating: review.rating || 0,
        author: review.user?.username || 'Anonymous',
        authorLocation: review.user?.user_location?.name || '',
        date: review.published_date || new Date().toISOString().split('T')[0],
        helpfulVotes: review.helpful_votes || 0,
        isVerified: true, // TripAdvisor reviews are considered verified
        language: review.lang || 'en'
    })).filter(review => review.text && review.text.length > 0); // Filter out empty reviews
}

/**
 * Process location data from TripAdvisor API
 */
export function processLocationData(locationResponse) {
    if (!locationResponse) {
        return {};
    }

    return {
        locationId: locationResponse.location_id,
        name: locationResponse.name,
        overallRating: parseFloat(locationResponse.rating) || 0,
        totalReviews: parseInt(locationResponse.num_reviews) || 0,
        ranking: locationResponse.ranking_data?.ranking_string || '',
        tripAdvisorUrl: locationResponse.web_url || '',
        address: locationResponse.address_obj ? {
            street1: locationResponse.address_obj.street1,
            city: locationResponse.address_obj.city,
            country: locationResponse.address_obj.country
        } : null
    };
}