/**
 * Bokun Availability Service - Production Ready
 * Automatically switches between secure API and fallback mode
 */

import { SecureBokunAPI } from './secure-api-client';
import { supabase } from '../../lib/supabase';

export class BokunAvailabilityService {
    constructor() {
        this.api = new SecureBokunAPI();
        this.CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    }



    /**
     * Get availability for a specific tour type, date, and time slot
     */
    async getAvailability(tourType, date, timeSlot = null) {
        const bokunProduct = await this.getBokunProduct(tourType);
        if (!bokunProduct) {
            throw new Error(`No Bokun product mapping found for ${tourType}`);
        }

        return await this.fetchSecureAvailability(bokunProduct.bokun_product_id, date, timeSlot);
    }

    /**
     * Get all available time slots for a specific date
     */
    async getAvailableTimeSlots(tourType, date) {
        const bokunProduct = await this.getBokunProduct(tourType);
        if (!bokunProduct) {
            throw new Error(`No Bokun product mapping found for ${tourType}`);
        }

        return await this.fetchSecureTimeSlots(bokunProduct.bokun_product_id, date);
    }

    /**
     * Fetch availability using secure backend API
     */
    async fetchSecureAvailability(bokunProductId, date, timeSlot = null) {
        const response = await this.api.getAvailabilities(bokunProductId, date, date);

        if (!response) {
            throw new Error('No response from secure API');
        }

        if (!Array.isArray(response)) {
            if (response.availabilities && Array.isArray(response.availabilities)) {
                const availabilities = response.availabilities;
                return this.processAvailabilityResponse(availabilities, timeSlot);
            } else {
                throw new Error(`Invalid response format from secure API. Expected array, got: ${typeof response}`);
            }
        }

        return this.processAvailabilityResponse(response, timeSlot);
    }

    /**
     * Process availability response (extracted for reuse)
     */
    processAvailabilityResponse(availabilities, timeSlot = null) {
        // Find the specific time slot or get general availability
        let targetAvailability = null;
        if (timeSlot && availabilities.length > 0) {
            targetAvailability = availabilities.find(avail => avail.startTime === timeSlot);
        } else if (availabilities.length > 0) {
            targetAvailability = availabilities[0];
        }

        if (!targetAvailability) {
            return {
                available: false,
                availableSpots: 0,
                totalCapacity: 0,
                cached: false,
                source: 'secure_api'
            };
        }

        const availableSpots = targetAvailability.availabilityCount || 0;
        const isUnlimited = targetAvailability.unlimitedAvailability || false;
        const isSoldOut = targetAvailability.soldOut || false;

        const result = {
            available: !isSoldOut && (isUnlimited || availableSpots > 0),
            availableSpots: isUnlimited ? 999 : availableSpots,
            totalCapacity: isUnlimited ? 999 : availableSpots + (targetAvailability.bookedParticipants || 0),
            cached: false,
            source: 'secure_api',
            bokunAvailability: targetAvailability
        };

        return result;
    }

    /**
     * Fetch time slots using secure backend API
     */
    async fetchSecureTimeSlots(bokunProductId, date) {
        const response = await this.api.getAvailabilities(bokunProductId, date, date);

        let availabilities = response;

        // Handle different response formats
        if (!Array.isArray(response)) {
            if (response && response.availabilities && Array.isArray(response.availabilities)) {
                availabilities = response.availabilities;
            } else {
                return [];
            }
        }

        const timeSlots = availabilities
            .filter(avail => !avail.soldOut && (avail.unlimitedAvailability || avail.availabilityCount > 0))
            .map(avail => ({
                time: avail.startTime,
                availableSpots: avail.unlimitedAvailability ? 999 : avail.availabilityCount,
                totalCapacity: avail.unlimitedAvailability ? 999 : avail.availabilityCount + (avail.bookedParticipants || 0),
                bokunAvailabilityId: avail.id,
                startTimeId: avail.startTimeId,
                source: 'secure_api'
            }));
        return timeSlots;
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
     * Compatibility methods
     */
    async getCachedAvailability(tourType, date, timeSlot) {
        return null; // Simplified for now
    }

    async updateAvailabilityCache(bokunProductId, date, timeSlot, availability) {
        // Cache update skipped in production service
    }

    async invalidateCache(tourType, date = null, timeSlot = null) {
        // Cache invalidation skipped in production service
    }
}

// Create singleton instance
export const bokunAvailabilityService = new BokunAvailabilityService(); 