/**
 * TripAdvisor Service - Legacy Compatibility Layer
 * 
 * This file maintains backward compatibility while delegating to the new modular structure.
 * All new development should use the modules in ./tripAdvisor/ directly.
 */

// Import everything from the new modular structure
export {
    getBusinessReviews,
    refreshCache,
    warmCache,
    clearCache,
    getCacheStatus,
    healthCheck,
    apiClient,
    config,
    getRealBusinessReviews
} from './tripAdvisor/index';

// Export the main function that components use
export { getBusinessReviewsWithFallbackWrapper as getBusinessReviewsWithFallback } from './tripAdvisor/index';

// Legacy exports for backward compatibility
export { getBusinessReviewsWithFallbackWrapper as getMockBusinessReviews } from './tripAdvisor/index';