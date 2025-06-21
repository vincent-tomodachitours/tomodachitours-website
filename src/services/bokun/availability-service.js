/**
 * Bokun Availability Service
 * Manages tour availability and timeslots from Bokun API with caching
 */

import bokunAPI from './api-client.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

class BokunAvailabilityService {
    constructor() {
        this.cacheExpiry = 15 * 60 * 1000; // 15 minutes in milliseconds
    }

    /**
     * Get Bokun product mapping for local tour type
     * @param {string} tourType - Local tour type (NIGHT_TOUR, MORNING_TOUR, etc.)
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
                console.error('Error fetching Bokun product mapping:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getBokunProduct:', error);
            return null;
        }
    }

    /**
     * Get cached availability from database
     * @param {string} bokunProductId - Bokun product ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} timeSlot - Time slot (optional)
     * @returns {Promise<Array>} Cached availability data
     */
    async getCachedAvailability(bokunProductId, date, timeSlot = null) {
        try {
            let query = supabase
                .from('bokun_availability_cache')
                .select('*')
                .eq('bokun_product_id', bokunProductId)
                .eq('date', date)
                .gt('expires_at', new Date().toISOString());

            if (timeSlot) {
                query = query.eq('time_slot', timeSlot);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching cached availability:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getCachedAvailability:', error);
            return [];
        }
    }

    /**
     * Update availability cache
     * @param {string} bokunProductId - Bokun product ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {Array} availabilityData - Availability data from Bokun API
     */
    async updateAvailabilityCache(bokunProductId, date, availabilityData) {
        try {
            // Clear expired cache entries first
            await this.clearExpiredCache();

            // Prepare cache entries
            const cacheEntries = availabilityData.map(slot => ({
                bokun_product_id: bokunProductId,
                date: date,
                time_slot: slot.time,
                available_spots: slot.availableSpots || 0,
                cached_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + this.cacheExpiry).toISOString()
            }));

            // Insert or update cache entries
            const { error } = await supabase
                .from('bokun_availability_cache')
                .upsert(cacheEntries, {
                    onConflict: 'bokun_product_id,date,time_slot'
                });

            if (error) {
                console.error('Error updating availability cache:', error);
            }
        } catch (error) {
            console.error('Error in updateAvailabilityCache:', error);
        }
    }

    /**
     * Clear expired cache entries
     */
    async clearExpiredCache() {
        try {
            const { error } = await supabase
                .from('bokun_availability_cache')
                .delete()
                .lt('expires_at', new Date().toISOString());

            if (error) {
                console.error('Error clearing expired cache:', error);
            }
        } catch (error) {
            console.error('Error in clearExpiredCache:', error);
        }
    }

    /**
     * Get availability for a tour type and date
     * @param {string} tourType - Local tour type
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} timeSlot - Specific time slot (optional)
     * @returns {Promise<Array>} Available time slots
     */
    async getAvailability(tourType, date, timeSlot = null) {
        try {
            // Get Bokun product mapping
            const bokunProduct = await this.getBokunProduct(tourType);

            if (!bokunProduct) {
                console.warn(`No Bokun product mapping found for tour type: ${tourType}`);
                return this.getFallbackAvailability(tourType, date, timeSlot);
            }

            // Check cache first
            const cached = await this.getCachedAvailability(bokunProduct.bokun_product_id, date, timeSlot);

            if (cached.length > 0) {
                console.log(`Using cached availability for ${tourType} on ${date}`);
                return this.formatAvailabilityData(cached);
            }

            // Fetch from Bokun API
            console.log(`Fetching fresh availability from Bokun for ${tourType} on ${date}`);
            const availability = await bokunAPI.getActivityAvailability(
                bokunProduct.bokun_product_id,
                date,
                timeSlot ? { time: timeSlot } : {}
            );

            // Update cache
            if (availability && availability.dates && availability.dates[0] && availability.dates[0].times) {
                const slots = availability.dates[0].times.map(time => ({
                    time: time.startTime,
                    availableSpots: time.availableSeats || 0
                }));

                await this.updateAvailabilityCache(
                    bokunProduct.bokun_product_id,
                    date,
                    slots
                );
                return this.formatAvailabilityData(slots);
            }

            return [];
        } catch (error) {
            console.error(`Error getting availability for ${tourType} on ${date}:`, error);
            // Fallback to local availability check
            return this.getFallbackAvailability(tourType, date, timeSlot);
        }
    }

