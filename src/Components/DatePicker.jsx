import { useCallback, useEffect, useState } from "react"
import Calendar from "react-calendar"
import '../CSS/Calendar.css';
import PeopleSelector from "./PeopleSelector";
import { ReactComponent as Clock } from '../SVG/Clock.svg'
import Checkout from './Checkout'
import { supabase } from '../lib/supabase';

function DatePicker({ tourName = "noTourName", maxSlots, availableTimes, sheetId, price, cancellationCutoffHours, cancellationCutoffHoursWithParticipant, nextDayCutoffTime }) {
    const [checkout, setCheckout] = useState(false);
    const handleOpenCheckout = () => setCheckout(true);
    const handleCloseCheckout = () => setCheckout(false);
    const [bookings, setBookings] = useState([]);

    const [calendarState, setCalendarState] = useState(0);

    const [adultParticipants, setAdultParticipants] = useState(1);
    const [childParticipants, setChildParticipants] = useState(0);
    const [infantParticipants, setInfantParticipants] = useState(0);

    // Calculate total participants dynamically instead of using separate state
    const participants = adultParticipants + childParticipants + infantParticipants;

    const totalPrice = (adultParticipants + childParticipants) * price;

    const [tourTime, setTourTime] = useState(availableTimes[0]);
    const [userSetTourTime, setUserSetTourTime] = useState(false);

    const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());

    const participantsByDate = {};

    const fetchBookings = useCallback(async () => {
        // Convert sheetId to match database tour_type format
        const tourTypeMap = {
            'NIGHT_TOUR': 'NIGHT_TOUR',
            'MORNING_TOUR': 'MORNING_TOUR',
            'UJI_TOUR': 'UJI_TOUR',
            'GION_TOUR': 'GION_TOUR',
            // Keep backwards compatibility
            'Night tour': 'NIGHT_TOUR',
            'Morning tour': 'MORNING_TOUR',
            'Uji tour': 'UJI_TOUR',
            'Gion tour': 'GION_TOUR'
        };
        const tourType = tourTypeMap[sheetId];

        if (!tourType) {
            throw new Error(`Invalid tour type: ${sheetId}`);
        }

        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('tour_type', tourType)
            .eq('status', 'CONFIRMED');

        if (error) {
            throw error;
        }

        setBookings(data);
    }, [sheetId]);

    const returnAvailableTimes = useCallback((date, participants) => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate] || {};
        const options = [...availableTimes];
        const nowJST = getNowInJST();

        // Check if this is a booking for tomorrow
        const dateJST = new Date(date);
        const todayJST = new Date(nowJST);

        // Reset times to start of day for date comparison
        const dateStart = new Date(dateJST.getFullYear(), dateJST.getMonth(), dateJST.getDate());
        const todayStart = new Date(todayJST.getFullYear(), todayJST.getMonth(), todayJST.getDate());

        const isBookingForTomorrow =
            dateStart.getTime() === todayStart.getTime() + (24 * 60 * 60 * 1000);

        console.log('Time Debug (returnAvailableTimes):', {
            nowJST: nowJST.toISOString(),
            dateJST: dateJST.toISOString(),
            todayJST: todayJST.toISOString(),
            isBookingForTomorrow,
            nextDayCutoffTime
        });

        // If booking for tomorrow and there's a next-day cut-off time
        if (isBookingForTomorrow && nextDayCutoffTime) {
            const [cutoffHour, cutoffMinute] = nextDayCutoffTime.split(':').map(Number);
            const todayCutoff = new Date(todayStart); // Use todayStart to ensure correct date
            todayCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

            console.log('Cutoff Time Debug:', {
                todayCutoff: todayCutoff.toISOString(),
                nowJST: nowJST.toISOString(),
                isPastCutoff: nowJST.getTime() >= todayCutoff.getTime()
            });

            if (nowJST.getTime() >= todayCutoff.getTime()) {
                console.log('Blocking booking - past cutoff time');
                return []; // Past cut-off time for tomorrow's bookings
            }
        }

        for (let i = 0; i < options.length; i++) {
            const currentSlot = options[i];
            const currentParticipants = dayData[currentSlot] || 0;
            const tourDateTimeJST = getTourDateTimeJST(date, currentSlot);
            const hoursUntilTour = (tourDateTimeJST - nowJST) / (1000 * 60 * 60);
            const hasParticipants = currentParticipants > 0;
            const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);

            // Remove slot if it's either full or past cutoff
            if (currentParticipants + participants > maxSlots || hoursUntilTour < cutoffHours) {
                options.splice(i, 1);
                i--;
            }
        }

        return options;
    }, [bookings, availableTimes, maxSlots, participantsByDate, cancellationCutoffHours, cancellationCutoffHoursWithParticipant, nextDayCutoffTime]);

    useEffect(() => {
        fetchBookings();
    }, [sheetId, fetchBookings]);

    useEffect(() => {
        if (calendarState === 1 && !userSetTourTime) {
            setTourTime(returnAvailableTimes(calendarSelectedDate, participants)[0]);
        }
    }, [calendarState, calendarSelectedDate, participants, returnAvailableTimes, userSetTourTime]);

    useEffect(() => {
        if (calendarState === 1) {
            const formattedDate = calendarSelectedDate.toLocaleDateString("en-CA");
            const nowJST = getNowInJST();
            const dayData = participantsByDate[formattedDate] || {};
            const enabledOptions = availableTimes.filter(slot => {
                const tourDateTimeJST = getTourDateTimeJST(calendarSelectedDate, slot);
                const hoursUntilTour = (tourDateTimeJST - nowJST) / (1000 * 60 * 60);
                const hasParticipants = (dayData[slot] || 0) > 0;
                const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);
                return hoursUntilTour >= cutoffHours;
            });
            if (!enabledOptions.includes(tourTime)) {
                setTourTime(enabledOptions[0] || "");
            }
        }
    }, [calendarState, calendarSelectedDate, participants, returnAvailableTimes, userSetTourTime, availableTimes, participantsByDate, cancellationCutoffHours, cancellationCutoffHoursWithParticipant]);

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

    const today = new Date();

    const oneYearsLater = new Date();
    oneYearsLater.setFullYear(today.getFullYear() + 1);

    const minViewLimit = new Date();
    minViewLimit.setMonth(today.getMonth());

    // Only process bookings if it's an array (not the initial "Loading" string)
    if (Array.isArray(bookings)) {
        console.log('Processing bookings array:', bookings);
        bookings.forEach((booking) => {
            if (booking.booking_date && booking.booking_time) {
                const formattedDate = booking.booking_date;
                const timeSlot = booking.booking_time;
                console.log('Processing booking:', { formattedDate, timeSlot, booking });

                // Initialize date entry if it doesn't exist
                if (!participantsByDate[formattedDate]) {
                    participantsByDate[formattedDate] = {};
                }
                // Ensure all time slots exist for that date (set to 0 by default)
                availableTimes.forEach((t) => {
                    if (!participantsByDate[formattedDate][t]) {
                        participantsByDate[formattedDate][t] = 0;
                    }
                });

                // Calculate total participants using the new schema
                const totalParticipants = booking.adults + booking.children;
                console.log('Adding participants:', { formattedDate, timeSlot, totalParticipants });
                participantsByDate[formattedDate][timeSlot] += totalParticipants;
            }
        });
        console.log('Final participantsByDate:', participantsByDate);
    }

    const timeSlotSelector = (options) => {
        const formattedDate = calendarSelectedDate.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate] || {};
        const nowJST = getNowInJST();
        return (
            <div className="custom-select-wrapper">
                <select
                    name="time"
                    id="time"
                    value={tourTime}
                    onChange={handleTourTimeChange}
                    className="custom-select w-full h-12 rounded-xl border border-gray-200 bg-white px-4 font-ubuntu font-semibold cursor-pointer shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    style={{
                        color: tourTime ? 'inherit' : '#9CA3AF',
                        backgroundColor: '#FFFFFF'
                    }}
                >
                    {options.map((slot, i) => {
                        const tourDateTimeJST = getTourDateTimeJST(calendarSelectedDate, slot);
                        const hoursUntilTour = (tourDateTimeJST - nowJST) / (1000 * 60 * 60);
                        const hasParticipants = dayData[slot] > 0;
                        const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);
                        const enabled = hoursUntilTour >= cutoffHours;
                        console.log({ slot, hoursUntilTour, hasParticipants, cutoffHours, enabled });
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
                    })}
                </select>
            </div>
        );
    }

    const isDateFull = (date, participants) => {
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate];

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
        const [hour, minute] = time.split(":");
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        // Since we're already in JST, we can create the date directly
        return new Date(`${y}-${m}-${d}T${hour}:${minute}:00`);
    }

    const disableDates = ({ date }) => {
        const todayJST = getNowInJST();
        const dateJST = new Date(date);

        // Reset times to start of day for date comparison
        const dateStart = new Date(dateJST.getFullYear(), dateJST.getMonth(), dateJST.getDate());
        const todayStart = new Date(todayJST.getFullYear(), todayJST.getMonth(), todayJST.getDate());

        if (dateStart < todayStart) return true;

        // Check if this is a booking for tomorrow
        const isBookingForTomorrow =
            dateStart.getTime() === todayStart.getTime() + (24 * 60 * 60 * 1000);

        console.log('Time Debug (disableDates):', {
            todayJST: todayJST.toISOString(),
            dateJST: dateJST.toISOString(),
            todayStart: todayStart.toISOString(),
            isBookingForTomorrow,
            nextDayCutoffTime
        });

        // If booking for tomorrow and there's a next-day cut-off time
        if (isBookingForTomorrow && nextDayCutoffTime) {
            const [cutoffHour, cutoffMinute] = nextDayCutoffTime.split(':').map(Number);
            const todayCutoff = new Date(todayStart); // Use todayStart to ensure correct date
            todayCutoff.setHours(cutoffHour, cutoffMinute, 0, 0);

            console.log('Cutoff Time Debug (disableDates):', {
                todayCutoff: todayCutoff.toISOString(),
                todayJST: todayJST.toISOString(),
                isPastCutoff: todayJST.getTime() >= todayCutoff.getTime()
            });

            if (todayJST.getTime() >= todayCutoff.getTime()) {
                console.log('Disabling date - past cutoff time');
                return true; // Past cut-off time for tomorrow's bookings
            }
        }

        const formattedDate = date.toLocaleDateString("en-CA");
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
                        <PeopleSelector min={1} max={maxSlots} title={"Adult"} ageRange="18 - 90" price={price} participants={participants} value={adultParticipants} onChange={setAdultParticipants} />
                        <PeopleSelector min={0} max={maxSlots} title={"Child"} ageRange="3 - 17" price={price} participants={participants} value={childParticipants} onChange={setChildParticipants} />
                        <PeopleSelector min={0} max={maxSlots} title={"Infant"} ageRange="0 - 2" price={0} participants={participants} value={infantParticipants} onChange={setInfantParticipants} />
                    </div>
                </div>
                <h1 className='font-ubuntu font-bold text-2xl text-gray-800 mb-6'>Choose a date</h1>
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
                        timeSlotSelector(returnAvailableTimes(calendarSelectedDate, participants))
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
                            <div className="font-bold text-xl text-gray-800">¥{totalPrice.toLocaleString('en-US')}</div>
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
        <div className='w-full md:w-2/3 lg:w-full bg-white border border-gray-200 rounded-2xl p-6 mx-auto text-gray-700 flex-none shadow-sm'>
            <div className='mb-8'>
                <h2 className='text-3xl font-bold text-gray-800'>¥ {price.toLocaleString('en-US')} <span className='text-lg font-medium text-gray-600'>/ Guest</span></h2>
            </div>
            {renderCalendarComponent()}
            {checkout === true ? (
                <Checkout onClose={handleCloseCheckout} tourName={tourName} sheetId={sheetId} tourDate={calendarSelectedDate.toLocaleDateString("en-CA")} tourTime={tourTime} adult={adultParticipants} child={childParticipants} infant={infantParticipants} tourPrice={price} />
            ) : null}
        </div>
    )
}

export default DatePicker