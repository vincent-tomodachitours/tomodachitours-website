import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import { BokunBookingFilters, TransformedBooking } from './bokun/types';
import { BokunApiClient } from './bokun/api';
import { BokunTransformer } from './bokun/transformer';
import { BokunCache } from './bokun/cache';

// Re-export types for backward compatibility
export type { BokunBookingFilters, TransformedBooking } from './bokun/types';

export class BokunBookingService {
    /**
     * Get all bookings (local + external Bokun bookings)
     */
    static async getAllBookings(filters?: BokunBookingFilters): Promise<Booking[]> {
        try {
            console.log('🔍 Admin: Fetching all bookings (local + external)');

            // Get local bookings from database
            const localBookings = await this.getLocalBookings(filters);
            console.log(`📋 Admin: Found ${localBookings.length} local bookings`);

            // Get external Bokun bookings from cache
            const bokunBookings = await BokunCache.getCachedBookings(filters);
            console.log(`📋 Admin: Found ${bokunBookings.length} external Bokun bookings`);

            // Combine and deduplicate bookings
            const allBookings = [...localBookings, ...bokunBookings];

            // Remove duplicates based on bokun_booking_id if present
            const uniqueBookings = allBookings.reduce((acc, booking) => {
                const key = booking.bokun_booking_id || `local_${booking.id}`;
                if (!acc.has(key)) {
                    acc.set(key, booking);
                }
                return acc;
            }, new Map<string, Booking>());

            const result = Array.from(uniqueBookings.values());
            console.log(`✅ Admin: Total unique bookings: ${result.length}`);

            return result;
        } catch (error) {
            console.error('Error fetching all bookings:', error);
            // Fallback to local bookings only
            return this.getLocalBookings(filters);
        }
    }

    /**
     * Get local bookings from database
     */
    static async getLocalBookings(filters?: BokunBookingFilters): Promise<Booking[]> {
        try {
            let query = supabase
                .from('bookings')
                .select(`
                    *,
                    assigned_guide:employees!assigned_guide_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status
                    )
                `)
                .order('booking_date', { ascending: false });

            // Apply filters
            if (filters) {
                if (filters.startDate && filters.endDate) {
                    query = query
                        .gte('booking_date', filters.startDate)
                        .lte('booking_date', filters.endDate);
                }

                if (filters.status) {
                    query = query.eq('status', filters.status);
                }

                if (filters.limit) {
                    query = query.limit(filters.limit);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching local bookings:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getLocalBookings:', error);
            return [];
        }
    }

    /**
     * Get external Bokun bookings from cache (FAST!)
     */
    static async getBokunBookings(filters?: BokunBookingFilters): Promise<Booking[]> {
        try {
            console.log('🚀 Admin: Fetching Bokun bookings from cache (fast!)');
            return await BokunCache.getCachedBookings(filters);
        } catch (error) {
            console.error('Error accessing Bokun cache:', error);
            // Fallback to live API
            return this.getBokunBookingsLive(filters);
        }
    }

    /**
     * Get external Bokun bookings via live API (SLOW - for fallback only)
     */
    static async getBokunBookingsLive(filters?: BokunBookingFilters): Promise<Booking[]> {
        try {
            console.warn('⚠️ Admin: Falling back to live Bokun API (slow)');

            // Get all active Bokun products to create a mapping
            const { data: bokunProducts, error: productError } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('is_active', true);

            if (productError || !bokunProducts || bokunProducts.length === 0) {
                console.warn('No active Bokun products found');
                return [];
            }

            // Create a mapping from Bokun product ID to local tour type
            const productMapping = new Map<string, string>();
            bokunProducts.forEach(product => {
                productMapping.set(product.bokun_product_id, product.local_tour_type);
            });

            const allBokunBookings: Booking[] = [];

            // Fetch bookings for each product
            for (const product of bokunProducts) {
                try {
                    const startDate = filters?.startDate || BokunApiClient.getDefaultStartDate();
                    const endDate = filters?.endDate || BokunApiClient.getDefaultEndDate();

                    console.log(`🔍 Admin: Fetching Bokun bookings for ${product.local_tour_type} (${product.bokun_product_id}) from ${startDate} to ${endDate}`);

                    const bookings = await BokunApiClient.fetchBookingsForProduct(
                        product.bokun_product_id,
                        startDate,
                        endDate
                    );

                    // Transform Bokun bookings to local format using the product mapping
                    const transformedBookings = bookings.map(booking =>
                        BokunTransformer.transformBokunBooking(booking, productMapping)
                    );

                    // Apply client-side date filtering since Bokun API filtering might not work correctly
                    let filteredBookings = transformedBookings;
                    if (filters?.startDate && filters?.endDate) {
                        filteredBookings = transformedBookings.filter(booking => {
                            const bookingDate = booking.booking_date;
                            return bookingDate >= filters.startDate! && bookingDate <= filters.endDate!;
                        });
                        console.log(`📅 Admin: Filtered ${transformedBookings.length} -> ${filteredBookings.length} bookings for date range ${filters.startDate} to ${filters.endDate}`);
                    }

                    allBokunBookings.push(...filteredBookings);
                } catch (error) {
                    console.warn(`Failed to fetch bookings for product ${product.bokun_product_id}:`, error);
                    // Continue with other products
                }
            }

            return allBokunBookings;
        } catch (error) {
            console.error('Error fetching Bokun bookings:', error);
            return [];
        }
    }

    /**
     * Sync Bokun bookings to cache (Admin function)
     */
    static async syncBokunCache(): Promise<{ success: boolean; message: string; details?: any }> {
        return BokunCache.syncCache();
    }

    /**
     * Get cache health status (Admin function)
     */
    static async getCacheHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
        return BokunCache.getCacheHealth();
    }

    /**
     * Clear cache (Admin function)
     */
    static async clearCache(): Promise<{ success: boolean; message: string }> {
        return BokunCache.clearCache();
    }

    /**
     * Test function to inspect raw Bokun API response
     */
    static async inspectBokunApiResponse(productId?: string): Promise<any> {
        return BokunApiClient.inspectApiResponse(productId);
    }

    /**
     * Legacy method for backward compatibility - now fetches all bookings
     */
    static async getTransformedBookings(filters?: BokunBookingFilters): Promise<TransformedBooking[]> {
        const allBookings = await this.getAllBookings(filters);

        return allBookings.map(booking => ({
            id: booking.id,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            customer_name: booking.customer_name,
            customer_email: booking.customer_email,
            customer_phone: booking.customer_phone,
            adults: booking.adults,
            children: booking.children,
            infants: booking.infants,
            total_participants: booking.total_participants || (booking.adults + booking.children + booking.infants),
            status: booking.status,
            tour_type: booking.tour_type,
            tour_name: booking.tour_type, // Use tour_type as tour_name
            created_at: booking.created_at,
            external_source: booking.external_source || 'website',
            bokun_booking_id: booking.bokun_booking_id || booking.id.toString(),
            confirmation_code: `${booking.external_source === 'bokun' ? 'BOKUN' : 'LOCAL'}-${booking.id}`,
            total_amount: 0, // No amount data available
            currency: 'USD',
            // Guide assignment fields - now properly included for Bokun bookings too
            assigned_guide_id: booking.assigned_guide_id,
            guide_notes: booking.guide_notes,
            assigned_guide: booking.assigned_guide,
            charge_id: booking.charge_id,
            discount_amount: booking.discount_amount,
            discount_code: booking.discount_code,
            discount_code_id: booking.discount_code_id
        }));
    }
}