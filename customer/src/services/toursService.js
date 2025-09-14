import { supabase } from '../lib/supabase';
import { bokunAvailabilityService } from './bokun/availability-service.js';

// Cache for tour data to avoid repeated API calls
let toursCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all tours from Supabase with caching
 */
export async function fetchTours() {
    try {
        // Check cache first
        if (toursCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
            return toursCache;
        }

        const { data: tours, error } = await supabase
            .from('tours')
            .select('*')
            .order('type');

        if (error) {
            throw error;
        }

        const transformedTours = {};

        tours.forEach(tour => {
            const key = getConfigKey(tour.type);
            transformedTours[key] = {
                'tour-title': tour.name,
                'tour-description': tour.description,
                'tour-price': tour.base_price,
                'original-price': tour.original_price,
                'tour-duration': formatDuration(tour.duration_minutes),
                'reviews': tour.reviews ?? 0,
                'time-slots': extractTimeSlots(tour.time_slots),
                'max-participants': tour.max_participants,
                'cancellation-cutoff-hours': tour.cancellation_cutoff_hours ?? 24,
                'cancellation-cutoff-hours-with-participant': tour.cancellation_cutoff_hours_with_participant ?? tour.cancellation_cutoff_hours ?? 24,
                'next-day-cutoff-time': tour.next_day_cutoff_time ?? null,
                'meeting-point': tour.meeting_point,
                id: tour.id,
                type: tour.type,
                updated_at: tour.updated_at
            };
        });

        // Cache the data
        toursCache = transformedTours;
        cacheTimestamp = Date.now();

        return transformedTours;

    } catch (error) {
        // Fall back to static config
        return getStaticTours();
    }
}

/**
 * Get a specific tour by config key (e.g., 'morning-tour')
 */
export async function getTour(configKey) {
    const tours = await fetchTours();
    return tours[configKey] || null;
}

/**
 * Clear the tours cache (useful for testing or when data is updated)
 */
export function clearToursCache() {
    toursCache = null;
    cacheTimestamp = null;
}

/**
 * Convert tour type to config key
 */
function getConfigKey(tourType) {
    const typeMap = {
        'NIGHT_TOUR': 'night-tour',
        'MORNING_TOUR': 'morning-tour',
        'UJI_TOUR': 'uji-tour',
        'UJI_WALKING_TOUR': 'uji-walking-tour',
        'GION_TOUR': 'gion-tour',
        'MUSIC_TOUR': 'music-tour'
    };
    return typeMap[tourType] || tourType.toLowerCase();
}

/**
 * Format duration from minutes to human readable
 */
function formatDuration(minutes) {
    console.log('formatDuration input:', minutes, 'type:', typeof minutes);

    // Handle string inputs that might already be formatted or malformed
    if (typeof minutes === 'string') {
        console.log('Processing string input:', minutes);
        // Clean up malformed strings like "4 hours 0 minutes" or "4 hours minutes"
        let cleaned = minutes
            .replace(/\s+0\s+minutes?/g, '') // Remove "0 minutes"
            .replace(/\s+minutes?\s*$/g, '') // Remove trailing "minutes" without a number
            .replace(/(\d+)\s+hours?\s+minutes?$/g, '$1 hours') // Fix "X hours minutes" to "X hours"
            .trim();

        console.log('Cleaned string result:', cleaned);
        return cleaned || minutes; // Return cleaned version or original if cleaning failed
    }

    // Convert to number if it's not already
    const numMinutes = Number(minutes);
    if (isNaN(numMinutes)) {
        console.log('Could not parse as number, returning as-is:', minutes);
        return minutes; // Return as-is if we can't parse it
    }

    console.log('Processing numeric input:', numMinutes);

    if (numMinutes < 60) {
        return `${numMinutes} minutes`;
    }
    const hours = Math.floor(numMinutes / 60);
    const remainingMinutes = numMinutes % 60;

    if (remainingMinutes === 0) {
        const result = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        console.log('Formatted result (no remaining minutes):', result);
        return result;
    }

    if (hours === 1) {
        return `1 hour ${remainingMinutes} minutes`;
    }

    // For multiple hours with minutes, use the format "X hours Y minutes"
    return `${hours} hours ${remainingMinutes} minutes`;
}

/**
 * Extract time slots from Supabase format
 */
function extractTimeSlots(timeSlots) {
    if (!timeSlots || !Array.isArray(timeSlots)) {
        return [];
    }

    return timeSlots
        .filter(slot => slot.is_active)
        .map(slot => slot.start_time)
        .sort();
}

