import { useCallback, useEffect, useState } from "react";
import Checkout from './Checkout';
import PriceDisplay from './PriceDisplay';
import CalendarView from './CalendarView';
import TimeSlotSelector from './TimeSlotSelector';
import { useAvailability } from '../hooks/useAvailability';
import { useBookings } from '../hooks/useBookings';
import { trackParticipantChange } from '../services/analytics/basicTracking.js';

function DatePicker({ tourName = "noTourName", maxSlots, availableTimes, sheetId, price, originalPrice, cancellationCutoffHours, cancellationCutoffHoursWithParticipant, nextDayCutoffTime }) {
    // State management
    const [checkout, setCheckout] = useState(false);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [calendarState, setCalendarState] = useState(0);
    const [adultParticipants, setAdultParticipants] = useState(1);
    const [childParticipants, setChildParticipants] = useState(0);
    const [infantParticipants, setInfantParticipants] = useState(0);
    const [tourTime, setTourTime] = useState(availableTimes[0]);
    const [userSetTourTime, setUserSetTourTime] = useState(false);
    const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
    const [calendarActiveStartDate, setCalendarActiveStartDate] = useState(new Date());
    const [availableTimesForDate, setAvailableTimesForDate] = useState([]);

    // Calculate total participants dynamically
    const participants = adultParticipants + childParticipants + infantParticipants;
    const totalPrice = (adultParticipants + childParticipants) * (price || 0);

    // Custom hooks
    const { bookings, participantsByDate, fetchBookings } = useBookings(sheetId, availableTimes);
    const {
        preloadedAvailability,
        availabilityLoading,
        setAvailabilityLoading,
        preloadAvailabilityForDates,
        returnAvailableTimes,
        isDateFull,
        findNextAvailableDate
    } = useAvailability(
        sheetId,
        availableTimes,
        maxSlots,
        participantsByDate,
        cancellationCutoffHours,
        cancellationCutoffHoursWithParticipant,
        nextDayCutoffTime
    );

    // Checkout handlers
    const handleOpenCheckout = () => {
        setCheckout(true);
    };

    const handleCloseCheckout = () => {
        const payjp3DS = sessionStorage.getItem('payjp_3ds_in_progress') === 'true' ||
            localStorage.getItem('payjp_3ds_in_progress') === 'true';
        const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
            localStorage.getItem('checkout_should_stay_open') === 'true';

        if (payjp3DS || shouldStayOpen) {
            console.log('🛑 Preventing checkout close during PayJP 3D Secure verification');
            return;
        }

        setCheckout(false);
    };

    // Participant change handlers with tracking
    const handleAdultParticipantsChange = useCallback((newCount) => {
        const oldCount = adultParticipants;
        setAdultParticipants(newCount);

        if (newCount !== oldCount) {
            const newTotal = newCount + childParticipants + infantParticipants;
            trackParticipantChange(tourName, 'adult', oldCount, newCount, newTotal);
        }
    }, [adultParticipants, childParticipants, infantParticipants, tourName]);

    const handleChildParticipantsChange = useCallback((newCount) => {
        const oldCount = childParticipants;
        setChildParticipants(newCount);

        if (newCount !== oldCount) {
            const newTotal = adultParticipants + newCount + infantParticipants;
            trackParticipantChange(tourName, 'child', oldCount, newCount, newTotal);
        }
    }, [adultParticipants, childParticipants, infantParticipants, tourName]);

    const handleInfantParticipantsChange = useCallback((newCount) => {
        const oldCount = infantParticipants;
        setInfantParticipants(newCount);

        if (newCount !== oldCount) {
            const newTotal = adultParticipants + childParticipants + newCount;
            trackParticipantChange(tourName, 'infant', oldCount, newCount, newTotal);
        }
    }, [adultParticipants, childParticipants, infantParticipants, tourName]);

    // Calendar and time handlers
    const handleTourTimeChange = (event) => {
        setTourTime(event.target.value);
        setUserSetTourTime(true);
    };

    const handleGoBack = () => {
        setCalendarState(0);
        setUserSetTourTime(false);
    };

    const onCalendarChange = (nextValue) => {
        setCalendarSelectedDate(nextValue);
        setCalendarState(1);
    };

    // Helper functions for date validation
    const getNowInJST = () => new Date();

    const getTourDateTimeJST = (date, time) => {
        if (!time || typeof time !== 'string') {
            console.error('getTourDateTimeJST: Invalid time parameter:', time);
            return new Date();
        }

        const timeParts = time.split(":");
        if (timeParts.length !== 2) {
            console.error('getTourDateTimeJST: Invalid time format:', time);
            return new Date();
        }

        const [hour, minute] = timeParts;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return new Date(`${y}-${m}-${d}T${hour}:${minute}:00`);
    };

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
            const todayCutoff = new Date(todayStart);
            todayCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

            if (todayJST.getTime() >= todayCutoff.getTime()) {
                return true;
            }
        }

        const formattedDate = date.toLocaleDateString("en-CA");

        // Check preloaded availability first (Bokun or database)
        const preloadedData = preloadedAvailability[formattedDate];
        if (preloadedData) {
            // If this is fallback data (API failed), use the original logic
            if (preloadedData.fallback) {
                // Fall through to original logic below
            } else {
                // We have real availability data (Bokun or database) - check if any time slot is available
                let hasValidSlot = false;

                for (const slot of preloadedData.timeSlots) {
                    let timeString, availableSpots;

                    if (typeof slot === 'string') {
                        timeString = slot;
                        availableSpots = null;
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

                    // Check availability - use external data (Bokun/database) if available, otherwise fall back to local calculation
                    let spotsAvailable;
                    if (availableSpots !== null && availableSpots !== undefined) {
                        // Use external availability data (already accounts for all bookings)
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
    };

    // Effects
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Update available times for the time slot selector
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

        const timeoutId = setTimeout(updateAvailableTimes, 50);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [calendarState, calendarSelectedDate, participants, returnAvailableTimes, tourTime, userSetTourTime]);

    // Handle checkout overlay
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

    // Handle 3D Secure
    useEffect(() => {
        const checkForPayJP3DS = () => {
            const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
                localStorage.getItem('checkout_should_stay_open') === 'true';
            if (shouldStayOpen && !checkout) {
                console.log('🔄 Reopening checkout after 3D Secure window focus');
                setCheckout(true);
            }
        };

        window.addEventListener('focus', checkForPayJP3DS);
        window.addEventListener('visibilitychange', checkForPayJP3DS);

        return () => {
            window.removeEventListener('focus', checkForPayJP3DS);
            window.removeEventListener('visibilitychange', checkForPayJP3DS);
        };
    }, [checkout]);

    // Monitor checkout state changes
    useEffect(() => {
        if (!checkout) {
            const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
                localStorage.getItem('checkout_should_stay_open') === 'true';
            if (shouldStayOpen) {
                setTimeout(() => setCheckout(true), 100);
            }
        }
    }, [checkout]);

    // Cleanup storage on unmount
    useEffect(() => {
        return () => {
            localStorage.removeItem('payjp_3ds_in_progress');
            localStorage.removeItem('checkout_should_stay_open');
            sessionStorage.removeItem('payjp_3ds_in_progress');
            sessionStorage.removeItem('checkout_should_stay_open');
        };
    }, []);

    // Preload availability and set calendar month
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

            // Find and set calendar to show month with next available date
            try {
                const nextAvailableDate = await findNextAvailableDate();
                console.log(`📅 Next available date found: ${nextAvailableDate.toLocaleDateString()}`);

                // Set calendar to show the month containing the next available date
                const monthStart = new Date(nextAvailableDate.getFullYear(), nextAvailableDate.getMonth(), 1);
                setCalendarActiveStartDate(monthStart);

                // Also set the selected date to the next available date if it's not today
                const todayCheck = new Date();
                todayCheck.setHours(0, 0, 0, 0);
                if (nextAvailableDate.getTime() !== todayCheck.getTime()) {
                    setCalendarSelectedDate(nextAvailableDate);
                }
            } catch (error) {
                console.warn('Error finding next available date:', error);
            }

            setAvailabilityLoading(false);
        };

        preloadInitialAvailability();
    }, []); // Only run once on mount

    // Date limits
    const today = new Date();
    const oneYearsLater = new Date();
    oneYearsLater.setFullYear(today.getFullYear() + 1);
    const minViewLimit = new Date();
    minViewLimit.setMonth(today.getMonth());

    // Render component based on state
    const renderCalendarComponent = () => {
        if (calendarState === 0) {
            return (
                <CalendarView
                    maxSlots={maxSlots}
                    price={price}
                    participants={participants}
                    adultParticipants={adultParticipants}
                    childParticipants={childParticipants}
                    infantParticipants={infantParticipants}
                    handleAdultParticipantsChange={handleAdultParticipantsChange}
                    handleChildParticipantsChange={handleChildParticipantsChange}
                    handleInfantParticipantsChange={handleInfantParticipantsChange}
                    availabilityLoading={availabilityLoading}
                    loadingAvailability={loadingAvailability}
                    disableDates={disableDates}
                    onCalendarChange={onCalendarChange}
                    calendarSelectedDate={calendarSelectedDate}
                    calendarActiveStartDate={calendarActiveStartDate}
                    setCalendarActiveStartDate={setCalendarActiveStartDate}
                    oneYearsLater={oneYearsLater}
                    minViewLimit={minViewLimit}
                />
            );
        } else if (calendarState === 1) {
            return (
                <TimeSlotSelector
                    calendarSelectedDate={calendarSelectedDate}
                    loadingAvailability={loadingAvailability}
                    tourTime={tourTime}
                    handleTourTimeChange={handleTourTimeChange}
                    availableTimesForDate={availableTimesForDate}
                    participantsByDate={participantsByDate}
                    cancellationCutoffHours={cancellationCutoffHours}
                    cancellationCutoffHoursWithParticipant={cancellationCutoffHoursWithParticipant}
                    tourName={tourName}
                    adultParticipants={adultParticipants}
                    childParticipants={childParticipants}
                    infantParticipants={infantParticipants}
                    totalPrice={totalPrice}
                    handleGoBack={handleGoBack}
                    handleOpenCheckout={handleOpenCheckout}
                />
            );
        }
    };

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
                <Checkout
                    onClose={handleCloseCheckout}
                    tourName={tourName}
                    sheetId={sheetId}
                    tourDate={calendarSelectedDate.toLocaleDateString("en-CA")}
                    tourTime={tourTime}
                    adult={adultParticipants}
                    child={childParticipants}
                    infant={infantParticipants}
                    tourPrice={price}
                />
            ) : null}
        </div>
    );
}

export default DatePicker;