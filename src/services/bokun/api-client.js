/**
 * Bokun REST API Client
 * Handles authentication and API communication with Bokun booking system
 */

class BokunAPI {
    constructor() {
        this.apiKey = process.env.REACT_APP_BOKUN_API_KEY;
        this.apiSecret = process.env.REACT_APP_BOKUN_API_SECRET;
        this.baseURL = process.env.REACT_APP_BOKUN_API_URL || 'https://api.bokun.io/booking';
        this.accessToken = null;
        this.tokenExpiry = null;

        if (!this.apiKey || !this.apiSecret) {
            console.warn('Bokun API credentials not configured. Bokun integration will be disabled.');
        }
    }

    /**
     * Authenticate with Bokun API using OAuth 2.0
     * @returns {Promise<string>} Access token
     */
    async authenticate() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const response = await fetch(`${this.baseURL}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.apiKey,
                    client_secret: this.apiSecret,
                    scope: 'booking:read booking:write'
                })
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

            return this.accessToken;
        } catch (error) {
            console.error('Bokun authentication error:', error);
            throw error;
        }
    }

    /**
     * Make authenticated request to Bokun API
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {string} method - HTTP method
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} API response
     */
    async makeRequest(endpoint, method = 'GET', data = null, options = {}) {
        if (!this.apiKey || !this.apiSecret) {
            throw new Error('Bokun API credentials not configured');
        }

        try {
            const token = await this.authenticate();

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            };

            const config = {
                method,
                headers,
                ...options
            };

            if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                config.body = JSON.stringify(data);
            }

            const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
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
     * Test API connection
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            await this.makeRequest('/health', 'GET');
            return true;
        } catch (error) {
            console.error('Bokun API connection test failed:', error);
            return false;
        }
    }

    /**
     * Get available products
     * @returns {Promise<Array>} List of products
     */
    async getProducts() {
        return this.makeRequest('/products', 'GET');
    }

    /**
     * Get product availability
     * @param {string} productId - Bokun product ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {Object} options - Additional query parameters
     * @returns {Promise<Object>} Availability data
     */
    async getProductAvailability(productId, date, options = {}) {
        const queryParams = new URLSearchParams({
            date,
            ...options
        });

        return this.makeRequest(`/products/${productId}/availability?${queryParams}`, 'GET');
    }

    /**
     * Create a booking
     * @param {Object} bookingData - Booking information
     * @returns {Promise<Object>} Created booking
     */
    async createBooking(bookingData) {
        return this.makeRequest('/bookings', 'POST', bookingData);
    }

    /**
     * Get booking details
     * @param {string} bookingId - Bokun booking ID
     * @returns {Promise<Object>} Booking details
     */
    async getBooking(bookingId) {
        return this.makeRequest(`/bookings/${bookingId}`, 'GET');
    }

    /**
     * Cancel a booking
     * @param {string} bookingId - Bokun booking ID
     * @param {Object} cancellationData - Cancellation information
     * @returns {Promise<Object>} Cancellation result
     */
    async cancelBooking(bookingId, cancellationData = {}) {
        return this.makeRequest(`/bookings/${bookingId}/cancel`, 'POST', cancellationData);
    }

    /**
     * Update booking
     * @param {string} bookingId - Bokun booking ID
     * @param {Object} updateData - Update information
     * @returns {Promise<Object>} Updated booking
     */
    async updateBooking(bookingId, updateData) {
        return this.makeRequest(`/bookings/${bookingId}`, 'PUT', updateData);
    }
}

// Export singleton instance
const bokunAPI = new BokunAPI();
export default bokunAPI; 