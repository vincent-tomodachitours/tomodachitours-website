import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { EmployeeService } from '../../services/employeeService';
import { Employee, EmployeeFormData, EmployeeRole, TourType } from '../../types';
import { Button } from '../../components/ui/Button';

interface EmployeeFormProps {
    employee?: Employee;
    onSuccess: () => void;
    onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSuccess, onCancel }) => {
    const isEditing = !!employee;

    // Form state
    const [formData, setFormData] = useState<EmployeeFormData>({
        employee_code: employee?.employee_code || '',
        first_name: employee?.first_name || '',
        last_name: employee?.last_name || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        role: employee?.role || 'tour_guide',
        hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
        emergency_contact: employee?.emergency_contact || {},
        certifications: employee?.certifications || [],
        tour_types: employee?.tour_types || ['NIGHT_TOUR']
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Emergency contact fields
    const [emergencyContact, setEmergencyContact] = useState({
        name: employee?.emergency_contact?.name || '',
        relationship: employee?.emergency_contact?.relationship || '',
        phone: employee?.emergency_contact?.phone || '',
        email: employee?.emergency_contact?.email || ''
    });

    // Certification input
    const [newCertification, setNewCertification] = useState('');

    // Available tour types
    const availableTourTypes = [
        { code: 'NIGHT_TOUR' as TourType, name: 'Night Tour' },
        { code: 'MORNING_TOUR' as TourType, name: 'Morning Tour' },
        { code: 'UJI_TOUR' as TourType, name: 'Uji Tour' },
        { code: 'GION_TOUR' as TourType, name: 'Gion Tour' }
    ];

    // Update emergency contact in form data when it changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            emergency_contact: emergencyContact
        }));
    }, [emergencyContact]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: EmployeeFormData) => EmployeeService.createEmployee(data),
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.error('Error creating employee:', error);
            setErrors({ general: 'Failed to create employee. Please try again.' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<EmployeeFormData>) =>
            EmployeeService.updateEmployee(employee!.id, data),
        onSuccess: () => {
            onSuccess();
        },
        onError: (error) => {
            console.error('Error updating employee:', error);
            setErrors({ general: 'Failed to update employee. Please try again.' });
        }
    });

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.hire_date) {
            newErrors.hire_date = 'Hire date is required';
        }

        if (formData.phone && !/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (isEditing) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleInputChange = (field: keyof EmployeeFormData, value: any) => {
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

    const handleTourTypeToggle = (tourType: TourType) => {
        setFormData(prev => ({
            ...prev,
            tour_types: prev.tour_types.includes(tourType)
                ? prev.tour_types.filter(type => type !== tourType)
                : [...prev.tour_types, tourType]
        }));
    };

    const handleAddCertification = () => {
        const certifications = formData.certifications || [];
        if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
            setFormData(prev => ({
                ...prev,
                certifications: [...(prev.certifications || []), newCertification.trim()]
            }));
            setNewCertification('');
        }
    };

    const handleRemoveCertification = (certification: string) => {
        setFormData(prev => ({
            ...prev,
            certifications: (prev.certifications || []).filter(cert => cert !== certification)
        }));
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
                <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{errors.general}</div>
                </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="employee_code" className="block text-sm font-medium text-gray-700">
                            Employee Code {!isEditing && <span className="text-gray-500">(auto-generated if empty)</span>}
                        </label>
                        <input
                            type="text"
                            id="employee_code"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.employee_code ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.employee_code}
                            onChange={(e) => handleInputChange('employee_code', e.target.value)}
                            placeholder="e.g., TG001"
                        />
                        {errors.employee_code && (
                            <p className="mt-1 text-sm text-red-600">{errors.employee_code}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role *
                        </label>
                        <select
                            id="role"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={formData.role}
                            onChange={(e) => handleInputChange('role', e.target.value as EmployeeRole)}
                        >
                            <option value="tour_guide">Tour Guide</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                            <option value="support">Support</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                            First Name *
                        </label>
                        <input
                            type="text"
                            id="first_name"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.first_name ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            required
                        />
                        {errors.first_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            id="last_name"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.last_name ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            required
                        />
                        {errors.last_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email *
                        </label>
                        <input
                            type="email"
                            id="email"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.phone ? 'border-red-300' : 'border-gray-300'
                                }`}
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">
                        Hire Date *
                    </label>
                    <input
                        type="date"
                        id="hire_date"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.hire_date ? 'border-red-300' : 'border-gray-300'
                            }`}
                        value={formData.hire_date}
                        onChange={(e) => handleInputChange('hire_date', e.target.value)}
                        required
                    />
                    {errors.hire_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.hire_date}</p>
                    )}
                </div>
            </div>

            {/* Tour Types */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Tours</h3>
                <p className="text-sm text-gray-600">Select which tours this guide can lead</p>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                    {availableTourTypes.map((tourType) => (
                        <label key={tourType.code} className="flex items-center">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={formData.tour_types.includes(tourType.code)}
                                onChange={() => handleTourTypeToggle(tourType.code)}
                            />
                            <span className="ml-2 text-sm text-gray-700">{tourType.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Certifications */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Certifications</h3>

                {(formData.certifications || []).length > 0 && (
                    <div className="space-y-2">
                        {(formData.certifications || []).map((certification, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                <span className="text-sm text-gray-700">{certification}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCertification(certification)}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add certification..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCertification();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleAddCertification}
                        disabled={!newCertification.trim()}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Contact Name
                        </label>
                        <input
                            type="text"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={emergencyContact.name}
                            onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Relationship
                        </label>
                        <input
                            type="text"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={emergencyContact.relationship}
                            onChange={(e) => setEmergencyContact(prev => ({ ...prev, relationship: e.target.value }))}
                            placeholder="e.g., Spouse, Parent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Contact Phone
                        </label>
                        <input
                            type="tel"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={emergencyContact.phone}
                            onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={emergencyContact.email}
                            onChange={(e) => setEmergencyContact(prev => ({ ...prev, email: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

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
                    {isEditing ? 'Update Employee' : 'Create Employee'}
                </Button>
            </div>
        </form>
    );
};

export default EmployeeForm; 