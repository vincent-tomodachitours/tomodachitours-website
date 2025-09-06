import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ShiftService } from '../../services/shiftService';
import { EmployeeService } from '../../services/employeeService';
import { EmployeeShift, ShiftFormData, TourType } from '../../types';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

interface ShiftFormProps {
    shift?: EmployeeShift;
    preselectedDate?: Date | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ shift, preselectedDate, onSuccess, onCancel }) => {
    const isEditing = !!shift;

    // Form state
    const [formData, setFormData] = useState<ShiftFormData>({
        employee_id: shift?.employee_id || '',
        tour_type: shift?.tour_type || 'NIGHT_TOUR',
        shift_date: shift?.shift_date || (preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : ''),
        time_slot: shift?.time_slot || '09:00',
        max_participants: shift?.max_participants || undefined,
        notes: shift?.notes || ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [conflicts, setConflicts] = useState<EmployeeShift[]>([]);
    const [showBulkCreate, setShowBulkCreate] = useState(false);
    const [bulkDates, setBulkDates] = useState<string[]>([]);

    // Available time slots
    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
    ];

    // Query for active tour guides
    const {
        data: employees = [],
        isLoading: employeesLoading
    } = useQuery({
        queryKey: ['employees', { role: ['tour_guide'], status: ['active'] }],
        queryFn: () => EmployeeService.getEmployees({ role: ['tour_guide'], status: ['active'] }),
    });

    // Check for conflicts when form data changes
    useEffect(() => {
        const checkConflicts = async () => {
            if (formData.employee_id && formData.shift_date && formData.time_slot) {
                try {
                    const conflictingShifts = await ShiftService.checkConflicts(
                        formData.employee_id,
                        formData.shift_date,
                        formData.time_slot,
                        isEditing ? shift.id : undefined
                    );
                    setConflicts(conflictingShifts);
                } catch (error) {
                    console.error('Error checking conflicts:', error);
                }
            }
        };

        const timeoutId = setTimeout(checkConflicts, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.employee_id, formData.shift_date, formData.time_slot, isEditing, shift?.id]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: ShiftFormData) => ShiftService.createShift(data),
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.error('Error creating shift:', error);
            setErrors({ general: 'Failed to create shift. Please try again.' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<ShiftFormData>) =>
            ShiftService.updateShift(shift!.id, data),
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.error('Error updating shift:', error);
            setErrors({ general: 'Failed to update shift. Please try again.' });
        }
    });

    const bulkCreateMutation = useMutation({
        mutationFn: () => ShiftService.createBulkShifts(
            formData.employee_id,
            formData.tour_type,
            formData.time_slot,
            bulkDates,
            formData.max_participants,
            formData.notes
        ),
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.error('Error creating bulk shifts:', error);
            setErrors({ general: 'Failed to create shifts. Please try again.' });
        }
    });

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.employee_id) {
            newErrors.employee_id = 'Employee is required';
        }

        if (!formData.shift_date) {
            newErrors.shift_date = 'Date is required';
        }

        if (!formData.time_slot) {
            newErrors.time_slot = 'Time slot is required';
        }

        if (formData.max_participants && formData.max_participants < 1) {
            newErrors.max_participants = 'Maximum participants must be at least 1';
        }

        if (conflicts.length > 0) {
            newErrors.conflicts = 'This employee already has a shift at this time';
        }

        if (showBulkCreate && bulkDates.length === 0) {
            newErrors.bulk_dates = 'Please select at least one date for bulk creation';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (showBulkCreate) {
            bulkCreateMutation.mutate();
        } else if (isEditing) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleInputChange = (field: keyof ShiftFormData, value: any) => {
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



    const generateDateRange = (startDate: string, endDate: string) => {
        const dates: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(format(date, 'yyyy-MM-dd'));
        }

        setBulkDates(dates);
    };

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

    const isLoading = createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{errors.general}</div>
                </div>
            )}

            {/* Bulk Create Toggle */}
            {!isEditing && (
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="bulk_create"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={showBulkCreate}
                        onChange={(e) => setShowBulkCreate(e.target.checked)}
                    />
                    <label htmlFor="bulk_create" className="text-sm font-medium text-gray-700">
                        Create shifts for multiple dates
                    </label>
                </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Shift Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                            Employee *
                        </label>
                        <select
                            id="employee_id"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.employee_id ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.employee_id}
                            onChange={(e) => handleInputChange('employee_id', e.target.value)}
                            disabled={employeesLoading}
                            required
                        >
                            <option value="">Select an employee</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.first_name} {employee.last_name} ({employee.employee_code})
                                </option>
                            ))}
                        </select>
                        {errors.employee_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="tour_type" className="block text-sm font-medium text-gray-700">
                            Tour Type *
                        </label>
                        <select
                            id="tour_type"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.tour_type}
                            onChange={(e) => handleInputChange('tour_type', e.target.value as TourType)}
                            required
                        >
                            <option value="NIGHT_TOUR">Night Tour</option>
                            <option value="MORNING_TOUR">Morning Tour</option>
                            <option value="UJI_TOUR">Uji Tour</option>
                            <option value="GION_TOUR">Gion Tour</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!showBulkCreate ? (
                        <div>
                            <label htmlFor="shift_date" className="block text-sm font-medium text-gray-700">
                                Date *
                            </label>
                            <input
                                type="date"
                                id="shift_date"
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.shift_date ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                value={formData.shift_date}
                                onChange={(e) => handleInputChange('shift_date', e.target.value)}
                                required
                            />
                            {errors.shift_date && (
                                <p className="mt-1 text-sm text-red-600">{errors.shift_date}</p>
                            )}
                        </div>
                    ) : (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bulk Date Selection *
                            </label>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const endInput = e.target.parentElement?.parentElement?.querySelector('input[type="date"]:last-child') as HTMLInputElement;
                                                    if (endInput && endInput.value) {
                                                        generateDateRange(e.target.value, endInput.value);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const startInput = e.target.parentElement?.parentElement?.querySelector('input[type="date"]:first-child') as HTMLInputElement;
                                                    if (startInput && startInput.value) {
                                                        generateDateRange(startInput.value, e.target.value);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {bulkDates.length > 0 && (
                                    <div className="text-sm text-gray-600">
                                        Selected {bulkDates.length} dates: {bulkDates.slice(0, 3).join(', ')}
                                        {bulkDates.length > 3 && ` and ${bulkDates.length - 3} more...`}
                                    </div>
                                )}
                            </div>
                            {errors.bulk_dates && (
                                <p className="mt-1 text-sm text-red-600">{errors.bulk_dates}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="time_slot" className="block text-sm font-medium text-gray-700">
                            Time Slot *
                        </label>
                        <select
                            id="time_slot"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.time_slot ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.time_slot}
                            onChange={(e) => handleInputChange('time_slot', e.target.value)}
                            required
                        >
                            {timeSlots.map((slot) => (
                                <option key={slot} value={slot}>
                                    {slot}
                                </option>
                            ))}
                        </select>
                        {errors.time_slot && (
                            <p className="mt-1 text-sm text-red-600">{errors.time_slot}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700">
                            Maximum Participants
                        </label>
                        <input
                            type="number"
                            id="max_participants"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.max_participants ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.max_participants || ''}
                            onChange={(e) => handleInputChange('max_participants', e.target.value ? parseInt(e.target.value) : undefined)}
                            min="1"
                            placeholder="e.g., 10"
                        />
                        {errors.max_participants && (
                            <p className="mt-1 text-sm text-red-600">{errors.max_participants}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Any additional notes or instructions..."
                    />
                </div>
            </div>

            {/* Conflict Warning */}
            {conflicts.length > 0 && (
                <div className="rounded-md bg-yellow-50 p-4">
                    <div className="text-sm text-yellow-700">
                        <strong>⚠️ Scheduling Conflict Detected:</strong>
                        <ul className="mt-2 list-disc list-inside">
                            {conflicts.map((conflict) => (
                                <li key={conflict.id}>
                                    {getTourTypeDisplay(conflict.tour_type)} at {conflict.time_slot} on {conflict.shift_date}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {errors.conflicts && (
                        <p className="mt-1 text-sm text-red-600">{errors.conflicts}</p>
                    )}
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
                    disabled={isLoading || conflicts.length > 0}
                >
                    {showBulkCreate
                        ? `Create ${bulkDates.length} Shifts`
                        : isEditing
                            ? 'Update Shift'
                            : 'Create Shift'
                    }
                </Button>
            </div>
        </form>
    );
};

export default ShiftForm; 