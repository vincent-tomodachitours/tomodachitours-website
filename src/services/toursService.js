import { supabase } from '../lib/supabase';

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