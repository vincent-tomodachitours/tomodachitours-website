import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    UserIcon,
    CalendarIcon,
    ClockIcon,
    UsersIcon,
    CreditCardIcon,
    PhoneIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant, getTourTypeBadgeVariant, formatTourType } from '../../components/ui/Badge';
import { BookingService } from '../../services/bookingService';
import { GuideAssignmentSection } from '../../components/bookings/GuideAssignmentSection';
import { Booking, BookingStatus } from '../../types';
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

interface BookingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onUpdate: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
    isOpen,
    onClose,
    booking,
    onUpdate,
}) => {
    const queryClient = useQueryClient();
    const [newStatus, setNewStatus] = useState<BookingStatus>(booking.status as BookingStatus);

    // Reset form when booking changes
    useEffect(() => {
        setNewStatus(booking.status as BookingStatus);
    }, [booking]);

    // Mutations
    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => BookingService.updateBookingStatus(booking.id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            onUpdate();
        },
    });

    // Handlers
    const handleUpdateStatus = async () => {
        if (newStatus === booking.status) return;

        const confirmMessage = `Are you sure you want to change the status from "${booking.status}" to "${newStatus}"?`;
        if (!window.confirm(confirmMessage)) {
            setNewStatus(booking.status as BookingStatus);
            return;
        }

        try {
            await updateStatusMutation.mutateAsync(newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
            setNewStatus(booking.status as BookingStatus);
        }
    };

    const isLoading = updateStatusMutation.isPending;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Booking #${booking.id}`} size="xl">
            <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-medium">{booking.customer_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 flex items-center">
                                <EnvelopeIcon className="h-3 w-3 mr-1" />
                                Email
                            </p>
                            <p className="font-medium">{booking.customer_email}</p>
                        </div>
                        {booking.customer_phone && (
                            <div>
                                <p className="text-sm text-gray-600 flex items-center">
                                    <PhoneIcon className="h-3 w-3 mr-1" />
                                    Phone
                                </p>
                                <p className="font-medium">{booking.customer_phone}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Booking Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Tour Type</p>
                            <Badge variant={getTourTypeBadgeVariant(booking.tour_type)}>
                                {formatTourType(booking.tour_type)}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <div className="flex items-center space-x-2">
                                <Badge variant={getStatusBadgeVariant(booking.status)}>
                                    {booking.status}
                                </Badge>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
                                    onBlur={handleUpdateStatus}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                    disabled={isLoading}
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="CONFIRMED">CONFIRMED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                    <option value="REFUNDED">REFUNDED</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Date
                            </p>
                            <p className="font-medium">
                                {safeFormatDate(booking.booking_date, 'EEEE, MMMM dd, yyyy', 'Invalid Date')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Time
                            </p>
                            <p className="font-medium">{booking.booking_time}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 flex items-center">
                                <UsersIcon className="h-3 w-3 mr-1" />
                                Participants
                            </p>
                            <p className="font-medium">
                                {booking.adults + booking.children + booking.infants} total
                                <span className="text-gray-500 text-sm ml-2">
                                    ({booking.adults} adults, {booking.children} children, {booking.infants} infants)
                                </span>
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Booking Date</p>
                            <p className="font-medium">
                                {safeFormatDate(booking.created_at, 'MMM dd, yyyy HH:mm', 'Unknown Date')}
                            </p>
                        </div>
                        {booking.charge_id && (
                            <div>
                                <p className="text-sm text-gray-600 flex items-center">
                                    <CreditCardIcon className="h-3 w-3 mr-1" />
                                    Payment ID
                                </p>
                                <p className="font-medium text-xs">{booking.charge_id}</p>
                            </div>
                        )}
                        {booking.discount_code && (
                            <div>
                                <p className="text-sm text-gray-600">Discount Code</p>
                                <p className="font-medium">
                                    {booking.discount_code}
                                    {booking.discount_amount && (
                                        <span className="text-green-600 ml-2">
                                            (-¥{booking.discount_amount})
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Guide Assignment */}
                <GuideAssignmentSection
                    booking={booking}
                    onUpdate={onUpdate}
                />

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default BookingDetailsModal; 