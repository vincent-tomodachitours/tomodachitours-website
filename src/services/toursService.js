import { supabase } from '../lib/supabase';

// Cache for tour data to avoid repeated API calls
let toursCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all tours from Supabase with caching
 */
export async function fetchTours() {
    // Return cached data if it's still fresh
    if (toursCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return toursCache;
    }

    try {
        const { data: tours, error } = await supabase
            .from('tours')
            .select('*')
            .order('created_at');

        if (error) {
            console.error('❌ Error fetching tours from Supabase:', error);
            console.error('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
            console.error('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
            // Fall back to static config if Supabase fails
            return getStaticTours();
        }

        // Transform Supabase data to match the expected format
        const transformedTours = {};

        tours.forEach(tour => {
            const key = getConfigKey(tour.type);
            transformedTours[key] = {
                'tour-title': tour.name,
                'tour-description': tour.description,
                'tour-price': tour.base_price,
                'tour-duration': formatDuration(tour.duration_minutes),
                'reviews': 0, // Could be added to DB later
                'time-slots': extractTimeSlots(tour.time_slots),
                'max-participants': tour.max_participants,
                // Additional data from Supabase
                id: tour.id,
                type: tour.type,
                updated_at: tour.updated_at
            };
        });

        // Cache the data
        toursCache = transformedTours;
        cacheTimestamp = Date.now();

        console.log('✅ Tours loaded from Supabase:', Object.keys(transformedTours));
        return transformedTours;

    } catch (error) {
        console.error('❌ Failed to fetch tours (catch block):', error);
        console.error('Environment check - URL:', process.env.REACT_APP_SUPABASE_URL);
        console.error('Environment check - Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
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
        console.log('⚠️ Using fallback static tours from config.json');
        return config.default || config;
    } catch (error) {
        console.error('Failed to load static config:', error);
        return {};
    }
} 