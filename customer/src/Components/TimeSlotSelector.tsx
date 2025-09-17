import { ReactComponent as Clock } from '../SVG/Clock.svg';
import PriceDisplay from './PriceDisplay';
import { TimeSlotSelectorProps } from '../types';

const TimeSlotSelector = ({
    calendarSelectedDate,
    loadingAvailability,
    tourTime,
    handleTourTimeChange,
    availableTimesForDate,
    participantsByDate,
    cancellationCutoffHours,
    cancellationCutoffHoursWithParticipant,
    tourName,
    tourId,
    adultParticipants,
    childParticipants,
    infantParticipants,
    totalPrice,
    minParticipants = 1,
    handleGoBack,
    handleOpenCheckout
}: TimeSlotSelectorProps) => {
    // Helper to get current time in JST
    function getNowInJST(): Date {
        const now = new Date();
        return now;
    }

    // Helper to get a Date object for a tour slot in JST
    function getTourDateTimeJST(date: Date, time: string): Date {
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
    }

    const timeSlotSelector = () => {
        const formattedDate = calendarSelectedDate.toLocaleDateString("en-CA");
        const dayData = (participantsByDate as Record<string, Record<string, number>>)[formattedDate] || {};
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
                        availableTimesForDate.map((slot, _i) => {
                            const tourDateTimeJST = getTourDateTimeJST(calendarSelectedDate, slot);
                            const hoursUntilTour = (tourDateTimeJST.getTime() - nowJST.getTime()) / (1000 * 60 * 60);
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
    };

    return (
        <div className="time-selection">
            <h1 className='font-ubuntu font-bold text-2xl text-gray-800 mb-6'>
                {calendarSelectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </h1>

            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <Clock className='w-5 h-5 text-gray-600 mr-2' />
                    <h2 className="font-ubuntu font-semibold text-lg text-gray-800">Choose a time</h2>
                </div>
                {timeSlotSelector()}
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
                        <div>{tourId === 'uji-tour' ? 'Participants' : 'Adults'}: {adultParticipants}</div>
                        {tourId !== 'uji-tour' && childParticipants !== 0 && <div>Children: {childParticipants}</div>}
                        {tourId !== 'uji-tour' && infantParticipants !== 0 && <div>Infants: {infantParticipants}</div>}
                        <div className="text-xs">
                            {tourId === 'uji-tour' ? (
                                <>
                                    Total: {adultParticipants}
                                    {minParticipants > 1 && (
                                        <span className={`ml-1 ${adultParticipants < minParticipants ? 'text-red-600' : 'text-green-600'}`}>
                                            (Min: {minParticipants})
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    Total: {adultParticipants + childParticipants + infantParticipants}
                                    {minParticipants > 1 && (
                                        <span className={`ml-1 ${(adultParticipants + childParticipants + infantParticipants) < minParticipants ? 'text-red-600' : 'text-green-600'}`}>
                                            (Min: {minParticipants})
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-600">Total</div>
                        <PriceDisplay
                            jpyPrice={totalPrice}
                            originalPrice={undefined}
                            showPerGuest={false}
                            showViatorComparison={false}
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
                {(() => {
                    const totalParticipants = tourId === 'uji-tour'
                        ? adultParticipants
                        : adultParticipants + childParticipants + infantParticipants;

                    return totalParticipants < minParticipants && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Minimum {minParticipants} {tourId === 'uji-tour' ? 'adults' : 'participants'} required for this tour.
                            </div>
                        </div>
                    );
                })()}
                <button
                    className={`w-full h-12 rounded-xl font-ubuntu font-semibold transition-colors duration-200 shadow-sm ${(() => {
                        const totalParticipants = tourId === 'uji-tour'
                            ? adultParticipants
                            : adultParticipants + childParticipants + infantParticipants;
                        return totalParticipants >= minParticipants
                            ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed';
                    })()}`}
                    onClick={handleOpenCheckout}
                    disabled={(() => {
                        const totalParticipants = tourId === 'uji-tour'
                            ? adultParticipants
                            : adultParticipants + childParticipants + infantParticipants;
                        return totalParticipants < minParticipants;
                    })()}
                >
                    Checkout
                </button>
            </div>
        </div>
    );
};

export default TimeSlotSelector;