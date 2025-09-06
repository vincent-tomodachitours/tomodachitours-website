import { supabase } from '../../lib/supabase';
import { Booking } from '../../types';
import { BokunBookingFilters } from './types';
import { BokunTransformer } from './transformer';

export class BokunCache {
    /**
     * Get external Bokun bookings from cache (FAST!)
     */
    static async getCachedBookings(filters?: BokunBookingFilters): Promise<Booking[]> {
        try {
            console.log('🚀 Admin: Fetching Bokun bookings from cache (fast!) - DEBUG MODE');

            // First, let's see what dates are available in the cache
            const { data: allDates, error: datesError } = await supabase
                .from('bokun_bookings_cache')
                .select('booking_date')
                .order('booking_date', { ascending: false });

            if (datesError) {
                console.error('Error fetching booking dates:', datesError);
            } else {
                const uniqueDates = Array.from(new Set(allDates?.map(d => d.booking_date) || []));
                console.log('🔍 DEBUG: Available booking dates in cache:', uniqueDates);
            }

            // Build query for cached bookings with guide assignment data
            let query = supabase
                .from('bokun_bookings_cache')
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
                        status,
                        tour_types
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
                    query = query.eq('status', filters.status.toUpperCase());
                }
            }

            const { data: cachedBookings, error } = await query;

            if (error) {
                console.error('Error fetching cached Bokun bookings:', error);
                throw error;
            }

            console.log(`🔍 DEBUG: Found ${cachedBookings?.length || 0} cached bookings`);

            if (!cachedBookings || cachedBookings.length === 0) {
                console.warn('📭 No cached Bokun bookings found. Cache might need syncing.');
                return [];
            }

            // Debug: Log participant data from cached bookings
            cachedBookings.forEach((booking, index) => {
                if (index < 3) { // Only log first 3 bookings to avoid spam
                    console.log(`🔍 DEBUG: Cached booking ${booking.id} (${booking.booking_date}):`, {
                        adults: booking.adults,
                        children: booking.children,
                        infants: booking.infants,
                        total_participants: booking.total_participants,
                        customer_name: booking.customer_name
                    });
                }
            });

            // Transform cached bookings to match the expected format
            const transformedBookings: Booking[] = cachedBookings.map(cached =>
                BokunTransformer.transformCachedBooking(cached)
            );

            console.log(`✅ Admin: Retrieved ${transformedBookings.length} cached Bokun bookings with guide assignments`);
            return transformedBookings;

        } catch (error) {
            console.error('Error accessing Bokun cache:', error);
            throw error;
        }
    }

    /**
     * Sync Bokun bookings to cache (Admin function)
     */
    static async syncCache(): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            console.log('🔄 Admin: Starting Bokun cache sync...');

            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
            const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

            const response = await fetch(`${supabaseUrl}/functions/v1/bokun-cache-sync/sync-all`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ Admin: Cache sync completed successfully', result);
                return {
                    success: true,
                    message: `Successfully cached ${result.total_bookings_cached} bookings for ${result.products_processed} products`,
                    details: result
                };
            } else {
                console.error('❌ Admin: Cache sync failed', result);
                return {
                    success: false,
                    message: `Sync failed: ${result.error || 'Unknown error'}`,
                    details: result
                };
            }

        } catch (error) {
            console.error('❌ Admin: Error triggering cache sync:', error);
            return {
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Clear cache (Admin function)
     */
    static async clearCache(): Promise<{ success: boolean; message: string }> {
        try {
            console.log('🗑️ Admin: Clearing Bokun cache...');

            // Delete all cached bookings
            const { error: bookingsError } = await supabase
                .from('bokun_bookings_cache')
                .delete()
                .neq('id', 0); // Delete all rows

            if (bookingsError) {
                throw bookingsError;
            }

            // Reset metadata
            const { error: metadataError } = await supabase
                .from('bokun_cache_metadata')
                .delete()
                .neq('id', 0); // Delete all rows

            if (metadataError) {
                throw metadataError;
            }

            console.log('✅ Admin: Cache cleared successfully');
            return {
                success: true,
                message: 'Cache cleared successfully'
            };

        } catch (error) {
            console.error('❌ Admin: Error clearing cache:', error);
            return {
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Get cache health status (Admin function)
     */
    static async getCacheHealth(): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
            const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

            const response = await fetch(`${supabaseUrl}/functions/v1/bokun-cache-sync/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result.cache_health };

        } catch (error) {
            console.error('❌ Admin: Error checking cache health:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}