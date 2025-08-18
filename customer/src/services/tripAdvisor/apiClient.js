/**
 * TripAdvisor API Client
 * Handles all HTTP interactions with TripAdvisor Content API
 */

import { TRIPADVISOR_CONFIG } from './config';

export class TripAdvisorApiClient {
    constructor() {
        this.baseUrl = TRIPADVISOR_CONFIG.apiUrl;
        this.apiKey = TRIPADVISOR_CONFIG.apiKey;
        this.locationId = TRIPADVISOR_CONFIG.locationId;
    }

    /**
     * Make authenticated request to TripAdvisor API with retry logic
     */
    async makeRequest(endpoint, options = {}, retryCount = 0) {
        if (!this.apiKey) {
            throw new Error('TripAdvisor API key not configured');
        }

        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${this.baseUrl}${endpoint}${separator}key=${this.apiKey}`;

        const headers = {
            'Accept': 'application/json',
            'origin': 'https://tomodachitours.com',
            'referer': 'https://tomodachitours.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ...options.headers
        };

        const maxRetries = options.maxRetries || TRIPADVISOR_CONFIG.maxRetries;
        const baseDelay = options.baseDelay || TRIPADVISOR_CONFIG.baseDelay;

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                timeout: options.timeout || TRIPADVISOR_CONFIG.timeout
            });

            // Handle rate limiting
            if (response.status === 429) {
                return this._handleRateLimit(response, endpoint, options, retryCount, maxRetries, baseDelay);
            }

            if (!response.ok) {
                return this._handleErrorResponse(response, endpoint, options, retryCount, maxRetries, baseDelay);
            }

            const data = await response.json();
            this._validateResponse(data);
            return data;

        } catch (error) {
            return this._handleNetworkError(error, endpoint, options, retryCount, maxRetries, baseDelay);
        }
    }

    /**
     * Fetch location details from TripAdvisor
     */
    async fetchLocationDetails(locationId = this.locationId) {
        if (!locationId) {
            throw new Error('Location ID is required');
        }

        const queryParams = new URLSearchParams({
            language: 'en',
            currency: 'USD'
        });

        const endpoint = `/location/${locationId}/details?${queryParams}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Fetch reviews for a location from TripAdvisor
     */
    async fetchReviews(locationId = this.locationId, options = {}) {
        if (!locationId) {
            throw new Error('Location ID is required');
        }

        const queryParams = new URLSearchParams({
            language: options.language || 'en',
            limit: options.limit || '10',
            offset: options.offset || '0',
            ...options.additionalParams
        });

        const endpoint = `/location/${locationId}/reviews?${queryParams}`;
        return await this.makeRequest(endpoint);
    }

    // Private helper methods
    async _handleRateLimit(response, endpoint, options, retryCount, maxRetries, baseDelay) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, retryCount);

        if (retryCount < maxRetries) {
            console.warn(`TripAdvisor API rate limited. Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.makeRequest(endpoint, options, retryCount + 1);
        } else {
            throw new Error(`TripAdvisor API rate limit exceeded. Max retries (${maxRetries}) reached.`);
        }
    }

    async _handleErrorResponse(response, endpoint, options, retryCount, maxRetries, baseDelay) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || response.statusText;

        // Handle specific error types
        if (response.status === 401) {
            throw new Error('TripAdvisor API authentication failed. Please check your API key.');
        } else if (response.status === 403) {
            throw new Error('TripAdvisor API access forbidden. Please verify your domain is registered.');
        } else if (response.status === 404) {
            throw new Error('TripAdvisor location not found. Please check your location ID.');
        } else if (response.status >= 500) {
            // Server errors - retry with exponential backoff
            if (retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount);
                console.warn(`TripAdvisor API server error (${response.status}). Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequest(endpoint, options, retryCount + 1);
            }
        }

        throw new Error(`TripAdvisor API error: ${response.status} - ${errorMessage}`);
    }

    async _handleNetworkError(error, endpoint, options, retryCount, maxRetries, baseDelay) {
        // Handle network errors with retry
        if (error.name === 'TypeError' || error.name === 'NetworkError') {
            if (retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount);
                console.warn(`TripAdvisor API network error. Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequest(endpoint, options, retryCount + 1);
            }
        }

        console.error('TripAdvisor API request failed:', error);
        throw error;
    }

    _validateResponse(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format from TripAdvisor API');
        }
    }
}

// Create singleton instance
export const apiClient = new TripAdvisorApiClient();