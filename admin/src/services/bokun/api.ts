import { BokunBooking } from './types';

export class BokunApiClient {
    /**
     * Fetch bookings from Bokun API for a specific product
     */
    static async fetchBookingsForProduct(productId: string, startDate: string, endDate: string): Promise<BokunBooking[]> {
        try {
            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
            const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

            const params = new URLSearchParams({
                productId,
                startDate,
                endDate
            });

            const response = await fetch(`${supabaseUrl}/functions/v1/bokun-proxy/bookings?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch Bokun bookings: ${response.status}`);
            }

            const data = await response.json();

            // Bokun API returns an object with results array, not just the array
            if (data && data.results && Array.isArray(data.results)) {
                console.log(`✅ Admin: Fetched ${data.results.length} Bokun bookings for product ${productId}`);
                return data.results;
            } else if (Array.isArray(data)) {
                // Handle case where response is already an array (backwards compatibility)
                console.log(`✅ Admin: Fetched ${data.length} Bokun bookings for product ${productId} (direct array)`);
                return data;
            } else {
                console.warn('Admin: Invalid Bokun bookings response format:', typeof data);
                return [];
            }
        } catch (error) {
            console.warn('Bokun bookings API not available:', error);
            return [];
        }
    }

    /**
     * Test function to inspect raw Bokun API response
     */
    static async inspectApiResponse(productId?: string): Promise<any> {
        try {
            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
            const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

            // Use default product ID if not provided
            const testProductId = productId || '932404'; // Night tour product ID from .env
            const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
            const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from now

            const params = new URLSearchParams({
                productId: testProductId,
                startDate,
                endDate
            });

            console.log(`🔍 Testing Bokun API for product ${testProductId} from ${startDate} to ${endDate}`);

            const response = await fetch(`${supabaseUrl}/functions/v1/bokun-proxy/bookings?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch Bokun bookings: ${response.status}`);
            }

            const data = await response.json();

            console.log('🔍 Raw Bokun API Response:', JSON.stringify(data, null, 2));

            // If there are bookings, log the first one in detail
            const bookings = data?.results || data;
            if (Array.isArray(bookings) && bookings.length > 0) {
                console.log('🔍 First booking structure:', JSON.stringify(bookings[0], null, 2));

                // Check specifically for participant data
                const firstBooking = bookings[0];
                console.log('🔍 Participant data in first booking:');
                console.log('  - participants:', firstBooking.participants);
                console.log('  - fields.totalParticipants:', firstBooking.fields?.totalParticipants);
                console.log('  - Any other participant fields:', Object.keys(firstBooking).filter(key =>
                    key.toLowerCase().includes('participant') || key.toLowerCase().includes('adult') ||
                    key.toLowerCase().includes('child') || key.toLowerCase().includes('infant')
                ));
            }

            return data;
        } catch (error) {
            console.error('Error inspecting Bokun API:', error);
            throw error;
        }
    }

    /**
     * Get default start date (30 days ago)
     */
    static getDefaultStartDate(): string {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    }

    /**
     * Get default end date (90 days from now)
     */
    static getDefaultEndDate(): string {
        const date = new Date();
        date.setDate(date.getDate() + 90);
        return date.toISOString().split('T')[0];
    }
}