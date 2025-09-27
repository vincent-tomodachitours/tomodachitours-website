import { useState, useEffect, useCallback } from 'react';
import { getBusinessReviewsWithFallback } from '../../../services/tripAdvisorService';
import type { Review, RealBusinessInfo } from '../../../types/data';

// Types for the hook parameters
interface TripAdvisorDataOptions {
    locationId: string;
    maxReviews: number;
    forceRefresh: boolean;
    tourId: string | null;
}

// Types for the service response
interface TripAdvisorServiceResponse {
    reviews: Review[];
    businessInfo: RealBusinessInfo;
    cached: boolean;
    fetchedAt: string;
    source?: string;
    tourId?: string | null;
    note?: string;
    cachedAt?: string;
    error?: string;
}

// Types for the hook return value
export interface UseTripAdvisorDataResult {
    reviews: Review[];
    businessInfo: RealBusinessInfo | null;
    loading: boolean;
    error: string | null;
    retryCount: number;
    lastFetch: Date | null;
    handleRefresh: () => void;
    MAX_RETRIES: number;
}

export const useTripAdvisorData = (
    locationId?: string,
    maxReviews: number = 6,
    autoRefresh: boolean = false,
    refreshInterval: number = 300000, // 5 minutes
    tourId: string | null = null
): UseTripAdvisorDataResult => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [businessInfo, setBusinessInfo] = useState<RealBusinessInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const MAX_RETRIES = 3;

    /**
     * Fetch reviews from TripAdvisor service
     */
    const fetchReviews = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const result: TripAdvisorServiceResponse = await getBusinessReviewsWithFallback({
                locationId,
                maxReviews,
                forceRefresh,
                tourId
            } as TripAdvisorDataOptions);

            // Limit reviews to maxReviews
            const limitedReviews = result.reviews.slice(0, maxReviews);

            setReviews(limitedReviews);
            setBusinessInfo(result.businessInfo);
            setLastFetch(new Date());
            setRetryCount(0); // Reset retry count on success

        } catch (err) {
            console.error('❌ useTripAdvisorData: Error fetching TripAdvisor reviews:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load reviews';
            setError(errorMessage);

            // Increment retry count for automatic retries
            setRetryCount(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    }, [locationId, maxReviews, tourId]);

    /**
     * Handle retry with exponential backoff
     */
    const handleRetry = useCallback((): void => {
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
    const handleRefresh = useCallback((): void => {
        setRetryCount(0);
        fetchReviews(true);
    }, [fetchReviews]);

    // Initial load
    useEffect(() => {
        if (locationId) {
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