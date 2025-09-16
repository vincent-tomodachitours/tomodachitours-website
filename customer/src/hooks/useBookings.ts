import { useCallback, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { bokunBookingService } from '../services/bokun/booking-service.js';
import { BookingsHookResult, Booking } from '../types/hooks';

export const useBookings = (sheetId: string, availableTimes: string[]): BookingsHookResult => {
    const [bookings, setBookings] = useState<Booking[]>([]);

    const fetchBookings = useCallback(async (): Promise<void> => {
        // Convert sheetId to match database tour_type format
        const tourTypeMap: Record<string, string> = {
            'NIGHT_TOUR': 'NIGHT_TOUR',
            'MORNING_TOUR': 'MORNING_TOUR',
            'UJI_TOUR': 'UJI_TOUR',
            'UJI_WALKING_TOUR': 'UJI_TOUR', // Use same availability as UJI_TOUR
            'GION_TOUR': 'GION_TOUR',
            'MUSIC_TOUR': 'MUSIC_TOUR',
            // Hyphenated format (used by tour pages)
            'night-tour': 'NIGHT_TOUR',
            'morning-tour': 'MORNING_TOUR',
            'uji-tour': 'UJI_TOUR',
            'uji-walking-tour': 'UJI_TOUR',
            'gion-tour': 'GION_TOUR',
            'music-tour': 'MUSIC_TOUR',
            // Keep backwards compatibility
            'Night tour': 'NIGHT_TOUR',
            'Morning tour': 'MORNING_TOUR',
            'Uji tour': 'UJI_TOUR',
            'Gion tour': 'GION_TOUR',
            'Music tour': 'MUSIC_TOUR'
        };
        const tourType = tourTypeMap[sheetId];

        if (!tourType) {
            console.error(`❌ Invalid tour type: ${sheetId}`);
            throw new Error(`Invalid tour type: ${sheetId}`);
        }

        try {
            // Fetch all bookings (local + external Bokun bookings)
            const allBookings = await bokunBookingService.getAllBookings(tourType);
            setBookings(allBookings);
        } catch (error) {
            console.error('❌ Error fetching bookings, falling back to local only:', error);

            // Fallback to local bookings only if Bokun service fails
            const { data, error: supabaseError } = await supabase
                .from('bookings')
                .select('*')
                .eq('tour_type', tourType)
                .eq('status', 'CONFIRMED');

            if (supabaseError) {
                console.error('❌ Supabase fallback error:', supabaseError);
                throw supabaseError;
            }
            setBookings(data || []);
        }
    }, [sheetId]);

    const participantsByDate = useMemo((): Record<string, Record<string, number>> => {
        const dateMap: Record<string, Record<string, number>> = {};

        // Only process bookings if it's an array (not the initial "Loading" string)
        if (Array.isArray(bookings)) {
            bookings.forEach((booking) => {
                if (booking.booking_date && booking.booking_time) {
                    const formattedDate = booking.booking_date;
                    const timeSlot = booking.booking_time;

                    // Initialize date entry if it doesn't exist
                    if (!dateMap[formattedDate]) {
                        dateMap[formattedDate] = {};
                    }
                    // Ensure all time slots exist for that date (set to 0 by default)
                    availableTimes.forEach((t) => {
                        if (!dateMap[formattedDate][t]) {
                            dateMap[formattedDate][t] = 0;
                        }
                    });

                    // Calculate total participants using the new schema
                    const totalParticipants = booking.adults + booking.children;
                    dateMap[formattedDate][timeSlot] += totalParticipants;
                }
            });
        }

        return dateMap;
    }, [bookings, availableTimes]);

    return {
        bookings,
        participantsByDate,
        fetchBookings
    };
};