/**
 * Check availability for a specific tour, date, and time slot
 * Integrates with Bokun for real-time availability
 */
export async function checkAvailability(tourType, date, timeSlot, participantCount = 1) {
    try {
        // Convert config key to tour type if needed
        const dbTourType = convertConfigKeyToTourType(tourType);

        // Use Bokun availability service (with fallback to local)
        const availability = await bokunAvailabilityService.getAvailability(dbTourType, date, timeSlot);

        if (availability) {
            return availability.available && availability.availableSpots >= participantCount;
        }

        // Fallback to local availability check if no Bokun data
        return checkLocalAvailability(tourType, date, timeSlot, participantCount);
    } catch (error) {
        console.error('Error checking availability:', error);
        // Fallback to local availability check
        return checkLocalAvailability(tourType, date, timeSlot, participantCount);
    }
}

/**
 * Get all available time slots for a tour on a specific date
 * Integrates with Bokun for real-time availability
 */
export async function getAvailableTimeSlots(tourType, date) {
    try {
        // Convert config key to tour type if needed
        const dbTourType = convertConfigKeyToTourType(tourType);

        // Get available time slots from Bokun service
        const timeSlots = await bokunAvailabilityService.getAvailableTimeSlots(dbTourType, date);

        // Return formatted time slots
        return timeSlots.map(slot => ({
            time: slot.time,
            availableSpots: slot.availableSpots,
            source: 'bokun'
        }));
    } catch (error) {
        console.error('Error getting available time slots:', error);
        // Fallback to tour configuration time slots
        const tour = await getTour(tourType);
        return tour ? tour['time-slots'].map(time => ({
            time,
            availableSpots: tour['max-participants'],
            source: 'fallback'
        })) : [];
    }
}

/**
 * Check local availability (fallback method)
 */
async function checkLocalAvailability(tourType, date, timeSlot, participantCount = 1) {
    try {
        const dbTourType = convertConfigKeyToTourType(tourType);

        // Get tour configuration
        const { data: tour, error: tourError } = await supabase
            .from('tours')
            .select('max_participants')
            .eq('type', dbTourType)
            .single();

        if (tourError || !tour) {
            console.error('Error fetching tour for availability check:', tourError);
            return false;
        }

        // Get existing bookings
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('total_participants')
            .eq('tour_type', dbTourType)
            .eq('booking_date', date)
            .eq('booking_time', timeSlot)
            .eq('status', 'CONFIRMED');

        if (bookingsError) {
            console.error('Error fetching bookings for availability check:', bookingsError);
            return false;
        }

        // Calculate available spots
        const bookedSpots = bookings.reduce((sum, booking) =>
            sum + (booking.total_participants || 0), 0
        );
        const availableSpots = tour.max_participants - bookedSpots;

        return availableSpots >= participantCount;
    } catch (error) {
        console.error('Error in local availability check:', error);
        return false;
    }
}

/**
 * Convert config key (e.g., 'night-tour') to database tour type (e.g., 'NIGHT_TOUR')
 */
function convertConfigKeyToTourType(configKey) {
    const keyMap = {
        'night-tour': 'NIGHT_TOUR',
        'morning-tour': 'MORNING_TOUR',
        'uji-tour': 'UJI_TOUR',
        'uji-walking-tour': 'UJI_WALKING_TOUR',
        'gion-tour': 'GION_TOUR',
        'music-tour': 'MUSIC_TOUR'
    };
    return keyMap[configKey] || configKey.toUpperCase().replace('-', '_');
}

/**
 * Invalidate availability cache for a tour and date
 */
export async function invalidateAvailabilityCache(tourType, date) {
    try {
        const dbTourType = convertConfigKeyToTourType(tourType);
        await bokunAvailabilityService.invalidateCache(dbTourType, date);
    } catch (error) {
        console.error('Error invalidating availability cache:', error);
    }
}

/**
 * Refresh availability for a specific date across all tours
 */
export async function refreshAvailabilityForDate(date) {
    try {
        // Invalidate cache for all tour types to force fresh data
        const tourTypes = ['NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'UJI_WALKING_TOUR', 'GION_TOUR', 'MUSIC_TOUR'];

        for (const tourType of tourTypes) {
            await bokunAvailabilityService.invalidateCache(tourType, date);
        }
    } catch (error) {
        console.error('Error refreshing availability:', error);
    }
}

/**
 * Fallback to static config.json if Supabase fails
 */
async function getStaticTours() {
    try {
        const config = await import('../config.json');
        return config.default || config;
    } catch (error) {
        return {};
    }
} 