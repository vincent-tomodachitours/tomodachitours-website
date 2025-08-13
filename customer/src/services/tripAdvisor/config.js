/**
 * TripAdvisor API Configuration
 */

export const TRIPADVISOR_CONFIG = {
    apiUrl: process.env.REACT_APP_TRIPADVISOR_API_URL || 'https://api.content.tripadvisor.com/api/v1',
    apiKey: process.env.REACT_APP_TRIPADVISOR_API_KEY,
    locationId: process.env.REACT_APP_TRIPADVISOR_LOCATION_ID,
    cacheDurationHours: 6,
    cacheDurationMs: 6 * 60 * 60 * 1000,
    maxRetries: 3,
    baseDelay: 1000,
    timeout: 10000
};

export const validateConfig = () => {
    const warnings = [];

    if (!TRIPADVISOR_CONFIG.apiKey) {
        warnings.push('TripAdvisor API key not configured. Reviews will not be available.');
    }

    if (!TRIPADVISOR_CONFIG.locationId) {
        warnings.push('TripAdvisor location ID not configured. Reviews will not be available.');
    }

    warnings.forEach(warning => console.warn(warning));

    return {
        isValid: warnings.length === 0,
        warnings
    };
};