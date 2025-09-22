import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { bokunAvailabilityService } from '../services/bokun/availability-service-production';
import { AvailabilityHookResult, HookAvailabilityData, TimeSlot } from '../types/hooks';

interface DatabaseTimeSlot {
    date: string;
    time: string;
    available_spots: number;
}

interface TourDatabaseData {
    time_slots: DatabaseTimeSlot[];
    max_participants: number;
}

export const useAvailability = (
    sheetId: string,
    availableTimes: string[],
    maxSlots: number,
    participantsByDate: Record<string, Record<string, number>>,
    cancellationCutoffHours: number,
    cancellationCutoffHoursWithParticipant: number,
    nextDayCutoffTime?: string
): AvailabilityHookResult => {
    const [preloadedAvailability, setPreloadedAvailability] = useState<Record<string, HookAvailabilityData>>({});
    const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(true);

    // Helper function to get the availability source for a tour
    const getAvailabilitySource = useCallback((tourSheetId: string): string => {
        // First, convert frontend tour IDs to database tour types
        const tourIdToTypeMap: Record<string, string> = {
            'night-tour': 'NIGHT_TOUR',
            'morning-tour': 'MORNING_TOUR',
            'uji-tour': 'UJI_TOUR',
            'gion-tour': 'GION_TOUR',
            'uji-walking-tour': 'UJI_TOUR', // Walking tour uses same availability as main Uji tour
            'music-tour': 'MUSIC_TOUR',
            'music-performance': 'MUSIC_PERFORMANCE'
        };

        // Convert to database format first
        const dbTourType = tourIdToTypeMap[tourSheetId] || tourSheetId.toUpperCase().replace('-', '_');

        // Then apply any additional mappings
        const availabilityMap: Record<string, string> = {
            'UJI_WALKING_TOUR': 'UJI_TOUR', // Walking tour uses same availability as main Uji tour
        };

        return availabilityMap[dbTourType] || dbTourType;
    }, []);

    /**
     * Get database availability for music tour
     */
    const getDatabaseAvailabilityForMusicTour = useCallback(async (dateStr: string): Promise<HookAvailabilityData | null> => {
        try {
            // Determine which tour type to query based on sheetId
            let tourType = 'MUSIC_TOUR';
            if (sheetId === 'music-performance' || sheetId === 'MUSIC_PERFORMANCE') {
                tourType = 'MUSIC_PERFORMANCE';
            }

            // Get tour data from database
            const { data: tour, error: tourError } = await supabase
                .from('tours')
                .select('time_slots, max_participants')
                .eq('type', tourType)
                .single();

            if (tourError || !tour) {
                console.warn(`Could not fetch ${tourType} tour data:`, tourError);
                return null;
            }

            const tourData = tour as TourDatabaseData;
            const timeSlots = tourData.time_slots || [];

            // Filter time slots for the specific date
            const availableSlotsForDate = timeSlots.filter(slot => {
                return slot.date === dateStr && slot.available_spots > 0;
            });

            // Convert to the expected format
            const formattedSlots: TimeSlot[] = availableSlotsForDate.map(slot => ({
                time: slot.time,
                availableSpots: slot.available_spots
            }));

            return {
                dateKey: dateStr,
                hasAvailability: formattedSlots.length > 0,
                timeSlots: formattedSlots,
                timestamp: Date.now(),
                source: 'database'
            };
        } catch (error) {
            console.error('Error fetching database availability for music tour:', error);
            return null;
        }
    }, [sheetId]);

    /**
     * Find the next available date for the tour
     */
    const findNextAvailableDate = useCallback(async (): Promise<Date> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check up to 6 months ahead
        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 6);

        const currentDate = new Date(today);

        while (currentDate <= maxDate) {
            const dateStr = currentDate.toLocaleDateString("en-CA");

            try {
                // Check if this is a music tour - use database availability
                if (sheetId === 'music-tour' || sheetId === 'MUSIC_TOUR' || sheetId === 'music-performance' || sheetId === 'MUSIC_PERFORMANCE') {
                    const dbAvailability = await getDatabaseAvailabilityForMusicTour(dateStr);
                    if (dbAvailability && dbAvailability.hasAvailability) {
                        return new Date(currentDate);
                    }
                } else {
                    // For other tours, use Bokun
                    const availabilitySource = getAvailabilitySource(sheetId);
                    const timeSlots = await bokunAvailabilityService.getAvailableTimeSlots(availabilitySource, dateStr);
                    if (timeSlots && timeSlots.length > 0) {
                        return new Date(currentDate);
                    }
                }
            } catch (error) {
                // If API fails, assume date might be available and continue
                console.warn(`Error checking availability for ${dateStr}:`, error);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // If no available date found, return today
        return today;
    }, [sheetId, getDatabaseAvailabilityForMusicTour, getAvailabilitySource]);
    /**
         * Preload availability for a range of dates (for calendar display)
         */
    const preloadAvailabilityForDates = useCallback(async (startDate: Date, endDate: Date): Promise<void> => {
        setAvailabilityLoading(true);
        const newAvailabilityData: Record<string, HookAvailabilityData> = {};

        try {
            // Get current preloaded availability data
            const currentPreloadedAvailability = await new Promise<Record<string, HookAvailabilityData>>(resolve => {
                setPreloadedAvailability(current => {
                    resolve(current);
                    return current;
                });
            });

            const currentDate = new Date(startDate);
            const promises: Promise<HookAvailabilityData>[] = [];

            while (currentDate <= endDate) {
                const dateKey = currentDate.toLocaleDateString("en-CA");

                // Skip if we already have recent data for this date
                if (currentPreloadedAvailability[dateKey] &&
                    (Date.now() - currentPreloadedAvailability[dateKey].timestamp) < 5 * 60 * 1000) {
                    newAvailabilityData[dateKey] = currentPreloadedAvailability[dateKey];
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                // Create promise for this date
                const promise = (async (date: Date): Promise<HookAvailabilityData> => {
                    try {
                        const dateStr = date.toLocaleDateString("en-CA");

                        // Check if this is a music tour - use database availability
                        if (sheetId === 'music-tour' || sheetId === 'MUSIC_TOUR' || sheetId === 'music-performance' || sheetId === 'MUSIC_PERFORMANCE') {
                            const dbAvailability = await getDatabaseAvailabilityForMusicTour(dateStr);
                            if (dbAvailability) {
                                return dbAvailability;
                            }
                            // Fall back to configured times if database fails
                            return {
                                dateKey: dateStr,
                                hasAvailability: true,
                                timeSlots: availableTimes.map(time => ({ time, availableSpots: null })),
                                timestamp: Date.now(),
                                fallback: true
                            };
                        }

                        // For all other tours, use Bokun
                        const availabilitySource = getAvailabilitySource(sheetId);
                        const timeSlots = await bokunAvailabilityService.getAvailableTimeSlots(availabilitySource, dateStr);

                        const hasAvailability = timeSlots && timeSlots.length > 0;

                        return {
                            dateKey: dateStr,
                            hasAvailability,
                            timeSlots: (timeSlots || []).map((slot: any) =>
                                typeof slot === 'string'
                                    ? { time: slot, availableSpots: null }
                                    : slot
                            ),
                            timestamp: Date.now()
                        };
                    } catch (error) {
                        console.warn(`⚠️ ${date.toLocaleDateString("en-CA")}: API error, using fallback`);
                        // Fall back to configured times - assume they're available
                        return {
                            dateKey: date.toLocaleDateString("en-CA"),
                            hasAvailability: true, // Default to available when falling back
                            timeSlots: availableTimes.map(time => ({ time, availableSpots: null })),
                            timestamp: Date.now(),
                            fallback: true
                        };
                    }
                })(new Date(currentDate));

                promises.push(promise);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Wait for all promises to complete
            const results = await Promise.all(promises);

            // Merge results
            results.forEach(result => {
                newAvailabilityData[result.dateKey] = result;
            });

            // Update state with both existing and new data
            setPreloadedAvailability(prev => ({
                ...prev,
                ...newAvailabilityData
            }));

        } catch (error) {
            console.error('Error preloading availability:', error);
        } finally {
            setAvailabilityLoading(false);
        }
    }, [sheetId, availableTimes, getAvailabilitySource, getDatabaseAvailabilityForMusicTour]);

    /**
     * Get available times for a specific date
     */
    const returnAvailableTimes = useCallback(async (date: Date, participants: number): Promise<string[]> => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate] || {};

        // Use preloaded availability data if available, otherwise fall back to configured times
        const preloadedData = preloadedAvailability[formattedDate];
        let timeSlots: TimeSlot[];
        let hasAvailabilityData = false;

        if (preloadedData && preloadedData.timeSlots) {
            // Keep full slot objects when we have availability data
            timeSlots = preloadedData.timeSlots.map(slot => {
                if (typeof slot === 'string') {
                    return { time: slot, availableSpots: null }; // String format, no availability data
                } else if (slot && slot.time) {
                    return slot; // Keep full object with availableSpots
                } else {
                    return null;
                }
            }).filter((slot): slot is TimeSlot => slot !== null);

            // Check if we have actual availability data (Bokun or database, not fallback)
            hasAvailabilityData = !preloadedData.fallback &&
                (preloadedData.source === 'database' || timeSlots.some(slot => slot.availableSpots !== null));
        } else {
            // Fallback to configured times
            timeSlots = availableTimes.map(time => ({ time, availableSpots: null }));
        }

        const nowJST = getNowInJST();

        // Check if this is a booking for tomorrow
        const dateJST = new Date(date);
        const todayJST = new Date(nowJST);

        // Reset times to start of day for date comparison
        const dateStart = new Date(dateJST.getFullYear(), dateJST.getMonth(), dateJST.getDate());
        const todayStart = new Date(todayJST.getFullYear(), todayJST.getMonth(), todayJST.getDate());

        const isBookingForTomorrow =
            dateStart.getTime() === todayStart.getTime() + (24 * 60 * 60 * 1000);

        // If booking for tomorrow and there's a next-day cut-off time
        if (isBookingForTomorrow && nextDayCutoffTime) {
            const [cutoffHour, cutoffMinute] = nextDayCutoffTime.split(':').map(Number);
            const todayCutoff = new Date(todayStart); // Use todayStart to ensure correct date
            todayCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

            if (nowJST.getTime() >= todayCutoff.getTime()) {
                return []; // Past cut-off time for tomorrow's bookings
            }
        }

        // Filter options based on availability and time constraints
        const filteredOptions: string[] = [];
        for (const currentSlot of timeSlots) {
            const slotTime = currentSlot.time;
            const currentParticipants = dayData[slotTime] || 0;
            const tourDateTimeJST = getTourDateTimeJST(date, slotTime);
            const hoursUntilTour = (tourDateTimeJST.getTime() - nowJST.getTime()) / (1000 * 60 * 60);
            const hasParticipants = currentParticipants > 0;
            const cutoffHours = hasParticipants ? cancellationCutoffHoursWithParticipant : cancellationCutoffHours;

            // Check availability - use external data (Bokun/database) if available, otherwise fall back to local calculation
            let spotsAvailable: boolean;
            if (hasAvailabilityData && currentSlot.availableSpots !== null && currentSlot.availableSpots !== undefined) {
                // Use external availability data (already accounts for all bookings)
                spotsAvailable = currentSlot.availableSpots >= participants;
                const source = preloadedData?.source === 'database' ? 'database' : 'Bokun';
                console.log(`🎯 Using ${source} availability for ${slotTime}: ${currentSlot.availableSpots} spots available, need ${participants}`);
            } else {
                // Fall back to local calculation (only accounts for local bookings)
                spotsAvailable = maxSlots - currentParticipants >= participants;
                console.log(`💾 Using local availability for ${slotTime}: ${maxSlots - currentParticipants} spots available, need ${participants}`);
            }

            const notPastCutoff = hoursUntilTour >= cutoffHours;

            if (spotsAvailable && notPastCutoff) {
                filteredOptions.push(slotTime);
            }
        }

        return filteredOptions;
    }, [maxSlots, participantsByDate, cancellationCutoffHours, cancellationCutoffHoursWithParticipant, nextDayCutoffTime, preloadedAvailability, availableTimes]);

    /**
     * Check if a date is full
     */
    const isDateFull = useCallback((date: Date, participants: number): boolean => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate];
        const preloadedData = preloadedAvailability[formattedDate];

        // If we have external availability data (Bokun or database), use it
        if (preloadedData && preloadedData.timeSlots && !preloadedData.fallback) {
            for (const slot of preloadedData.timeSlots) {
                let availableSpots: number | null = null;
                if (slot && typeof slot === 'object' && slot.availableSpots !== undefined) {
                    availableSpots = slot.availableSpots;
                }

                if (availableSpots !== null) {
                    // Use external availability data (Bokun or database)
                    if (availableSpots >= participants) {
                        return false; // Date is NOT full because this slot has availability
                    }
                } else {
                    // Fall back to local calculation for this slot
                    const timeString = slot.time;
                    const currentParticipants = dayData ? (dayData[timeString] || 0) : 0;
                    if (currentParticipants + participants <= maxSlots) {
                        return false; // Date is NOT full because this slot is available
                    }
                }
            }
            return true; // Date IS full because no slots have availability
        }

        // Fallback to original logic when no external data
        if (!dayData) return false;

        for (let i = 0; i < availableTimes.length; i++) {
            const currentParticipants = dayData[availableTimes[i]] || 0;
            // Check if this slot can accommodate the requested number of participants
            if (currentParticipants + participants <= maxSlots) {
                return false; // Date is NOT full because at least one slot is available
            }
        }

        return true; // Date IS full because no slots can accommodate the participants
    }, [participantsByDate, preloadedAvailability, maxSlots, availableTimes]);

    return {
        preloadedAvailability,
        availabilityLoading,
        setAvailabilityLoading,
        preloadAvailabilityForDates,
        returnAvailableTimes,
        isDateFull,
        findNextAvailableDate
    };
};

// Helper functions
function getNowInJST(): Date {
    const now = new Date();
    // Since you're already in JST timezone, we don't need to convert
    return now;
}

function getTourDateTimeJST(date: Date, time: string): Date {
    // Validate time parameter
    if (!time || typeof time !== 'string') {
        console.error('getTourDateTimeJST: Invalid time parameter:', time);
        return new Date(); // Return current date as fallback
    }

    const timeParts = time.split(":");
    if (timeParts.length !== 2) {
        console.error('getTourDateTimeJST: Invalid time format:', time);
        return new Date(); // Return current date as fallback
    }

    const [hour, minute] = timeParts;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    // Since we're already in JST, we can create the date directly
    return new Date(`${y}-${m}-${d}T${hour}:${minute}:00`);
}