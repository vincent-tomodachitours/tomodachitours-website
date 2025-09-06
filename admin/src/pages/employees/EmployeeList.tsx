import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { EmployeeService } from '../../services/employeeService';
import { Employee, EmployeeRole, EmployeeStatus } from '../../types';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import EmployeeForm from './EmployeeForm';
import EmployeeDetailsModal from './EmployeeDetailsModal';
import { format } from 'date-fns';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const EmployeeList: React.FC = () => {
    const { hasPermission } = useAdminAuth();
    const queryClient = useQueryClient();

    // State for filters and UI
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

    // Filter state
    const [selectedRoles, setSelectedRoles] = useState<EmployeeRole[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<EmployeeStatus[]>(['active']);

    // Build filters object
    const filters = useMemo(() => ({
        role: selectedRoles.length > 0 ? selectedRoles : undefined,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        searchQuery: searchQuery.trim() || undefined
    }), [selectedRoles, selectedStatuses, searchQuery]);

    // Query for employees
    const {
        data: employees = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['employees', filters],
        queryFn: () => EmployeeService.getEmployees(filters),
        refetchInterval: 30000, // Refetch every 30 seconds
    });



    // Mutation for deleting employee
    const deleteEmployeeMutation = useMutation({
        mutationFn: (id: string) => EmployeeService.deleteEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });

    const handleViewDetails = (employee: Employee) => {
        setSelectedEmployee(employee);
        setShowDetailsModal(true);
    };

    const handleEditEmployee = (employee: Employee) => {
        setEmployeeToEdit(employee);
        setShowEditModal(true);
    };



    const handleDeleteEmployee = (employee: Employee) => {
        if (window.confirm(`Are you sure you want to terminate ${employee.first_name} ${employee.last_name}? This action cannot be undone.`)) {
            deleteEmployeeMutation.mutate(employee.id);
        }
    };

    const handleFormSuccess = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setEmployeeToEdit(null);
        queryClient.invalidateQueries({ queryKey: ['employees'] });
    };

    const roleOptions: EmployeeRole[] = ['admin', 'manager', 'tour_guide', 'support'];
    const statusOptions: EmployeeStatus[] = ['active', 'inactive', 'suspended', 'terminated'];

    const getRoleDisplay = (role: EmployeeRole) => {
        const roleMap = {
            admin: 'Admin',
            manager: 'Manager',
            tour_guide: 'Tour Guide',
            support: 'Support'
        };
        return roleMap[role];
    };

    const getStatusDisplay = (status: EmployeeStatus) => {
        const statusMap = {
            active: 'Active',
            inactive: 'Inactive',
            suspended: 'Suspended',
            terminated: 'Terminated'
        };
        return statusMap[status];
    };

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600">Error loading employees: {error.message}</div>
                <Button onClick={() => refetch()} className="mt-4">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage tour guides, admins, and support staff
                    </p>
                </div>
                {hasPermission('manage_employees') && (
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Employee
                    </Button>
                )}
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees by name, email, or code..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filter Toggle */}
                    <Button
                        variant="ghost"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center"
                    >
                        <FunnelIcon className="h-5 w-5 mr-2" />
                        Filters
                        {(selectedRoles.length > 0 || selectedStatuses.length !== 1) && (
                            <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                                {selectedRoles.length + (selectedStatuses.length !== 1 ? 1 : 0)}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Role Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Roles
                                </label>
                                <div className="space-y-2">
                                    {roleOptions.map((role) => (
                                        <label key={role} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={selectedRoles.includes(role)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedRoles([...selectedRoles, role]);
                                                    } else {
                                                        setSelectedRoles(selectedRoles.filter(r => r !== role));
                                                    }
                                                }}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                {getRoleDisplay(role)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <div className="space-y-2">
                                    {statusOptions.map((status) => (
                                        <label key={status} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={selectedStatuses.includes(status)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedStatuses([...selectedStatuses, status]);
                                                    } else {
                                                        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                                    }
                                                }}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                {getStatusDisplay(status)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedRoles([]);
                                    setSelectedStatuses(['active']);
                                    setSearchQuery('');
                                }}
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Employee List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading employees...</p>
                    </div>
                ) : employees.length === 0 ? (
                    <div className="p-8 text-center">
                        <UserPlusIcon className="h-12 w-12 text-gray-400 mx-auto" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchQuery || selectedRoles.length > 0 || selectedStatuses.length !== 1
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first employee'
                            }
                        </p>
                        {hasPermission('manage_employees') && !searchQuery && selectedRoles.length === 0 && selectedStatuses.length === 1 && (
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4"
                            >
                                Add Employee
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hire Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    {hasPermission('manage_employees') && (
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-indigo-800">
                                                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {employee.first_name} {employee.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {employee.employee_code}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {getRoleDisplay(employee.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={getStatusBadgeVariant(employee.status)}>
                                                {getStatusDisplay(employee.status)}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(employee.hire_date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{employee.email}</div>
                                            {employee.phone && (
                                                <div className="text-sm text-gray-500">{employee.phone}</div>
                                            )}
                                        </td>
                                        {hasPermission('manage_employees') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(employee)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditEmployee(employee)}
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    {employee.status !== 'terminated' && (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteEmployee(employee)}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Add New Employee"
                    size="lg"
                >
                    <EmployeeForm
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowCreateModal(false)}
                    />
                </Modal>
            )}

            {showEditModal && employeeToEdit && (
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Edit Employee"
                    size="lg"
                >
                    <EmployeeForm
                        employee={employeeToEdit}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowEditModal(false)}
                    />
                </Modal>
            )}

            {showDetailsModal && selectedEmployee && (
                <EmployeeDetailsModal
                    employee={selectedEmployee}
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    onEdit={() => {
                        setShowDetailsModal(false);
                        handleEditEmployee(selectedEmployee);
                    }}
                />
            )}
        </div>
    );
};

export default EmployeeList; 