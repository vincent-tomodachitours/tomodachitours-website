import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlassIcon, FunnelIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { BookingService } from '../../services/bookingService';
import { Booking, BookingFilters, TourType, BookingStatus } from '../../types';
import { Badge, getStatusBadgeVariant, getTourTypeBadgeVariant, formatTourType } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import BookingDetailsModal from './BookingDetailsModal';
import { format } from 'date-fns';

const BookingList: React.FC = () => {
    const [filters, setFilters] = useState<BookingFilters>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Query for bookings
    const {
        data: bookings = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['bookings', filters],
        queryFn: () => BookingService.getBookings(filters),
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Update filters when search query changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({
                ...prev,
                searchQuery: searchQuery.trim() || undefined
            }));
        }, 300); // Debounce search

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter state for the UI
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });
    const [selectedTourTypes, setSelectedTourTypes] = useState<TourType[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<BookingStatus[]>([]);

    // Apply filters
    const applyFilters = () => {
        const newFilters: BookingFilters = {};

        if (dateRange.start && dateRange.end) {
            newFilters.dateRange = {
                start: new Date(dateRange.start),
                end: new Date(dateRange.end)
            };
        }

        if (selectedTourTypes.length > 0) {
            newFilters.tourType = selectedTourTypes;
        }

        if (selectedStatuses.length > 0) {
            newFilters.status = selectedStatuses;
        }

        if (searchQuery.trim()) {
            newFilters.searchQuery = searchQuery.trim();
        }

        setFilters(newFilters);
        setShowFilters(false);
    };

    // Clear filters
    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setSelectedTourTypes([]);
        setSelectedStatuses([]);
        setSearchQuery('');
        setFilters({});
        setShowFilters(false);
    };

    // Handle booking click
    const handleBookingClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setShowDetailsModal(true);
    };

    // Handle booking update (from modal)
    const handleBookingUpdate = () => {
        refetch();
        setShowDetailsModal(false);
        setSelectedBooking(null);
    };

    // Calculate filter counts
    const filterCount = useMemo(() => {
        let count = 0;
        if (dateRange.start && dateRange.end) count++;
        if (selectedTourTypes.length > 0) count++;
        if (selectedStatuses.length > 0) count++;
        return count;
    }, [dateRange, selectedTourTypes, selectedStatuses]);

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
                    <Button onClick={() => refetch()} className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
                <p className="text-gray-600">Manage and track all tour bookings</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by customer name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Filter Button */}
                        <Button
                            variant="ghost"
                            onClick={() => setShowFilters(true)}
                            className="relative"
                        >
                            <FunnelIcon className="h-5 w-5 mr-2" />
                            Filters
                            {filterCount > 0 && (
                                <Badge variant="primary" size="sm" className="ml-2">
                                    {filterCount}
                                </Badge>
                            )}
                        </Button>

                        {/* Refresh Button */}
                        <Button variant="ghost" onClick={() => refetch()}>
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    {bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {Object.keys(filters).length > 0
                                    ? 'Try adjusting your filters'
                                    : 'No bookings have been made yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Booking
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tour
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Participants
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Guide
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bookings.map((booking) => (
                                        <tr
                                            key={booking.id}
                                            onClick={() => handleBookingClick(booking)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">#{booking.id}</div>
                                                    <div className="text-gray-500">
                                                        {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">{booking.customer_name}</div>
                                                    <div className="text-gray-500">{booking.customer_email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={getTourTypeBadgeVariant(booking.tour_type)}
                                                    size="sm"
                                                >
                                                    {formatTourType(booking.tour_type)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">
                                                        {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                                                    </div>
                                                    <div className="text-gray-500">{booking.booking_time}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {booking.adults + booking.children + booking.infants} total
                                                    <div className="text-gray-500 text-xs">
                                                        {booking.adults}A {booking.children}C {booking.infants}I
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {booking.assigned_guide ? (
                                                    <div className="flex items-center">
                                                        <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-900">
                                                            {booking.assigned_guide.first_name} {booking.assigned_guide.last_name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={getStatusBadgeVariant(booking.status)}
                                                    size="sm"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            <Modal
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                title="Filter Bookings"
                size="md"
            >
                <div className="space-y-6">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Tour Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tour Types
                        </label>
                        <div className="space-y-2">
                            {(['NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'GION_TOUR'] as TourType[]).map(type => (
                                <label key={type} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedTourTypes.includes(type)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTourTypes(prev => [...prev, type]);
                                            } else {
                                                setSelectedTourTypes(prev => prev.filter(t => t !== type));
                                            }
                                        }}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        {formatTourType(type)}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <div className="space-y-2">
                            {(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'] as BookingStatus[]).map(status => (
                                <label key={status} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedStatuses(prev => [...prev, status]);
                                            } else {
                                                setSelectedStatuses(prev => prev.filter(s => s !== status));
                                            }
                                        }}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        {status}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={clearFilters}>
                            Clear All
                        </Button>
                        <div className="space-x-3">
                            <Button variant="ghost" onClick={() => setShowFilters(false)}>
                                Cancel
                            </Button>
                            <Button onClick={applyFilters}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <BookingDetailsModal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedBooking(null);
                    }}
                    booking={selectedBooking}
                    onUpdate={handleBookingUpdate}
                />
            )}
        </div>
    );
};

export default BookingList; 