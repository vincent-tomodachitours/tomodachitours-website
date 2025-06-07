import { useCallback, useEffect, useState } from "react"
import Calendar from "react-calendar"
import '../CSS/Calendar.css';
import PeopleSelector from "./PeopleSelector";
import { ReactComponent as Clock } from '../SVG/Clock.svg'
import Checkout from './Checkout'
import { supabase } from '../lib/supabase';

function DatePicker({ tourName = "noTourName", maxSlots, availableTimes, sheetId, price, cancellationCutoffHours, cancellationCutoffHoursWithParticipant }) {
    const [checkout, setCheckout] = useState(false);
    const handleOpenCheckout = () => setCheckout(true);
    const handleCloseCheckout = () => setCheckout(false);
    const [bookings, setBookings] = useState([]);

    const [calendarState, setCalendarState] = useState(0);

    const [participants, setParticipants] = useState(1);

    const [adultParticipants, setAdultParticipants] = useState(1);
    const [childParticipants, setChildParticipants] = useState(0);
    const [infantParticipants, setInfantParticipants] = useState(0);

    const totalPrice = (adultParticipants + childParticipants) * price;

    const [tourTime, setTourTime] = useState(availableTimes[0]);
    const [userSetTourTime, setUserSetTourTime] = useState(false);

    const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());

    const participantsByDate = {};

    const fetchBookings = useCallback(async () => {
        // Convert sheetId to match database tour_type format
        const tourTypeMap = {
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

        for (let i = 0; i < options.length; i++) {
            const currentSlot = options[i];
            const currentParticipants = dayData[currentSlot] || 0;
            const tourDateTimeJST = getTourDateTimeJST(date, currentSlot);
            const hoursUntilTour = (tourDateTimeJST - nowJST) / (1000 * 60 * 60);
            const hasParticipants = currentParticipants > 0;
            const cutoffHours = hasParticipants ? (cancellationCutoffHoursWithParticipant || 24) : (cancellationCutoffHours || 24);

            // Remove slot if it's either full or past cutoff
            if (currentParticipants > (maxSlots - participants) || hoursUntilTour < cutoffHours) {
                options.splice(i, 1);
                i--;
            }
        }

        return options;
    }, [bookings, availableTimes, maxSlots, participantsByDate, cancellationCutoffHours, cancellationCutoffHoursWithParticipant]);

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
                    className="custom-select w-full h-10 rounded-lg border border-gray-700 bg-slate-100 px-2 font-ubuntu font-bold cursor-pointer"
                    style={{
                        color: tourTime ? 'inherit' : '#9CA3AF',
                        backgroundColor: '#F8FAFC'
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
                                    backgroundColor: enabled ? '#F8FAFC' : '#F3F4F6'
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
            if (dayData[availableTimes[i]] < (maxSlots - participants)) {
                return false;
            }
        }

        return true;
    };

    // Helper to get current time in JST
    function getNowInJST() {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (9 * 60 * 60000)); // JST is UTC+9
    }

    // Helper to get a Date object for a tour slot in JST
    function getTourDateTimeJST(date, time) {
        const [hour, minute] = time.split(":");
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        // Format: YYYY-MM-DDTHH:mm:00+09:00
        const dtString = `${y}-${m}-${d}T${hour}:${minute}:00+09:00`;
        return new Date(dtString);
    }

    const disableDates = ({ date }) => {
        const todayJST = getNowInJST();
        const dateJST = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayDateJST = new Date(todayJST.getFullYear(), todayJST.getMonth(), todayJST.getDate());
        if (dateJST < todayDateJST) return true;
        const nowJST = getNowInJST();
        const formattedDate = date.toLocaleDateString("en-CA");
        const dayData = participantsByDate[formattedDate] || {};
        let allSlotsPastCutoff = true;
        for (let i = 0; i < availableTimes.length; i++) {
            const slot = availableTimes[i];
            const tourDateTimeJST = getTourDateTimeJST(date, slot);
            const hoursUntilTour = (tourDateTimeJST - nowJST) / (1000 * 60 * 60);
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
                <div className="mb-8">
                    <h1 className='font-ubuntu font-black text-2xl'>Who's going?</h1>
                    <PeopleSelector min={1} max={maxSlots} title={"Adult"} participants={participants} setParticipants={setParticipants} value={adultParticipants} onChange={setAdultParticipants} />
                    <PeopleSelector min={0} max={maxSlots} title={"Child"} participants={participants} setParticipants={setParticipants} value={childParticipants} onChange={setChildParticipants} />
                    <PeopleSelector min={0} max={maxSlots} title={"Infant"} participants={participants} setParticipants={setParticipants} value={infantParticipants} onChange={setInfantParticipants} />
                </div>
                <h1 className='font-ubuntu font-black text-2xl my-4'>Choose a date</h1>
                <Calendar
                    tileDisabled={disableDates}
                    onChange={onCalendarChange}
                    value={calendarSelectedDate}
                    next2Label={null}
                    prev2Label={null}
                    maxDate={oneYearsLater}
                    minDate={minViewLimit}
                />
                {/** 
                <p className="font-ubuntu font-bold text-md h-full mt-4">{maxSlots - checkParticipants(calendarSelectedDate) > 0 ? maxSlots - checkParticipants(calendarSelectedDate) : 0} slots left</p>
                 * **/}
            </div>
        } else if (calendarState === 1) {
            return <div className="time-selection">
                <h1 className='font-ubuntu font-black text-2xl'>{calendarSelectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</h1>
                <br />
                <div className="flex items-center mb-2">
                    <Clock className='w-6 h-6 text-gray-700 mr-2' />
                    <h2 className="font-ubuntu font-black text-lg">Choose a time</h2>
                </div>
                {
                    timeSlotSelector(returnAvailableTimes(calendarSelectedDate, participants))
                }
                <div className="mt-6 booking-summary">
                    <h1 className='font-ubuntu font-black text-2xl my-4'>Booking Summary</h1>
                    <div className="w-full flex justify-between">
                        <h2 className="font-ubuntu font-black text-lg">{tourName}</h2>
                        <div className="w-full text-right">
                            <span className="font-ubuntu font-extrabold text-blue-700 text-2xl">{tourTime}</span><br />
                            <span className="font-ubuntu font-extrabold text-blue-700 text-md">{calendarSelectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                    </div>
                    <div className="flex w-full my-4">
                        <div>
                            <span>Adults: {adultParticipants}</span>
                            {childParticipants !== 0 ?
                                <div>
                                    <span>Children: {childParticipants}</span>
                                </div> : null}
                            {infantParticipants !== 0 ?
                                <div>
                                    <span>Infants: {infantParticipants}</span>
                                </div> : null
                            }
                        </div>
                        <div className="ml-auto mt-auto text-black">
                            <span>Total (¥): </span>
                            <span>{totalPrice}</span>
                        </div>
                    </div>
                </div>
                <button onClick={handleGoBack}>&lt; Go back</button>
                <button className="w-full h-12 mt-4 bg-blue-700 rounded-md  text-white font-ubuntu" onClick={handleOpenCheckout}>Checkout</button>
            </div>
        }
    }

    return (
        <div className='w-full md:w-2/3 lg:w-2/5 h-full border border-gray-300 rounded-md p-4 mx-auto text-gray-700'>
            {renderCalendarComponent()}
            {checkout === true ? (
                <Checkout onClose={handleCloseCheckout} tourName={tourName} sheetId={sheetId} tourDate={calendarSelectedDate.toLocaleDateString("en-CA")} tourTime={tourTime} adult={adultParticipants} child={childParticipants} infant={infantParticipants} tourPrice={price} />
            ) : null}
        </div>
    )
}

export default DatePicker