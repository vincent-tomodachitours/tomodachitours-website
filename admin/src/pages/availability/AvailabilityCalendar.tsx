import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { AvailabilityService } from '../../services/availabilityService';
import { TourService } from '../../services/tourService';
import { EmployeeShift, TourType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge, getTourTypeBadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AvailabilityCalendar: React.FC = () => {
    const { employee } = useAdminAuth();
    const queryClient = useQueryClient();

    // State for calendar
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
    const [selectedTourType, setSelectedTourType] = useState<TourType>('NIGHT_TOUR');
    const [editingAvailability, setEditingAvailability] = useState<EmployeeShift[]>([]);
    const [isAllDaySelected, setIsAllDaySelected] = useState(false);

    // Calendar date range - show full weeks
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Fetch tours to get dynamic time slots
    const { data: tours = [] } = useQuery({
        queryKey: ['tours'],
        queryFn: () => TourService.getTours(),
        refetchInterval: 300000, // Refresh every 5 minutes
    });

    // Generate dynamic time slots from tours
    const tourTypeTimeSlots: Record<TourType, string[]> = useMemo(() => {
        const timeSlotsByType: Record<TourType, Set<string>> = {
            'NIGHT_TOUR': new Set(),
            'MORNING_TOUR': new Set(),
            'UJI_TOUR': new Set(),
            'UJI_WALKING_TOUR': new Set(),
            'GION_TOUR': new Set()
        };

        tours.forEach(tour => {
            if (tour.time_slots && tour.time_slots.length > 0) {
                tour.time_slots.forEach(slot => {
                    if (slot.is_active) {
                        timeSlotsByType[tour.type].add(slot.start_time);
                    }
                });
            }
        });

        // Convert sets to sorted arrays
        const result: Record<TourType, string[]> = {
            'NIGHT_TOUR': Array.from(timeSlotsByType['NIGHT_TOUR']).sort(),
            'MORNING_TOUR': Array.from(timeSlotsByType['MORNING_TOUR']).sort(),
            'UJI_TOUR': Array.from(timeSlotsByType['UJI_TOUR']).sort(),
            'UJI_WALKING_TOUR': Array.from(timeSlotsByType['UJI_WALKING_TOUR']).sort(),
            'GION_TOUR': Array.from(timeSlotsByType['GION_TOUR']).sort()
        };

        return result;
    }, [tours]);

    // Get available time slots for selected tour type
    const availableTimeSlots = useMemo(() => {
        return tourTypeTimeSlots[selectedTourType] || [];
    }, [tourTypeTimeSlots, selectedTourType]);

    // Tour types
    const tourTypes: { value: TourType; label: string; color: string }[] = [
        { value: 'NIGHT_TOUR', label: 'Night Tour', color: 'bg-purple-100 text-purple-800' },
        { value: 'MORNING_TOUR', label: 'Morning Tour', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'UJI_TOUR', label: 'Uji Tour', color: 'bg-green-100 text-green-800' },
        { value: 'GION_TOUR', label: 'Gion Tour', color: 'bg-blue-100 text-blue-800' }
    ];

    // Fetch my availability
    const {
        data: availability = [],
        isLoading,
        error
    } = useQuery({
        queryKey: ['my-availability', employee?.id, currentDate.getFullYear(), currentDate.getMonth()],
        queryFn: () => AvailabilityService.getMyAvailability(
            employee!.id,
            format(calendarStart, 'yyyy-MM-dd'),
            format(calendarEnd, 'yyyy-MM-dd')
        ),
        enabled: !!employee,
        refetchInterval: 30000
    });

    // Group availability by date
    const availabilityByDate = useMemo(() => {
        const grouped: Record<string, EmployeeShift[]> = {};
        availability.forEach((shift: EmployeeShift) => {
            const dateKey = shift.shift_date;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(shift);
        });
        return grouped;
    }, [availability]);

    // Helper function to determine if a day has "full availability"
    const getDayAvailabilityDisplay = (dayAvailability: EmployeeShift[]) => {
        if (dayAvailability.length === 0) return [];

        // Get all possible time slots across all tour types
        const allPossibleSlots = Object.values(tourTypeTimeSlots).flat();
        const uniqueAllSlots = Array.from(new Set(allPossibleSlots));

        // Check if this day has availability for most/all time slots
        const availableSlots = dayAvailability.map(shift => shift.time_slot);
        const uniqueAvailableSlots = Array.from(new Set(availableSlots));

        // If they have availability for 75% or more of all possible slots, show as "Available all day"
        const coveragePercentage = uniqueAvailableSlots.length / uniqueAllSlots.length;

        if (coveragePercentage >= 0.75) {
            // Return a summary view
            const hasAssignedShifts = dayAvailability.some(shift => shift.status === 'assigned');
            return [{
                type: 'summary',
                label: 'Available',
                isAssigned: hasAssignedShifts,
                count: dayAvailability.length
            }];
        }

        // Group by tour type for cleaner display
        const byTourType: { [key in TourType]?: EmployeeShift[] } = {};
        dayAvailability.forEach(shift => {
            if (!byTourType[shift.tour_type]) {
                byTourType[shift.tour_type] = [];
            }
            byTourType[shift.tour_type]!.push(shift);
        });

        // For each tour type, if they have many slots, summarize
        const displayItems: any[] = [];
        Object.entries(byTourType).forEach(([tourType, shifts]) => {
            const tourSlots = tourTypeTimeSlots[tourType as TourType] || [];
            const tourCoverage = shifts.length / tourSlots.length;

            if (tourCoverage >= 0.75) {
                // Summarize this tour type
                const hasAssigned = shifts.some(shift => shift.status === 'assigned');
                displayItems.push({
                    type: 'tour-summary',
                    tourType: tourType as TourType,
                    label: getTourTypeLabel(tourType as TourType),
                    isAssigned: hasAssigned,
                    count: shifts.length
                });
            } else {
                // Show individual time slots for this tour type
                shifts.forEach(shift => {
                    displayItems.push({
                        type: 'individual',
                        shift: shift
                    });
                });
            }
        });

        return displayItems;
    };

    // Mutations
    const addAvailabilityMutation = useMutation({
        mutationFn: (data: { date: string; timeSlots: string[]; tourType: TourType }) =>
            AvailabilityService.bulkAddAvailability(employee!.id, [data.date], data.timeSlots, [data.tourType]),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-availability'] });
            setShowAddModal(false);
            setSelectedDate(null);
            setSelectedTimeSlots([]);
            setIsAllDaySelected(false);
        },
    });

    const removeAvailabilityMutation = useMutation({
        mutationFn: (shiftId: string) => AvailabilityService.removeAvailability(shiftId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-availability'] });
        },
    });

    const handlePreviousMonth = () => {
        setCurrentDate(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => addMonths(prev, 1));
    };

    const handleDateClick = (date: Date) => {
        // Only allow adding availability for future dates
        if (date < new Date()) {
            return;
        }
        setSelectedDate(date);
        setSelectedTimeSlots([]);
        setIsAllDaySelected(false);
        setShowAddModal(true);
    };

    const handleTourTypeChange = (tourType: TourType) => {
        setSelectedTourType(tourType);
        setSelectedTimeSlots([]); // Reset time slots when tour type changes
        setIsAllDaySelected(false); // Reset all day selection
    };

    const handleTimeSlotToggle = (timeSlot: string) => {
        setIsAllDaySelected(false); // Uncheck all day when individual slots are selected
        setSelectedTimeSlots(prev => {
            if (prev.includes(timeSlot)) {
                return prev.filter(slot => slot !== timeSlot);
            } else {
                return [...prev, timeSlot];
            }
        });
    };

    const handleAllTimeSlotsToggle = () => {
        setIsAllDaySelected(false); // Uncheck all day when all time slots are selected
        if (selectedTimeSlots.length === availableTimeSlots.length) {
            setSelectedTimeSlots([]);
        } else {
            setSelectedTimeSlots([...availableTimeSlots]);
        }
    };

    const handleAllDayToggle = () => {
        if (isAllDaySelected) {
            setIsAllDaySelected(false);
            setSelectedTimeSlots([]);
        } else {
            setIsAllDaySelected(true);
            // Get all time slots from all tour types
            const allTimeSlots = Object.values(tourTypeTimeSlots).flat();
            const uniqueTimeSlots = Array.from(new Set(allTimeSlots)).sort();
            setSelectedTimeSlots(uniqueTimeSlots);
        }
    };



    const handleAddAvailability = () => {
        if (!selectedDate || !employee || selectedTimeSlots.length === 0) return;

        const dateString = format(selectedDate, 'yyyy-MM-dd');

        if (isAllDaySelected) {
            // For "Available all day", add each time slot with its correct tour type
            const availabilityPromises: Promise<any>[] = [];

            Object.entries(tourTypeTimeSlots).forEach(([tourType, slots]) => {
                slots.forEach(timeSlot => {
                    if (selectedTimeSlots.includes(timeSlot)) {
                        availabilityPromises.push(
                            AvailabilityService.addAvailability(
                                employee.id,
                                dateString,
                                timeSlot,
                                tourType as TourType
                            )
                        );
                    }
                });
            });

            // Execute all availability additions
            Promise.all(availabilityPromises)
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['my-availability'] });
                    setShowAddModal(false);
                    setSelectedDate(null);
                    setSelectedTimeSlots([]);
                    setIsAllDaySelected(false);
                })
                .catch((error) => {
                    console.error('Error adding availability:', error);
                });
        } else {
            // For specific tour type, use the bulk add function
            addAvailabilityMutation.mutate({
                date: dateString,
                timeSlots: selectedTimeSlots,
                tourType: selectedTourType
            });
        }
    };

    const handleRemoveAvailability = (shift: EmployeeShift) => {
        removeAvailabilityMutation.mutate(shift.id);
    };

    const handleEditAvailability = (date: Date, dayAvailability: EmployeeShift[]) => {
        setSelectedDate(date);
        setEditingAvailability(dayAvailability);
        setShowEditModal(true);
    };

    const handleRemoveMultipleAvailability = (shifts: EmployeeShift[]) => {
        Promise.all(shifts.map(shift => removeAvailabilityMutation.mutateAsync(shift.id)))
            .then(() => {
                setShowEditModal(false);
                setEditingAvailability([]);
            });
    };

    const getTourTypeColor = (tourType: TourType) => {
        return tourTypes.find(t => t.value === tourType)?.color || 'bg-gray-100 text-gray-800';
    };

    const getTourTypeLabel = (tourType: TourType) => {
        return tourTypes.find(t => t.value === tourType)?.label || tourType;
    };

    const isAllTimeSlotsSelected = selectedTimeSlots.length === availableTimeSlots.length && availableTimeSlots.length > 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error loading availability. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Availability</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Set your availability for tour guide shifts
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePreviousMonth}
                        className="p-2"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNextMonth}
                        className="p-2"
                    >
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tour Types</h3>
                <div className="flex flex-wrap gap-2">
                    {tourTypes.map(tourType => (
                        <Badge
                            key={tourType.value}
                            variant="default"
                            className={tourType.color}
                        >
                            {tourType.label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="px-3 py-2 text-center text-sm font-medium text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                    {calendarDays.map(date => {
                        const dateKey = format(date, 'yyyy-MM-dd');
                        const dayAvailability = availabilityByDate[dateKey] || [];
                        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                        const isToday = isSameDay(date, new Date());
                        const isPast = date < new Date();

                        const displayItems = getDayAvailabilityDisplay(dayAvailability);

                        return (
                            <div
                                key={dateKey}
                                className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                                    } ${isPast ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
                                onClick={() => !isPast && handleDateClick(date)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${isToday ? 'text-blue-600' :
                                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                        {format(date, 'd')}
                                    </span>
                                    {!isPast && (
                                        <PlusIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                                    )}
                                </div>

                                {/* Availability slots */}
                                <div className="space-y-1">
                                    {displayItems.map((item: any, index: number) => {
                                        if (item.type === 'summary') {
                                            return (
                                                <div
                                                    key={index}
                                                    className={`text-xs px-2 py-1 rounded ${item.isAssigned ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} flex items-center justify-between group cursor-pointer hover:opacity-80`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditAvailability(date, dayAvailability);
                                                    }}
                                                >
                                                    <span className="truncate">
                                                        {item.label} ({item.count})
                                                    </span>
                                                    {item.isAssigned && (
                                                        <CheckIcon className="h-3 w-3 text-green-600" />
                                                    )}
                                                </div>
                                            );
                                        } else if (item.type === 'tour-summary') {
                                            return (
                                                <div
                                                    key={index}
                                                    className={`text-xs px-2 py-1 rounded ${getTourTypeColor(item.tourType)} flex items-center justify-between group cursor-pointer hover:opacity-80`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditAvailability(date, dayAvailability);
                                                    }}
                                                >
                                                    <span className="truncate">
                                                        {item.label} ({item.count})
                                                    </span>
                                                    {item.isAssigned && (
                                                        <CheckIcon className="h-3 w-3 text-green-600" />
                                                    )}
                                                </div>
                                            );
                                        } else if (item.type === 'individual') {
                                            return (
                                                <div
                                                    key={item.shift.id}
                                                    className={`text-xs px-2 py-1 rounded ${getTourTypeColor(item.shift.tour_type)} flex items-center justify-between group`}
                                                >
                                                    <span className="truncate">
                                                        {item.shift.time_slot} {getTourTypeLabel(item.shift.tour_type)}
                                                    </span>
                                                    {item.shift.status === 'assigned' && (
                                                        <CheckIcon className="h-3 w-3 text-green-600" />
                                                    )}
                                                    {item.shift.status === 'available' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveAvailability(item.shift);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800"
                                                        >
                                                            <XMarkIcon className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Availability Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setSelectedDate(null);
                    setSelectedTimeSlots([]);
                    setIsAllDaySelected(false);
                }}
                title="Add Availability"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="text"
                            value={selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="all-day"
                                checked={isAllDaySelected}
                                onChange={handleAllDayToggle}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="all-day" className="ml-2 block text-sm text-gray-900 font-medium">
                                Available all day (all tours)
                            </label>
                        </div>
                    </div>

                    {!isAllDaySelected && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tour Type
                            </label>
                            <select
                                value={selectedTourType}
                                onChange={(e) => handleTourTypeChange(e.target.value as TourType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {tourTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!isAllDaySelected && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Time Slots
                            </label>

                            {/* Quick select options */}
                            <div className="mb-4 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="all-time-slots"
                                        checked={isAllTimeSlotsSelected}
                                        onChange={handleAllTimeSlotsToggle}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="all-time-slots" className="ml-2 block text-sm text-gray-900 font-medium">
                                        All time slots for {getTourTypeLabel(selectedTourType)}
                                    </label>
                                </div>
                            </div>

                            {/* Individual time slots */}
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                {availableTimeSlots.map(timeSlot => (
                                    <div key={timeSlot} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`time-${timeSlot}`}
                                            checked={selectedTimeSlots.includes(timeSlot)}
                                            onChange={() => handleTimeSlotToggle(timeSlot)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`time-${timeSlot}`} className="ml-2 block text-sm text-gray-900">
                                            {timeSlot}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowAddModal(false);
                                setSelectedDate(null);
                                setSelectedTimeSlots([]);
                                setIsAllDaySelected(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddAvailability}
                            disabled={addAvailabilityMutation.isPending || selectedTimeSlots.length === 0}
                        >
                            {addAvailabilityMutation.isPending
                                ? 'Adding...'
                                : isAllDaySelected
                                    ? 'Add All Day Availability'
                                    : `Add Availability (${selectedTimeSlots.length})`
                            }
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Availability Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedDate(null);
                    setEditingAvailability([]);
                }}
                title="Edit Availability"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="text"
                            value={selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Current Availability ({editingAvailability.length} entries)
                        </label>

                        {editingAvailability.length === 0 ? (
                            <p className="text-gray-500 text-sm">No availability entries for this date.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {editingAvailability.map((shift) => (
                                    <div
                                        key={shift.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${shift.status === 'assigned'
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-blue-50 border-blue-200'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {shift.time_slot}
                                                </span>
                                                <Badge variant={getTourTypeBadgeVariant(shift.tour_type)}>
                                                    {getTourTypeLabel(shift.tour_type)}
                                                </Badge>
                                                {shift.status === 'assigned' && (
                                                    <Badge variant="success">
                                                        Assigned
                                                    </Badge>
                                                )}
                                            </div>
                                            {shift.notes && (
                                                <p className="text-xs text-gray-600 mt-1">{shift.notes}</p>
                                            )}
                                        </div>
                                        {shift.status === 'available' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveAvailability(shift)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between space-x-3 pt-4">
                        <div>
                            {editingAvailability.some(shift => shift.status === 'available') && (
                                <Button
                                    variant="ghost"
                                    onClick={() => handleRemoveMultipleAvailability(editingAvailability.filter(shift => shift.status === 'available'))}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Remove All Available
                                </Button>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedDate(null);
                                setEditingAvailability([]);
                            }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AvailabilityCalendar; 