    /**
     * Format availability data for consistent response
     * @param {Array} availabilityData - Raw availability data
     * @returns {Array} Formatted availability data
     */
    formatAvailabilityData(availabilityData) {
        return availabilityData.map(slot => ({
            time: slot.time_slot || slot.time,
            availableSpots: slot.available_spots || slot.availableSpots || 0,
            isAvailable: (slot.available_spots || slot.availableSpots || 0) > 0,
            source: 'bokun'
        }));
    }

    /**
     * Fallback availability check using local database only
     * @param {string} tourType - Local tour type
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} timeSlot - Specific time slot (optional)
     * @returns {Promise<Array>} Local availability data
     */
    async getFallbackAvailability(tourType, date, timeSlot = null) {
        try {
            // Get tour configuration
            const { data: tour, error: tourError } = await supabase
                .from('tours')
                .select('*')
                .eq('type', tourType)
                .single();

            if (tourError || !tour) {
                console.error('Error fetching tour configuration:', tourError);
                return [];
            }

            // Get existing bookings for the date
            let bookingsQuery = supabase
                .from('bookings')
                .select('booking_time, total_participants')
                .eq('tour_type', tourType)
                .eq('booking_date', date)
                .eq('status', 'CONFIRMED');

            if (timeSlot) {
                bookingsQuery = bookingsQuery.eq('booking_time', timeSlot);
            }

            const { data: bookings, error: bookingsError } = await bookingsQuery;

            if (bookingsError) {
                console.error('Error fetching bookings:', bookingsError);
                return [];
            }

            // Calculate availability for each time slot
            const timeSlots = tour.time_slots || [];
            const availability = timeSlots.map(slot => {
                const bookingsForSlot = bookings.filter(b => b.booking_time === slot);
                const bookedSpots = bookingsForSlot.reduce((sum, booking) =>
                    sum + (booking.total_participants || 0), 0
                );
                const availableSpots = Math.max(0, tour.max_participants - bookedSpots);

                return {
                    time: slot,
                    availableSpots,
                    isAvailable: availableSpots > 0,
                    source: 'local'
                };
            });

            return timeSlot ? availability.filter(slot => slot.time === timeSlot) : availability;
        } catch (error) {
            console.error('Error in fallback availability check:', error);
            return [];
        }
    }

    /**
     * Check if a specific timeslot is available
     * @param {string} tourType - Local tour type
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} timeSlot - Time slot to check
     * @param {number} participantCount - Number of participants needed
     * @returns {Promise<boolean>} Availability status
     */
    async isTimeSlotAvailable(tourType, date, timeSlot, participantCount = 1) {
        try {
            const availability = await this.getAvailability(tourType, date, timeSlot);
            const slot = availability.find(s => s.time === timeSlot);

            return slot ? slot.availableSpots >= participantCount : false;
        } catch (error) {
            console.error('Error checking timeslot availability:', error);
            return false;
        }
    }

    /**
     * Invalidate cache for specific product and date
     * @param {string} tourType - Local tour type
     * @param {string} date - Date in YYYY-MM-DD format
     */
    async invalidateCache(tourType, date) {
        try {
            const bokunProduct = await this.getBokunProduct(tourType);

            if (bokunProduct) {
                const { error } = await supabase
                    .from('bokun_availability_cache')
                    .delete()
                    .eq('bokun_product_id', bokunProduct.bokun_product_id)
                    .eq('date', date);

                if (error) {
                    console.error('Error invalidating cache:', error);
                } else {
                    console.log(`Cache invalidated for ${tourType} on ${date}`);
                }
            }
        } catch (error) {
            console.error('Error in invalidateCache:', error);
        }
    }

    /**
     * Refresh availability for all active products
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<void>}
     */
    async refreshAllAvailability(date) {
        try {
            const { data: products, error } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('is_active', true);

            if (error) {
                console.error('Error fetching active products:', error);
                return;
            }

            // Refresh availability for each product
            const refreshPromises = products.map(product =>
                this.getAvailability(product.local_tour_type, date)
            );

            await Promise.allSettled(refreshPromises);
            console.log(`Availability refreshed for ${products.length} products on ${date}`);
        } catch (error) {
            console.error('Error refreshing all availability:', error);
        }
    }
}

// Export singleton instance
const bokunAvailabilityService = new BokunAvailabilityService();
export default bokunAvailabilityService; 