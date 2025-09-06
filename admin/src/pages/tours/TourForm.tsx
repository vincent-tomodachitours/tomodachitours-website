import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { TourService } from '../../services/tourService';
import { Tour, TourType, TimeSlot } from '../../types';
import { Button } from '../../components/ui/Button';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getMeetingPointLocation } from '../../utils/tourUtils';

interface TourFormData {
    type: TourType;
    name: string;
    description: string;
    duration_minutes: number;
    price_jpy: number;
    time_slots: TimeSlot[];
    meeting_point: string;
    meeting_point_lat?: number;
    meeting_point_lng?: number;
    max_participants: number;
    min_participants: number;
    included_items: string[];
    excluded_items: string[];
    requirements: string[];
    cancellation_policy: string;
    images: string[];
    status: 'active' | 'inactive' | 'draft';
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
}

interface TourFormProps {
    tour?: Tour;
    onSuccess: () => void;
    onCancel: () => void;
}

const TourForm: React.FC<TourFormProps> = ({ tour, onSuccess, onCancel }) => {
    const isEditing = !!tour;

    // Debug: Log the tour data to see what we're getting from the database
    React.useEffect(() => {
        if (tour) {
            console.log('Tour data received:', tour);
            console.log('Duration minutes value:', tour.duration_minutes, 'Type:', typeof tour.duration_minutes);
        }
    }, [tour]);

    const [formData, setFormData] = useState<TourFormData>({
        type: tour?.type || 'NIGHT_TOUR',
        name: tour?.name || '',
        description: tour?.description || '',
        duration_minutes: tour?.duration_minutes || 0, // No default - user must specify duration
        price_jpy: tour?.base_price || 0, // Use actual base_price from database
        time_slots: tour?.time_slots || [],
        meeting_point: tour?.meeting_point ? getMeetingPointLocation(tour.meeting_point) : '',
        meeting_point_lat: tour?.meeting_point_lat,
        meeting_point_lng: tour?.meeting_point_lng,
        max_participants: tour?.max_participants ?? 10,
        min_participants: tour?.min_participants ?? 1,
        included_items: tour?.included_items || [],
        excluded_items: tour?.excluded_items || [],
        requirements: tour?.requirements || [],
        cancellation_policy: tour?.cancellation_policy || (tour ? 'Free cancellation up to 24 hours before the tour starts. Cancellations within 24 hours are subject to a 50% charge.' : ''),
        images: tour?.images || [],
        status: tour?.status || 'draft',
        seo_title: tour?.seo_title || '',
        seo_description: tour?.seo_description || '',
        seo_keywords: tour?.seo_keywords || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentTab, setCurrentTab] = useState<'basic' | 'details' | 'seo'>('basic');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [newMaxCapacity, setNewMaxCapacity] = useState(10);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: TourFormData) => TourService.createTour(data),
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.error('Error creating tour:', error);
            setErrors({ general: 'Failed to create tour. Please try again.' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<TourFormData>) => {
            // Update core tour fields including time slots and price
            const updateData = {
                name: data.name,
                description: data.description,
                duration_minutes: data.duration_minutes,
                price_jpy: data.price_jpy,
                min_participants: data.min_participants,
                max_participants: data.max_participants,
                time_slots: data.time_slots
            };
            console.log('updateMutation called with:', { tourId: tour!.id, data: updateData });
            console.log('🕐 Time slots being updated:', data.time_slots);
            console.log('💰 Price being updated:', data.price_jpy);
            return TourService.updateTour(tour!.id, updateData);
        },
        onSuccess: (result) => {
            console.log('Update successful:', result);
            onSuccess();
        },
        onError: (error) => {
            console.error('Error updating tour:', error);
            setErrors({ general: `Failed to update tour: ${error.message || 'Unknown error'}` });
        }
    });

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        console.log('🔍 Validating form with data:', {
            name: formData.name,
            description: formData.description,
            duration_minutes: formData.duration_minutes,
            time_slots_count: formData.time_slots.length,
            time_slots: formData.time_slots,
            meeting_point: formData.meeting_point,
            min_participants: formData.min_participants,
            max_participants: formData.max_participants
        });

        if (!formData.name.trim()) {
            newErrors.name = 'Tour name is required';
            console.log('❌ Validation failed: Name is empty');
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
            console.log('❌ Validation failed: Description is empty');
        }

        if (formData.duration_minutes <= 0) {
            newErrors.duration_minutes = 'Duration must be greater than 0';
            console.log('❌ Validation failed: Duration is', formData.duration_minutes);
        }

        // Only require time slots for new tours, not for editing existing ones
        if (!isEditing && formData.time_slots.length === 0) {
            newErrors.time_slots = 'At least one time slot is required';
            console.log('❌ Validation failed: No time slots provided for new tour');
        }

        if (!formData.meeting_point.trim()) {
            newErrors.meeting_point = 'Meeting point is required';
            console.log('❌ Validation failed: Meeting point is empty');
        }

        if (formData.max_participants <= 0) {
            newErrors.max_participants = 'Max participants must be greater than 0';
            console.log('❌ Validation failed: Max participants is', formData.max_participants);
        }

        if (formData.min_participants <= 0) {
            newErrors.min_participants = 'Min participants must be greater than 0';
            console.log('❌ Validation failed: Min participants is', formData.min_participants);
        }

        if (formData.min_participants > formData.max_participants) {
            newErrors.min_participants = 'Min participants cannot exceed max participants';
            console.log('❌ Validation failed: Min participants exceeds max participants');
        }

        if (formData.price_jpy <= 0) {
            newErrors.price_jpy = 'Price must be greater than 0';
            console.log('❌ Validation failed: Price is', formData.price_jpy);
        }

        console.log('🔍 Validation errors found:', newErrors);
        console.log('🔍 Number of errors:', Object.keys(newErrors).length);

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        console.log('📝 Form submitted', { isEditing, tour: tour?.id, formData });
        console.log('🕐 Duration in form data (minutes):', formData.duration_minutes);
        console.log('🕐 Duration in form data (hours):', formData.duration_minutes / 60);

        if (!validateForm()) {
            console.log('❌ Form validation failed', errors);
            return;
        }

        console.log('✅ Form validation passed, calling mutation...');

        if (isEditing) {
            console.log('🔄 Updating tour with ID:', tour?.id);
            console.log('📦 Data being sent to update:', formData);
            updateMutation.mutate(formData);
        } else {
            console.log('➕ Creating new tour');
            createMutation.mutate(formData);
        }
    };

    const handleInputChange = (field: keyof TourFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleArrayInputChange = (field: 'included_items' | 'excluded_items' | 'requirements', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        handleInputChange(field, newArray);
    };

    const addArrayItem = (field: 'included_items' | 'excluded_items' | 'requirements') => {
        handleInputChange(field, [...formData[field], '']);
    };

    const removeArrayItem = (field: 'included_items' | 'excluded_items' | 'requirements', index: number) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        handleInputChange(field, newArray);
    };

    const addTimeSlot = () => {
        if (!newStartTime.trim() || !newEndTime.trim()) {
            setErrors(prev => ({ ...prev, newTimeSlot: 'Please enter both start and end times' }));
            return;
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
            setErrors(prev => ({ ...prev, newTimeSlot: 'Please enter valid time format (HH:MM)' }));
            return;
        }

        // Validate that end time is after start time
        const startMinutes = timeToMinutes(newStartTime);
        const endMinutes = timeToMinutes(newEndTime);
        if (endMinutes <= startMinutes) {
            setErrors(prev => ({ ...prev, newTimeSlot: 'End time must be after start time' }));
            return;
        }

        // Check if time slot already exists
        const timeSlotExists = formData.time_slots.some(slot =>
            slot.start_time === newStartTime && slot.end_time === newEndTime
        );
        if (timeSlotExists) {
            setErrors(prev => ({ ...prev, newTimeSlot: 'This time slot already exists' }));
            return;
        }

        // Create new time slot object
        const newTimeSlot: TimeSlot = {
            start_time: newStartTime,
            end_time: newEndTime,
            is_active: true,
            max_capacity: newMaxCapacity
        };

        // Add and sort the time slots by start time
        const updatedTimeSlots = [...formData.time_slots, newTimeSlot]
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

        setFormData(prev => ({
            ...prev,
            time_slots: updatedTimeSlots
        }));

        setNewStartTime('');
        setNewEndTime('');
        setNewMaxCapacity(10);
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.newTimeSlot;
            return newErrors;
        });
    };

    const removeTimeSlot = (index: number) => {
        setFormData(prev => ({
            ...prev,
            time_slots: prev.time_slots.filter((_, i) => i !== index)
        }));
    };

    const toggleTimeSlotActive = (index: number) => {
        setFormData(prev => ({
            ...prev,
            time_slots: prev.time_slots.map((slot, i) =>
                i === index ? { ...slot, is_active: !slot.is_active } : slot
            )
        }));
    };

    const updateTimeSlotCapacity = (index: number, capacity: number) => {
        setFormData(prev => ({
            ...prev,
            time_slots: prev.time_slots.map((slot, i) =>
                i === index ? { ...slot, max_capacity: capacity } : slot
            )
        }));
    };

    // Helper function to convert time string to minutes for comparison
    const timeToMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Helper function to format time slot for display
    const formatTimeSlot = (slot: TimeSlot): string => {
        return `${slot.start_time} - ${slot.end_time}`;
    };

    const handleNewTimeSlotKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTimeSlot();
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    const tabs = [
        { id: 'basic', name: 'Basic Info', icon: '📝' },
        { id: 'details', name: 'Details', icon: '📋' },
        { id: 'seo', name: 'SEO', icon: '🔍' }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{errors.general}</div>
                </div>
            )}

            {Object.keys(errors).length > 0 && (
                <div className="rounded-md bg-yellow-50 p-4">
                    <div className="text-sm text-yellow-700">
                        <strong>Please fix the following errors:</strong>
                        <ul className="mt-2 list-disc list-inside">
                            {Object.entries(errors).map(([field, message]) => (
                                <li key={field}>{message}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setCurrentTab(tab.id as any)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${currentTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon} {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Basic Info Tab */}
            {currentTab === 'basic' && (
                <div className="space-y-6">
                    {/* Tour Name and Status Row */}
                    <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Tour Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="e.g., Kyoto Night Food Tour"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="col-span-1">
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Status *
                            </label>
                            <select
                                id="status"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive' | 'draft')}
                            >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Full Description *
                        </label>
                        <textarea
                            id="description"
                            rows={6}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.description ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Detailed tour description..."
                            required
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700">
                                Duration (hours) *
                            </label>
                            <input
                                type="number"
                                id="duration_hours"
                                min="0.5"
                                step="0.5"
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.duration_minutes ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                value={formData.duration_minutes / 60} // Convert minutes to hours for display
                                onChange={(e) => {
                                    const hours = parseFloat(e.target.value) || 0;
                                    const minutes = hours * 60;
                                    console.log('🕐 Duration changed:', { hours, minutes });
                                    handleInputChange('duration_minutes', minutes);
                                }} // Convert hours to minutes for storage
                                required
                            />
                            {errors.duration_minutes && (
                                <p className="mt-1 text-sm text-red-600">{errors.duration_minutes}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="price_jpy" className="block text-sm font-medium text-gray-700">
                                Price (JPY) *
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">¥</span>
                                </div>
                                <input
                                    type="number"
                                    id="price_jpy"
                                    min="1"
                                    step="1"
                                    className={`block w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.price_jpy ? 'border-red-300' : 'border-gray-300'
                                        } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                    value={formData.price_jpy}
                                    onChange={(e) => handleInputChange('price_jpy', parseInt(e.target.value) || 0)}
                                    placeholder="5000"
                                    required
                                />
                            </div>
                            {errors.price_jpy && (
                                <p className="mt-1 text-sm text-red-600">{errors.price_jpy}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="min_participants" className="block text-sm font-medium text-gray-700">
                                Min Participants *
                            </label>
                            <input
                                type="number"
                                id="min_participants"
                                min="1"
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.min_participants ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                value={formData.min_participants}
                                onChange={(e) => handleInputChange('min_participants', parseInt(e.target.value))}
                                required
                            />
                            {errors.min_participants && (
                                <p className="mt-1 text-sm text-red-600">{errors.min_participants}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700">
                                Max Participants *
                            </label>
                            <input
                                type="number"
                                id="max_participants"
                                min="1"
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.max_participants ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                value={formData.max_participants}
                                onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value))}
                                required
                            />
                            {errors.max_participants && (
                                <p className="mt-1 text-sm text-red-600">{errors.max_participants}</p>
                            )}
                        </div>
                    </div>

                    {/* Available Times */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Available Times *
                        </label>

                        {/* Add new time slot */}
                        <div className="mb-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.newTimeSlot ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Add new time (e.g., 10:00, 14:30)"
                                    value={newStartTime}
                                    onChange={(e) => setNewStartTime(e.target.value)}
                                    onKeyPress={handleNewTimeSlotKeyPress}
                                />
                                <input
                                    type="text"
                                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.newTimeSlot ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Add new time (e.g., 10:00, 14:30)"
                                    value={newEndTime}
                                    onChange={(e) => setNewEndTime(e.target.value)}
                                    onKeyPress={handleNewTimeSlotKeyPress}
                                />
                                <input
                                    type="number"
                                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.newTimeSlot ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Max Capacity"
                                    value={newMaxCapacity}
                                    onChange={(e) => setNewMaxCapacity(parseInt(e.target.value))}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTimeSlot();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={addTimeSlot}
                                    className="flex items-center"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Time
                                </Button>
                            </div>
                            {errors.newTimeSlot && (
                                <p className="mt-1 text-sm text-red-600">{errors.newTimeSlot}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Enter times in 24-hour format (HH:MM). End time must be after start time.
                            </p>
                        </div>

                        {/* Display existing time slots */}
                        {formData.time_slots.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Time Slots:</h4>
                                <div className="space-y-2">
                                    {formData.time_slots.map((slot, index) => (
                                        <div key={index} className={`flex items-center justify-between px-3 py-2 rounded-md border ${slot.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                            }`}>
                                            <div className="flex-1">
                                                <span className="text-sm text-gray-900 font-medium">{formatTimeSlot(slot)}</span>
                                                <div className="text-xs text-gray-500">
                                                    Capacity: {slot.max_capacity} • {slot.is_active ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500">Cap:</span>
                                                <input
                                                    type="number"
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={slot.max_capacity}
                                                    onChange={(e) => updateTimeSlotCapacity(index, parseInt(e.target.value) || 1)}
                                                    min="1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleTimeSlotActive(index)}
                                                    className={`${slot.is_active
                                                        ? 'text-green-600 hover:text-green-800 hover:bg-green-100'
                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title={slot.is_active ? 'Deactivate time slot' : 'Activate time slot'}
                                                >
                                                    {slot.is_active ? '✓' : '○'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeTimeSlot(index)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                    title="Remove time slot"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.time_slots.length === 0 && (
                            <p className="mt-2 text-sm text-red-600">Please add at least one time slot</p>
                        )}
                    </div>
                </div>
            )}

            {/* Details Tab */}
            {currentTab === 'details' && (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="meeting_point" className="block text-sm font-medium text-gray-700">
                            Meeting Point *
                        </label>
                        <input
                            type="text"
                            id="meeting_point"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.meeting_point ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.meeting_point}
                            onChange={(e) => handleInputChange('meeting_point', e.target.value)}
                            placeholder="e.g., JR Kyoto Station Central Exit"
                            required
                        />
                        {errors.meeting_point && (
                            <p className="mt-1 text-sm text-red-600">{errors.meeting_point}</p>
                        )}
                    </div>

                    {/* Included Items */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            What's Included
                        </label>
                        <div className="space-y-2">
                            {formData.included_items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={item}
                                        onChange={(e) => handleArrayInputChange('included_items', index, e.target.value)}
                                        placeholder="e.g., Professional guide"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeArrayItem('included_items', index)}
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addArrayItem('included_items')}
                                className="flex items-center"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </div>

                    {/* Excluded Items */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            What's Not Included
                        </label>
                        <div className="space-y-2">
                            {formData.excluded_items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={item}
                                        onChange={(e) => handleArrayInputChange('excluded_items', index, e.target.value)}
                                        placeholder="e.g., Personal expenses"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeArrayItem('excluded_items', index)}
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addArrayItem('excluded_items')}
                                className="flex items-center"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Requirements & Recommendations
                        </label>
                        <div className="space-y-2">
                            {formData.requirements.map((requirement, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={requirement}
                                        onChange={(e) => handleArrayInputChange('requirements', index, e.target.value)}
                                        placeholder="e.g., Comfortable walking shoes"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeArrayItem('requirements', index)}
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addArrayItem('requirements')}
                                className="flex items-center"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Requirement
                            </Button>
                        </div>
                    </div>


                </div>
            )}

            {/* SEO Tab */}
            {currentTab === 'seo' && (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700">
                            SEO Title
                        </label>
                        <input
                            type="text"
                            id="seo_title"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.seo_title}
                            onChange={(e) => handleInputChange('seo_title', e.target.value)}
                            placeholder="SEO optimized title..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {(formData.seo_title || '').length}/60 characters
                        </p>
                    </div>

                    <div>
                        <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700">
                            SEO Description
                        </label>
                        <textarea
                            id="seo_description"
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.seo_description}
                            onChange={(e) => handleInputChange('seo_description', e.target.value)}
                            placeholder="Meta description for search engines..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {(formData.seo_description || '').length}/160 characters
                        </p>
                    </div>

                    <div>
                        <label htmlFor="seo_keywords" className="block text-sm font-medium text-gray-700">
                            SEO Keywords
                        </label>
                        <input
                            type="text"
                            id="seo_keywords"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.seo_keywords}
                            onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                            placeholder="keyword1, keyword2, keyword3..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Separate keywords with commas
                        </p>
                    </div>
                </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    loading={isLoading}
                    disabled={isLoading}
                >
                    {isEditing ? 'Update Tour' : 'Create Tour'}
                </Button>
            </div>
        </form>
    );
};

export default TourForm; 