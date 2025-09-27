import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { TimesheetService, TimesheetRealtimeManager } from '../../services/timesheetService';
import { EmployeeService } from '../../services/employeeService';
import { Timesheet, TimesheetFilters } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const ITEMS_PER_PAGE = 20;

const TimesheetTable: React.FC = () => {
    const { hasPermission } = useAdminAuth();
    const queryClient = useQueryClient();
    const subscriptionRef = useRef<any>(null);

    // State for filters and UI
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<keyof Timesheet>('clock_in');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Real-time connection state
    const [connectionState, setConnectionState] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
    const [pendingUpdates, setPendingUpdates] = useState<number>(0);

    // Filter state
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Download state
    const [downloadMonth, setDownloadMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [isDownloading, setIsDownloading] = useState<boolean>(false);

    // Build filters object
    const filters = useMemo((): TimesheetFilters => {
        const filterObj: TimesheetFilters = {};

        if (selectedEmployeeId) {
            filterObj.employeeId = selectedEmployeeId;
        }

        if (selectedStatus !== 'all') {
            filterObj.status = selectedStatus;
        }

        if (startDate && endDate) {
            filterObj.dateRange = {
                start: startOfDay(new Date(startDate)),
                end: endOfDay(new Date(endDate))
            };
        }

        if (searchQuery.trim()) {
            filterObj.searchQuery = searchQuery.trim();
        }

        return filterObj;
    }, [selectedEmployeeId, selectedStatus, startDate, endDate, searchQuery]);

    // Query for timesheets
    const {
        data: timesheets = [],
        isLoading: timesheetsLoading,
        error: timesheetsError,
        refetch: refetchTimesheets
    } = useQuery({
        queryKey: ['timesheets', filters],
        queryFn: () => TimesheetService.getTimesheets(filters),
        staleTime: 30000, // Consider data stale after 30 seconds
        refetchInterval: connectionState === 'connected' ? 60000 : 15000, // Adjust based on connection
        refetchIntervalInBackground: false
    });

    // Handle query success/error states
    useEffect(() => {
        if (timesheets) {
            setLastUpdateTime(new Date());
            setPendingUpdates(0);
        }
    }, [timesheets]);

    useEffect(() => {
        if (timesheetsError) {
            setConnectionState('disconnected');
        }
    }, [timesheetsError]);

    // Query for employees (for filter dropdown)
    const {
        data: employees = [],
        isLoading: employeesLoading
    } = useQuery({
        queryKey: ['employees', { status: ['active'] }],
        queryFn: () => EmployeeService.getEmployees({ status: ['active'] }),
        staleTime: 300000, // Employee data is relatively stable
    });

    // Set up real-time subscription for all timesheets
    const setupRealtimeSubscription = useCallback(() => {
        // Clean up existing subscription
        if (subscriptionRef.current) {
            TimesheetRealtimeManager.unsubscribe('table-all-timesheets');
            subscriptionRef.current = null;
        }

        console.log('Setting up table real-time subscription for all timesheets');

        subscriptionRef.current = TimesheetRealtimeManager.subscribeToAllTimesheets(
            (payload) => {
                console.log('Table timesheet change detected:', payload);

                // Increment pending updates counter
                setPendingUpdates(prev => prev + 1);

                // Invalidate queries to trigger refetch
                queryClient.invalidateQueries({ queryKey: ['timesheets'] });
                queryClient.invalidateQueries({ queryKey: ['timesheetStats'] });

                setLastUpdateTime(new Date());
                setConnectionState('connected');
            },
            'table-all-timesheets'
        );
    }, [queryClient]);

    useEffect(() => {
        setupRealtimeSubscription();

        return () => {
            TimesheetRealtimeManager.unsubscribe('table-all-timesheets');
        };
    }, [setupRealtimeSubscription]);

    // Monitor connection state
    useEffect(() => {
        if (timesheetsError) {
            setConnectionState('disconnected');
        } else if (timesheets.length >= 0) {
            setConnectionState('connected');
        }
    }, [timesheetsError, timesheets]);

    // Sort and paginate timesheets
    const sortedAndPaginatedTimesheets = useMemo(() => {
        let sorted = [...timesheets];

        // Apply sorting
        sorted.sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            // Handle nested employee data for sorting
            if (sortField === 'employee_id' && a.employee && b.employee) {
                aValue = `${a.employee.first_name} ${a.employee.last_name}`;
                bValue = `${b.employee.first_name} ${b.employee.last_name}`;
            }

            // Handle date sorting
            if (sortField === 'clock_in' || sortField === 'clock_out') {
                aValue = aValue ? new Date(aValue).getTime() : 0;
                bValue = bValue ? new Date(bValue).getTime() : 0;
            }

            // Handle numeric sorting
            if (sortField === 'hours_worked') {
                aValue = aValue || 0;
                bValue = bValue || 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Apply pagination
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedData = sorted.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            totalItems: sorted.length,
            totalPages: Math.ceil(sorted.length / ITEMS_PER_PAGE)
        };
    }, [timesheets, sortField, sortDirection, currentPage]);

    const handleSort = (field: keyof Timesheet) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const clearFilters = () => {
        setSelectedEmployeeId('');
        setSelectedStatus('all');
        setStartDate('');
        setEndDate('');
        setSearchQuery('');
        setCurrentPage(1);
    };

    const downloadTimesheetData = async () => {
        if (!downloadMonth) return;

        setIsDownloading(true);
        try {
            const [year, month] = downloadMonth.split('-');
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0);

            // Create filters for the selected month
            const monthFilters: TimesheetFilters = {
                dateRange: {
                    start: startOfMonth,
                    end: endOfMonth
                }
            };

            // Fetch timesheet data for the month
            const monthlyTimesheets = await TimesheetService.getTimesheets(monthFilters);

            // Convert to CSV format
            const csvHeaders = [
                'Employee Name',
                'Employee Code',
                'Date',
                'Clock In',
                'Clock Out',
                'Duration (Hours)',
                'Todo',
                'Notes',
                'Status'
            ];

            const csvRows = monthlyTimesheets.map(timesheet => {
                const clockInDate = parseISO(timesheet.clock_in);
                const clockOutDate = timesheet.clock_out ? parseISO(timesheet.clock_out) : null;
                const duration = clockOutDate
                    ? ((clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)).toFixed(2)
                    : 'Ongoing';

                return [
                    `${timesheet.employee?.first_name || ''} ${timesheet.employee?.last_name || ''}`.trim(),
                    timesheet.employee?.employee_code || '',
                    format(clockInDate, 'yyyy-MM-dd'),
                    format(clockInDate, 'HH:mm'),
                    clockOutDate ? format(clockOutDate, 'HH:mm') : '',
                    duration,
                    timesheet.todo || '',
                    timesheet.note || '',
                    timesheet.clock_out ? 'Completed' : 'Active'
                ];
            });

            // Create CSV content
            const csvContent = [
                csvHeaders.join(','),
                ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `timesheet-${downloadMonth}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to download timesheet data:', error);
            alert('Failed to download timesheet data. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const getStatusBadge = (timesheet: Timesheet) => {
        if (timesheet.clock_out) {
            return (
                <Badge variant="success" className="flex items-center text-xs px-1.5 py-0.5">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Done
                </Badge>
            );
        } else {
            return (
                <Badge variant="warning" className="flex items-center text-xs px-1.5 py-0.5">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    Active
                </Badge>
            );
        }
    };

    const formatDuration = (clockIn: string, clockOut?: string) => {
        if (!clockOut) {
            const now = new Date();
            const start = parseISO(clockIn);
            const diffMs = now.getTime() - start.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m (ongoing)`;
        }

        const start = parseISO(clockIn);
        const end = parseISO(clockOut);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const SortableHeader: React.FC<{ field: keyof Timesheet; children: React.ReactNode }> = ({ field, children }) => (
        <th
            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center">
                {children}
                {sortField === field && (
                    <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </th>
    );

    // Check permissions
    if (!hasPermission('manage_employees')) {
        return (
            <div className="text-center py-12">
                <XCircleIcon className="h-12 w-12 text-red-400 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
                <p className="mt-1 text-sm text-gray-500">
                    You don't have permission to view timesheet management.
                </p>
            </div>
        );
    }

    if (timesheetsError) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600">Error loading timesheets: {timesheetsError.message}</div>
                <Button onClick={() => refetchTimesheets()} className="mt-4">
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
                    <h1 className="text-2xl font-bold text-gray-900">Timesheet Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        View and manage all employee timesheet entries
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    {/* Download Section */}
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-700">Download:</label>
                        <input
                            type="month"
                            value={downloadMonth}
                            onChange={(e) => setDownloadMonth(e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={downloadTimesheetData}
                            disabled={isDownloading || !downloadMonth}
                            className="flex items-center"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            {isDownloading ? 'Downloading...' : 'CSV'}
                        </Button>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-400' :
                            connectionState === 'reconnecting' ? 'bg-yellow-400 animate-pulse' :
                                'bg-red-400'
                            }`} />
                        <span className="text-xs text-gray-500">
                            {connectionState === 'connected' ? 'Live' :
                                connectionState === 'reconnecting' ? 'Reconnecting...' :
                                    'Offline'}
                        </span>
                        {pendingUpdates > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {pendingUpdates} updates
                            </span>
                        )}
                    </div>

                    {/* Manual Refresh */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            refetchTimesheets();
                            setPendingUpdates(0);
                        }}
                        className="flex items-center"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Connection Warning */}
            {connectionState === 'disconnected' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                            <p className="text-sm text-yellow-800">
                                Connection lost. Data may not be up to date.
                            </p>
                            <button
                                onClick={() => {
                                    setupRealtimeSubscription();
                                    refetchTimesheets();
                                }}
                                className="text-xs text-yellow-700 underline hover:text-yellow-900 mt-1"
                            >
                                Retry connection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search in todos and notes..."
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
                        {(selectedEmployeeId || selectedStatus !== 'all' || startDate || endDate) && (
                            <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                                Active
                            </span>
                        )}
                    </Button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Employee Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employee
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    disabled={employeesLoading}
                                >
                                    <option value="">All Employees</option>
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.first_name} {employee.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'completed')}
                                >
                                    <option value="all">All Entries</option>
                                    <option value="active">Active (Clocked In)</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            {/* Start Date Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            <div className="bg-white px-4 py-2 rounded-lg shadow">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Showing {sortedAndPaginatedTimesheets.data.length} of {sortedAndPaginatedTimesheets.totalItems} timesheet entries
                    </p>
                    {connectionState === 'connected' && (
                        <p className="text-xs text-gray-400">
                            Last updated: {lastUpdateTime.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Timesheet Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {timesheetsLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading timesheets...</p>
                    </div>
                ) : sortedAndPaginatedTimesheets.data.length === 0 ? (
                    <div className="p-8 text-center">
                        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No timesheet entries found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {Object.keys(filters).length > 0
                                ? 'Try adjusting your search or filters'
                                : 'No timesheet entries have been recorded yet'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <SortableHeader field="employee_id">Employee</SortableHeader>
                                        <SortableHeader field="clock_in">Clock In</SortableHeader>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Todo
                                        </th>
                                        <SortableHeader field="clock_out">Clock Out</SortableHeader>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Note
                                        </th>
                                        <SortableHeader field="hours_worked">Duration</SortableHeader>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedAndPaginatedTimesheets.data.map((timesheet) => (
                                        <tr key={timesheet.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-6 w-6">
                                                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-xs font-medium text-indigo-800">
                                                                {timesheet.employee?.first_name?.[0]}{timesheet.employee?.last_name?.[0]}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-2">
                                                        <div className="text-xs font-medium text-gray-900">
                                                            {timesheet.employee?.first_name} {timesheet.employee?.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {timesheet.employee?.employee_code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <div className="text-xs text-gray-900">
                                                    {format(parseISO(timesheet.clock_in), 'MMM d')}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {format(parseISO(timesheet.clock_in), 'h:mm a')}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-xs text-gray-900 max-w-xs truncate">
                                                    {timesheet.todo || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                {timesheet.clock_out ? (
                                                    <>
                                                        <div className="text-xs text-gray-900">
                                                            {format(parseISO(timesheet.clock_out), 'MMM d')}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {format(parseISO(timesheet.clock_out), 'h:mm a')}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="text-xs text-gray-900 max-w-xs truncate">
                                                    {timesheet.note || '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <div className="text-xs text-gray-900">
                                                    {formatDuration(timesheet.clock_in, timesheet.clock_out)}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                {getStatusBadge(timesheet)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {sortedAndPaginatedTimesheets.totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === sortedAndPaginatedTimesheets.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing{' '}
                                            <span className="font-medium">
                                                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                            </span>{' '}
                                            to{' '}
                                            <span className="font-medium">
                                                {Math.min(currentPage * ITEMS_PER_PAGE, sortedAndPaginatedTimesheets.totalItems)}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">{sortedAndPaginatedTimesheets.totalItems}</span>{' '}
                                            results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                            >
                                                <ChevronLeftIcon className="h-5 w-5" />
                                            </Button>

                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, sortedAndPaginatedTimesheets.totalPages) }, (_, i) => {
                                                const pageNum = Math.max(1, Math.min(
                                                    sortedAndPaginatedTimesheets.totalPages - 4,
                                                    currentPage - 2
                                                )) + i;

                                                if (pageNum > sortedAndPaginatedTimesheets.totalPages) return null;

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? "primary" : "ghost"}
                                                        size="sm"
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === sortedAndPaginatedTimesheets.totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                            >
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </Button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TimesheetTable;