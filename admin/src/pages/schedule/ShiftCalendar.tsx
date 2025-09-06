import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { ShiftService } from '../../services/shiftService';
import { EmployeeService } from '../../services/employeeService';
import { EmployeeShift, TourType, ShiftStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import ShiftForm from '../../pages/schedule/ShiftForm';
import ShiftDetailsModal from '../../pages/schedule/ShiftDetailsModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const ShiftCalendar: React.FC = () => {
    const { hasPermission } = useAdminAuth();
    const queryClient = useQueryClient();

    // State for calendar and modals
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Filters
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [selectedTourType, setSelectedTourType] = useState<TourType | ''>('');
    const [selectedStatus, setSelectedStatus] = useState<ShiftStatus | ''>('');

    // Calendar date range
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Build filters for shifts query
    const filters = useMemo(() => ({
        dateRange: { start: monthStart, end: monthEnd },
        employeeId: selectedEmployee || undefined,
        tourType: selectedTourType ? [selectedTourType] : undefined,
        status: selectedStatus ? [selectedStatus] : undefined
    }), [monthStart, monthEnd, selectedEmployee, selectedTourType, selectedStatus]);

    // Queries
    const {
        data: shifts = [],
        isLoading: shiftsLoading,
        error: shiftsError,
        refetch: refetchShifts
    } = useQuery({
        queryKey: ['shifts', filters],
        queryFn: () => ShiftService.getShifts(filters),
        refetchInterval: 30000,
    });

    const {
        data: employees = []
    } = useQuery({
        queryKey: ['employees', { role: ['tour_guide'], status: ['active'] }],
        queryFn: () => EmployeeService.getEmployees({ role: ['tour_guide'], status: ['active'] }),
    });

    // Mutations
    const deleteShiftMutation = useMutation({
        mutationFn: (id: string) => ShiftService.deleteShift(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ShiftStatus }) =>
            ShiftService.updateShiftStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts'] });
        },
    });

    // Group shifts by date and time
    const shiftsByDate = useMemo(() => {
        const grouped: Record<string, EmployeeShift[]> = {};
        shifts.forEach(shift => {
            const dateKey = shift.shift_date;
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(shift);
        });
        return grouped;
    }, [shifts]);

    const handlePreviousMonth = () => {
        setCurrentDate(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => addMonths(prev, 1));
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setShowCreateModal(true);
    };

    const handleShiftClick = (shift: EmployeeShift) => {
        setSelectedShift(shift);
        setShowDetailsModal(true);
    };

    const handleFormSuccess = () => {
        setShowCreateModal(false);
        setSelectedDate(null);
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
    };

    const handleDeleteShift = (shift: EmployeeShift) => {
        if (window.confirm(`Are you sure you want to delete this shift for ${shift.employee.first_name} ${shift.employee.last_name}?`)) {
            deleteShiftMutation.mutate(shift.id);
        }
    };

    const handleStatusChange = (shift: EmployeeShift, newStatus: ShiftStatus) => {
        updateStatusMutation.mutate({ id: shift.id, status: newStatus });
    };

    const getTourTypeColor = (tourType: TourType) => {
        const colors: Record<string, string> = {
            'NIGHT_TOUR': 'bg-purple-100 text-purple-800 border-purple-200',
            'MORNING_TOUR': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'UJI_TOUR': 'bg-green-100 text-green-800 border-green-200',
            'UJI_WALKING_TOUR': 'bg-cyan-100 text-cyan-800 border-cyan-200',
            'GION_TOUR': 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return colors[tourType] || 'bg-gray-100 text-gray-800 border-gray-200';
    };



    if (shiftsError) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600">Error loading shifts: {shiftsError.message}</div>
                <Button onClick={() => refetchShifts()} className="mt-4">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shift Calendar</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage employee shifts and availability
                    </p>
                </div>
                {hasPermission('manage_employees') && (
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Shift
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Employee
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                        >
                            <option value="">All Employees</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.first_name} {employee.last_name} ({employee.employee_code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tour Type
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedTourType}
                            onChange={(e) => setSelectedTourType(e.target.value as TourType | '')}
                        >
                            <option value="">All Tours</option>
                            <option value="NIGHT_TOUR">Night Tour</option>
                            <option value="MORNING_TOUR">Morning Tour</option>
                            <option value="UJI_TOUR">Uji Tour</option>
                            <option value="GION_TOUR">Gion Tour</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as ShiftStatus | '')}
                        >
                            <option value="">All Statuses</option>
                            <option value="available">Available</option>
                            <option value="assigned">Assigned</option>
                            <option value="unavailable">Unavailable</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSelectedEmployee('');
                                setSelectedTourType('');
                                setSelectedStatus('');
                            }}
                            className="w-full"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Calendar Navigation */}
            <div className="bg-white rounded-lg shadow">
                <div className="flex items-center justify-between p-4 border-b">
                    <Button
                        variant="ghost"
                        onClick={handlePreviousMonth}
                        className="flex items-center"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </Button>

                    <h2 className="text-lg font-semibold text-gray-900">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>

                    <Button
                        variant="ghost"
                        onClick={handleNextMonth}
                        className="flex items-center"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="p-4">
                    {shiftsLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading shifts...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-1">
                            {/* Day headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                                    {day}
                                </div>
                            ))}

                            {/* Calendar days */}
                            {calendarDays.map((day) => {
                                const dayShifts = shiftsByDate[format(day, 'yyyy-MM-dd')] || [];
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`min-h-[120px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50 border-blue-200' : ''
                                            }`}
                                        onClick={() => handleDateClick(day)}
                                    >
                                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'
                                            }`}>
                                            {format(day, 'd')}
                                        </div>

                                        <div className="space-y-1">
                                            {(() => {
                                                // Group shifts by employee
                                                const shiftsByEmployee: Record<string, EmployeeShift[]> = {};
                                                dayShifts.forEach(shift => {
                                                    const employeeKey = `${shift.employee.first_name} ${shift.employee.last_name}`;
                                                    if (!shiftsByEmployee[employeeKey]) {
                                                        shiftsByEmployee[employeeKey] = [];
                                                    }
                                                    shiftsByEmployee[employeeKey].push(shift);
                                                });

                                                const displayItems: any[] = [];
                                                Object.entries(shiftsByEmployee).forEach(([employeeName, shifts]) => {
                                                    if (shifts.length >= 3) {
                                                        // Show simplified "Available All Day" for employees with 3+ shifts
                                                        const hasAssigned = shifts.some(s => s.status === 'assigned');
                                                        displayItems.push({
                                                            type: 'summary',
                                                            employeeName,
                                                            shifts,
                                                            hasAssigned,
                                                            count: shifts.length
                                                        });
                                                    } else {
                                                        // Show individual shifts for employees with fewer shifts
                                                        shifts.forEach(shift => {
                                                            displayItems.push({
                                                                type: 'individual',
                                                                shift
                                                            });
                                                        });
                                                    }
                                                });

                                                // Limit display to prevent overflow
                                                const visibleItems = displayItems.slice(0, 4);
                                                const remainingCount = displayItems.length - visibleItems.length;

                                                return (
                                                    <>
                                                        {visibleItems.map((item, index) => {
                                                            if (item.type === 'summary') {
                                                                return (
                                                                    <div
                                                                        key={`summary-${index}`}
                                                                        className={`text-xs px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 ${item.hasAssigned ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // Click on first shift to open details
                                                                            handleShiftClick(item.shifts[0]);
                                                                        }}
                                                                    >
                                                                        <div className="truncate">
                                                                            {item.employeeName}
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="truncate">
                                                                                Available All Day
                                                                            </span>
                                                                            <Badge variant={item.hasAssigned ? 'success' : 'default'} size="sm">
                                                                                {item.count}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div
                                                                        key={item.shift.id}
                                                                        className={`text-xs px-1 py-0.5 rounded border cursor-pointer hover:opacity-80 ${getTourTypeColor(item.shift.tour_type)}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleShiftClick(item.shift);
                                                                        }}
                                                                    >
                                                                        <div className="truncate">
                                                                            {item.shift.employee.first_name} {item.shift.employee.last_name[0]}.
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="truncate">
                                                                                {item.shift.time_slot}
                                                                            </span>
                                                                            <Badge variant={getStatusBadgeVariant(item.shift.status)} size="sm">
                                                                                {item.shift.status[0].toUpperCase()}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        })}
                                                        {remainingCount > 0 && (
                                                            <div className="text-xs text-gray-500 text-center">
                                                                +{remainingCount} more
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Create New Shift"
                    size="lg"
                >
                    <ShiftForm
                        preselectedDate={selectedDate}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowCreateModal(false)}
                    />
                </Modal>
            )}

            {showDetailsModal && selectedShift && (
                <ShiftDetailsModal
                    shift={selectedShift}
                    isOpen={showDetailsModal}
                    onClose={() => setShowDetailsModal(false)}
                    onDelete={() => handleDeleteShift(selectedShift)}
                    onStatusChange={(status) => handleStatusChange(selectedShift, status)}
                />
            )}
        </div>
    );
};

export default ShiftCalendar; 