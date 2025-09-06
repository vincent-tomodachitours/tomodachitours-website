import React from 'react';
import { format, parseISO } from 'date-fns';
import {
    ClockIcon,
    UsersIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    ClipboardDocumentIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Modal } from '../../components/ui/Modal';
import { Badge, formatTourType, getTourTypeBadgeVariant, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Booking } from '../../types';

interface TimeSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    timeSlot: string;
    tourType: string;
    date: string;
    bookings: Booking[];
    onBookingClick: (booking: Booking) => void;
}

// Copy email to clipboard function
const copyEmailToClipboard = async (email: string) => {
    try {
        await navigator.clipboard.writeText(email);
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

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({
    isOpen,
    onClose,
    timeSlot,
    tourType,
    date,
    bookings,
    onBookingClick
}) => {
    const totalParticipants = bookings.reduce((sum, booking) => sum + (booking.total_participants || 0), 0);
    const assignedBookings = bookings.filter(booking => booking.assigned_guide_id);
    const unassignedBookings = bookings.filter(booking => !booking.assigned_guide_id);

    // Check if all bookings are assigned and have phone numbers
    const allBookingsAssigned = unassignedBookings.length === 0 && bookings.length > 0;
    const bookingsWithPhone = bookings.filter(booking => booking.customer_phone);
    const canSendWhatsApp = allBookingsAssigned && bookingsWithPhone.length > 0;

    const handleSendWhatsAppMessages = () => {
        // TODO: Implement WhatsApp messaging functionality
        console.log('Send WhatsApp messages to:', bookingsWithPhone.map(b => ({
            name: b.customer_name,
            phone: b.customer_phone
        })));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${formatTourType(tourType)} - ${timeSlot}`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <ClockIcon className="h-6 w-6 text-gray-400" />
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {timeSlot} • {formatTourType(tourType)}
                                </p>
                            </div>
                        </div>
                        <Badge variant={getTourTypeBadgeVariant(tourType)}>
                            {formatTourType(tourType)}
                        </Badge>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{bookings.length}</div>
                            <div className="text-sm text-gray-500">Bookings</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{totalParticipants}</div>
                            <div className="text-sm text-gray-500">Total Guests</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{unassignedBookings.length}</div>
                            <div className="text-sm text-gray-500">Unassigned</div>
                        </div>
                    </div>
                </div>

                {/* Assigned Guide Info */}
                {assignedBookings.length > 0 && assignedBookings[0].assigned_guide && (
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <UserIcon className="h-6 w-6 text-green-600" />
                            <div>
                                <h4 className="text-md font-medium text-green-900">Assigned Guide</h4>
                                <p className="text-sm text-green-700">
                                    {assignedBookings[0].assigned_guide.first_name} {assignedBookings[0].assigned_guide.last_name}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bookings List */}
                <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                        Bookings ({bookings.length})
                    </h4>
                    <div className="space-y-3">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                onClick={() => onBookingClick(booking)}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-indigo-800">
                                                    {booking.customer_name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-medium text-gray-900">
                                                    {booking.customer_name}
                                                </h5>
                                                <p className="text-xs text-gray-500">
                                                    Booking #{booking.id}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600 truncate flex-1">
                                                    {booking.customer_email}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyEmailToClipboard(booking.customer_email);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title="Copy email"
                                                >
                                                    <ClipboardDocumentIcon className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {booking.customer_phone && (
                                                <div className="flex items-center space-x-2">
                                                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600">
                                                        {booking.customer_phone}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-2">
                                                <UsersIcon className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">
                                                    {booking.total_participants} guests ({booking.adults}A {booking.children}C {booking.infants}I)
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Badge variant={getStatusBadgeVariant(booking.status)} size="sm">
                                                    {booking.status}
                                                </Badge>
                                                <Badge variant={(booking.external_source || 'website') === 'bokun' ? 'warning' : 'primary'} size="sm">
                                                    {(booking.external_source || 'website') === 'bokun' ? 'Bokun' : 'Website'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-4 flex flex-col items-end space-y-2">
                                        {booking.assigned_guide ? (
                                            <div className="text-xs text-green-600 font-medium flex items-center">
                                                <UserIcon className="h-3 w-3 mr-1" />
                                                Assigned
                                            </div>
                                        ) : (
                                            <div className="text-xs text-orange-600 font-medium flex items-center">
                                                <ClockIcon className="h-3 w-3 mr-1" />
                                                Unassigned
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* WhatsApp Message Section */}
                {canSendWhatsApp && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
                                <div>
                                    <h4 className="text-sm font-medium text-green-900">
                                        Ready to Send WhatsApp Messages
                                    </h4>
                                    <p className="text-xs text-green-700">
                                        All bookings are assigned. Send tour details to {bookingsWithPhone.length} customer{bookingsWithPhone.length !== 1 ? 's' : ''} with phone numbers.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleSendWhatsAppMessages}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                                Send WhatsApp Messages
                            </Button>
                        </div>
                    </div>
                )}

                {/* Info message when not all conditions are met */}
                {!canSendWhatsApp && bookings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-600" />
                            <div>
                                <h4 className="text-sm font-medium text-yellow-900">
                                    WhatsApp Messages Not Available
                                </h4>
                                <div className="text-xs text-yellow-700 mt-1">
                                    {unassignedBookings.length > 0 && (
                                        <p>• {unassignedBookings.length} booking{unassignedBookings.length !== 1 ? 's' : ''} still unassigned</p>
                                    )}
                                    {bookingsWithPhone.length === 0 && (
                                        <p>• No customers have phone numbers</p>
                                    )}
                                    {bookingsWithPhone.length > 0 && bookingsWithPhone.length < bookings.length && (
                                        <p>• {bookings.length - bookingsWithPhone.length} customer{bookings.length - bookingsWithPhone.length !== 1 ? 's' : ''} missing phone numbers</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TimeSlotModal;