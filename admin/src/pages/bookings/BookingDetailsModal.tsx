import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Booking, BookingStatus } from '../../types';
import { format } from 'date-fns';

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
    const [selectedGuide, setSelectedGuide] = useState<string>(booking.assigned_guide_id || '');
    const [guideNotes, setGuideNotes] = useState(booking.guide_notes || '');
    const [newStatus, setNewStatus] = useState<BookingStatus>(booking.status as BookingStatus);

    // Reset form when booking changes
    useEffect(() => {
        setSelectedGuide(booking.assigned_guide_id || '');
        setGuideNotes(booking.guide_notes || '');
        setNewStatus(booking.status as BookingStatus);
    }, [booking]);

    // Fetch available guides for this booking
    const { data: availableGuides = [] } = useQuery({
        queryKey: ['availableGuides', booking.tour_type, booking.booking_date, booking.booking_time],
        queryFn: () => BookingService.getAvailableGuides(
            booking.tour_type,
            booking.booking_date,
            booking.booking_time
        ),
        enabled: isOpen,
    });

    // Mutations
    const assignGuideMutation = useMutation({
        mutationFn: ({ guideId, notes }: { guideId: string; notes?: string }) =>
            BookingService.assignGuide(booking.id, guideId, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            onUpdate();
        },
    });

    const removeGuideMutation = useMutation({
        mutationFn: () => BookingService.removeGuide(booking.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            setSelectedGuide('');
            setGuideNotes('');
            onUpdate();
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => BookingService.updateBookingStatus(booking.id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            onUpdate();
        },
    });

    const updateNotesMutation = useMutation({
        mutationFn: (notes: string) => BookingService.updateGuideNotes(booking.id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            onUpdate();
        },
    });

    // Handlers
    const handleAssignGuide = async () => {
        if (!selectedGuide) return;

        try {
            await assignGuideMutation.mutateAsync({
                guideId: selectedGuide,
                notes: guideNotes || undefined
            });
        } catch (error) {
            console.error('Error assigning guide:', error);
            alert('Failed to assign guide. Please try again.');
        }
    };

    const handleRemoveGuide = async () => {
        if (!window.confirm('Are you sure you want to remove the assigned guide?')) {
            return;
        }

        try {
            await removeGuideMutation.mutateAsync();
        } catch (error) {
            console.error('Error removing guide:', error);
            alert('Failed to remove guide. Please try again.');
        }
    };

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

    const handleUpdateNotes = async () => {
        if (guideNotes === (booking.guide_notes || '')) return;

        try {
            await updateNotesMutation.mutateAsync(guideNotes);
        } catch (error) {
            console.error('Error updating notes:', error);
            alert('Failed to update notes. Please try again.');
        }
    };

    const isLoading = assignGuideMutation.isPending ||
        removeGuideMutation.isPending ||
        updateStatusMutation.isPending ||
        updateNotesMutation.isPending;

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
                                {format(new Date(booking.booking_date), 'EEEE, MMMM dd, yyyy')}
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
                                {format(new Date(booking.created_at), 'MMM dd, yyyy HH:mm')}
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
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <UserIcon className="h-4 w-4 mr-2" />
                        Guide Assignment
                    </h4>

                    {booking.assigned_guide ? (
                        <div className="space-y-3">
                            <div className="bg-white p-3 rounded-md border">
                                <p className="text-sm text-gray-600">Currently Assigned</p>
                                <p className="font-medium">
                                    {booking.assigned_guide.first_name} {booking.assigned_guide.last_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {booking.assigned_guide.employee_code} • {booking.assigned_guide.email}
                                </p>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={handleRemoveGuide}
                                    loading={removeGuideMutation.isPending}
                                    className="mt-2"
                                >
                                    Remove Guide
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Guide
                                </label>
                                <select
                                    value={selectedGuide}
                                    onChange={(e) => setSelectedGuide(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={isLoading}
                                >
                                    <option value="">Select a guide...</option>
                                    {availableGuides.map((shift) => (
                                        <option key={shift.id} value={shift.employee_id}>
                                            {shift.employee?.first_name} {shift.employee?.last_name} ({shift.employee?.employee_code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Guide Notes */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Guide Notes
                        </label>
                        <textarea
                            value={guideNotes}
                            onChange={(e) => setGuideNotes(e.target.value)}
                            onBlur={handleUpdateNotes}
                            placeholder="Add notes for the guide..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Assign Button (only show if no guide assigned and guide selected) */}
                    {!booking.assigned_guide && selectedGuide && (
                        <Button
                            onClick={handleAssignGuide}
                            loading={assignGuideMutation.isPending}
                            className="mt-3"
                        >
                            Assign Guide
                        </Button>
                    )}
                </div>

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