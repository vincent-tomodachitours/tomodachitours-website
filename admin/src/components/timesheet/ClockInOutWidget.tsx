import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClockIcon, PlayIcon, StopIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { TimesheetService, TimesheetRealtimeManager } from '../../services/timesheetService';
import { Button } from '../ui/Button';
import { Timesheet } from '../../types';
import {
    validateTodo,
    validateNote,
    validateClockIn,
    validateClockOut,
    sanitizeTextInput,
    TimesheetValidationContext
} from '../../utils/timesheetValidation';
import { useTimesheetErrorHandler, TimesheetError } from '../../services/timesheetErrorHandler';
import { useNetworkState } from '../../hooks/useNetworkState';
import { TimesheetErrorDisplay, NetworkErrorDisplay } from './TimesheetErrorDisplay';

interface ClockInOutWidgetProps {
    className?: string;
    onStatusChange?: (isActive: boolean) => void;
}

export const ClockInOutWidget: React.FC<ClockInOutWidgetProps> = ({
    className = '',
    onStatusChange
}) => {
    const { employee } = useAdminAuth();
    const queryClient = useQueryClient();
    const subscriptionRef = useRef<any>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Enhanced error handling and network state
    const { handleError, clearRetryAttempts } = useTimesheetErrorHandler();
    const networkState = useNetworkState();

    // Form states
    const [todoText, setTodoText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [showTodoInput, setShowTodoInput] = useState(false);
    const [showNoteInput, setShowNoteInput] = useState(false);

    // Enhanced error states
    const [currentError, setCurrentError] = useState<TimesheetError | null>(null);
    const [validationErrors, setValidationErrors] = useState<{
        todo?: string;
        note?: string;
    }>({});

    // Warnings state
    const [warnings, setWarnings] = useState<string[]>([]);

    // Get current timesheet status with enhanced error handling
    const { data: currentTimesheet, isLoading, error, refetch } = useQuery({
        queryKey: ['currentTimesheet', employee?.id],
        queryFn: () => employee ? TimesheetService.getCurrentTimesheet(employee.id) : null,
        enabled: !!employee?.id,
        staleTime: 10000, // Consider data stale after 10 seconds
        refetchInterval: () => {
            // Reduce polling frequency when real-time is working
            return networkState.isOnline ? 60000 : 15000;
        },
        refetchIntervalInBackground: false,
        retry: (failureCount, error) => {
            // Enhanced retry logic with error handling
            if (failureCount < 3) {
                const timesheetError = handleError(error, {
                    operation: 'fetch_timesheet',
                    employeeId: employee?.id,
                    attemptCount: failureCount
                }, queryClient);

                setCurrentError(timesheetError);
                return true;
            }
            return false;
        }
    });

    // Handle query success/error states
    useEffect(() => {
        if (currentTimesheet && !error) {
            // Clear errors on successful fetch
            setCurrentError(null);
            clearRetryAttempts('fetch_timesheet', employee?.id);
        }
    }, [currentTimesheet, error, clearRetryAttempts, employee?.id]);

    useEffect(() => {
        if (error && !currentError) {
            // Handle fetch errors
            const timesheetError = handleError(error, {
                operation: 'fetch_timesheet',
                employeeId: employee?.id
            }, queryClient);

            setCurrentError(timesheetError);
        }
    }, [error, currentError, handleError, employee?.id, queryClient]);

    // Clock in mutation with enhanced error handling
    const clockInMutation = useMutation({
        mutationFn: ({ employeeId, todo }: { employeeId: string; todo?: string }) =>
            TimesheetService.clockIn(employeeId, todo),
        onMutate: async ({ employeeId, todo }) => {
            // Clear previous errors
            setCurrentError(null);
            setWarnings([]);

            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['currentTimesheet', employeeId] });

            // Snapshot the previous value
            const previousTimesheet = queryClient.getQueryData(['currentTimesheet', employeeId]);

            // Optimistically update to the new value
            if (employee) {
                const optimisticTimesheet = TimesheetService.createOptimisticTimesheet(
                    employeeId,
                    employee,
                    todo
                );
                queryClient.setQueryData(['currentTimesheet', employeeId], optimisticTimesheet);

                // Notify parent component optimistically
                onStatusChange?.(true);
            }

            // Return a context object with the snapshotted value
            return { previousTimesheet };
        },

    });

    // Clock out mutation with enhanced error handling
    const clockOutMutation = useMutation({
        mutationFn: ({ timesheetId, note }: { timesheetId: string; note?: string }) =>
            TimesheetService.clockOut(timesheetId, note),
        onMutate: async ({ timesheetId, note }) => {
            // Clear previous errors
            setCurrentError(null);
            setWarnings([]);

            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['currentTimesheet', employee?.id] });

            // Snapshot the previous value
            const previousTimesheet = queryClient.getQueryData(['currentTimesheet', employee?.id]) as Timesheet | null;

            // Optimistically update to the new value
            if (previousTimesheet) {
                const optimisticTimesheet = TimesheetService.createOptimisticClockOut(previousTimesheet, note);
                queryClient.setQueryData(['currentTimesheet', employee?.id], optimisticTimesheet);
            }

            // Return a context object with the snapshotted value
            return { previousTimesheet };
        },

    });

    // Track handled mutation states to prevent infinite loops
    const handledClockInRef = useRef<string | null>(null);
    const handledClockOutRef = useRef<string | null>(null);

    // Handle clock in mutation success/error
    useEffect(() => {
        const mutationId = clockInMutation.submittedAt?.toString();
        if (clockInMutation.isSuccess && clockInMutation.data && mutationId && handledClockInRef.current !== mutationId) {
            handledClockInRef.current = mutationId;

            // Reset form
            setTodoText('');
            setShowTodoInput(false);
            setValidationErrors({});
            setCurrentError(null);
            setWarnings([]);

            // Update cache with real data
            queryClient.setQueryData(['currentTimesheet', employee?.id], clockInMutation.data);
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
            queryClient.invalidateQueries({ queryKey: ['recentTimesheets'] });
            queryClient.invalidateQueries({ queryKey: ['timesheetStats'] });

            // Clear retry attempts
            clearRetryAttempts('clock_in', employee?.id);
        }
    }, [clockInMutation.isSuccess, clockInMutation.data, clockInMutation.submittedAt, queryClient, employee?.id, clearRetryAttempts]);

    useEffect(() => {
        const mutationId = clockInMutation.submittedAt?.toString();
        if (clockInMutation.isError && clockInMutation.error && mutationId && handledClockInRef.current !== mutationId) {
            handledClockInRef.current = mutationId;

            // Handle error with enhanced error handler
            const timesheetError = handleError(clockInMutation.error, {
                operation: 'clock_in',
                employeeId: employee?.id
            }, queryClient);

            setCurrentError(timesheetError);
        }
    }, [clockInMutation.isError, clockInMutation.error, clockInMutation.submittedAt, handleError, employee?.id, queryClient]);

    // Handle clock out mutation success/error
    useEffect(() => {
        const mutationId = clockOutMutation.submittedAt?.toString();
        if (clockOutMutation.isSuccess && mutationId && handledClockOutRef.current !== mutationId) {
            handledClockOutRef.current = mutationId;

            // Reset form
            setNoteText('');
            setShowNoteInput(false);
            setValidationErrors({});
            setCurrentError(null);
            setWarnings([]);

            // Update cache - set to null since employee is now clocked out
            queryClient.setQueryData(['currentTimesheet', employee?.id], null);
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
            queryClient.invalidateQueries({ queryKey: ['recentTimesheets'] });
            queryClient.invalidateQueries({ queryKey: ['timesheetStats'] });

            // Notify parent component
            onStatusChange?.(false);

            // Clear retry attempts
            clearRetryAttempts('clock_out', employee?.id);
        }
    }, [clockOutMutation.isSuccess, clockOutMutation.submittedAt, queryClient, employee?.id, onStatusChange, clearRetryAttempts]);

    useEffect(() => {
        const mutationId = clockOutMutation.submittedAt?.toString();
        if (clockOutMutation.isError && clockOutMutation.error && mutationId && handledClockOutRef.current !== mutationId) {
            handledClockOutRef.current = mutationId;

            // Handle error with enhanced error handler
            const timesheetError = handleError(clockOutMutation.error, {
                operation: 'clock_out',
                employeeId: employee?.id
            }, queryClient);

            setCurrentError(timesheetError);
        }
    }, [clockOutMutation.isError, clockOutMutation.error, clockOutMutation.submittedAt, handleError, employee?.id, queryClient]);

    // Real-time subscription setup with enhanced error handling
    const setupRealtimeSubscription = useCallback(() => {
        if (!employee?.id) return;

        // Clean up existing subscription
        if (subscriptionRef.current) {
            TimesheetRealtimeManager.unsubscribe(`widget-${employee.id}`);
            subscriptionRef.current = null;
        }

        // Set up new subscription
        subscriptionRef.current = TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
            employee.id,
            (payload) => {
                console.log('Real-time timesheet update in widget:', payload);

                // Invalidate and refetch current timesheet
                queryClient.invalidateQueries({ queryKey: ['currentTimesheet', employee.id] });
                queryClient.invalidateQueries({ queryKey: ['recentTimesheets', employee.id] });
                queryClient.invalidateQueries({ queryKey: ['timesheetStats'] });

                // Clear any connection errors since real-time is working
                if (currentError?.type === 'network') {
                    setCurrentError(null);
                }

                // Clear any retry timeouts
                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                    retryTimeoutRef.current = null;
                }
            },
            `widget-${employee.id}`
        );
    }, [employee?.id, queryClient, currentError]);

    // Set up real-time subscription
    useEffect(() => {
        setupRealtimeSubscription();

        return () => {
            if (employee?.id) {
                TimesheetRealtimeManager.unsubscribe(`widget-${employee.id}`);
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [setupRealtimeSubscription, employee?.id]);

    // Handle network state changes
    useEffect(() => {
        if (!networkState.isOnline && !retryTimeoutRef.current) {
            // Retry connection after network comes back
            retryTimeoutRef.current = setTimeout(() => {
                console.log('Retrying real-time connection after network recovery...');
                setupRealtimeSubscription();
                refetch();
                retryTimeoutRef.current = null;
            }, 2000);
        }
    }, [networkState.isOnline, setupRealtimeSubscription, refetch]);

    // Calculate duration for active timesheet
    const [currentDuration, setCurrentDuration] = useState<string>('');

    useEffect(() => {
        if (!currentTimesheet?.clock_in) {
            setCurrentDuration('');
            return;
        }

        const updateDuration = () => {
            const clockInTime = new Date(currentTimesheet.clock_in);
            const now = new Date();
            const diffMs = now.getTime() - clockInTime.getTime();

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            setCurrentDuration(`${hours}h ${minutes}m`);
        };

        // Update immediately
        updateDuration();

        // Update every minute
        const interval = setInterval(updateDuration, 60000);

        return () => clearInterval(interval);
    }, [currentTimesheet?.clock_in]);

    // Enhanced validation with context
    const getValidationContext = useCallback((): TimesheetValidationContext => ({
        employeeId: employee?.id,
        currentTimesheet: currentTimesheet,
        isOnline: networkState.isOnline,
        lastSyncTime: new Date()
    }), [employee?.id, currentTimesheet, networkState.isOnline]);

    // Enhanced clock in handler with comprehensive validation
    const handleClockIn = useCallback(() => {
        if (!employee?.id) {
            const error = handleError(new Error('Employee information not available'), {
                operation: 'clock_in'
            });
            setCurrentError(error);
            return;
        }

        // Clear previous errors and warnings
        setCurrentError(null);
        setValidationErrors({});
        setWarnings([]);

        // Validate operation context
        const context = getValidationContext();
        const operationValidation = validateClockIn(context);

        if (!operationValidation.isValid) {
            const error = handleError(new Error(operationValidation.errors[0]), {
                operation: 'clock_in',
                employeeId: employee.id
            });
            setCurrentError(error);
            return;
        }

        // Show warnings if any
        if (operationValidation.warnings) {
            setWarnings(operationValidation.warnings);
        }

        // Validate and sanitize todo input
        let sanitizedTodo: string | undefined;
        if (showTodoInput && todoText.trim()) {
            sanitizedTodo = sanitizeTextInput(todoText);
            const todoValidation = validateTodo(sanitizedTodo);

            if (!todoValidation.isValid) {
                setValidationErrors({ todo: todoValidation.errors[0] });
                return;
            }

            if (todoValidation.warnings) {
                setWarnings(prev => [...prev, ...todoValidation.warnings!]);
            }
        }

        // Execute clock in
        clockInMutation.mutate({
            employeeId: employee.id,
            todo: sanitizedTodo
        });
    }, [employee?.id, showTodoInput, todoText, getValidationContext, handleError, clockInMutation]);

    // Enhanced clock out handler with comprehensive validation
    const handleClockOut = useCallback(() => {
        if (!currentTimesheet?.id) {
            const error = handleError(new Error('No active timesheet found'), {
                operation: 'clock_out',
                employeeId: employee?.id
            });
            setCurrentError(error);
            return;
        }

        // Clear previous errors and warnings
        setCurrentError(null);
        setValidationErrors({});
        setWarnings([]);

        // Validate operation context
        const context = getValidationContext();
        const operationValidation = validateClockOut(context);

        if (!operationValidation.isValid) {
            const error = handleError(new Error(operationValidation.errors[0]), {
                operation: 'clock_out',
                employeeId: employee?.id,
                timesheetId: currentTimesheet.id
            });
            setCurrentError(error);
            return;
        }

        // Show warnings if any
        if (operationValidation.warnings) {
            setWarnings(operationValidation.warnings);
        }

        // Validate and sanitize note input
        let sanitizedNote: string | undefined;
        if (showNoteInput && noteText.trim()) {
            sanitizedNote = sanitizeTextInput(noteText);
            const noteValidation = validateNote(sanitizedNote);

            if (!noteValidation.isValid) {
                setValidationErrors({ note: noteValidation.errors[0] });
                return;
            }

            if (noteValidation.warnings) {
                setWarnings(prev => [...prev, ...noteValidation.warnings!]);
            }
        }

        // Execute clock out
        clockOutMutation.mutate({
            timesheetId: currentTimesheet.id,
            note: sanitizedNote
        });
    }, [currentTimesheet?.id, employee?.id, showNoteInput, noteText, getValidationContext, handleError, clockOutMutation]);

    // Handle error recovery actions
    const handleRetryError = useCallback(() => {
        if (currentError?.context.operation === 'fetch_timesheet') {
            refetch();
        } else if (currentError?.context.operation === 'clock_in') {
            handleClockIn();
        } else if (currentError?.context.operation === 'clock_out') {
            handleClockOut();
        }
    }, [currentError, refetch, handleClockIn, handleClockOut]);

    const handleRefreshData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['currentTimesheet', employee?.id] });
        setCurrentError(null);
        setValidationErrors({});
        setWarnings([]);
    }, [queryClient, employee?.id]);

    const handleDismissError = useCallback(() => {
        setCurrentError(null);
    }, []);

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
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }



    const isActive = !!currentTimesheet;
    const isMutating = clockInMutation.isPending || clockOutMutation.isPending;

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
            {/* Header with Connection Status */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <ClockIcon className={`h-6 w-6 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Time Clock
                        </h3>
                        <p className="text-sm text-gray-500">
                            {isActive ? 'Currently clocked in' : 'Ready to clock in'}
                        </p>
                    </div>
                </div>

                {/* Enhanced Connection Status Indicator */}
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${networkState.isOnline ? 'bg-green-400' :
                        networkState.isReconnecting ? 'bg-yellow-400 animate-pulse' :
                            'bg-red-400'
                        }`} />
                    <span className="text-xs text-gray-500">
                        {networkState.isOnline ? 'Live' :
                            networkState.isReconnecting ? 'Reconnecting...' :
                                'Offline'}
                    </span>
                </div>
            </div>

            {/* Network Error Display */}
            <NetworkErrorDisplay
                isOnline={networkState.isOnline}
                isReconnecting={networkState.isReconnecting}
                lastOnlineTime={networkState.lastOnlineTime}
                onRetryConnection={networkState.forceReconnect}
                className="mb-4"
            />

            {/* Main Error Display */}
            <TimesheetErrorDisplay
                error={currentError}
                onRetry={currentError?.recoveryOptions.canRetry ? handleRetryError : undefined}
                onRefresh={currentError?.recoveryOptions.canRefresh ? handleRefreshData : undefined}
                onDismiss={handleDismissError}
                className="mb-4"
                showDetails={true}
            />

            {/* Warnings Display */}
            {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="text-sm font-medium text-yellow-800 mb-1">
                                Please note:
                            </div>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                {warnings.map((warning, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{warning}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Status */}
            {isActive && currentTimesheet && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800">
                                Clocked in at {formatTime(currentTimesheet.clock_in)}
                            </p>
                            <p className="text-xs text-green-600">
                                {formatDate(currentTimesheet.clock_in)}
                            </p>
                            {currentTimesheet.todo && (
                                <p className="text-sm text-green-700 mt-2">
                                    <span className="font-medium">Todo:</span> {currentTimesheet.todo}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-green-800">
                                {currentDuration}
                            </p>
                            <p className="text-xs text-green-600">
                                Duration
                            </p>
                        </div>
                    </div>
                </div>
            )}



            {/* Clock In Section */}
            {!isActive && (
                <div className="space-y-4">
                    {/* Todo Input Toggle */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="show-todo"
                            checked={showTodoInput}
                            onChange={(e) => {
                                setShowTodoInput(e.target.checked);
                                if (!e.target.checked) {
                                    setTodoText('');
                                    setValidationErrors(prev => ({ ...prev, todo: undefined }));
                                }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="show-todo" className="ml-2 text-sm text-gray-700">
                            Add todo for this shift
                        </label>
                    </div>

                    {/* Todo Input */}
                    {showTodoInput && (
                        <div>
                            <textarea
                                value={todoText}
                                onChange={(e) => {
                                    setTodoText(e.target.value);
                                    const validation = validateTodo(e.target.value);
                                    setValidationErrors(prev => ({
                                        ...prev,
                                        todo: validation.isValid ? undefined : validation.errors[0]
                                    }));
                                }}
                                placeholder="What do you plan to work on today?"
                                rows={2}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${validationErrors.todo ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {validationErrors.todo && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.todo}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                {todoText.length}/500 characters
                            </p>
                        </div>
                    )}

                    {/* Clock In Button */}
                    <Button
                        onClick={handleClockIn}
                        loading={isMutating}
                        variant="success"
                        size="lg"
                        className="w-full"
                    >
                        <PlayIcon className="h-5 w-5 mr-2" />
                        Clock In
                    </Button>
                </div>
            )}

            {/* Clock Out Section */}
            {isActive && (
                <div className="space-y-4">
                    {/* Note Input Toggle */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="show-note"
                            checked={showNoteInput}
                            onChange={(e) => {
                                setShowNoteInput(e.target.checked);
                                if (!e.target.checked) {
                                    setNoteText('');
                                    setValidationErrors(prev => ({ ...prev, note: undefined }));
                                }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="show-note" className="ml-2 text-sm text-gray-700">
                            Add notes about this shift
                        </label>
                    </div>

                    {/* Note Input */}
                    {showNoteInput && (
                        <div>
                            <textarea
                                value={noteText}
                                onChange={(e) => {
                                    setNoteText(e.target.value);
                                    const validation = validateNote(e.target.value);
                                    setValidationErrors(prev => ({
                                        ...prev,
                                        note: validation.isValid ? undefined : validation.errors[0]
                                    }));
                                }}
                                placeholder="Any notes about your shift (tasks completed, issues, etc.)"
                                rows={3}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${validationErrors.note ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            />
                            {validationErrors.note && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.note}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                {noteText.length}/1000 characters
                            </p>
                        </div>
                    )}

                    {/* Clock Out Button */}
                    <Button
                        onClick={handleClockOut}
                        loading={isMutating}
                        variant="danger"
                        size="lg"
                        className="w-full"
                    >
                        <StopIcon className="h-5 w-5 mr-2" />
                        Clock Out
                    </Button>
                </div>
            )}
        </div>
    );
};