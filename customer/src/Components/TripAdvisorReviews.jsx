import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import ReviewCard from './ReviewCard';
import { getBusinessReviews, getBusinessReviewsWithFallback } from '../services/tripAdvisorService';

const TripAdvisorReviews = ({
    locationId,
    maxReviews = 6,
    showRating = true,
    layout = 'grid',
    className = '',
    showAttribution = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
}) => {
    const [reviews, setReviews] = useState([]);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [lastFetch, setLastFetch] = useState(null);

    // Maximum retry attempts
    const MAX_RETRIES = 3;

    /**
     * Fetch reviews from TripAdvisor service
     */
    const fetchReviews = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            const result = await getBusinessReviewsWithFallback({
                locationId,
                maxReviews,
                forceRefresh
            });

            // Limit reviews to maxReviews
            const limitedReviews = result.reviews.slice(0, maxReviews);

            setReviews(limitedReviews);
            setBusinessInfo(result.businessInfo);
            setLastFetch(new Date());
            setRetryCount(0); // Reset retry count on success

        } catch (err) {
            console.error('Error fetching TripAdvisor reviews:', err);
            setError(err.message || 'Failed to load reviews');

            // Increment retry count for automatic retries
            setRetryCount(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    }, [locationId, maxReviews]);

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

    /**
     * Render skeleton loading placeholders
     */
    const renderSkeletonCards = () => {
        const skeletonCount = Math.min(maxReviews, 6);

        return Array.from({ length: skeletonCount }, (_, index) => (
            <div
                key={`skeleton-${index}`}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse"
                data-testid="skeleton-card"
            >
                {/* Rating skeleton */}
                <div className="flex items-center mb-4">
                    <div className="flex space-x-1">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                        ))}
                    </div>
                    <div className="ml-2 w-8 h-4 bg-gray-300 rounded"></div>
                </div>

                {/* Title skeleton */}
                <div className="w-3/4 h-6 bg-gray-300 rounded mb-4"></div>

                {/* Text skeleton */}
                <div className="space-y-2 mb-4">
                    <div className="w-full h-4 bg-gray-300 rounded"></div>
                    <div className="w-full h-4 bg-gray-300 rounded"></div>
                    <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
                </div>

                {/* Footer skeleton */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                        <div>
                            <div className="w-20 h-4 bg-gray-300 rounded mb-1"></div>
                            <div className="w-16 h-3 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                    <div className="w-16 h-3 bg-gray-300 rounded"></div>
                </div>
            </div>
        ));
    };

    /**
     * Render error state
     */
    const renderErrorState = () => (
        <div className="text-center py-12" data-testid="error-state">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Unable to Load Reviews
                </h3>
                <p className="text-gray-600 mb-4">
                    {error || 'We\'re having trouble loading customer reviews right now.'}
                </p>
                {retryCount < MAX_RETRIES && (
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        data-testid="retry-button"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );

    /**
     * Render empty state
     */
    const renderEmptyState = () => (
        <div className="text-center py-12" data-testid="empty-state">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Reviews Available
                </h3>
                <p className="text-gray-600">
                    Customer reviews will appear here once they become available.
                </p>
            </div>
        </div>
    );

    /**
     * Render business rating summary with TripAdvisor branding
     */
    const renderBusinessRating = () => {
        if (!showRating || !businessInfo) return null;

        // TripAdvisor brand colors
        const tripAdvisorGreen = '#00AA6C';
        const tripAdvisorOrange = '#FF5722';

        return (
            <div className="text-center mb-8" data-testid="business-rating">
                <div className="inline-flex items-center space-x-6 bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-6">
                    {/* Overall Rating Section */}
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                            {/* TripAdvisor Owl Logo */}
                            <svg
                                className="w-8 h-8 mr-2"
                                viewBox="0 0 200 200"
                                fill={tripAdvisorGreen}
                                aria-label="TripAdvisor"
                            >
                                <path d="M100 20C60.2 20 28 52.2 28 92c0 39.8 32.2 72 72 72s72-32.2 72-72c0-39.8-32.2-72-72-72zm0 130c-32 0-58-26-58-58s26-58 58-58 58 26 58 58-26 58-58 58z" />
                                <circle cx="75" cy="85" r="12" />
                                <circle cx="125" cy="85" r="12" />
                                <path d="M100 115c-12 0-22-8-25-19h50c-3 11-13 19-25 19z" />
                            </svg>
                            <div className="text-3xl font-bold" style={{ color: tripAdvisorGreen }}>
                                {businessInfo.overallRating ? businessInfo.overallRating.toFixed(1) : 'N/A'}
                            </div>
                        </div>

                        {/* Star Rating with TripAdvisor styling */}
                        <div className="flex justify-center mb-2">
                            {Array.from({ length: 5 }, (_, i) => {
                                const rating = businessInfo.overallRating || 0;
                                const isFilled = i < Math.floor(rating);
                                const isHalfFilled = i === Math.floor(rating) && rating % 1 >= 0.5;

                                return (
                                    <svg
                                        key={i}
                                        className="w-6 h-6"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <defs>
                                            <linearGradient id={`half-${i}`}>
                                                <stop offset="50%" stopColor={tripAdvisorGreen} />
                                                <stop offset="50%" stopColor="#E5E7EB" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                            fill={
                                                isFilled
                                                    ? tripAdvisorGreen
                                                    : isHalfFilled
                                                        ? `url(#half-${i})`
                                                        : '#E5E7EB'
                                            }
                                            stroke={tripAdvisorGreen}
                                            strokeWidth="0.5"
                                        />
                                    </svg>
                                );
                            })}
                        </div>

                        <div className="text-sm text-gray-600">
                            Based on {businessInfo.totalReviews || 0} reviews
                        </div>

                        {/* TripAdvisor Link */}
                        {businessInfo.tripAdvisorUrl && (
                            <a
                                href={businessInfo.tripAdvisorUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-2 text-sm font-medium transition-colors duration-200"
                                style={{ color: tripAdvisorGreen }}
                                onMouseEnter={(e) => e.target.style.color = '#008A55'}
                                onMouseLeave={(e) => e.target.style.color = tripAdvisorGreen}
                                data-testid="tripadvisor-link"
                            >
                                View on TripAdvisor
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}
                    </div>

                    {/* Ranking Section */}
                    {businessInfo.ranking && (
                        <div className="text-center border-l border-gray-200 pl-6">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                                TripAdvisor Ranking
                            </div>
                            <div className="text-xs text-gray-600 max-w-32">
                                {businessInfo.ranking}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    /**
     * Render TripAdvisor attribution with proper branding compliance
     */
    const renderAttribution = () => {
        if (!showAttribution) return null;

        // TripAdvisor brand colors
        const tripAdvisorGreen = '#00AA6C';

        return (
            <div className="text-center mt-8 pt-6 border-t border-gray-200" data-testid="tripadvisor-attribution">
                {/* Main Attribution */}
                <div className="flex items-center justify-center space-x-3 mb-4">
                    <span className="text-sm text-gray-600 font-medium">Powered by</span>

                    {/* Official TripAdvisor Logo */}
                    <div className="flex items-center">
                        <svg
                            className="w-6 h-6 mr-2"
                            viewBox="0 0 200 200"
                            fill={tripAdvisorGreen}
                            aria-label="TripAdvisor Logo"
                        >
                            {/* Owl body */}
                            <path d="M100 20C60.2 20 28 52.2 28 92c0 39.8 32.2 72 72 72s72-32.2 72-72c0-39.8-32.2-72-72-72zm0 130c-32 0-58-26-58-58s26-58 58-58 58 26 58 58-26 58-58 58z" />
                            {/* Left eye */}
                            <circle cx="75" cy="85" r="12" />
                            {/* Right eye */}
                            <circle cx="125" cy="85" r="12" />
                            {/* Beak/mouth */}
                            <path d="M100 115c-12 0-22-8-25-19h50c-3 11-13 19-25 19z" />
                        </svg>

                        <span
                            className="text-lg font-bold tracking-tight"
                            style={{ color: tripAdvisorGreen }}
                        >
                            TripAdvisor
                        </span>
                    </div>
                </div>

                {/* Business Link */}
                {businessInfo?.tripAdvisorUrl && (
                    <div className="mb-3">
                        <a
                            href={businessInfo.tripAdvisorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 border"
                            style={{
                                color: tripAdvisorGreen,
                                borderColor: tripAdvisorGreen,
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = tripAdvisorGreen;
                                e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = tripAdvisorGreen;
                            }}
                            data-testid="tripadvisor-business-link"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View all reviews on TripAdvisor
                        </a>
                    </div>
                )}

                {/* Compliance Notice */}
                <div className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Reviews are provided by TripAdvisor and reflect the opinions of individual travelers.
                    TripAdvisor and the TripAdvisor logo are trademarks of TripAdvisor LLC.
                </div>

                {/* Additional Compliance Info */}
                <div className="mt-2 text-xs text-gray-400">
                    Reviews displayed with permission from TripAdvisor
                </div>
            </div>
        );
    };

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
            return 'grid grid-cols-1 md:grid-cols-2 gap-6';
        } else if (reviewCount <= 4) {
            return 'grid grid-cols-1 md:grid-cols-2 gap-6';
        } else {
            return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        }
    };

    return (
        <div className={`tripadvisor-reviews ${className}`} data-testid="tripadvisor-reviews">
            {/* Business Rating Summary */}
            {renderBusinessRating()}

            {/* Reviews Content */}
            <div className="reviews-content">
                {loading ? (
                    <div className={getGridClasses()}>
                        {renderSkeletonCards()}
                    </div>
                ) : error ? (
                    renderErrorState()
                ) : reviews.length === 0 ? (
                    renderEmptyState()
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
            {renderAttribution()}

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && lastFetch && (
                <div className="mt-4 text-xs text-gray-500 text-center">
                    Last updated: {lastFetch.toLocaleTimeString()}
                    {retryCount > 0 && ` (Retry ${retryCount}/${MAX_RETRIES})`}
                </div>
            )}
        </div>
    );
};

TripAdvisorReviews.propTypes = {
    locationId: PropTypes.string,
    maxReviews: PropTypes.number,
    showRating: PropTypes.bool,
    layout: PropTypes.oneOf(['grid', 'carousel']),
    className: PropTypes.string,
    showAttribution: PropTypes.bool,
    autoRefresh: PropTypes.bool,
    refreshInterval: PropTypes.number
};

export default TripAdvisorReviews;