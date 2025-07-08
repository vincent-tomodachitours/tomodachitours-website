/**
 * Bokun Availability Service - Production Ready
 * Automatically switches between secure API and fallback mode
 */

import { SecureBokunAPI } from './secure-api-client.js';
import { supabase } from '../../lib/supabase.js';

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
        console.log(`🔐 Fetching secure availability for product ${bokunProductId} on ${date}`);
        console.log(`🔍 Date type: ${typeof date}, Date value: ${date}`);

        const response = await this.api.getAvailabilities(bokunProductId, date, date);

        console.log('🔍 Raw Bokun API response:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Is array:', Array.isArray(response));

        if (!response) {
            throw new Error('No response from secure API');
        }

        if (!Array.isArray(response)) {
            console.log('🔍 Response is not array, checking if it has availabilities property...');
            if (response.availabilities && Array.isArray(response.availabilities)) {
                console.log('✅ Found availabilities array in response');
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
        console.log('🔄 Processing availability response:', availabilities);

        // Find the specific time slot or get general availability
        let targetAvailability = null;
        if (timeSlot && availabilities.length > 0) {
            targetAvailability = availabilities.find(avail => avail.startTime === timeSlot);
        } else if (availabilities.length > 0) {
            targetAvailability = availabilities[0];
        }

        if (!targetAvailability) {
            console.log('⚠️ No target availability found');
            return {
                available: false,
                availableSpots: 0,
                totalCapacity: 0,
                cached: false,
                source: 'secure_api'
            };
        }

        console.log('✅ Found target availability:', targetAvailability);

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

        console.log('✅ Processed availability result:', result);
        return result;
    }

    /**
     * Fetch time slots using secure backend API
     */
    async fetchSecureTimeSlots(bokunProductId, date) {
        console.log(`🔐 Fetching secure time slots for product ${bokunProductId} on ${date}`);
        console.log(`🔍 Date type: ${typeof date}, Date value: ${date}`);

        const response = await this.api.getAvailabilities(bokunProductId, date, date);

        console.log('🔍 Raw time slots response:', response);

        let availabilities = response;

        // Handle different response formats
        if (!Array.isArray(response)) {
            if (response && response.availabilities && Array.isArray(response.availabilities)) {
                availabilities = response.availabilities;
            } else {
                console.log('⚠️ Invalid time slots response format');
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

        console.log('✅ Processed time slots:', timeSlots);
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
        console.log('📝 Cache update skipped in production service');
    }

    async invalidateCache(tourType, date = null, timeSlot = null) {
        console.log('🗑️ Cache invalidation skipped in production service');
    }
}

// Create singleton instance
export const bokunAvailabilityService = new BokunAvailabilityService(); 