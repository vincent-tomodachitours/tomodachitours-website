import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isToday,
    parseISO
} from 'date-fns';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    UsersIcon,
    ClockIcon,
    PhoneIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Badge, formatTourType, getTourTypeBadgeVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { BookingService } from '../../services/bookingService';
import { Booking } from '../../types';

interface BookingDetailsModalProps {
    booking: Booking;
    isOpen: boolean;
    onClose: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, isOpen, onClose }) => {
    const getTourTypeDisplay = (tourType: string) => {
        const names = {
            'NIGHT_TOUR': 'Night Tour',
            'MORNING_TOUR': 'Morning Tour',
            'UJI_TOUR': 'Uji Tour',
            'GION_TOUR': 'Gion Tour'
        };
        return names[tourType as keyof typeof names] || tourType;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Booking Details" size="lg">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Booking #{booking.id}
                        </h3>
                        <Badge variant={getTourTypeBadgeVariant(booking.tour_type)}>
                            {getTourTypeDisplay(booking.tour_type)}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date & Time</p>
                                <p className="text-sm text-gray-900">
                                    {format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')} at {booking.booking_time}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <UsersIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Participants</p>
                                <p className="text-sm text-gray-900">
                                    {booking.total_participants} total ({booking.adults}A {booking.children}C {booking.infants}I)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-800">
                                    {booking.customer_name.split(' ').map(n => n[0]).join('')}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{booking.customer_name}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <a
                                href={`mailto:${booking.customer_email}`}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                {booking.customer_email}
                            </a>
                        </div>

                        {booking.customer_phone && (
                            <div className="flex items-center space-x-2">
                                <PhoneIcon className="h-4 w-4 text-gray-400" />
                                <a
                                    href={`tel:${booking.customer_phone}`}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    {booking.customer_phone}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Booking Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-500">Status</p>
                            <Badge variant="success">{booking.status}</Badge>
                        </div>

                        <div>
                            <p className="font-medium text-gray-500">Source</p>
                            <Badge variant={booking.external_source === 'bokun' ? 'warning' : 'primary'}>
                                {booking.external_source === 'bokun' ? 'Bokun' : 'Website'}
                            </Badge>
                        </div>

                        <div>
                            <p className="font-medium text-gray-500">Booked</p>
                            <p className="text-gray-900">
                                {format(parseISO(booking.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                        </div>

                        {booking.discount_code && (
                            <div>
                                <p className="font-medium text-gray-500">Discount Code</p>
                                <p className="text-gray-900">{booking.discount_code}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Guide Notes */}
                {booking.guide_notes && (
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-md font-medium text-blue-900 mb-2">Notes for You</h4>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{booking.guide_notes}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
};

const EmployeeBookingsCalendar: React.FC = () => {
    const { employee } = useAdminAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Calendar date range - show full weeks
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Fetch my assigned bookings
    const { data: allBookings = [], isLoading, error } = useQuery({
        queryKey: ['employee-bookings', employee?.id, currentDate.getFullYear(), currentDate.getMonth()],
        queryFn: async () => {
            if (!employee?.id) return [];

            return BookingService.getEmployeeBookings(
                employee.id,
                format(calendarStart, 'yyyy-MM-dd'),
                format(calendarEnd, 'yyyy-MM-dd')
            );
        },
        enabled: !!employee?.id,
        refetchInterval: 60000, // Refresh every minute
    });

    // Group bookings by date
    const bookingsByDate = useMemo(() => {
        const grouped: Record<string, Booking[]> = {};
        allBookings.forEach((booking) => {
            const dateKey = booking.booking_date;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(booking);
        });

        // Sort bookings within each date by time
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => a.booking_time.localeCompare(b.booking_time));
        });

        return grouped;
    }, [allBookings]);

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(currentDate.getMonth() - 1);
        } else {
            newDate.setMonth(currentDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleBookingClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setShowDetailsModal(true);
    };

    const getDayBookings = (date: Date): Booking[] => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return bookingsByDate[dateKey] || [];
    };

    const getTourTypeColor = (tourType: string) => {
        const colors = {
            'NIGHT_TOUR': 'bg-purple-100 text-purple-800',
            'MORNING_TOUR': 'bg-yellow-100 text-yellow-800',
            'UJI_TOUR': 'bg-green-100 text-green-800',
            'GION_TOUR': 'bg-blue-100 text-blue-800'
        };
        return colors[tourType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">Error loading bookings</h2>
                    <p className="text-gray-600 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-600">Tours assigned to you</p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateMonth('prev')}
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-semibold text-gray-900 px-4">
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
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date) => {
                            const dayBookings = getDayBookings(date);
                            const isCurrentMonth = isSameMonth(date, currentDate);
                            const isCurrentDay = isToday(date);

                            return (
                                <div
                                    key={date.toISOString()}
                                    className={`min-h-[120px] border rounded-lg p-2 ${isCurrentMonth
                                        ? 'bg-white border-gray-200'
                                        : 'bg-gray-50 border-gray-100'
                                        } ${isCurrentDay ? 'ring-2 ring-indigo-500' : ''}`}
                                >
                                    <div className={`text-sm font-medium mb-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        } ${isCurrentDay ? 'text-indigo-600' : ''}`}>
                                        {format(date, 'd')}
                                    </div>

                                    {/* Bookings for this day */}
                                    <div className="space-y-1">
                                        {dayBookings.slice(0, 3).map((booking) => (
                                            <div
                                                key={booking.id}
                                                onClick={() => handleBookingClick(booking)}
                                                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getTourTypeColor(booking.tour_type)}`}
                                            >
                                                <div className="font-medium truncate">
                                                    {booking.booking_time} • {formatTourType(booking.tour_type)}
                                                </div>
                                                <div className="truncate">
                                                    {booking.customer_name}
                                                </div>
                                                <div className="text-xs opacity-75">
                                                    {booking.total_participants} pax
                                                </div>
                                            </div>
                                        ))}

                                        {dayBookings.length > 3 && (
                                            <div className="text-xs text-gray-500 text-center py-1">
                                                +{dayBookings.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <CalendarIcon className="h-8 w-8 text-indigo-600" />
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">This Month</h3>
                            <p className="text-2xl font-bold text-indigo-600">
                                {allBookings.length} bookings
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <UsersIcon className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Total Guests</h3>
                            <p className="text-2xl font-bold text-green-600">
                                {allBookings.reduce((sum, booking) => sum + (booking.total_participants || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <ClockIcon className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Next Booking</h3>
                            <p className="text-sm font-medium text-purple-600">
                                {allBookings.length > 0
                                    ? format(parseISO(allBookings[0].booking_date), 'MMM d')
                                    : 'None scheduled'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedBooking(null);
                    }}
                />
            )}
        </div>
    );
};

export default EmployeeBookingsCalendar; 