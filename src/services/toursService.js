import { supabase } from '../lib/supabase';
import bokunAvailabilityService from './bokun/availability-service.js';

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
                'tour-duration': formatDuration(tour.duration_minutes),
                'reviews': tour.reviews ?? 0,
                'time-slots': extractTimeSlots(tour.time_slots),
                'max-participants': tour.max_participants,
                'cancellation-cutoff-hours': tour.cancellation_cutoff_hours ?? 24,
                'cancellation-cutoff-hours-with-participant': tour.cancellation_cutoff_hours_with_participant ?? tour.cancellation_cutoff_hours ?? 24,
                'next-day-cutoff-time': tour.next_day_cutoff_time ?? null,
                'meeting-point': tour.meeting_point ?? {
                    location: '7-Eleven Heart-in - JR Kyoto Station Central Entrance Store',
                    google_maps_url: 'https://maps.app.goo.gl/EFbn55FvZ6VdaxXN9',
                    additional_info: 'Warning: There are multiple 7-Elevens at Kyoto station. The 7-Eleven for the meetup location is in the central exit of Kyoto station.'
                },
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
        'GION_TOUR': 'gion-tour'
    };
    return typeMap[tourType] || tourType.toLowerCase();
}

/**
 * Format duration from minutes to human readable
 */
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    if (hours === 1) {
        return `1 hour ${remainingMinutes} minutes`;
    }

    // Convert to decimal format for consistency with existing config
    const decimalHours = (hours + remainingMinutes / 60).toFixed(1);
    return `${decimalHours} hours`;
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
        const isAvailable = await bokunAvailabilityService.isTimeSlotAvailable(
            dbTourType,
            date,
            timeSlot,
            participantCount
        );

        return isAvailable;
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

        // Get availability from Bokun service
        const availability = await bokunAvailabilityService.getAvailability(dbTourType, date);

        // Filter only available slots
        return availability
            .filter(slot => slot.isAvailable)
            .map(slot => ({
                time: slot.time,
                availableSpots: slot.availableSpots,
                source: slot.source
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
        'gion-tour': 'GION_TOUR'
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
        await bokunAvailabilityService.refreshAllAvailability(date);
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