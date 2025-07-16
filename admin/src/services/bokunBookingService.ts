import { supabase } from '../lib/supabase';
import { Employee, Booking, BookingStatus } from '../types';

// Bokun API booking interface
export interface BokunBooking {
    id: string;
    confirmationCode: string;
    productId: string;
    productTitle: string;
    date: string;
    time: string;
    status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
    participants: {
        adults: number;
        children: number;
        infants: number;
    };
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    totalPrice: {
        amount: number;
        currency: string;
    };
    createdAt: string;
    updatedAt: string;
    source: string; // 'direct', 'viator', 'getyourguide', etc.
}

export interface BokunBookingFilters {
    startDate?: string;
    endDate?: string;
    status?: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
    limit?: number;
}

// Transformed booking interface to match admin expectations
export interface TransformedBooking {
    id: number; // Convert string to number for compatibility
    booking_date: string;
    booking_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    adults: number;
    children: number;
    infants: number;
    total_participants: number;
    status: string;
    tour_type: string;
    created_at: string;

    // Bokun-specific fields
    tour_name: string;
    external_source: string;
    bokun_booking_id: string;
    confirmation_code: string;
    total_amount: number;
    currency: string;

    // Admin fields for compatibility
    assigned_guide_id?: string;
    guide_notes?: string;
    assigned_guide?: Employee;
    charge_id?: string;
    discount_amount?: number;
    discount_code?: string;
    discount_code_id?: number;
}

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

            // Get external Bokun bookings
            const bokunBookings = await this.getBokunBookings(filters);
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

            // Build query for cached bookings
            let query = supabase
                .from('bokun_bookings_cache')
                .select('*')
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
                // Fallback to live API if cache fails
                return this.getBokunBookingsLive(filters);
            }

            if (!cachedBookings || cachedBookings.length === 0) {
                console.warn('📭 No cached Bokun bookings found. Cache might need syncing.');
                // Check if cache is stale and suggest sync
                const { data: metadata } = await supabase
                    .from('bokun_cache_metadata')
                    .select('last_full_sync')
                    .order('last_full_sync', { ascending: false })
                    .limit(1)
                    .single();

                const lastSync = metadata?.last_full_sync;
                if (!lastSync || new Date(lastSync) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
                    console.warn('⚠️ Cache is stale (>24h old). Consider running sync.');
                }

                return [];
            }

            // Transform cached bookings to match the expected format
            const transformedBookings: Booking[] = cachedBookings.map(cached => ({
                id: cached.id,
                tour_type: cached.tour_type,
                booking_date: cached.booking_date,
                booking_time: cached.booking_time,
                customer_name: cached.customer_name,
                customer_email: cached.customer_email,
                customer_phone: cached.customer_phone,
                adults: cached.adults,
                children: cached.children,
                infants: cached.infants,
                total_participants: cached.total_participants,
                status: cached.status as BookingStatus,
                external_source: 'bokun',
                bokun_booking_id: cached.bokun_booking_id,
                created_at: cached.last_synced, // Use sync time as created_at
                bokun_synced: true,
                // Admin specific fields
                assigned_guide_id: undefined,
                guide_notes: undefined,
                assigned_guide: undefined,
                charge_id: undefined,
                discount_amount: undefined,
                discount_code: undefined,
                discount_code_id: undefined
            }));

            console.log(`✅ Admin: Retrieved ${transformedBookings.length} cached Bokun bookings`);
            return transformedBookings;

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
                    const startDate = filters?.startDate || this.getDefaultStartDate();
                    const endDate = filters?.endDate || this.getDefaultEndDate();

                    console.log(`🔍 Admin: Fetching Bokun bookings for ${product.local_tour_type} (${product.bokun_product_id}) from ${startDate} to ${endDate}`);

                    const bookings = await this.fetchBokunBookingsForProduct(
                        product.bokun_product_id,
                        startDate,
                        endDate
                    );

                    // Transform Bokun bookings to local format using the product mapping
                    const transformedBookings = bookings.map(booking =>
                        this.transformBokunBooking(booking, productMapping)
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
     * Fetch bookings from Bokun API for a specific product
     */
    static async fetchBokunBookingsForProduct(productId: string, startDate: string, endDate: string): Promise<BokunBooking[]> {
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
     * Transform Bokun booking to local booking format
     */
    static transformBokunBooking(bokunBooking: any, productMapping: Map<string, string>): Booking {
        // Get the actual product ID from the booking and map it to local tour type
        const bokunProductId = bokunBooking.product?.id?.toString() || bokunBooking.productId?.toString();
        const tourType = productMapping.get(bokunProductId) || 'UNKNOWN_TOUR';

        if (!bokunProductId || tourType === 'UNKNOWN_TOUR') {
            console.warn('Unknown Bokun product ID in booking:', bokunProductId, 'Available mappings:', Array.from(productMapping.keys()));
        }

        // Convert Bokun timestamp to date string (YYYY-MM-DD)
        const bookingDate = bokunBooking.startDate
            ? new Date(bokunBooking.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        // Extract time from fields.startTimeStr
        const bookingTime = bokunBooking.fields?.startTimeStr || '18:00';

        // Extract participant count
        const totalParticipants = bokunBooking.fields?.totalParticipants || 1;

        return {
            id: parseInt(bokunBooking.id) || Math.floor(Math.random() * 1000000),
            tour_type: tourType,
            booking_date: bookingDate,
            booking_time: bookingTime,
            customer_name: `${bokunBooking.customer?.firstName || 'External'} ${bokunBooking.customer?.lastName || 'Booking'}`,
            customer_email: bokunBooking.customer?.email || 'external@bokun.com',
            customer_phone: bokunBooking.customer?.phoneNumber || bokunBooking.customer?.phone,
            adults: totalParticipants, // Bokun doesn't separate adults/children, so put all in adults
            children: 0,
            infants: 0,
            total_participants: totalParticipants,
            status: 'CONFIRMED' as BookingStatus, // All Bokun bookings we fetch should be confirmed
            external_source: 'bokun',
            bokun_booking_id: bokunBooking.id,
            created_at: bokunBooking.creationDate ? new Date(bokunBooking.creationDate).toISOString() : new Date().toISOString(),
            bokun_synced: true,
            // Admin specific fields
            assigned_guide_id: undefined,
            guide_notes: undefined,
            assigned_guide: undefined,
            charge_id: undefined,
            discount_amount: undefined,
            discount_code: undefined,
            discount_code_id: undefined
        };
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

    /**
     * Sync Bokun bookings to cache (Admin function)
     */
    static async syncBokunCache(): Promise<{ success: boolean; message: string; details?: any }> {
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