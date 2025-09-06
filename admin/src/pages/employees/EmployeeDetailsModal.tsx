import React from 'react';
import { Employee, TourType } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { PencilIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface EmployeeDetailsModalProps {
    employee: Employee;
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
    employee,
    isOpen,
    onClose,
    onEdit
}) => {
    const { hasPermission } = useAdminAuth();

    const getRoleDisplay = (role: string) => {
        const roleMap = {
            admin: 'Administrator',
            manager: 'Manager',
            tour_guide: 'Tour Guide',
            support: 'Support Staff'
        };
        return roleMap[role as keyof typeof roleMap] || role;
    };

    const getStatusDisplay = (status: string) => {
        const statusMap = {
            active: 'Active',
            inactive: 'Inactive',
            suspended: 'Suspended',
            terminated: 'Terminated'
        };
        return statusMap[status as keyof typeof statusMap] || status;
    };

    const getTourTypeDisplay = (tourTypes: TourType[]) => {
        const tourTypeMap: Record<string, string> = {
            'NIGHT_TOUR': 'Night Tour',
            'MORNING_TOUR': 'Morning Tour',
            'UJI_TOUR': 'Uji Tour',
            'UJI_WALKING_TOUR': 'Uji Walking Tour',
            'GION_TOUR': 'Gion Tour'
        };
        return tourTypes.map(type => tourTypeMap[type] || type).join(', ');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Employee Details"
            size="lg"
        >
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xl font-medium text-indigo-800">
                                {employee.first_name?.[0]}{employee.last_name?.[0]}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {employee.first_name} {employee.last_name}
                            </h2>
                            <p className="text-gray-600">{getRoleDisplay(employee.role)}</p>
                            <Badge variant={getStatusBadgeVariant(employee.status)} className="mt-1">
                                {getStatusDisplay(employee.status)}
                            </Badge>
                        </div>
                    </div>
                    {hasPermission('manage_employees') && (
                        <Button
                            onClick={onEdit}
                            variant="ghost"
                            className="flex items-center"
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    )}
                </div>

                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <IdentificationIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Employee Code</p>
                                <p className="text-sm text-gray-900">{employee.employee_code}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Hire Date</p>
                                <p className="text-sm text-gray-900">
                                    {format(new Date(employee.hire_date), 'MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <a
                                    href={`mailto:${employee.email}`}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
                                    {employee.email}
                                </a>
                            </div>
                        </div>

                        {employee.phone && (
                            <div className="flex items-center space-x-2">
                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Phone</p>
                                    <a
                                        href={`tel:${employee.phone}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-700"
                                    >
                                        {employee.phone}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tour Types */}
                {employee.tour_types && employee.tour_types.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tours</h3>
                        <p className="text-sm text-gray-600 mb-3">Tours this guide can lead</p>
                        <div className="flex flex-wrap gap-2">
                            {employee.tour_types.map((tourType) => (
                                <span
                                    key={tourType}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                    {getTourTypeDisplay([tourType])}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {employee.certifications && employee.certifications.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Certifications</h3>
                        <div className="space-y-2">
                            {employee.certifications.map((certification, index) => (
                                <div
                                    key={index}
                                    className="flex items-center p-2 bg-white rounded border"
                                >
                                    <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                                    <span className="text-sm text-gray-900">{certification}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Emergency Contact */}
                {employee.emergency_contact && (
                    Object.keys(employee.emergency_contact).length > 0 && (
                        Object.values(employee.emergency_contact).some(value => value && value.toString().trim() !== '')
                    )
                ) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {employee.emergency_contact.name && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Name</p>
                                        <p className="text-sm text-gray-900">{employee.emergency_contact.name}</p>
                                    </div>
                                )}

                                {employee.emergency_contact.relationship && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Relationship</p>
                                        <p className="text-sm text-gray-900">{employee.emergency_contact.relationship}</p>
                                    </div>
                                )}

                                {employee.emergency_contact.phone && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Phone</p>
                                        <a
                                            href={`tel:${employee.emergency_contact.phone}`}
                                            className="text-sm text-indigo-600 hover:text-indigo-700"
                                        >
                                            {employee.emergency_contact.phone}
                                        </a>
                                    </div>
                                )}

                                {employee.emergency_contact.email && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <a
                                            href={`mailto:${employee.emergency_contact.email}`}
                                            className="text-sm text-indigo-600 hover:text-indigo-700"
                                        >
                                            {employee.emergency_contact.email}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                {/* Account Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Account Status</p>
                            <Badge variant={getStatusBadgeVariant(employee.status)}>
                                {getStatusDisplay(employee.status)}
                            </Badge>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Auth User Linked</p>
                            <div className="flex items-center space-x-2">
                                <div className={`h-2 w-2 rounded-full ${employee.user_id ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-sm text-gray-900">
                                    {employee.user_id ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Created</p>
                            <p className="text-sm text-gray-900">
                                {format(new Date(employee.created_at), 'MMMM d, yyyy')}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Last Updated</p>
                            <p className="text-sm text-gray-900">
                                {format(new Date(employee.updated_at), 'MMMM d, yyyy')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                    {hasPermission('manage_employees') && (
                        <Button onClick={onEdit}>
                            Edit Employee
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EmployeeDetailsModal; 