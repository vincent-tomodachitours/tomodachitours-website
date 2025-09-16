import React from 'react';

interface SkeletonCardsProps {
    maxReviews: number;
}

interface ErrorStateProps {
    error?: string;
    retryCount: number;
    maxRetries: number;
    onRetry: () => void;
}

// Skeleton loading cards
export const SkeletonCards: React.FC<SkeletonCardsProps> = ({ maxReviews }) => {
    const skeletonCount = Math.min(maxReviews, 6);

    return (
        <>
            {Array.from({ length: skeletonCount }, (_, index) => (
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
            ))}
        </>
    );
};

// Error state
export const ErrorState: React.FC<ErrorStateProps> = ({ error, retryCount, maxRetries, onRetry }) => (
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
            {retryCount < maxRetries && (
                <button
                    onClick={onRetry}
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

// Empty state
export const EmptyState: React.FC = () => (
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



const LoadingStates = { SkeletonCards, ErrorState, EmptyState };
export default LoadingStates;
