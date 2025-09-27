import React from 'react';
import ReviewCard from './ReviewCard';
import BusinessRating from './TripAdvisor/BusinessRating';
import { SkeletonCards, ErrorState, EmptyState } from './TripAdvisor/LoadingStates';
import Attribution from './TripAdvisor/Attribution';
import { useTripAdvisorData } from './TripAdvisor/hooks/useTripAdvisorData';

interface TripAdvisorReviewsProps {
    locationId?: string;
    maxReviews?: number;
    showRating?: boolean;
    layout?: 'grid' | 'carousel';
    className?: string;
    showAttribution?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
    tourId?: string | null;
    tourReviewCount?: number | null;
}

const TripAdvisorReviews: React.FC<TripAdvisorReviewsProps> = ({
    locationId,
    maxReviews = 6,
    showRating = true,
    layout = 'grid',
    className = '',
    showAttribution = true,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    tourId: _tourId = null, // New prop for tour-specific filtering
    tourReviewCount = null // New prop for tour-specific review count
}) => {
    const {
        reviews,
        businessInfo,
        loading,
        error,
        retryCount,
        lastFetch,
        handleRefresh,
        MAX_RETRIES
    } = useTripAdvisorData(locationId, maxReviews, autoRefresh, refreshInterval, _tourId);

    // Don't render anything if no locationId is provided
    if (!locationId) {
        return null;
    }

    // Determine grid classes based on layout and number of reviews
    const getGridClasses = () => {
        if (layout === 'carousel') {
            return 'flex overflow-x-auto space-x-4 pb-4 scrollbar-hide';
        }

        // Responsive grid layout
        const reviewCount = reviews.length || maxReviews;
        if (reviewCount === 1) {
            return 'grid grid-cols-1 max-w-md mx-auto';
        } else if (reviewCount === 2) {
            return 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';
        } else if (reviewCount <= 4) {
            return 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';
        } else {
            return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start';
        }
    };

    return (
        <div className={`tripadvisor-reviews ${className}`} data-testid="tripadvisor-reviews">
            {/* Business Rating Summary */}
            <BusinessRating businessInfo={businessInfo} showRating={showRating} tourReviewCount={tourReviewCount} />

            {/* Reviews Content */}
            <div className="reviews-content">
                {loading ? (
                    <div className={getGridClasses()}>
                        <SkeletonCards maxReviews={maxReviews} />
                    </div>
                ) : error ? (
                    <ErrorState
                        error={error}
                        retryCount={retryCount}
                        maxRetries={MAX_RETRIES}
                        onRetry={handleRefresh}
                    />
                ) : reviews.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className={getGridClasses()}>
                        {reviews.map((review, index) => (
                            <div
                                key={review.id || `review-${index}`}
                                className={layout === 'carousel' ? 'flex-shrink-0 w-80' : ''}
                            >
                                <ReviewCard
                                    review={review}
                                    truncateLength={150}
                                    showDate={true}
                                    showHelpfulVotes={true}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* TripAdvisor Attribution */}
            <Attribution businessInfo={businessInfo} showAttribution={showAttribution} />

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && lastFetch && (
                <div className="mt-4 text-xs text-gray-500 text-center">
                    Last updated: {(lastFetch as Date).toLocaleTimeString()}
                    {retryCount > 0 && ` (Retry ${retryCount}/${MAX_RETRIES})`}
                </div>
            )}
        </div>
    );
};



export default TripAdvisorReviews;