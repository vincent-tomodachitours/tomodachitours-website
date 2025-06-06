import { useEffect, useState } from "react"
import Calendar from "react-calendar"
import '../CSS/Calendar.css';
import PeopleSelector from "./PeopleSelector";
import { ReactComponent as Clock } from '../SVG/Clock.svg'
import Checkout from './Checkout'
import { supabase } from '../lib/supabase';

function DatePicker({ tourName = "noTourName", maxSlots, availableTimes, sheetId, price }) {
    const [checkout, setCheckout] = useState(false);
    const handleOpenCheckout = () => setCheckout(true);
    const handleCloseCheckout = () => setCheckout(false);
    const [bookings, setBookings] = useState([]);

    const [loaded, setLoaded] = useState(0);
    const [calendarState, setCalendarState] = useState(0);

    const [participants, setParticipants] = useState(1);

    const [adultParticipants, setAdultParticipants] = useState(1);
    const [childParticipants, setChildParticipants] = useState(0);
    const [infantParticipants, setInfantParticipants] = useState(0);

    const totalPrice = (adultParticipants + childParticipants) * price;

    const [tourTime, setTourTime] = useState(availableTimes[0]);
    const handleTourTimeChange = (event) => {
        setTourTime(event.target.value);
    }

    useEffect(() => {
        fetchBookings();
    }, [sheetId]);

    useEffect(() => {
        if (calendarState === 1) {
            setTourTime(returnAvailableTimes(calendarSelectedDate, participants)[0])
        }
    }, [calendarState])

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

    async function fetchBookingsForTour() {
        console.log('Fetching bookings for tour:', sheetId);
        // Convert sheetId to match database tour_type format
        const tourTypeMap = {
            'Night tour': 'NIGHT_TOUR',
            'Morning tour': 'MORNING_TOUR',
            'Uji tour': 'UJI_TOUR',
            'Gion tour': 'GION_TOUR'
        };
        const tourType = tourTypeMap[sheetId];
        console.log('Using tour_type:', tourType);

        if (!tourType) {
            console.error('Invalid tour type:', sheetId);
            throw new Error(`Invalid tour type: ${sheetId}`);
        }

        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('tour_type', tourType)
            .eq('status', 'CONFIRMED');

        if (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }

        console.log('Fetched bookings:', data);
        return data;
    }

    const fetchBookings = async () => {
        try {
            const data = await fetchBookingsForTour();
            console.log('Setting bookings state:', data);
            setBookings(data);
            setLoaded(true);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
            setBookings([]);
            setLoaded(true);
        }
    };

    const [calendarSelectedDate, setCalendarSelectedDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    });
    const today = new Date();

    const oneYearsLater = new Date();
    oneYearsLater.setFullYear(today.getFullYear() + 1);

    const minViewLimit = new Date();
    minViewLimit.setMonth(today.getMonth());

    const participantsByDate = {};

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

    const returnAvailableTimes = (date, participants) => {
        const formattedDate = date.toLocaleDateString("en-CA");
        console.log('Checking available times for:', { formattedDate, participants });
        const dayData = participantsByDate[formattedDate];
        console.log('Day data:', dayData);

        const options = [...availableTimes];
        console.log('Initial time options:', options);

        if (dayData) {
            for (let i = 0; i < options.length; i++) {
                const currentSlot = options[i];
                const currentParticipants = dayData[currentSlot] || 0;
                console.log('Checking time slot:', { currentSlot, currentParticipants, maxSlots, participants });

                if (currentParticipants > (maxSlots - participants)) {
                    console.log('Removing time slot:', currentSlot);
                    options.splice(i, 1);
                    i--;
                }
            }
        }

        console.log('Final available times:', options);
        return options;
    }

    const timeSlotSelector = (options) => {
        return <div>
            <select name="time" id="time" value={tourTime} onChange={handleTourTimeChange} className="w-full h-10 rounded-lg border border-gray-700 bg-slate-100 px-2 font-ubuntu font-bold">
                {options.map((_, i) => (
                    <option value={options[i]}>
                        {options[i]}
                    </option>
                ))}
            </select>
        </div>
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


    const disableDates = ({ date }) => {
        return date < today || isDateFull(date, participants);
    }

    function onCalendarChange(nextValue) {
        setCalendarSelectedDate(nextValue);
        setCalendarState(1);
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
                <button onClick={() => { setCalendarState(0) }}>&lt; Go back</button>
                <button className="w-full h-12 mt-4 bg-blue-700 rounded-md  text-white font-ubuntu" onClick={handleOpenCheckout}>Checkout</button>
            </div>
        }
    }

    return (
        <div className='w-full md:w-2/3 lg:w-2/5 h-full border border-gray-300 rounded-md p-4 mx-auto text-gray-700'>
            {loaded ? (
                <div>
                    {renderCalendarComponent()}
                </div>
            ) : (
                <div className="w-full h-full grid place-content-center">
                    <h1 className="text-3xl font-ubuntu font-bold">LOADING...</h1>
                </div>
            )}
            {checkout === true ? (
                <Checkout onClose={handleCloseCheckout} tourName={tourName} sheetId={sheetId} tourDate={calendarSelectedDate.toLocaleDateString("en-CA")} tourTime={tourTime} adult={adultParticipants} child={childParticipants} infant={infantParticipants} tourPrice={price} />
            ) : null}
        </div>
    )
}

export default DatePicker