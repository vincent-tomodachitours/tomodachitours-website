/**
 * Bokun REST API Client
 * Handles HMAC-SHA1 authentication and API communication with Bokun booking system
 */

class BokunAPI {
    constructor() {
        this.accessKey = process.env.REACT_APP_BOKUN_PUBLIC_KEY || process.env.BOKUN_PUBLIC_KEY;
        this.secretKey = process.env.REACT_APP_BOKUN_SECRET_KEY || process.env.BOKUN_SECRET_KEY;
        this.baseURL = process.env.REACT_APP_BOKUN_API_URL || process.env.BOKUN_API_URL || 'https://api.bokun.io';

        if (!this.accessKey || !this.secretKey) {
            console.warn('Bokun API credentials not configured. Bokun integration will be disabled.');
        }
    }

    /**
     * Create HMAC-SHA1 signature using Web Crypto API (browser-compatible)
     * @param {string} date - UTC date string in format "yyyy-MM-dd HH:mm:ss"
     * @param {string} method - HTTP method (uppercase)
     * @param {string} path - API path including query string
     * @returns {Promise<string>} Base64 encoded signature
     */
    async createSignature(date, method, path) {
        // Concatenate: date + accessKey + method + path
        const stringToSign = date + this.accessKey + method.toUpperCase() + path;

        // Convert secret key and message to ArrayBuffer
        const encoder = new TextEncoder();
        const keyData = encoder.encode(this.secretKey);
        const messageData = encoder.encode(stringToSign);

        // Import the secret key
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );

        // Create HMAC-SHA1 signature
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

        // Convert to base64
        const signatureArray = new Uint8Array(signature);
        const signatureBase64 = btoa(String.fromCharCode(...signatureArray));

        return signatureBase64;
    }

    /**
     * Get current UTC date in Bokun format
     * @returns {string} Date in "yyyy-MM-dd HH:mm:ss" format
     */
    getCurrentBokunDate() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
 * Make authenticated request to Bokun API using HMAC-SHA1 authentication
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {string} method - HTTP method
 * @param {Object} data - Request data
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} API response
 */
    async makeRequest(endpoint, method = 'GET', data = null, options = {}) {
        if (!this.accessKey || !this.secretKey) {
            throw new Error('Bokun API credentials not configured');
        }

        try {
            // Ensure endpoint starts with /
            const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
            const date = this.getCurrentBokunDate();
            const signature = await this.createSignature(date, method, path);

            const headers = {
                'X-Bokun-Date': date,
                'X-Bokun-AccessKey': this.accessKey,
                'X-Bokun-Signature': signature,
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/json',
                ...options.headers
            };

            const config = {
                method: method.toUpperCase(),
                headers,
                ...options
            };

            if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                config.body = JSON.stringify(data);
            }

            const url = `${this.baseURL}${path}`;
            console.log(`Making Bokun API request: ${method} ${url}`);

            const response = await fetch(url, config);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Bokun API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // Handle empty responses
            const responseText = await response.text();
            return responseText ? JSON.parse(responseText) : {};
        } catch (error) {
            console.error(`Bokun API request failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    /**
 * Test API connection by getting activity search
 * @returns {Promise<boolean>} Connection status
 */
    async testConnection() {
        try {
            // Use activity search as a test endpoint
            await this.makeRequest('/activity.json/search?lang=EN&currency=USD', 'GET');
            return true;
        } catch (error) {
            console.error('Bokun API connection test failed:', error);
            return false;
        }
    }

    /**
     * Search for activities/products
     * @param {Object} searchParams - Search parameters
     * @returns {Promise<Object>} Search results
     */
    async searchActivities(searchParams = {}) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD',
            ...searchParams
        });

        return this.makeRequest(`/activity.json/search?${params}`, 'POST');
    }

    /**
     * Get activity details
     * @param {string} activityId - Bokun activity ID
     * @param {Object} options - Additional options (lang, currency)
     * @returns {Promise<Object>} Activity details
     */
    async getActivityDetails(activityId, options = {}) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD',
            ...options
        });

        return this.makeRequest(`/activity.json/${activityId}?${params}`, 'GET');
    }

    /**
     * Get availability for an activity
     * @param {string} activityId - Bokun activity ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Availability data
     */
    async getActivityAvailability(activityId, date, options = {}) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD',
            ...options
        });

        const requestData = {
            date: date,
            ...options
        };

        return this.makeRequest(`/activity.json/${activityId}/availability?${params}`, 'POST', requestData);
    }

    /**
     * Get pricing for an activity
     * @param {string} activityId - Bokun activity ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {Object} pricingParams - Pricing parameters
     * @returns {Promise<Object>} Pricing data
     */
    async getActivityPricing(activityId, date, pricingParams = {}) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD'
        });

        const requestData = {
            date: date,
            ...pricingParams
        };

        return this.makeRequest(`/activity.json/${activityId}/pricing?${params}`, 'POST', requestData);
    }

    /**
     * Create a booking reservation
     * @param {Object} bookingData - Booking information
     * @returns {Promise<Object>} Reservation result
     */
    async createReservation(bookingData) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD'
        });

        return this.makeRequest(`/booking.json/reservation?${params}`, 'POST', bookingData);
    }

    /**
     * Confirm a booking
     * @param {string} reservationId - Reservation ID from createReservation
     * @param {Object} confirmationData - Confirmation data
     * @returns {Promise<Object>} Confirmation result
     */
    async confirmBooking(reservationId, confirmationData) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD'
        });

        return this.makeRequest(`/booking.json/${reservationId}/confirmation?${params}`, 'POST', confirmationData);
    }

    /**
     * Get booking details
     * @param {string} bookingId - Bokun booking ID
     * @returns {Promise<Object>} Booking details
     */
    async getBooking(bookingId) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD'
        });

        return this.makeRequest(`/booking.json/${bookingId}?${params}`, 'GET');
    }

    /**
     * Cancel a booking
     * @param {string} bookingId - Bokun booking ID
     * @param {Object} cancellationData - Cancellation information
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelBooking(bookingId, cancellationData = {}) {
        const params = new URLSearchParams({
            lang: 'EN',
            currency: 'USD'
        });

        return this.makeRequest(`/booking.json/${bookingId}/cancellation?${params}`, 'POST', cancellationData);
    }
}

// Export class and singleton instance
export { BokunAPI };

const bokunAPI = new BokunAPI();
export default bokunAPI; 