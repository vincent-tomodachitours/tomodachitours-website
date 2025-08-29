import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, FunnelIcon, CalendarIcon, ArrowPathIcon, TrashIcon, ExclamationTriangleIcon, ClipboardDocumentIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { BookingService } from '../../services/bookingService';
import { BokunBookingService } from '../../services/bokunBookingService';
import { BookingFilters, TourType, BookingStatus } from '../../types';
import { Badge, getStatusBadgeVariant, getTourTypeBadgeVariant, formatTourType } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import BookingDetailsModal from './BookingDetailsModal';
import BookingCalendarView from './BookingCalendarView';
import { format } from 'date-fns';

// Safe date formatting function that handles invalid dates
const safeFormatDate = (dateValue: any, formatString: string, fallback: string = 'Invalid Date'): string => {
    if (!dateValue) return fallback;

    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date value:', dateValue);
            return fallback;
        }
        return format(date, formatString);
    } catch (error) {
        console.warn('Date formatting error:', error, 'for value:', dateValue);
        return fallback;
    }
};

// Copy email to clipboard function
const copyEmailToClipboard = async (email: string) => {
    try {
        await navigator.clipboard.writeText(email);
        // You could add a toast notification here if you have one set up
        console.log('Email copied to clipboard:', email);
    } catch (error) {
        console.error('Failed to copy email:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
};

const BookingList: React.FC = () => {
    const [filters, setFilters] = useState<BookingFilters>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCacheManager, setShowCacheManager] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const queryClient = useQueryClient();

    // Query for upcoming bookings (local + external Bokun bookings)
    const {
        data: allBookings = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['bookings', filters],
        queryFn: () => BookingService.getBookings(filters),
        refetchInterval: 30000,
        // refetchOnWindowFocus is already disabled globally in QueryProvider
    });

    // Query cache health
    const { data: cacheHealth, refetch: refetchCacheHealth } = useQuery({
        queryKey: ['cache-health'],
        queryFn: () => BokunBookingService.getCacheHealth(),
        refetchInterval: 60000, // Check every minute
        // refetchOnWindowFocus is already disabled globally in QueryProvider
    });

    // Cache sync mutation
    const syncCacheMutation = useMutation({
        mutationFn: () => BokunBookingService.syncBokunCache(),
        onSuccess: (result) => {
            if (result.success) {
                // Refresh bookings and cache health after successful sync
                refetch();
                refetchCacheHealth();
                queryClient.invalidateQueries({ queryKey: ['bookings'] });
            }
        }
    });

    // Cache clear mutation
    const clearCacheMutation = useMutation({
        mutationFn: () => BokunBookingService.clearCache(),
        onSuccess: (result) => {
            if (result.success) {
                // Refresh bookings and cache health after clearing
                refetch();
                refetchCacheHealth();
                queryClient.invalidateQueries({ queryKey: ['bookings'] });
            }
        }
    });



    // Apply search filtering client-side for better performance
    const bookings = useMemo(() => {
        if (!searchQuery.trim()) {
            return allBookings;
        }

        const searchTerm = searchQuery.toLowerCase();
        return allBookings.filter(booking =>
            booking.customer_name.toLowerCase().includes(searchTerm) ||
            booking.customer_email.toLowerCase().includes(searchTerm)
        );
    }, [allBookings, searchQuery]);

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
    const handleBookingClick = (booking: any) => {
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

    // Function to get alternating background color based on date
    const getDateBackgroundColor = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'bg-white'; // Default to white for invalid dates
            }

            // Get the day number from the date (this will alternate based on the date)
            const dayOfMonth = date.getDate();

            // Alternate between white and very light green based on even/odd day
            if (dayOfMonth % 2 === 0) {
                return 'bg-green-100'; // Very light green for even days
            } else {
                return 'bg-white'; // White for odd days
            }
        } catch {
            return 'bg-white'; // Default to white on error
        }
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
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Upcoming Bookings</h1>
                    <p className="text-gray-600">
                        Upcoming tours only (direct website bookings + external Bokun bookings)
                    </p>
                </div>
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

                        {/* Cache Management Button */}
                        <Button
                            variant="ghost"
                            onClick={() => setShowCacheManager(true)}
                            className="relative"
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                            Cache
                            {cacheHealth?.success && cacheHealth.data && (
                                <Badge
                                    variant="primary"
                                    size="sm"
                                    className="ml-2"
                                >
                                    {cacheHealth.data.total_cached_bookings}
                                </Badge>
                            )}
                        </Button>

                        {/* View Toggle */}
                        <div className="flex rounded-md shadow-sm">
                            <Button
                                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="rounded-r-none"
                            >
                                <ListBulletIcon className="h-4 w-4 mr-1" />
                                List
                            </Button>
                            <Button
                                variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('calendar')}
                                className="rounded-l-none border-l-0"
                            >
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Calendar
                            </Button>
                        </div>

                        {/* Refresh Button */}
                        <Button variant="ghost" onClick={() => refetch()}>
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bookings Content - List or Calendar View */}
            {viewMode === 'list' ? (
                <div className="bg-white shadow rounded-lg">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
                                <p className="text-sm text-gray-600">
                                    {bookings.length} upcoming bookings
                                </p>
                            </div>
                        </div>

                        {bookings.length === 0 ? (
                            <div className="text-center py-8">
                                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No upcoming bookings found</p>
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
                                                Source
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
                                                className={`${getDateBackgroundColor(booking.booking_date)} hover:bg-gray-100 cursor-pointer transition-colors`}
                                                onClick={() => handleBookingClick(booking)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        #{booking.id}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {safeFormatDate(booking.created_at, 'MMM d, yyyy', 'Unknown Date')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap w-48 max-w-48">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {booking.customer_name}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm text-gray-500 truncate flex-1 min-w-0">
                                                            {booking.customer_email}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyEmailToClipboard(booking.customer_email);
                                                            }}
                                                            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                            title="Copy email"
                                                        >
                                                            <ClipboardDocumentIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={getTourTypeBadgeVariant(booking.tour_type)}>
                                                        {formatTourType(booking.tour_type)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {safeFormatDate(booking.booking_date, 'MMM d, yyyy', 'Invalid Date')}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {booking.booking_time}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {booking.total_participants} total
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {booking.adults}A {booking.children}C {booking.infants}I
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={(booking.external_source || 'website') === 'bokun' ? 'warning' : 'primary'}>
                                                        {(booking.external_source || 'website') === 'bokun' ? 'Bokun' : 'Website'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {booking.assigned_guide ? (
                                                        <div className="text-sm text-gray-900">
                                                            {booking.assigned_guide.first_name} {booking.assigned_guide.last_name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={getStatusBadgeVariant(booking.status)}>
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
            ) : (
                <BookingCalendarView
                    bookings={bookings}
                    onBookingClick={handleBookingClick}
                    isLoading={isLoading}
                />
            )}

            {/* Filter Modal */}
            <Modal
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                title="Filter Bookings"
            >
                <div className="space-y-6">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tour Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tour Types
                        </label>
                        <div className="space-y-2">
                            {(['NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'UJI_WALKING_TOUR', 'GION_TOUR'] as TourType[]).map(type => (
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

            {/* Cache Management Modal */}
            <Modal
                isOpen={showCacheManager}
                onClose={() => setShowCacheManager(false)}
                title="Bokun Cache Management"
            >
                <div className="space-y-6">
                    {/* Cache Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Cache Status</h3>

                        {cacheHealth?.success && cacheHealth.data ? (
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Cached Bookings:</span>
                                    <Badge variant="primary">
                                        {cacheHealth.data.total_cached_bookings.toLocaleString()}
                                    </Badge>
                                </div>

                                {cacheHealth.data.products_metadata?.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Products Status:</h4>
                                        <div className="space-y-1">
                                            {cacheHealth.data.products_metadata.map((product: any) => (
                                                <div key={product.product_id} className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Product {product.product_id}:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={product.sync_status === 'completed' ? 'success' :
                                                                product.sync_status === 'error' ? 'danger' : 'warning'}
                                                            size="sm"
                                                        >
                                                            {product.sync_status}
                                                        </Badge>
                                                        {product.total_bookings_cached && (
                                                            <span className="text-gray-500">
                                                                ({product.total_bookings_cached} bookings)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : cacheHealth?.error ? (
                            <div className="text-red-600 flex items-center">
                                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                Error: {cacheHealth.error}
                            </div>
                        ) : (
                            <div className="text-gray-500">Loading cache status...</div>
                        )}
                    </div>

                    {/* Sync Status */}
                    {(syncCacheMutation.isPending || syncCacheMutation.data) && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="text-lg font-medium text-blue-900 mb-2">Sync Status</h3>

                            {syncCacheMutation.isPending && (
                                <div className="flex items-center text-blue-700">
                                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                                    Syncing cache... This may take a few minutes.
                                </div>
                            )}

                            {syncCacheMutation.data && (
                                <div className={`${syncCacheMutation.data.success ? 'text-green-700' : 'text-red-700'}`}>
                                    {syncCacheMutation.data.message}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Clear Status */}
                    {(clearCacheMutation.isPending || clearCacheMutation.data) && (
                        <div className="bg-orange-50 rounded-lg p-4">
                            <h3 className="text-lg font-medium text-orange-900 mb-2">Clear Status</h3>

                            {clearCacheMutation.isPending && (
                                <div className="flex items-center text-orange-700">
                                    <TrashIcon className="h-5 w-5 mr-2" />
                                    Clearing cache...
                                </div>
                            )}

                            {clearCacheMutation.data && (
                                <div className={`${clearCacheMutation.data.success ? 'text-green-700' : 'text-red-700'}`}>
                                    {clearCacheMutation.data.message}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t border-gray-200">
                        <div className="space-x-3">
                            <Button
                                onClick={() => syncCacheMutation.mutate()}
                                disabled={syncCacheMutation.isPending || clearCacheMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {syncCacheMutation.isPending ? (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                                        Sync Cache
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={() => clearCacheMutation.mutate()}
                                disabled={syncCacheMutation.isPending || clearCacheMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                {clearCacheMutation.isPending ? (
                                    <>
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Clearing...
                                    </>
                                ) : (
                                    <>
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Clear Cache
                                    </>
                                )}
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => setShowCacheManager(false)}
                        >
                            Close
                        </Button>
                    </div>

                    {/* Help Text */}
                    <div className="text-sm text-gray-500 bg-gray-50 rounded p-3">
                        <p><strong>Sync Cache:</strong> Fetches latest bookings from Bokun API and stores them locally for fast access.</p>
                        <p><strong>Clear Cache:</strong> Removes all cached data. Cache will be empty until next sync.</p>
                        <p className="mt-2 text-xs">💡 Tip: Cache is automatically used for fast loading. Sync when you need latest data.</p>
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