import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmployeeShift, ShiftStatus, TourType } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import {
    PencilIcon,
    TrashIcon,
    UserIcon,
    CalendarIcon,
    ClockIcon,
    MapPinIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { ShiftService } from '../../services/shiftService';

interface ShiftDetailsModalProps {
    shift: EmployeeShift;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onDelete: () => void;
    onStatusChange: (status: ShiftStatus) => void;
}

const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({
    shift,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    onStatusChange
}) => {
    const { hasPermission } = useAdminAuth();
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    // Fetch all shifts for this employee on this date
    const { data: dayShifts = [] } = useQuery({
        queryKey: ['employeeDayShifts', shift.employee_id, shift.shift_date],
        queryFn: () => ShiftService.getShifts({
            employeeId: shift.employee_id,
            dateRange: {
                start: new Date(shift.shift_date),
                end: new Date(shift.shift_date)
            }
        }),
        enabled: isOpen,
    });

    const getTourTypeDisplay = (tourType: TourType) => {
        const names: Record<string, string> = {
            'NIGHT_TOUR': 'Night Tour',
            'MORNING_TOUR': 'Morning Tour',
            'UJI_TOUR': 'Uji Tour',
            'UJI_WALKING_TOUR': 'Uji Walking Tour',
            'GION_TOUR': 'Gion Tour'
        };
        return names[tourType] || tourType;
    };

    const getStatusDisplay = (status: ShiftStatus) => {
        const names = {
            'available': 'Available',
            'assigned': 'Assigned',
            'unavailable': 'Unavailable',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return names[status] || status;
    };

    const getTourTypeColor = (tourType: TourType) => {
        const colors: Record<string, string> = {
            'NIGHT_TOUR': 'text-purple-600',
            'MORNING_TOUR': 'text-yellow-600',
            'UJI_TOUR': 'text-green-600',
            'UJI_WALKING_TOUR': 'text-cyan-600',
            'GION_TOUR': 'text-blue-600'
        };
        return colors[tourType] || 'text-gray-600';
    };

    const statusOptions: { value: ShiftStatus; label: string; color: string }[] = [
        { value: 'available', label: 'Available', color: 'text-green-600' },
        { value: 'assigned', label: 'Assigned', color: 'text-blue-600' },
        { value: 'unavailable', label: 'Unavailable', color: 'text-gray-600' },
        { value: 'completed', label: 'Completed', color: 'text-green-600' },
        { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' }
    ];

    // Calculate comprehensive availability for this day
    const availabilityInfo = useMemo(() => {
        if (!dayShifts.length) return null;

        // Group shifts by tour type and time
        const availableShifts = dayShifts.filter(s => s.status === 'available');
        const tourTypes = ['NIGHT_TOUR', 'MORNING_TOUR', 'UJI_TOUR', 'UJI_WALKING_TOUR', 'GION_TOUR'] as TourType[];

        // Check if available for all major tour types with reasonable coverage
        const tourTypeCoverage = tourTypes.reduce((acc, tourType) => {
            const shiftsForTour = availableShifts.filter(s => s.tour_type === tourType);
            acc[tourType] = shiftsForTour.length;
            return acc;
        }, {} as Record<TourType, number>);

        const totalAvailableSlots = availableShifts.length;
        const hasGoodCoverage = Object.values(tourTypeCoverage).every(count => count >= 3);
        const hasHighVolume = totalAvailableSlots >= 12; // Arbitrary threshold for "all day"

        if (hasGoodCoverage && hasHighVolume) {
            return {
                isAllDay: true,
                totalSlots: totalAvailableSlots,
                tourTypes: Object.keys(tourTypeCoverage).filter(t => tourTypeCoverage[t as TourType] > 0)
            };
        }

        // Group by tour type for detailed display
        const groupedAvailability = tourTypes.reduce((acc, tourType) => {
            const shifts = availableShifts
                .filter(s => s.tour_type === tourType)
                .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

            if (shifts.length > 0) {
                acc[tourType] = shifts.map(s => s.time_slot);
            }
            return acc;
        }, {} as Record<TourType, string[]>);

        return {
            isAllDay: false,
            grouped: groupedAvailability,
            totalSlots: totalAvailableSlots
        };
    }, [dayShifts]);

    const handleStatusChange = (newStatus: ShiftStatus) => {
        if (window.confirm(`Are you sure you want to change the status to ${getStatusDisplay(newStatus)}?`)) {
            onStatusChange(newStatus);
            setShowStatusMenu(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this shift? This action cannot be undone.')) {
            onDelete();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Shift Details"
            size="lg"
        >
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {shift.employee.first_name} {shift.employee.last_name}
                            </h2>
                            <p className="text-gray-600">{shift.employee.employee_code}</p>
                            <Badge variant={getStatusBadgeVariant(shift.status)} className="mt-1">
                                {getStatusDisplay(shift.status)}
                            </Badge>
                        </div>
                    </div>
                    {hasPermission('manage_employees') && (
                        <div className="flex space-x-2">
                            {onEdit && (
                                <Button
                                    onClick={onEdit}
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center"
                                >
                                    <PencilIcon className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                            )}
                            <Button
                                onClick={handleDelete}
                                variant="danger"
                                size="sm"
                                className="flex items-center"
                            >
                                <TrashIcon className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>

                {/* Availability Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Availability for This Day</h3>

                    <div className="flex items-center space-x-3 mb-4">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {format(new Date(shift.shift_date), 'EEEE, MMMM d, yyyy')}
                            </p>
                        </div>
                    </div>

                    {availabilityInfo ? (
                        availabilityInfo.isAllDay ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2">
                                    <ClockIcon className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-800">Available All Day</p>
                                        <p className="text-xs text-green-600">
                                            {availabilityInfo.totalSlots} time slots across all tour types
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(availabilityInfo.grouped || {}).map(([tourType, timeSlots]) => (
                                    <div key={tourType} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                                            <span className={`text-sm font-semibold ${getTourTypeColor(tourType as TourType)}`}>
                                                {getTourTypeDisplay(tourType as TourType)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {timeSlots.map((time) => (
                                                <Badge
                                                    key={`${tourType}-${time}`}
                                                    variant={time === shift.time_slot && tourType === shift.tour_type ? 'primary' : 'default'}
                                                    size="sm"
                                                >
                                                    {time}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="text-xs text-gray-500 mt-2">
                                    Total: {availabilityInfo.totalSlots} time slots available
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-sm text-amber-800">No availability information found for this date.</p>
                        </div>
                    )}

                    {/* Current Selected Shift Highlight */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                                <p className="text-xs font-medium text-gray-600">
                                    Currently viewing: {getTourTypeDisplay(shift.tour_type)} at {shift.time_slot}
                                </p>
                            </div>
                            {shift.max_participants && (
                                <div className="flex items-center space-x-1">
                                    <UsersIcon className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                        Max: {shift.max_participants}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Employee Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <a
                                href={`mailto:${shift.employee.email}`}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                {shift.employee.email}
                            </a>
                        </div>

                        {shift.employee.phone && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <a
                                    href={`tel:${shift.employee.phone}`}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    {shift.employee.phone}
                                </a>
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-medium text-gray-500">Role</p>
                            <p className="text-sm text-gray-900 capitalize">
                                {shift.employee.role.replace('_', ' ')}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <Badge variant={getStatusBadgeVariant(shift.employee.status)}>
                                {shift.employee.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {shift.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{shift.notes}</p>
                    </div>
                )}

                {/* Status Management */}
                {hasPermission('manage_employees') && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Status Management</h3>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">Current Status:</span>
                            <Badge variant={getStatusBadgeVariant(shift.status)}>
                                {getStatusDisplay(shift.status)}
                            </Badge>

                            <div className="relative">
                                <Button
                                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                                    variant="ghost"
                                    size="sm"
                                >
                                    Change Status
                                </Button>

                                {showStatusMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                        <div className="py-1">
                                            {statusOptions
                                                .filter(option => option.value !== shift.status)
                                                .map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleStatusChange(option.value)}
                                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${option.color}`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium text-gray-500">Created</p>
                            <p className="text-gray-900">
                                {format(new Date(shift.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Last Updated</p>
                            <p className="text-gray-900">
                                {format(new Date(shift.updated_at), 'MMM d, yyyy h:mm a')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                    {hasPermission('manage_employees') && onEdit && (
                        <Button onClick={onEdit}>
                            Edit Shift
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ShiftDetailsModal; 