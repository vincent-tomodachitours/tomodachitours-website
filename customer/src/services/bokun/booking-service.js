/**
 * Bokun Booking Service
 * Handles fetching bookings from both local database and Bokun API
 */

import { supabase } from '../../lib/supabase';
import { SecureBokunAPI } from './secure-api-client';

export class BokunBookingService {
    constructor() {
        this.api = new SecureBokunAPI();
    }

    /**
     * Get all bookings for a tour type (local + Bokun external)
     * @param {string} tourType - Tour type (e.g., 'NIGHT_TOUR')
     * @returns {Promise<Array>} Combined array of all bookings
     */
    async getAllBookings(tourType) {
        try {
            // Get local bookings from database
            const localBookings = await this.getLocalBookings(tourType);

            // Get external Bokun bookings
            const bokunBookings = await this.getBokunBookings(tourType);

            // Combine and deduplicate bookings
            const allBookings = [...localBookings, ...bokunBookings];

            // Remove duplicates based on bokun_booking_id if present
            const uniqueBookings = allBookings.reduce((acc, booking) => {
                const key = booking.bokun_booking_id || `local_${booking.id}`;
                if (!acc.has(key)) {
                    acc.set(key, booking);
                }
                return acc;
            }, new Map());

            const result = Array.from(uniqueBookings.values());
            console.log(`📋 Bookings fetched: ${localBookings.length} local + ${bokunBookings.length} external = ${result.length} total`);

            return result;
        } catch (error) {
            console.error('❌ Error fetching bookings:', error);
            // Fallback to local bookings only
            return this.getLocalBookings(tourType);
        }
    }

    /**
     * Get local bookings from database
     * @param {string} tourType - Tour type
     * @returns {Promise<Array>} Local bookings array
     */
    async getLocalBookings(tourType) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('tour_type', tourType)
                .eq('status', 'CONFIRMED');

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
     * Get external Bokun bookings via API
     * @param {string} tourType - Tour type
     * @returns {Promise<Array>} Bokun bookings array
     */
    async getBokunBookings(tourType) {
        try {
            // Get Bokun product mapping
            const bokunProduct = await this.getBokunProduct(tourType);
            if (!bokunProduct) {
                return [];
            }

            // Get bookings for the past 30 days and next 90 days
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 90);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            const bookings = await this.fetchBokunBookings(
                bokunProduct.bokun_product_id,
                startDateStr,
                endDateStr
            );

            // Get product mapping to ensure correct tour type assignment
            const { data: allProducts, error: allProductsError } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('is_active', true);

            const productMapping = new Map();
            if (!allProductsError && allProducts) {
                allProducts.forEach(product => {
                    productMapping.set(product.bokun_product_id, product.local_tour_type);
                });
            }

            // Transform Bokun bookings to local format using product mapping
            const transformedBookings = bookings.map(booking => this.transformBokunBooking(booking, productMapping));

            return transformedBookings;
        } catch (error) {
            console.error('❌ Error fetching Bokun bookings:', error);
            return [];
        }
    }

    /**
     * Fetch bookings from Bokun API via proxy
     * @param {string} productId - Bokun product ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} Raw Bokun bookings
     */
    async fetchBokunBookings(productId, startDate, endDate) {
        try {
            const params = new URLSearchParams({
                productId,
                startDate,
                endDate
            });

            const response = await this.api.makeRequest(`/bookings?${params}`, 'GET');

            // Bokun API returns an object with results array, not just the array
            if (response && response.results && Array.isArray(response.results)) {
                console.log(`✅ Fetched ${response.results.length} Bokun bookings for product ${productId}`);
                return response.results;
            } else if (Array.isArray(response)) {
                // Handle case where response is already an array (backwards compatibility)
                console.log(`✅ Fetched ${response.length} Bokun bookings for product ${productId} (direct array)`);
                return response;
            } else {
                console.warn('Invalid Bokun bookings response format:', typeof response);
                return [];
            }
        } catch (error) {
            console.warn('Bokun bookings API not available, using local data only:', error);
            return [];
        }
    }

    /**
     * Transform Bokun booking to local booking format
     * @param {Object} bokunBooking - Raw Bokun booking
     * @param {Map} productMapping - Map of Bokun product IDs to local tour types
     * @returns {Object} Transformed booking
     */
    transformBokunBooking(bokunBooking, productMapping) {
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

        // Extract participant breakdown from Bokun booking
        const participants = bokunBooking.participants || {};
        const adults = participants.adults || 0;
        const children = participants.children || 0;
        const infants = participants.infants || 0;
        const totalParticipants = adults + children + infants || bokunBooking.fields?.totalParticipants || 1;

        return {
            id: `bokun_${bokunBooking.id}`,
            tour_type: tourType,
            booking_date: bookingDate,
            booking_time: bookingTime,
            customer_name: `${bokunBooking.customer?.firstName || 'External'} ${bokunBooking.customer?.lastName || 'Booking'}`,
            customer_email: bokunBooking.customer?.email || 'external@bokun.com',
            customer_phone: bokunBooking.customer?.phoneNumber || bokunBooking.customer?.phone,
            adults: adults,
            children: children,
            infants: infants,
            total_participants: totalParticipants,
            status: 'CONFIRMED', // All Bokun bookings we fetch should be confirmed
            external_source: 'bokun',
            bokun_booking_id: bokunBooking.id,
            created_at: bokunBooking.creationDate ? new Date(bokunBooking.creationDate).toISOString() : new Date().toISOString(),
            confirmation_code: bokunBooking.confirmationCode || bokunBooking.productConfirmationCode
        };
    }

    /**
     * Get Bokun product mapping for a tour type
     * @param {string} tourType - Local tour type
     * @returns {Promise<Object|null>} Bokun product mapping
     */
    async getBokunProduct(tourType) {
        try {
            const { data, error } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('local_tour_type', tourType)
                .eq('is_active', true)
                .single();

            if (error) {
                console.warn('Error fetching Bokun product mapping:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getBokunProduct:', error);
            return null;
        }
    }

    /**
     * Get bookings for a specific date and time slot
     * @param {string} tourType - Tour type
     * @param {string} date - Date (YYYY-MM-DD)
     * @param {string} timeSlot - Time slot (HH:MM)
     * @returns {Promise<Array>} Bookings for that slot
     */
    async getBookingsForSlot(tourType, date, timeSlot) {
        try {
            const allBookings = await this.getAllBookings(tourType);

            return allBookings.filter(booking =>
                booking.booking_date === date &&
                booking.booking_time === timeSlot &&
                booking.status === 'CONFIRMED'
            );
        } catch (error) {
            console.error('Error getting bookings for slot:', error);
            return [];
        }
    }

    /**
     * Calculate occupied spots for a specific date and time
     * @param {string} tourType - Tour type
     * @param {string} date - Date (YYYY-MM-DD)
     * @param {string} timeSlot - Time slot (HH:MM)
     * @returns {Promise<number>} Number of occupied spots
     */
    async getOccupiedSpots(tourType, date, timeSlot) {
        try {
            const bookings = await this.getBookingsForSlot(tourType, date, timeSlot);

            return bookings.reduce((total, booking) => {
                return total + (booking.total_participants || booking.adults + booking.children + booking.infants);
            }, 0);
        } catch (error) {
            console.error('Error calculating occupied spots:', error);
            return 0;
        }
    }
}

// Export singleton instance
export const bokunBookingService = new BokunBookingService(); 