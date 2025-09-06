import React, { useState, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isToday,
    parseISO,
    addMonths,
    subMonths
} from 'date-fns';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    UsersIcon,
    ClockIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { Badge, formatTourType, getTourTypeBadgeVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Booking } from '../../types';
import TimeSlotModal from './TimeSlotModal';

interface BookingCalendarViewProps {
    bookings: Booking[];
    onBookingClick: (booking: Booking) => void;
    isLoading?: boolean;
}

const BookingCalendarView: React.FC<BookingCalendarViewProps> = ({
    bookings,
    onBookingClick,
    isLoading = false
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
        timeSlot: string;
        tourType: string;
        date: string;
        bookings: Booking[];
    } | null>(null);
    const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);

    // Calendar date range - show full weeks
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Group bookings by date, then by time slot and tour type
    const bookingsByDate = useMemo(() => {
        const grouped: Record<string, Record<string, Booking[]>> = {};

        bookings.forEach((booking) => {
            const dateKey = booking.booking_date;
            const timeSlotKey = `${booking.booking_time}-${booking.tour_type}`;

            if (!grouped[dateKey]) {
                grouped[dateKey] = {};
            }
            if (!grouped[dateKey][timeSlotKey]) {
                grouped[dateKey][timeSlotKey] = [];
            }
            grouped[dateKey][timeSlotKey].push(booking);
        });

        // Sort time slots within each date
        Object.keys(grouped).forEach(date => {
            const sortedTimeSlots: Record<string, Booking[]> = {};
            const timeSlotKeys = Object.keys(grouped[date]).sort((a, b) => {
                const timeA = a.split('-')[0];
                const timeB = b.split('-')[0];
                return timeA.localeCompare(timeB);
            });

            timeSlotKeys.forEach(key => {
                sortedTimeSlots[key] = grouped[date][key];
            });

            grouped[date] = sortedTimeSlots;
        });

        return grouped;
    }, [bookings]);

    // Calculate stats for current month
    const monthlyStats = useMemo(() => {
        const monthBookings = bookings.filter(booking => {
            const bookingDate = parseISO(booking.booking_date);
            return isSameMonth(bookingDate, currentDate);
        });

        const totalGuests = monthBookings.reduce((sum, booking) => sum + (booking.total_participants || 0), 0);
        const assignedBookings = monthBookings.filter(booking => booking.assigned_guide_id).length;
        const unassignedBookings = monthBookings.length - assignedBookings;

        return {
            totalBookings: monthBookings.length,
            totalGuests,
            assignedBookings,
            unassignedBookings
        };
    }, [bookings, currentDate]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const getDayTimeSlots = (date: Date): Array<{ key: string; timeSlot: string; tourType: string; bookings: Booking[] }> => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayBookings = bookingsByDate[dateKey] || {};

        return Object.entries(dayBookings).map(([key, bookings]) => {
            const [timeSlot, tourType] = key.split('-');
            return {
                key,
                timeSlot,
                tourType,
                bookings
            };
        });
    };

    const handleTimeSlotClick = (date: Date, timeSlot: string, tourType: string, bookings: Booking[]) => {
        setSelectedTimeSlot({
            timeSlot,
            tourType,
            date: format(date, 'yyyy-MM-dd'),
            bookings
        });
        setShowTimeSlotModal(true);
    };

    const getTourTypeColor = (tourType: string) => {
        const colors: Record<string, string> = {
            'NIGHT_TOUR': 'bg-purple-100 text-purple-800 border-purple-200',
            'MORNING_TOUR': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'UJI_TOUR': 'bg-green-100 text-green-800 border-green-200',
            'UJI_WALKING_TOUR': 'bg-cyan-100 text-cyan-800 border-cyan-200',
            'GION_TOUR': 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return colors[tourType as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };



    if (isLoading) {
        return (
            <div className="min-h-[600px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </Button>
                    <h2 className="text-xl font-semibold text-gray-900 px-4 min-w-[200px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                >
                    Today
                </Button>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <CalendarIcon className="h-6 w-6 text-indigo-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                            <p className="text-lg font-bold text-indigo-600">
                                {monthlyStats.totalBookings}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <UsersIcon className="h-6 w-6 text-green-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Guests</p>
                            <p className="text-lg font-bold text-green-600">
                                {monthlyStats.totalGuests}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Assigned</p>
                            <p className="text-lg font-bold text-blue-600">
                                {monthlyStats.assignedBookings}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center">
                        <ClockIcon className="h-6 w-6 text-orange-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Unassigned</p>
                            <p className="text-lg font-bold text-orange-600">
                                {monthlyStats.unassignedBookings}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50 rounded">
                                <div className="hidden sm:block">{day}</div>
                                <div className="sm:hidden">{day.slice(0, 3)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date) => {
                            const dayTimeSlots = getDayTimeSlots(date);
                            const isCurrentMonth = isSameMonth(date, currentDate);
                            const isCurrentDay = isToday(date);

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`min-h-[140px] border rounded-lg p-2 ${isCurrentMonth
                                        ? 'bg-white border-gray-200'
                                        : 'bg-gray-50 border-gray-100'
                                        } ${isCurrentDay ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    {/* Date number */}
                                    <div className={`text-sm font-medium mb-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        } ${isCurrentDay ? 'text-indigo-600' : ''}`}>
                                        {format(date, 'd')}
                                    </div>

                                    {/* Time slots for this day */}
                                    <div className="space-y-1">
                                        {dayTimeSlots.slice(0, 4).map((timeSlot) => {
                                            const totalParticipants = timeSlot.bookings.reduce((sum, booking) => sum + (booking.total_participants || 0), 0);
                                            const hasUnassigned = timeSlot.bookings.some(booking => !booking.assigned_guide_id);
                                            const hasConfirmed = timeSlot.bookings.some(booking => booking.status === 'CONFIRMED');

                                            return (
                                                <div
                                                    key={timeSlot.key}
                                                    onClick={() => handleTimeSlotClick(date, timeSlot.timeSlot, timeSlot.tourType, timeSlot.bookings)}
                                                    className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity border-l-2 ${getTourTypeColor(timeSlot.tourType)} ${hasConfirmed ? 'border-l-green-500' : 'border-l-yellow-500'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-xs">
                                                            {timeSlot.timeSlot}
                                                        </span>
                                                        <Badge
                                                            variant={getTourTypeBadgeVariant(timeSlot.tourType)}
                                                            size="sm"
                                                            className="text-xs px-1 py-0"
                                                        >
                                                            {formatTourType(timeSlot.tourType).split(' ')[0]}
                                                        </Badge>
                                                    </div>

                                                    <div className="truncate font-medium mb-1">
                                                        {timeSlot.bookings.length} booking{timeSlot.bookings.length !== 1 ? 's' : ''}
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs opacity-75">
                                                            {totalParticipants} pax
                                                        </span>
                                                        {hasUnassigned ? (
                                                            <span className="text-xs text-orange-600 font-medium">
                                                                ! Unassigned
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-green-600 font-medium">
                                                                ✓ Assigned
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {dayTimeSlots.length > 4 && (
                                            <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 rounded">
                                                +{dayTimeSlots.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
                        <span className="text-sm text-gray-600">Night Tour</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
                        <span className="text-sm text-gray-600">Morning Tour</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                        <span className="text-sm text-gray-600">Uji Tour</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                        <span className="text-sm text-gray-600">Gion Tour</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-2 bg-green-500 rounded"></div>
                        <span className="text-sm text-gray-600">Confirmed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-2 bg-yellow-500 rounded"></div>
                        <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-2 bg-red-500 rounded"></div>
                        <span className="text-sm text-gray-600">Cancelled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-2 bg-gray-500 rounded"></div>
                        <span className="text-sm text-gray-600">Refunded</span>
                    </div>
                </div>
            </div>

            {/* Time Slot Modal */}
            {selectedTimeSlot && (
                <TimeSlotModal
                    isOpen={showTimeSlotModal}
                    onClose={() => {
                        setShowTimeSlotModal(false);
                        setSelectedTimeSlot(null);
                    }}
                    timeSlot={selectedTimeSlot.timeSlot}
                    tourType={selectedTimeSlot.tourType}
                    date={selectedTimeSlot.date}
                    bookings={selectedTimeSlot.bookings}
                    onBookingClick={onBookingClick}
                />
            )}
        </div>
    );
};

export default BookingCalendarView;