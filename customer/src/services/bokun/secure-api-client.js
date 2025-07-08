/**
 * Secure Bokun API Client for Browser
 * Calls our Supabase Edge Function proxy to safely access Bokun API
 */

export class SecureBokunAPI {
    constructor() {
        // Use our Supabase Edge Function as proxy
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables for Bokun API');
        }

        this.baseURL = `${supabaseUrl}/functions/v1/bokun-proxy`;
        this.anonKey = supabaseAnonKey;
    }

    /**
     * Make request to our secure backend proxy
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${this.anonKey}`,
                'apikey': this.anonKey
            }
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(data);
        }

        console.log(`🔗 Making secure request: ${method} ${url}`);

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Secure API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseText = await response.text();
        return responseText ? JSON.parse(responseText) : {};
    }

    /**
     * Get activity availabilities for a specific date
     */
    async getAvailabilities(activityId, startDate, endDate) {
        // Ensure dates are in YYYY-MM-DD format, not ISO timestamps
        const formatDate = (date) => {
            if (typeof date === 'string' && date.includes('T')) {
                // Convert ISO timestamp to date-only
                return date.split('T')[0];
            }
            return date;
        };

        const params = new URLSearchParams({
            activityId,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        });

        console.log('📅 Formatted dates for Bokun:', {
            activityId,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        });

        return this.makeRequest(`/availabilities?${params}`, 'GET');
    }

    /**
     * Get activity details
     */
    async getActivity(activityId) {
        return this.makeRequest(`/activity/${activityId}`, 'GET');
    }

    /**
     * Search activities  
     */
    async searchActivities(searchData = {}) {
        return this.makeRequest('/search', 'POST', searchData);
    }
} 