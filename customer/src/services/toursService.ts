import { supabase } from '../lib/supabase';
import { bokunAvailabilityService } from './bokun/availability-service';
import { TourType } from '../types';

// Type definitions
export interface TourConfig {
    id: string;
    type: TourType;
    'tour-title': string;
    'tour-description': string;
    'tour-price': number;
    'original-price'?: number;
    'tour-duration': string;
    reviews: number;
    'time-slots': string[];
    'max-participants': number;
    'min-participants': number;
    'cancellation-cutoff-hours': number;
    'cancellation-cutoff-hours-with-participant': number;
    'next-day-cutoff-time'?: string;
    'meeting-point': string;
    updated_at?: string;
}

// Static config.json structure (subset of TourConfig)
interface StaticTourConfig {
    'tour-title': string;
    'tour-description': string;
    'tour-price': number;
    'tour-duration': string;
    reviews: number;
    'time-slots': string[];
    'max-participants': number;
    'min-participants'?: number;
    updated_at?: string;
}

export interface TimeSlot {
    time: string;
    availableSpots: number;
    source: 'bokun' | 'fallback';
}

export interface AvailabilityResult {
    available: boolean;
    availableSpots: number;
}

export interface TourFromDB {
    id: number;
    name: string;
    description: string;
    base_price: number;
    original_price: number | null;
    duration_minutes: number;
    reviews: number | null;
    time_slots: Array<{ start_time: string; is_active: boolean }> | null;
    max_participants: number;
    min_participants: number;
    meeting_point: string;
    booking_cutoff_hours: number | null;
    type: string;
    updated_at: string;
}

export interface BookingFromDB {
    total_participants: number | null;
}

// Cache for tour data to avoid repeated API calls
let toursCache: Record<string, TourConfig> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds for testing, will increase later

/**
 * Fetch all tours from Supabase with caching
 */
export async function fetchTours(): Promise<Record<string, TourConfig>> {
    try {
        // Check cache first
        if (toursCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
            console.log('🔄 Using cached tour data');
            return toursCache;
        }

        console.log('🔍 Fetching fresh tour data from database');

        const { data: tours, error } = await supabase
            .from('tours')
            .select('*')
            .order('type');

        if (error) {
            console.error('❌ Error fetching tours from database:', error);
            throw error;
        }

        console.log('✅ Tours fetched from database:', tours);

        const transformedTours: Record<string, TourConfig> = {};

        (tours as TourFromDB[]).forEach(tour => {
            const key = getConfigKey(tour.type);
            const cutoffHours = tour.booking_cutoff_hours ?? 24; // Fallback to 24 hours
            
            console.log(`🔍 Processing tour ${tour.type} (${key}):`, {
                min_participants: tour.min_participants,
                max_participants: tour.max_participants,
                cutoff_hours: cutoffHours
            });

            transformedTours[key] = {
                'tour-title': tour.name,
                'tour-description': tour.description,
                'tour-price': tour.base_price,
                'original-price': tour.original_price ?? undefined,
                'tour-duration': formatDuration(tour.duration_minutes),
                'reviews': tour.reviews ?? 0,
                'time-slots': extractTimeSlots(tour.time_slots),
                'max-participants': tour.max_participants,
                'min-participants': tour.min_participants,
                'cancellation-cutoff-hours': cutoffHours,
                'cancellation-cutoff-hours-with-participant': cutoffHours,
                'next-day-cutoff-time': undefined,
                'meeting-point': tour.meeting_point,
                id: String(tour.id),
                type: tour.type as TourType,
                updated_at: tour.updated_at
            };
        });

        // Cache the data
        toursCache = transformedTours;
        cacheTimestamp = Date.now();

        return transformedTours;

    } catch (error) {
        // Fall back to static config
        const staticTours = await getStaticTours();
        const transformedStaticTours: Record<string, TourConfig> = {};

        Object.entries(staticTours).forEach(([key, tour]) => {
            transformedStaticTours[key] = {
                ...tour,
                'min-participants': tour['min-participants'] || 1, // Default to 1 if not specified
                'cancellation-cutoff-hours': 24,
                'cancellation-cutoff-hours-with-participant': 24,
                'meeting-point': 'TBD',
                id: key,
                type: convertConfigKeyToTourType(key) as TourType
            } as TourConfig;
        });

        return transformedStaticTours;
    }
}

