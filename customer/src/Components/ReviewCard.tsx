import React, { useState } from 'react';

interface Review {
    id: string | number;
    title?: string;
    text: string;
    rating: number;
    author?: string;
    authorLocation?: string;
    date?: string;
    helpfulVotes?: number;
}

interface ReviewCardProps {
    review: Review;
    truncateLength?: number;
    showDate?: boolean;
    showHelpfulVotes?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
    review,
    truncateLength = 150,
    showDate = true,
    showHelpfulVotes = true
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Format date to readable format
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    // Generate star rating display with TripAdvisor styling
    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        // TripAdvisor brand colors
        // eslint-disable-next-line no-unused-vars
        // const tripAdvisorGreen = '#00AA6C'; // Unused variable removed
        const starColor = '#FF5722'; // TripAdvisor orange for stars

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <svg
                        key={i}
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill={starColor}
                            stroke={starColor}
                            strokeWidth="0.5"
                        />
                    </svg>
                );
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <svg
                        key={i}
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient id={`half-star-${review.id}-${i}`}>
                                <stop offset="50%" stopColor={starColor} />
                                <stop offset="50%" stopColor="#E5E7EB" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill={`url(#half-star-${review.id}-${i})`}
                            stroke={starColor}
                            strokeWidth="0.5"
                        />
                    </svg>
                );
            } else {
                stars.push(
                    <svg
                        key={i}
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill="#E5E7EB"
                            stroke="#D1D5DB"
                            strokeWidth="0.5"
                        />
                    </svg>
                );
            }
        }

        return stars;
    };

    // Determine if text should be truncated
    const shouldTruncate = review.text && review.text.length > truncateLength;
    const displayText = shouldTruncate && !isExpanded
        ? review.text.substring(0, truncateLength) + '...'
        : review.text;

    const handleToggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-lg"
            data-testid="review-card"
        >
            {/* Header with rating and reviewer info */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    {/* Rating stars */}
                    <div className="flex items-center mb-2" aria-label={`Rating: ${review.rating} out of 5 stars`}>
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-600 font-medium">
                            {review.rating}/5
                        </span>
                    </div>

                    {/* Review title */}
                    {review.title && (
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                            {review.title}
                        </h3>
                    )}
                </div>
            </div>

            {/* Review text */}
            <div className="mb-4">
                <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                    {displayText}
                </p>

                {/* Read more/less button */}
                {shouldTruncate && (
                    <button
                        onClick={handleToggleExpanded}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                        data-testid="toggle-text-button"
                        aria-expanded={isExpanded}
                    >
                        {isExpanded ? 'Read less' : 'Read more'}
                    </button>
                )}
            </div>

            {/* Footer with reviewer info and metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100 text-sm text-gray-600">
                <div className="flex items-center mb-2 sm:mb-0">
                    {/* Reviewer avatar placeholder */}
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div>
                        <div className="font-medium text-gray-900">
                            {review.author || 'Anonymous'}
                        </div>
                        {review.authorLocation && (
                            <div className="text-xs text-gray-500">
                                {review.authorLocation}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-4 text-xs">
                    {/* Review date */}
                    {showDate && review.date && (
                        <span className="text-gray-500">
                            {formatDate(review.date)}
                        </span>
                    )}

                    {/* Helpful votes */}
                    {showHelpfulVotes && review.helpfulVotes && review.helpfulVotes > 0 && (
                        <span className="text-gray-500 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                            </svg>
                            {review.helpfulVotes} helpful
                        </span>
                    )}

                    {/* TripAdvisor Badge */}
                    <div className="flex items-center" data-testid="tripadvisor-badge">
                        <svg
                            className="w-4 h-4 mr-1"
                            viewBox="0 0 200 200"
                            fill="#00AA6C"
                            aria-label="TripAdvisor"
                        >
                            <path d="M100 20C60.2 20 28 52.2 28 92c0 39.8 32.2 72 72 72s72-32.2 72-72c0-39.8-32.2-72-72-72zm0 130c-32 0-58-26-58-58s26-58 58-58 58 26 58 58-26 58-58 58z" />
                            <circle cx="75" cy="85" r="12" />
                            <circle cx="125" cy="85" r="12" />
                            <path d="M100 115c-12 0-22-8-25-19h50c-3 11-13 19-25 19z" />
                        </svg>
                        <span className="text-gray-500 text-xs">TripAdvisor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};



export default ReviewCard;