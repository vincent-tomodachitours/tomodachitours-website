import { useState, useEffect, useCallback } from 'react';
import { getBusinessReviewsWithFallback } from '../../../services/tripAdvisorService';

export const useTripAdvisorData = (locationId, maxReviews = 6, autoRefresh = false, refreshInterval = 300000, tourId = null) => {
    const [reviews, setReviews] = useState([]);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [lastFetch, setLastFetch] = useState(null);

    const MAX_RETRIES = 3;

    /**
     * Fetch reviews from TripAdvisor service
     */
    const fetchReviews = useCallback(async (forceRefresh = false) => {
        console.log('🚀 useTripAdvisorData: Starting fetchReviews with:', { locationId, maxReviews, forceRefresh });

        try {
            setLoading(true);
            setError(null);

            console.log('📞 useTripAdvisorData: Calling getBusinessReviewsWithFallback...');

            const result = await getBusinessReviewsWithFallback({
                locationId,
                maxReviews,
                forceRefresh,
                tourId
            });

            console.log('📊 useTripAdvisorData: Received result:', result);
            console.log('📈 useTripAdvisorData: Business info:', result.businessInfo);
            console.log('📝 useTripAdvisorData: Total reviews from API:', result.businessInfo?.totalReviews);

            // Limit reviews to maxReviews
            const limitedReviews = result.reviews.slice(0, maxReviews);

            setReviews(limitedReviews);
            setBusinessInfo(result.businessInfo);
            setLastFetch(new Date());
            setRetryCount(0); // Reset retry count on success

            console.log('✅ useTripAdvisorData: Successfully set data - businessInfo.totalReviews:', result.businessInfo?.totalReviews);

        } catch (err) {
            console.error('❌ useTripAdvisorData: Error fetching TripAdvisor reviews:', err);
            setError(err.message || 'Failed to load reviews');

            // Increment retry count for automatic retries
            setRetryCount(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    }, [locationId, maxReviews, tourId]);

    /**
     * Handle retry with exponential backoff
     */
    const handleRetry = useCallback(() => {
        if (retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            setTimeout(() => {
                fetchReviews();
            }, delay);
        }
    }, [retryCount, fetchReviews]);

    /**
     * Manual refresh handler
     */
    const handleRefresh = useCallback(() => {
        setRetryCount(0);
        fetchReviews(true);
    }, [fetchReviews]);

    // Initial load
    useEffect(() => {
        if (locationId) {
            console.log('🔄 useTripAdvisorData: Initial load triggered');
            fetchReviews();
        }
    }, [fetchReviews, locationId]);

    // Auto-retry on error
    useEffect(() => {
        if (error && retryCount > 0 && retryCount <= MAX_RETRIES) {
            handleRetry();
        }
    }, [error, retryCount, handleRetry]);

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh || !refreshInterval) return;

        const interval = setInterval(() => {
            fetchReviews(true);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchReviews]);

    return {
        reviews,
        businessInfo,
        loading,
        error,
        retryCount,
        lastFetch,
        handleRefresh,
        MAX_RETRIES
    };
};