/**
 * Get a specific tour by config key (e.g., 'morning-tour')
 */
export async function getTour(configKey: string): Promise<TourConfig | null> {
    const tours = await fetchTours();
    return tours[configKey] || null;
}

/**
 * Clear the tours cache (useful for testing or when data is updated)
 */
export function clearToursCache(): void {
    console.log('🗑️ Clearing tours cache');
    toursCache = null;
    cacheTimestamp = null;
}

/**
 * Convert tour type to config key
 */
function getConfigKey(tourType: string): string {
    const typeMap: { [key: string]: string } = {
        'NIGHT_TOUR': 'night-tour',
        'MORNING_TOUR': 'morning-tour',
        'UJI_TOUR': 'uji-tour',
        'UJI_WALKING_TOUR': 'uji-walking-tour',
        'GION_TOUR': 'gion-tour',
        'MUSIC_TOUR': 'music-tour',
        'MUSIC_PERFORMANCE': 'music-performance'
    };
    return typeMap[tourType] || tourType.toLowerCase();
}

/**
 * Format duration from minutes to human readable
 */
function formatDuration(minutes: number | string): string {
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
        return String(minutes); // Return as-is if we can't parse it
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
function extractTimeSlots(timeSlots: Array<{ start_time: string; is_active: boolean }> | null): string[] {
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
export async function checkAvailability(tourType: string, date: string, timeSlot: string, participantCount: number = 1): Promise<boolean> {
    try {
        // Convert config key to tour type if needed
        const dbTourType = convertConfigKeyToTourType(tourType);

        // Use Bokun availability service (with fallback to local)
        const availability = await bokunAvailabilityService.getAvailability(dbTourType, date, timeSlot) as any;

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
export async function getAvailableTimeSlots(tourType: string, date: string): Promise<TimeSlot[]> {
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
async function checkLocalAvailability(tourType: string, date: string, timeSlot: string, participantCount: number = 1): Promise<boolean> {
    try {
        const dbTourType = convertConfigKeyToTourType(tourType);

        // Get tour configuration
        const { data: tour, error: tourError } = await supabase
            .from('tours')
            .select('max_participants, min_participants')
            .eq('type', dbTourType)
            .single();

        if (tourError || !tour) {
            console.error('Error fetching tour for availability check:', tourError);
            return false;
        }

        // Check minimum participants requirement
        if (participantCount < tour.min_participants) {
            console.log(`Minimum ${tour.min_participants} participants required, got ${participantCount}`);
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
function convertConfigKeyToTourType(configKey: string): string {
    const keyMap: { [key: string]: string } = {
        'night-tour': 'NIGHT_TOUR',
        'morning-tour': 'MORNING_TOUR',
        'uji-tour': 'UJI_TOUR',
        'uji-walking-tour': 'UJI_WALKING_TOUR',
        'gion-tour': 'GION_TOUR',
        'music-tour': 'MUSIC_TOUR',
        'music-performance': 'MUSIC_PERFORMANCE'
    };
    return keyMap[configKey] || configKey.toUpperCase().replace('-', '_');
}

/**
 * Invalidate availability cache for a tour and date
 */
export async function invalidateAvailabilityCache(tourType: string, date: string): Promise<void> {
    try {
        const dbTourType = convertConfigKeyToTourType(tourType);
        await (bokunAvailabilityService as any).invalidateCache(dbTourType, date);
    } catch (error) {
        console.error('Error invalidating availability cache:', error);
    }
}

/**
 * Refresh availability for a specific date across all tours
 */
export async function refreshAvailabilityForDate(date: string): Promise<void> {
    try {
        // Invalidate cache for all tour types to force fresh data
        const tourTypes = ['NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'UJI_WALKING_TOUR', 'GION_TOUR', 'MUSIC_TOUR', 'MUSIC_PERFORMANCE'];

        for (const tourType of tourTypes) {
            await (bokunAvailabilityService as any).invalidateCache(tourType, date);
        }
    } catch (error) {
        console.error('Error refreshing availability:', error);
    }
}

/**
 * Fallback to static config.json if Supabase fails
 */
async function getStaticTours(): Promise<Record<string, StaticTourConfig>> {
    try {
        const config = await import('../config.json');
        return (config.default || config) as unknown as Record<string, StaticTourConfig>;
    } catch (error) {
        return {};
    }
} 