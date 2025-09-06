import { useCallback, useEffect, useState, useMemo } from "react"
import Calendar from "react-calendar"
import '../CSS/Calendar.css';
import PeopleSelector from "./PeopleSelector";
import { ReactComponent as Clock } from '../SVG/Clock.svg'
import Checkout from './Checkout'
import PriceDisplay from './PriceDisplay';
import { supabase } from '../lib/supabase';
import { bokunAvailabilityService } from '../services/bokun/availability-service-production';
import { bokunBookingService } from '../services/bokun/booking-service.js';
import { trackParticipantChange } from '../services/analytics/basicTracking.js';


function DatePicker({ tourName = "noTourName", maxSlots, availableTimes, sheetId, price, originalPrice, cancellationCutoffHours, cancellationCutoffHoursWithParticipant, nextDayCutoffTime }) {
    const [checkout, setCheckout] = useState(false);
    const handleOpenCheckout = () => {
        setCheckout(true);
        // Note: begin_checkout tracking is now handled in the Checkout component
        // to ensure accurate timing and customer data collection
    };
    const handleCloseCheckout = () => {
        const payjp3DS = sessionStorage.getItem('payjp_3ds_in_progress') === 'true' ||
            localStorage.getItem('payjp_3ds_in_progress') === 'true';
        const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
            localStorage.getItem('checkout_should_stay_open') === 'true';

        console.log('🚪 DatePicker handleCloseCheckout called', {
            payjp3DS,
            shouldStayOpen,
            checkoutState: checkout,
            sessionStorage: {
                payjp3DS: sessionStorage.getItem('payjp_3ds_in_progress'),
                shouldStayOpen: sessionStorage.getItem('checkout_should_stay_open')
            },
            localStorage: {
                payjp3DS: localStorage.getItem('payjp_3ds_in_progress'),
                shouldStayOpen: localStorage.getItem('checkout_should_stay_open')
            }
        });

        // Check if 3D Secure is in progress and prevent closing
        if (payjp3DS || shouldStayOpen) {
            console.log('🛑 Preventing checkout close during PayJP 3D Secure verification');
            return;
        }

        console.log('✅ Allowing checkout to close');
        setCheckout(false);
    };
    const [bookings, setBookings] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    const [calendarState, setCalendarState] = useState(0);

    const [adultParticipants, setAdultParticipants] = useState(1);
    const [childParticipants, setChildParticipants] = useState(0);
    const [infantParticipants, setInfantParticipants] = useState(0);

    // Calculate total participants dynamically instead of using separate state
    const participants = adultParticipants + childParticipants + infantParticipants;

    // Wrapper functions for participant setters with GA4 tracking
    const handleAdultParticipantsChange = useCallback((newCount) => {
        const oldCount = adultParticipants;
        setAdultParticipants(newCount);

        // Track the change if it's different from the current value
        if (newCount !== oldCount) {
            const newTotal = newCount + childParticipants + infantParticipants;
            trackParticipantChange(tourName, 'adult', oldCount, newCount, newTotal);
        }
    }, [adultParticipants, childParticipants, infantParticipants, tourName]);

    const handleChildParticipantsChange = useCallback((newCount) => {
        const oldCount = childParticipants;
        setChildParticipants(newCount);

        // Track the change if it's different from the current value
        if (newCount !== oldCount) {
            const newTotal = adultParticipants + newCount + infantParticipants;
            trackParticipantChange(tourName, 'child', oldCount, newCount, newTotal);
        }
    }, [adultParticipants, childParticipants, infantParticipants, tourName]);

    const handleInfantParticipantsChange = useCallback((newCount) => {
        const oldCount = infantParticipants;
        setInfantParticipants(newCount);

        // Track the change if it's different from the current value
        if (newCount !== oldCount) {
            const newTotal = adultParticipants + childParticipants + newCount;
            trackParticipantChange(tourName, 'infant', oldCount, newCount, newTotal);
        }
    }, [adultParticipants, childParticipants, infantParticipants, tourName]);

    const totalPrice = (adultParticipants + childParticipants) * (price || 0);

    const [tourTime, setTourTime] = useState(availableTimes[0]);
    const [userSetTourTime, setUserSetTourTime] = useState(false);

    const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
    const [availableTimesForDate, setAvailableTimesForDate] = useState([]);
    const [preloadedAvailability, setPreloadedAvailability] = useState({});
    const [availabilityLoading, setAvailabilityLoading] = useState(true); // Start as true to show loading immediately

    // Helper function to get the availability source for a tour
    const getAvailabilitySource = useCallback((tourSheetId) => {
        // Map tours that should share availability
        const availabilityMap = {
            'UJI_WALKING_TOUR': 'UJI_TOUR', // Walking tour uses same availability as main Uji tour
        };
        return availabilityMap[tourSheetId] || tourSheetId;
    }, []);

    const participantsByDate = useMemo(() => {
        const dateMap = {};

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

    /**
     * Preload availability for a range of dates (for calendar display)
     */
    const preloadAvailabilityForDates = useCallback(async (startDate, endDate) => {
        setAvailabilityLoading(true);
        const newAvailabilityData = {};

        try {
            // Get current preloaded availability data
            const currentPreloadedAvailability = await new Promise(resolve => {
                setPreloadedAvailability(current => {
                    resolve(current);
                    return current;
                });
            });

            const currentDate = new Date(startDate);
            const promises = [];

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
                const promise = (async (date) => {
                    try {
                        const dateStr = date.toLocaleDateString("en-CA");
                        const availabilitySource = getAvailabilitySource(sheetId);
                        const timeSlots = await bokunAvailabilityService.getAvailableTimeSlots(availabilitySource, dateStr);

                        const hasAvailability = timeSlots && timeSlots.length > 0;

                        return {
                            dateKey: dateStr,
                            hasAvailability,
                            timeSlots: timeSlots || [],
                            timestamp: Date.now()
                        };
                    } catch (error) {
                        console.warn(`⚠️ ${date.toLocaleDateString("en-CA")}: Bokun API error, using fallback`);
                        // Fall back to configured times - assume they're available
                        return {
                            dateKey: date.toLocaleDateString("en-CA"),
                            hasAvailability: true, // Default to available when falling back
                            timeSlots: availableTimes,
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
    }, [sheetId, availableTimes, getAvailabilitySource]);

    const fetchBookings = useCallback(async () => {
        // Convert sheetId to match database tour_type format
        const tourTypeMap = {
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

    const returnAvailableTimes = useCallback(async (date, participants) => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate] || {};

        // Use preloaded availability data if available, otherwise fall back to configured times
        const preloadedData = preloadedAvailability[formattedDate];
        let timeSlots;
        let hasBokunData = false;

        if (preloadedData && preloadedData.timeSlots) {
            // Keep full slot objects when we have Bokun data with availability info
            timeSlots = preloadedData.timeSlots.map(slot => {
                if (typeof slot === 'string') {
                    return { time: slot, availableSpots: null }; // String format, no availability data
                } else if (slot && slot.time) {
                    return slot; // Keep full object with availableSpots
                } else {
                    return null;
                }
            }).filter(Boolean);

            // Check if we have actual Bokun availability data (not fallback)
            hasBokunData = !preloadedData.fallback && timeSlots.some(slot => slot.availableSpots !== null);
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
        const filteredOptions = [];
        for (const currentSlot of timeSlots) {
            const slotTime = currentSlot.time || currentSlot;
            const currentParticipants = dayData[slotTime] || 0;
            const tourDateTimeJST = getTourDateTimeJST(date, slotTime);
            const hoursUntilTour = (tourDateTimeJST - nowJST) / (1000 * 60 * 60);
            const hasParticipants = currentParticipants > 0;
            const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);

            // Check availability - use Bokun data if available, otherwise fall back to local calculation
            let spotsAvailable;
            if (hasBokunData && currentSlot.availableSpots !== null && currentSlot.availableSpots !== undefined) {
                // Use Bokun's availability data (already accounts for all bookings)
                spotsAvailable = currentSlot.availableSpots >= participants;
                console.log(`🎯 Using Bokun availability for ${slotTime}: ${currentSlot.availableSpots} spots available, need ${participants}`);
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

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Update available times for the time slot selector - CONSOLIDATED VERSION
    useEffect(() => {
        if (calendarState !== 1) {
            setAvailableTimesForDate([]);
            setLoadingAvailability(false);
            return;
        }

        let isCancelled = false;

        const updateAvailableTimes = async () => {
            try {
                if (isCancelled) return;
                setLoadingAvailability(true);

                const times = await returnAvailableTimes(calendarSelectedDate, participants);

                if (isCancelled) return;

                setAvailableTimesForDate(times || []);

                // Auto-select first available time if none selected and user hasn't manually set one
                if (!userSetTourTime && times && times.length > 0 && !tourTime) {
                    setTourTime(times[0]);
                }

                // Reset tour time if current selection is no longer available
                if (tourTime && times && !times.includes(tourTime)) {
                    setTourTime(times[0] || "");
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error updating available times:', error);
                    setAvailableTimesForDate([]);
                }
            } finally {
                if (!isCancelled) {
                    setLoadingAvailability(false);
                }
            }
        };

        // Shorter debounce for better responsiveness 
        const timeoutId = setTimeout(updateAvailableTimes, 50);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [calendarState, calendarSelectedDate, participants, returnAvailableTimes, tourTime, userSetTourTime]);

    useEffect(() => {
        const appContainer = document.getElementById('app-container');
        if (checkout) {
            appContainer.classList.remove('overflow-y-auto');
            appContainer.classList.add('overflow-y-hidden');
        } else {
            appContainer.classList.remove('overflow-y-hidden');
            appContainer.classList.add('overflow-y-auto');
        }

        return () => {
            appContainer.classList.remove('overflow-y-hidden');
        };
    }, [checkout]);

    // Effect to handle 3D Secure and prevent checkout from closing
    useEffect(() => {
        const checkForPayJP3DS = () => {
            // If checkout should stay open but isn't, reopen it
            const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
                localStorage.getItem('checkout_should_stay_open') === 'true';
            if (shouldStayOpen && !checkout) {
                console.log('🔄 Reopening checkout after 3D Secure window focus');
                setCheckout(true);
            }
        };

        // Listen for window focus events that might indicate 3D Secure completion
        window.addEventListener('focus', checkForPayJP3DS);
        window.addEventListener('visibilitychange', checkForPayJP3DS);

        return () => {
            window.removeEventListener('focus', checkForPayJP3DS);
            window.removeEventListener('visibilitychange', checkForPayJP3DS);
        };
    }, [checkout]);

    // Monitor checkout state changes for debugging
    useEffect(() => {
        console.log('🔍 DatePicker checkout state changed:', {
            checkout,
            payjp3DS: sessionStorage.getItem('payjp_3ds_in_progress') === 'true' || localStorage.getItem('payjp_3ds_in_progress') === 'true',
            shouldStayOpen: sessionStorage.getItem('checkout_should_stay_open') === 'true' || localStorage.getItem('checkout_should_stay_open') === 'true'
        });

        // Auto-reopen if checkout is closed but should stay open
        if (!checkout) {
            const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
                localStorage.getItem('checkout_should_stay_open') === 'true';
            if (shouldStayOpen) {
                console.log('🚨 Auto-reopening checkout because it should stay open!');
                setTimeout(() => setCheckout(true), 100); // Small delay to prevent loops
            }
        }
    }, [checkout]);

    // Cleanup storage on component unmount
    useEffect(() => {
        return () => {
            localStorage.removeItem('payjp_3ds_in_progress');
            localStorage.removeItem('checkout_should_stay_open');
            sessionStorage.removeItem('payjp_3ds_in_progress');
            sessionStorage.removeItem('checkout_should_stay_open');
        };
    }, []);

    // Preload availability for the next 3 months on page load only
    useEffect(() => {
        const preloadInitialAvailability = async () => {
            setAvailabilityLoading(true);

            // Preload from today to 3 months ahead
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const endDate = new Date(today);
            endDate.setMonth(endDate.getMonth() + 3);

            console.log(`📅 Initial availability preload: ${today.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
            await preloadAvailabilityForDates(today, endDate);

            setAvailabilityLoading(false);
        };

        // Only run once on component mount
        preloadInitialAvailability();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount, ignore function dependency

    const today = new Date();

    const oneYearsLater = new Date();
    oneYearsLater.setFullYear(today.getFullYear() + 1);

    const minViewLimit = new Date();
    minViewLimit.setMonth(today.getMonth());

    // Booking processing is now handled in the useMemo hook above

    const timeSlotSelector = () => {
        const formattedDate = calendarSelectedDate.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate] || {};
        const nowJST = getNowInJST();

        return (
            <div className="custom-select-wrapper">
                <select
                    name="time"
                    id="time"
                    value={loadingAvailability ? "loading" : tourTime}
                    onChange={handleTourTimeChange}
                    className="custom-select w-full h-12 rounded-xl border border-gray-200 bg-white px-4 font-ubuntu font-semibold cursor-pointer shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    style={{
                        color: loadingAvailability ? '#6B7280' : (tourTime ? 'inherit' : '#9CA3AF'),
                        backgroundColor: '#FFFFFF'
                    }}
                    disabled={loadingAvailability}
                >
                    {loadingAvailability ? (
                        <option value="loading" disabled>Checking availability...</option>
                    ) : availableTimesForDate.length === 0 ? (
                        <option value="" disabled>No available times</option>
                    ) : (
                        availableTimesForDate.map((slot, i) => {
                            const tourDateTimeJST = getTourDateTimeJST(calendarSelectedDate, slot);
                            const hoursUntilTour = (tourDateTimeJST - nowJST) / (1000 * 60 * 60);
                            const hasParticipants = dayData[slot] > 0;
                            const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);
                            const enabled = hoursUntilTour >= cutoffHours;
                            return (
                                <option
                                    value={slot}
                                    key={slot}
                                    disabled={!enabled}
                                    style={{
                                        color: enabled ? 'inherit' : '#9CA3AF',
                                        backgroundColor: enabled ? '#FFFFFF' : '#F3F4F6'
                                    }}
                                >
                                    {slot}
                                </option>
                            );
                        })
                    )}
                </select>
            </div>
        );
    }

    const isDateFull = (date, participants) => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate];
        const preloadedData = preloadedAvailability[formattedDate];

        // If we have Bokun data, use it
        if (preloadedData && preloadedData.timeSlots && !preloadedData.fallback) {
            for (const slot of preloadedData.timeSlots) {
                let availableSpots = null;
                if (slot && typeof slot === 'object' && slot.availableSpots !== undefined) {
                    availableSpots = slot.availableSpots;
                }

                if (availableSpots !== null) {
                    // Use Bokun availability data
                    if (availableSpots >= participants) {
                        return false; // Date is NOT full because this slot has availability
                    }
                } else {
                    // Fall back to local calculation for this slot
                    const timeString = slot.time || slot;
                    const currentParticipants = dayData ? (dayData[timeString] || 0) : 0;
                    if (currentParticipants + participants <= maxSlots) {
                        return false; // Date is NOT full because this slot is available
                    }
                }
            }
            return true; // Date IS full because no slots have availability
        }

        // Fallback to original logic when no Bokun data
        if (!dayData) return false;

        for (let i = 0; i < availableTimes.length; i++) {
            const currentParticipants = dayData[availableTimes[i]] || 0;
            // Check if this slot can accommodate the requested number of participants
            if (currentParticipants + participants <= maxSlots) {
                return false; // Date is NOT full because at least one slot is available
            }
        }

        return true; // Date IS full because no slots can accommodate the participants
    };

    // Helper to get current time in JST
    function getNowInJST() {
        const now = new Date();
        // Since you're already in JST timezone, we don't need to convert
        return now;
    }

    // Helper to get a Date object for a tour slot in JST
    function getTourDateTimeJST(date, time) {
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

    const disableDates = ({ date }) => {
        // Disable all dates while availability is loading
        if (availabilityLoading) {
            return true;
        }

        const todayJST = getNowInJST();
        const dateJST = new Date(date);

        // Reset times to start of day for date comparison
        const dateStart = new Date(dateJST.getFullYear(), dateJST.getMonth(), dateJST.getDate());
        const todayStart = new Date(todayJST.getFullYear(), todayJST.getMonth(), todayJST.getDate());

        if (dateStart < todayStart) return true;

        // Check if this is a booking for tomorrow
        const isBookingForTomorrow =
            dateStart.getTime() === todayStart.getTime() + (24 * 60 * 60 * 1000);

        // If booking for tomorrow and there's a next-day cut-off time
        if (isBookingForTomorrow && nextDayCutoffTime) {
            const [cutoffHour, cutoffMinute] = nextDayCutoffTime.split(':').map(Number);
            const todayCutoff = new Date(todayStart); // Use todayStart to ensure correct date
            todayCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

            if (todayJST.getTime() >= todayCutoff.getTime()) {
                return true; // Past cut-off time for tomorrow's bookings
            }
        }

        const formattedDate = date.toLocaleDateString("en-CA");

        // Check preloaded Bokun availability first
        const preloadedData = preloadedAvailability[formattedDate];
        if (preloadedData) {
            // If this is fallback data (Bokun API failed), use the original logic
            if (preloadedData.fallback) {
                // Fall through to original logic below
            } else {
                // We have real Bokun data - check if any time slots are valid
                const availableSlots = preloadedData.timeSlots || [];

                if (!preloadedData.hasAvailability) {
                    return true; // Disable the date
                }

                // Check if any of the available time slots from Bokun are still valid
                let hasValidSlot = false;

                for (const slot of availableSlots) {
                    // Handle both string format and object format
                    let timeString;
                    let availableSpots = null;

                    if (typeof slot === 'string') {
                        timeString = slot;
                    } else if (slot && slot.time) {
                        timeString = slot.time;
                        availableSpots = slot.availableSpots;
                    } else {
                        console.warn('Invalid time slot format:', slot);
                        continue;
                    }

                    const tourDateTimeJST = getTourDateTimeJST(date, timeString);
                    const hoursUntilTour = (tourDateTimeJST - todayJST) / (1000 * 60 * 60);
                    const dayData = participantsByDate[formattedDate] || {};
                    const hasParticipants = dayData[timeString] > 0;
                    const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);

                    // Check availability - use Bokun data if available, otherwise fall back to local calculation
                    let spotsAvailable;
                    if (availableSpots !== null && availableSpots !== undefined) {
                        // Use Bokun's availability data (already accounts for all bookings)
                        spotsAvailable = availableSpots >= participants;
                    } else {
                        // Fall back to local calculation (only accounts for local bookings)
                        spotsAvailable = (dayData[timeString] || 0) + participants <= maxSlots;
                    }

                    if (hoursUntilTour >= cutoffHours && spotsAvailable) {
                        hasValidSlot = true;
                        break;
                    }
                }

                return !hasValidSlot; // Return true to disable if no valid slots
            }
        }

        // Fallback to original logic if no preloaded data (for backwards compatibility)
        const dayData = participantsByDate[formattedDate] || {};
        let allSlotsPastCutoff = true;
        for (let i = 0; i < availableTimes.length; i++) {
            const slot = availableTimes[i];
            const tourDateTimeJST = getTourDateTimeJST(date, slot);
            const hoursUntilTour = (tourDateTimeJST - todayJST) / (1000 * 60 * 60);
            const hasParticipants = dayData[slot] > 0;
            const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);
            if (hoursUntilTour >= cutoffHours) {
                allSlotsPastCutoff = false;
                break;
            }
        }
        if (allSlotsPastCutoff) return true;
        return isDateFull(date, participants);
    }

    function onCalendarChange(nextValue) {
        setCalendarSelectedDate(nextValue);
        setCalendarState(1);
    }

    const handleTourTimeChange = (event) => {
        setTourTime(event.target.value);
        setUserSetTourTime(true);
    }

    const handleGoBack = () => {
        setCalendarState(0);
        setUserSetTourTime(false);
    }

    const renderCalendarComponent = () => {
        if (calendarState === 0) {
            return <div>
                <div className="mb-4">
                    <div className="space-y-2">
                        <PeopleSelector min={1} max={maxSlots} title={"Adult"} ageRange="18 - 90" price={price} participants={participants} value={adultParticipants} onChange={handleAdultParticipantsChange} />
                        <PeopleSelector min={0} max={maxSlots} title={"Child"} ageRange="3 - 17" price={price} participants={participants} value={childParticipants} onChange={handleChildParticipantsChange} />
                        <PeopleSelector min={0} max={maxSlots} title={"Infant"} ageRange="0 - 2" price={0} participants={participants} value={infantParticipants} onChange={handleInfantParticipantsChange} />
                    </div>
                </div>
                <h1 className='font-ubuntu font-bold text-2xl text-gray-800 mb-6'>Choose a date</h1>
                <div className="relative">
                    {/* Overlay loading indicator */}
                    {availabilityLoading && (
                        <div className="absolute inset-0 z-20 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center space-y-3">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="text-sm font-medium text-gray-700">Loading availability...</div>
                                <div className="text-xs text-gray-500 text-center">Checking tour dates</div>
                            </div>
                        </div>
                    )}

                    {/* Small loading indicator for time slot updates */}
                    {loadingAvailability && !availabilityLoading && (
                        <div className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 rounded-lg px-3 py-1 shadow-sm">
                            <div className="text-xs text-gray-600 flex items-center">
                                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                Updating times...
                            </div>
                        </div>
                    )}
                    <Calendar
                        tileDisabled={disableDates}
                        onChange={onCalendarChange}
                        value={calendarSelectedDate}
                        next2Label={null}
                        prev2Label={null}
                        maxDate={oneYearsLater}
                        minDate={minViewLimit}
                        calendarType="gregory"
                        showNavigation={true}
                        navigationLabel={({ date }) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                </div>
                {/** 
                <p className="font-ubuntu font-bold text-md h-full mt-4">{maxSlots - checkParticipants(calendarSelectedDate) > 0 ? maxSlots - checkParticipants(calendarSelectedDate) : 0} slots left</p>
                 * **/}
            </div>
        } else if (calendarState === 1) {
            return <div className="time-selection">
                <h1 className='font-ubuntu font-bold text-2xl text-gray-800 mb-6'>{calendarSelectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</h1>

                <div className="mb-6">
                    <div className="flex items-center mb-4">
                        <Clock className='w-5 h-5 text-gray-600 mr-2' />
                        <h2 className="font-ubuntu font-semibold text-lg text-gray-800">Choose a time</h2>
                    </div>
                    {
                        timeSlotSelector()
                    }
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h1 className='font-ubuntu font-bold text-xl text-gray-800 mb-4'>Booking Summary</h1>

                    {/* Tour name */}
                    <div className="mb-4">
                        <h2 className="font-ubuntu font-semibold text-base text-gray-700">{tourName}</h2>
                    </div>

                    {/* Date and Time - More prominent */}
                    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500 font-medium">Date</div>
                                <div className="font-ubuntu font-bold text-lg text-gray-800">
                                    {calendarSelectedDate.toLocaleDateString("en-US", {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 font-medium">Time</div>
                                <div className="font-ubuntu font-bold text-lg text-blue-600">{tourTime}</div>
                            </div>
                        </div>
                    </div>

                    {/* Participants and Total */}
                    <div className="flex justify-between items-end">
                        <div className="text-sm text-gray-600 space-y-1">
                            <div>Adults: {adultParticipants}</div>
                            {childParticipants !== 0 && <div>Children: {childParticipants}</div>}
                            {infantParticipants !== 0 && <div>Infants: {infantParticipants}</div>}
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Total</div>
                            <PriceDisplay
                                jpyPrice={totalPrice}
                                showPerGuest={false}
                                size="small"
                                className="text-right"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleGoBack}
                        className="text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Go back
                    </button>
                    <button
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-ubuntu font-semibold transition-colors duration-200 shadow-sm hover:shadow-md"
                        onClick={handleOpenCheckout}
                    >
                        Checkout
                    </button>
                </div>
            </div>
        }
    }

    return (
        <div className='w-full md:w-2/3 lg:w-full bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mx-auto text-gray-700 flex-none shadow-sm'>
            <div className='mb-6 sm:mb-8'>
                <PriceDisplay
                    jpyPrice={price}
                    originalPrice={originalPrice}
                    showPerGuest={true}
                    showViatorComparison={!!originalPrice}
                    size="medium"
                />
            </div>
            {renderCalendarComponent()}
            {checkout === true ? (
                <Checkout onClose={handleCloseCheckout} tourName={tourName} sheetId={sheetId} tourDate={calendarSelectedDate.toLocaleDateString("en-CA")} tourTime={tourTime} adult={adultParticipants} child={childParticipants} infant={infantParticipants} tourPrice={price} />
            ) : null}
        </div>
    )
}

export default DatePicker