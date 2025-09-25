import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ClockIcon, CalendarDaysIcon, ChartBarIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { TimesheetService, TimesheetRealtimeManager } from '../../services/timesheetService';
import { ClockInOutWidget } from '../../components/timesheet/ClockInOutWidget';
import { Timesheet } from '../../types';

export const TimesheetDashboard: React.FC = () => {
    const { employee } = useAdminAuth();
    const queryClient = useQueryClient();
    const subscriptionRef = useRef<any>(null);
    const [connectionState, setConnectionState] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
    const [, setLastUpdateTime] = useState<Date>(new Date());
    const [editingTimesheet, setEditingTimesheet] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        clock_in: string;
        clock_out: string;
        todo: string;
        note: string;
    }>({
        clock_in: '',
        clock_out: '',
        todo: '',
        note: ''
    });

    // Get recent timesheet entries
    const { data: recentTimesheets, isLoading: isLoadingRecent, error: recentError } = useQuery({
        queryKey: ['recentTimesheets', employee?.id],
        queryFn: () => employee ? TimesheetService.getRecentTimesheets(employee.id, 10) : [],
        enabled: !!employee?.id,
        staleTime: 30000, // Consider data stale after 30 seconds
        refetchInterval: connectionState === 'connected' ? 120000 : 30000, // Adjust based on connection
        refetchIntervalInBackground: false
    });

    // Get timesheet statistics
    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['timesheetStats'],
        queryFn: () => TimesheetService.getTimesheetStats(),
        staleTime: 60000, // Consider data stale after 1 minute
        refetchInterval: connectionState === 'connected' ? 300000 : 60000, // Adjust based on connection
        refetchIntervalInBackground: false
    });

    // Mutation for updating timesheet entries
    const updateTimesheetMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Timesheet> }) =>
            TimesheetService.updateTimesheet(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recentTimesheets', employee?.id] });
            queryClient.invalidateQueries({ queryKey: ['timesheetStats'] });
            setEditingTimesheet(null);
        },
        onError: (error) => {
            console.error('Failed to update timesheet:', error);
            alert('Failed to update timesheet entry. Please try again.');
        }
    });

    // Handle query success states
    useEffect(() => {
        if (recentTimesheets || stats) {
            setLastUpdateTime(new Date());
        }
    }, [recentTimesheets, stats]);

    // Set up real-time subscriptions for timesheet updates
    const setupRealtimeSubscription = useCallback(() => {
        if (!employee?.id) return;

        // Clean up existing subscription
        if (subscriptionRef.current) {
            TimesheetRealtimeManager.unsubscribe(`dashboard-${employee.id}`);
            subscriptionRef.current = null;
        }

        console.log('Setting up dashboard real-time subscription for employee:', employee.id);

        subscriptionRef.current = TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
            employee.id,
            (payload) => {
                console.log('Dashboard timesheet change detected:', payload);

                // Invalidate and refetch relevant queries
                queryClient.invalidateQueries({ queryKey: ['currentTimesheet', employee.id] });
                queryClient.invalidateQueries({ queryKey: ['recentTimesheets', employee.id] });
                queryClient.invalidateQueries({ queryKey: ['timesheetStats'] });

                setLastUpdateTime(new Date());
                setConnectionState('connected');
            },
            `dashboard-${employee.id}`
        );
    }, [employee?.id, queryClient]);

    useEffect(() => {
        setupRealtimeSubscription();

        return () => {
            if (employee?.id) {
                TimesheetRealtimeManager.unsubscribe(`dashboard-${employee.id}`);
            }
        };
    }, [setupRealtimeSubscription, employee?.id]);

    // Monitor connection state
    useEffect(() => {
        const checkConnection = () => {
            // Simple connectivity check - if queries are failing, assume disconnected
            if (recentError) {
                setConnectionState('disconnected');
            } else {
                setConnectionState('connected');
            }
        };

        checkConnection();
    }, [recentError]);

    // Handle clock in/out status changes
    const handleStatusChange = () => {
        // Additional logic can be added here if needed
    };

    // Format time for display
    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format duration
    const formatDuration = (hours: number): string => {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);

        if (wholeHours === 0) {
            return `${minutes}m`;
        } else if (minutes === 0) {
            return `${wholeHours}h`;
        } else {
            return `${wholeHours}h ${minutes}m`;
        }
    };

    // Get status badge color
    const getStatusBadge = (timesheet: Timesheet) => {
        if (!timesheet.clock_out) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Completed
                </span>
            );
        }
    };

    // Start editing a timesheet entry
    const startEditing = (timesheet: Timesheet) => {
        setEditingTimesheet(timesheet.id);
        setEditForm({
            clock_in: formatDateTimeForInput(timesheet.clock_in),
            clock_out: timesheet.clock_out ? formatDateTimeForInput(timesheet.clock_out) : '',
            todo: timesheet.todo || '',
            note: timesheet.note || ''
        });
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingTimesheet(null);
        setEditForm({
            clock_in: '',
            clock_out: '',
            todo: '',
            note: ''
        });
    };

    // Save timesheet changes
    const saveTimesheet = (timesheetId: string) => {
        const updates: Partial<Timesheet> = {
            clock_in: new Date(editForm.clock_in).toISOString(),
            todo: editForm.todo || undefined,
            note: editForm.note || undefined
        };

        if (editForm.clock_out) {
            updates.clock_out = new Date(editForm.clock_out).toISOString();
        }

        updateTimesheetMutation.mutate({ id: timesheetId, updates });
    };

    // Format datetime for input field
    const formatDateTimeForInput = (dateString: string): string => {
        const date = new Date(dateString);
        // Get local timezone offset and adjust the date
        const timezoneOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format
    };

    // Check if user can edit this timesheet (only their own completed entries)
    const canEditTimesheet = (timesheet: Timesheet): boolean => {
        return timesheet.employee_id === employee?.id && !!timesheet.clock_out;
    };

    if (!employee) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Loading employee information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Timesheet
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track your work hours and manage your shifts
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && !isLoadingStats && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ClockIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Active Employees
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.activeEmployees}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Hours Today
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.totalHoursToday.toFixed(1)}h
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Hours This Week
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.totalHoursThisWeek.toFixed(1)}h
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Hours This Month
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.totalHoursThisMonth.toFixed(1)}h
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Clock In/Out Widget */}
                <div className="lg:col-span-1">
                    <ClockInOutWidget
                        onStatusChange={handleStatusChange}
                        className="h-fit"
                    />
                </div>

                {/* Recent Timesheet Entries */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                Recent Timesheet Entries
                            </h3>

                            {isLoadingRecent ? (
                                <div className="animate-pulse space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex space-x-4">
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentError ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-red-600">
                                        Failed to load recent timesheet entries
                                    </p>
                                    <button
                                        onClick={() => queryClient.invalidateQueries({ queryKey: ['recentTimesheets'] })}
                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : !recentTimesheets || recentTimesheets.length === 0 ? (
                                <div className="text-center py-8">
                                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        No timesheet entries
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Clock in to start tracking your work hours.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '160px' }}>
                                                    Clock In
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '160px' }}>
                                                    Clock Out
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Duration
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '80px' }}>
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentTimesheets.map((timesheet) => (
                                                <tr key={timesheet.id} className="hover:bg-gray-50">
                                                    {editingTimesheet === timesheet.id ? (
                                                        // Edit mode
                                                        <>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatDate(timesheet.clock_in)}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="datetime-local"
                                                                    value={editForm.clock_in}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, clock_in: e.target.value }))}
                                                                    className="w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                                    style={{ minWidth: '160px' }}
                                                                />
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="datetime-local"
                                                                    value={editForm.clock_out}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, clock_out: e.target.value }))}
                                                                    className="w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                                    style={{ minWidth: '160px' }}
                                                                />
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {timesheet.hours_worked ? formatDuration(timesheet.hours_worked) : '-'}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                {getStatusBadge(timesheet)}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                                                <div className="flex space-x-1 justify-center">
                                                                    <button
                                                                        onClick={() => saveTimesheet(timesheet.id)}
                                                                        disabled={updateTimesheetMutation.isPending}
                                                                        className="p-1 text-green-600 hover:text-green-900 disabled:opacity-50 hover:bg-green-50 rounded"
                                                                        title="Save changes"
                                                                    >
                                                                        <CheckIcon className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEditing}
                                                                        disabled={updateTimesheetMutation.isPending}
                                                                        className="p-1 text-red-600 hover:text-red-900 disabled:opacity-50 hover:bg-red-50 rounded"
                                                                        title="Cancel editing"
                                                                    >
                                                                        <XMarkIcon className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        // View mode
                                                        <>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatDate(timesheet.clock_in)}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {formatTime(timesheet.clock_in)}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {timesheet.clock_out ? formatTime(timesheet.clock_out) : '-'}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {timesheet.hours_worked ? formatDuration(timesheet.hours_worked) : '-'}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap">
                                                                {getStatusBadge(timesheet)}
                                                            </td>
                                                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                                {canEditTimesheet(timesheet) ? (
                                                                    <button
                                                                        onClick={() => startEditing(timesheet)}
                                                                        className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                                                        title="Edit timesheet entry"
                                                                    >
                                                                        <PencilIcon className="h-4 w-4" />
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Edit Form for Todo and Notes */}
                                    {editingTimesheet && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Todo & Notes</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Todo
                                                    </label>
                                                    <textarea
                                                        value={editForm.todo}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, todo: e.target.value }))}
                                                        rows={2}
                                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="What needs to be done during this shift?"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Notes
                                                    </label>
                                                    <textarea
                                                        value={editForm.note}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                                                        rows={2}
                                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="Any additional notes about this shift?"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Todo and Notes Display */}
                                    {recentTimesheets.some(t => t.todo || t.note) && (
                                        <div className="mt-6 space-y-4">
                                            <h4 className="text-sm font-medium text-gray-900">Recent Notes & Todos</h4>
                                            {recentTimesheets
                                                .filter(t => t.todo || t.note)
                                                .slice(0, 3)
                                                .map((timesheet) => (
                                                    <div key={`notes-${timesheet.id}`} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(timesheet.clock_in)}
                                                            </span>
                                                            {getStatusBadge(timesheet)}
                                                        </div>
                                                        {timesheet.todo && (
                                                            <div className="mb-2">
                                                                <span className="text-xs font-medium text-gray-700">Todo:</span>
                                                                <p className="text-sm text-gray-600 mt-1">{timesheet.todo}</p>
                                                            </div>
                                                        )}
                                                        {timesheet.note && (
                                                            <div>
                                                                <span className="text-xs font-medium text-gray-700">Note:</span>
                                                                <p className="text-sm text-gray-600 mt-1">{timesheet.note}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimesheetDashboard;