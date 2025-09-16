/**
 * Bokun Availability Service
 * Manages tour availability and timeslots from Bokun API with caching
 */

import { supabase } from '../../lib/supabase';

export class BokunAvailabilityService {
    constructor() {
        this.CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
        console.warn('⚠️ Bokun API integration temporarily disabled - using fallback mode');
    }

    /**
     * Get availability for a specific tour type, date, and time slot
     * @param {string} tourType - e.g., 'NIGHT_TOUR', 'MORNING_TOUR'
     * @param {string} date - ISO date string (YYYY-MM-DD)
     * @param {string} timeSlot - Time in HH:MM format
     * @returns {Promise<Object>} Availability information
     */
    async getAvailability(tourType, date, timeSlot = null) {
        try {
            // Check cache first
            const cached = await this.getCachedAvailability(tourType, date, timeSlot);
            if (cached && new Date(cached.expires_at) > new Date()) {
                console.log('Using cached availability for', tourType, date, timeSlot);
                return {
                    available: cached.available_spots > 0,
                    availableSpots: cached.available_spots,
                    totalCapacity: cached.total_capacity,
                    cached: true,
                    cachedAt: cached.cached_at
                };
            }

            // Get Bokun product mapping
            const bokunProduct = await this.getBokunProduct(tourType);
            if (!bokunProduct) {
                console.warn(`No Bokun product mapping found for ${tourType}`);
                return null;
            }

            // Fetch from Bokun API
            console.log(`Fetching availability from Bokun for product ${bokunProduct.bokun_product_id}`);
            const availability = await this.fetchBokunAvailability(bokunProduct.bokun_product_id, date, timeSlot);

            // Update cache
            await this.updateAvailabilityCache(bokunProduct.bokun_product_id, date, timeSlot, availability);

            return availability;
        } catch (error) {
            console.error('Error getting availability:', error);

            // Return cached data even if expired as fallback
            const cached = await this.getCachedAvailability(tourType, date, timeSlot);
            if (cached) {
                console.log('Using expired cache as fallback');
                return {
                    available: cached.available_spots > 0,
                    availableSpots: cached.available_spots,
                    totalCapacity: cached.total_capacity,
                    cached: true,
                    cachedAt: cached.cached_at,
                    fallback: true
                };
            }

            throw error;
        }
    }

    /**
     * Get cached availability from database
     */
    async getCachedAvailability(tourType, date, timeSlot) {
        try {
            const bokunProduct = await this.getBokunProduct(tourType);
            if (!bokunProduct) return null;

            let query = supabase
                .from('bokun_availability_cache')
                .select('*')
                .eq('bokun_product_id', bokunProduct.bokun_product_id)
                .eq('date', date);

            if (timeSlot) {
                query = query.eq('time_slot', timeSlot);
            }

            const { data, error } = await query.single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching cached availability:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in getCachedAvailability:', error);
            return null;
        }
    }

    /**
 * Fetch availability directly from Bokun API
 */
    async fetchBokunAvailability(bokunProductId, date, timeSlot = null) {
        try {
            // Temporary fallback - simulate Bokun API response for testing
            console.log(`🔧 Using fallback Bokun data for product ${bokunProductId} on ${date}`);

            // Simulate API response with sample time slots for NIGHT_TOUR
            const response = bokunProductId === '932404' ? [
                {
                    id: `fallback_${date}`,
                    startTime: '18:00',
                    availabilityCount: 10,
                    soldOut: false,
                    unlimitedAvailability: false,
                    bookedParticipants: 2
                }
            ] : [];

            if (!response || !Array.isArray(response)) {
                console.warn('No availability data returned from fallback');
                return {
                    available: false,
                    availableSpots: 0,
                    totalCapacity: 0,
                    cached: false
                };
            }

            // Process Bokun response
            // Bokun returns array of availability objects for each date/time
            const availabilities = response;

            // Find the specific time slot or get general availability
            let targetAvailability = null;
            if (timeSlot && availabilities.length > 0) {
                targetAvailability = availabilities.find(avail => {
                    // Check if this availability matches the requested time slot
                    return avail.startTime === timeSlot;
                });
            } else if (availabilities.length > 0) {
                targetAvailability = availabilities[0]; // Use first available slot
            }

            if (!targetAvailability) {
                return {
                    available: false,
                    availableSpots: 0,
                    totalCapacity: 0,
                    cached: false
                };
            }

            // Extract availability info from Bokun response
            const availableSpots = targetAvailability.availabilityCount || 0;
            const isUnlimited = targetAvailability.unlimitedAvailability || false;
            const isSoldOut = targetAvailability.soldOut || false;

            return {
                available: !isSoldOut && (isUnlimited || availableSpots > 0),
                availableSpots: isUnlimited ? 999 : availableSpots,
                totalCapacity: isUnlimited ? 999 : availableSpots + (targetAvailability.bookedParticipants || 0),
                cached: false,
                bokunAvailability: targetAvailability // Include raw Bokun data for debugging
            };

        } catch (error) {
            console.error('Error fetching from Bokun API:', error);
            throw new Error(`Failed to fetch availability from Bokun: ${error.message}`);
        }
    }

    /**
     * Update availability cache in database
     */
    async updateAvailabilityCache(bokunProductId, date, timeSlot, availability) {
        try {
            const expiresAt = new Date(Date.now() + this.CACHE_DURATION);

            const cacheData = {
                bokun_product_id: bokunProductId,
                date: date,
                time_slot: timeSlot || '00:00', // Default time if not specified
                available_spots: availability.availableSpots || 0,
                total_capacity: availability.totalCapacity || 0,
                cached_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            };

            const { error } = await supabase
                .from('bokun_availability_cache')
                .upsert(cacheData, {
                    onConflict: 'bokun_product_id,date,time_slot'
                });

            if (error) {
                console.error('Error updating availability cache:', error);
            } else {
                console.log('Updated availability cache:', cacheData);
            }
        } catch (error) {
            console.error('Error in updateAvailabilityCache:', error);
        }
    }

    /**
     * Get Bokun product mapping from database
     */
    async getBokunProduct(tourType) {
        try {
            const { data, error } = await supabase
                .from('bokun_products')
                .select('*')
                .eq('local_tour_type', tourType)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') {
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
     * Invalidate cache for specific product/date/time
     */
    async invalidateCache(tourType, date = null, timeSlot = null) {
        try {
            const bokunProduct = await this.getBokunProduct(tourType);
            if (!bokunProduct) return;

            let query = supabase
                .from('bokun_availability_cache')
                .delete()
                .eq('bokun_product_id', bokunProduct.bokun_product_id);

            if (date) {
                query = query.eq('date', date);
            }

            if (timeSlot) {
                query = query.eq('time_slot', timeSlot);
            }

            const { error } = await query;

            if (error) {
                console.error('Error invalidating cache:', error);
            } else {
                console.log('Cache invalidated for:', tourType, date, timeSlot);
            }
        } catch (error) {
            console.error('Error in invalidateCache:', error);
        }
    }

    /**
 * Get all available time slots for a specific date
 */
    async getAvailableTimeSlots(tourType, date) {
        try {
            const bokunProduct = await this.getBokunProduct(tourType);
            if (!bokunProduct) {
                console.warn(`No Bokun product mapping found for ${tourType}`);
                return [];
            }

            const endpoint = `/activity.json/${bokunProduct.bokun_product_id}/availabilities`;
            const params = new URLSearchParams({
                start: date,
                end: date,
                currency: 'USD'
            });

            const response = await this.api.makeRequest(`${endpoint}?${params}`, 'GET');

            if (!response || !Array.isArray(response)) {
                return [];
            }

            return response
                .filter(avail => !avail.soldOut && (avail.unlimitedAvailability || avail.availabilityCount > 0))
                .map(avail => ({
                    time: avail.startTime,
                    availableSpots: avail.unlimitedAvailability ? 999 : avail.availabilityCount,
                    totalCapacity: avail.unlimitedAvailability ? 999 : avail.availabilityCount + (avail.bookedParticipants || 0),
                    bokunAvailabilityId: avail.id,
                    startTimeId: avail.startTimeId
                }));
        } catch (error) {
            console.error('Error getting available time slots:', error);
            return [];
        }
    }
}

// Create singleton instance
export const bokunAvailabilityService = new BokunAvailabilityService(); 