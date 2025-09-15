import React from 'react';
import Calendar from "react-calendar";
import '../CSS/Calendar.css';
import PeopleSelector from "./PeopleSelector";

const CalendarView = ({
    maxSlots,
    price,
    participants,
    adultParticipants,
    childParticipants,
    infantParticipants,
    handleAdultParticipantsChange,
    handleChildParticipantsChange,
    handleInfantParticipantsChange,
    availabilityLoading,
    loadingAvailability,
    disableDates,
    onCalendarChange,
    calendarSelectedDate,
    calendarActiveStartDate,
    setCalendarActiveStartDate,
    oneYearsLater,
    minViewLimit,
    tourId
}) => {
    return (
        <div>
            <div className="mb-4">
                <div className="space-y-2">
                    <PeopleSelector
                        min={1}
                        max={maxSlots}
                        title={"Adults"}
                        ageRange="18 - 90"
                        price={price}
                        participants={participants}
                        value={adultParticipants}
                        onChange={handleAdultParticipantsChange}
                    />
                    <PeopleSelector
                        min={0}
                        max={maxSlots}
                        title={"Children"}
                        ageRange={tourId === 'music-tour' ? "6 - 17" : "3 - 17"}
                        price={price}
                        participants={participants}
                        value={childParticipants}
                        onChange={handleChildParticipantsChange}
                    />
                    {tourId !== 'music-tour' && (
                        <PeopleSelector
                            min={0}
                            max={maxSlots}
                            title={"Infants"}
                            ageRange="0 - 2"
                            price={0}
                            participants={participants}
                            value={infantParticipants}
                            onChange={handleInfantParticipantsChange}
                        />
                    )}
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
                    activeStartDate={calendarActiveStartDate}
                    onActiveStartDateChange={setCalendarActiveStartDate}
                    next2Label={null}
                    prev2Label={null}
                    maxDate={oneYearsLater}
                    minDate={minViewLimit}
                    calendarType="gregory"
                    showNavigation={true}
                    navigationLabel={({ date }) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                />
            </div>
        </div>
    );
};

export default CalendarView;