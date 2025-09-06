import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingService } from '../../services/bookingService';
import { Badge, formatTourType, getTourTypeBadgeVariant } from '../ui/Badge';
import { Button } from '../ui/Button';
import { UserIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Booking, Employee, EmployeeShift, TourType } from '../../types';

interface GuideAssignmentSectionProps {
    booking: Booking;
    onUpdate: () => void;
}

export const GuideAssignmentSection: React.FC<GuideAssignmentSectionProps> = ({
    booking,
    onUpdate
}) => {
    const queryClient = useQueryClient();
    const [selectedGuide, setSelectedGuide] = useState<string>(booking.assigned_guide_id || '');
    const [guideNotes, setGuideNotes] = useState(booking.guide_notes || '');
    const [showAllGuides, setShowAllGuides] = useState(false);

    // Fetch available guides for this specific booking
    const { data: availableGuides = [], isLoading: availableLoading } = useQuery({
        queryKey: ['availableGuides', booking.tour_type, booking.booking_date, booking.booking_time],
        queryFn: () => BookingService.getAvailableGuides(
            booking.tour_type,
            booking.booking_date,
            booking.booking_time
        ),
    });

    // Fetch all qualified guides for this tour type (for manual assignment)
    const { data: allQualifiedGuides = [], isLoading: qualifiedLoading } = useQuery({
        queryKey: ['qualifiedGuides', booking.tour_type, booking.booking_date, booking.booking_time],
        queryFn: () => BookingService.getQualifiedGuides(booking.tour_type, booking.booking_date, booking.booking_time),
        enabled: showAllGuides,
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
        updateNotesMutation.isPending;

    // Helper to render guide option
    const renderGuideOption = (guide: Employee | EmployeeShift['employee'], isFromShift: boolean = false) => {
        const isQualified = guide.tour_types?.includes(booking.tour_type as TourType) || isFromShift;

        return (
            <option key={guide.id} value={guide.id}>
                {guide.first_name} {guide.last_name} ({guide.employee_code})
                {isFromShift ? ' - Scheduled & Available' : ' - Qualified & Available'}
                {!isQualified ? ' - Not Qualified' : ''}
            </option>
        );
    };

    // Note: We handle guide display logic directly in the render section below

    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <UserIcon className="h-4 w-4 mr-2" />
                Guide Assignment
                <Badge variant={getTourTypeBadgeVariant(booking.tour_type)} className="ml-2">
                    {formatTourType(booking.tour_type)}
                </Badge>
            </h4>

            {booking.assigned_guide ? (
                <div className="space-y-3">
                    <div className="bg-white p-3 rounded-md border">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Currently Assigned</p>
                                <p className="font-medium">
                                    {booking.assigned_guide.first_name} {booking.assigned_guide.last_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {booking.assigned_guide.employee_code} • {booking.assigned_guide.email}
                                </p>

                                {/* Show guide's tour capabilities */}
                                {booking.assigned_guide.tour_types && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Can lead:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {booking.assigned_guide.tour_types.map((tourType: TourType) => (
                                                <Badge
                                                    key={tourType}
                                                    variant={tourType === booking.tour_type ? 'success' : 'default'}
                                                    size="sm"
                                                >
                                                    {formatTourType(tourType)}
                                                    {tourType === booking.tour_type && (
                                                        <CheckCircleIcon className="h-3 w-3 ml-1" />
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleRemoveGuide}
                                loading={removeGuideMutation.isPending}
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Guide Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Select Qualified Guide
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllGuides(!showAllGuides)}
                                    loading={qualifiedLoading}
                                >
                                    {showAllGuides ? 'Show Scheduled Only' : 'Show All Available'}
                                </Button>
                            </div>
                        </div>

                        <select
                            value={selectedGuide}
                            onChange={(e) => setSelectedGuide(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isLoading || availableLoading}
                        >
                            <option value="">Select a guide...</option>

                            {/* Preferred guides (with shifts) */}
                            {availableGuides.length > 0 && (
                                <optgroup label="🕐 Scheduled & Available">
                                    {availableGuides.map((shift) =>
                                        renderGuideOption(shift.employee!, true)
                                    )}
                                </optgroup>
                            )}

                            {/* All available guides (if showing all) */}
                            {showAllGuides && allQualifiedGuides.length > 0 && (
                                <optgroup label="✅ Available (Other Time Slots)">
                                    {allQualifiedGuides
                                        .filter(guide => !availableGuides.some(shift => shift.employee_id === guide.id))
                                        .map(guide => renderGuideOption(guide))
                                    }
                                </optgroup>
                            )}
                        </select>

                        {availableGuides.length === 0 && !showAllGuides && (
                            <p className="mt-1 text-sm text-amber-600">
                                No guides have posted availability for this exact time. Click "Show All Available" to see guides available on this date.
                            </p>
                        )}

                        {availableGuides.length === 0 && showAllGuides && allQualifiedGuides.length === 0 && (
                            <p className="mt-1 text-sm text-red-600">
                                No guides have posted any availability for this date. Guides must mark themselves as available before they can be assigned.
                            </p>
                        )}
                    </div>

                    {/* Selected Guide Info */}
                    {selectedGuide && (
                        <div className="bg-blue-50 p-3 rounded-md">
                            {(() => {
                                const selectedGuideData =
                                    availableGuides.find(shift => shift.employee_id === selectedGuide)?.employee ||
                                    allQualifiedGuides.find(guide => guide.id === selectedGuide);

                                if (!selectedGuideData) return null;

                                return (
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            {selectedGuideData.first_name} {selectedGuideData.last_name}
                                        </p>
                                        <p className="text-sm text-blue-700">
                                            {selectedGuideData.employee_code} • {selectedGuideData.email}
                                        </p>
                                        {selectedGuideData.tour_types && (
                                            <div className="mt-2">
                                                <p className="text-xs text-blue-600 mb-1">Tour capabilities:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedGuideData.tour_types.map((tourType: TourType) => (
                                                        <Badge
                                                            key={tourType}
                                                            variant={tourType === booking.tour_type ? 'success' : 'default'}
                                                            size="sm"
                                                        >
                                                            {formatTourType(tourType)}
                                                            {tourType === booking.tour_type && (
                                                                <CheckCircleIcon className="h-3 w-3 ml-1" />
                                                            )}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
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
                    className="mt-3 w-full"
                >
                    Assign Guide
                </Button>
            )}
        </div>
    );
}; 