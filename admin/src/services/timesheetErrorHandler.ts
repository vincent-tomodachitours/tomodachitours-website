/**
 * Comprehensive error handling service for timesheet operations
 * Implements error recovery and user-friendly messaging as per requirements 5.1, 5.2, 5.3
 */

import { QueryClient } from '@tanstack/react-query';
import { getUserFriendlyErrorMessage } from '../utils/timesheetValidation';

export interface ErrorContext {
    operation: 'clock_in' | 'clock_out' | 'fetch_timesheet' | 'sync_data';
    employeeId?: string;
    timesheetId?: string;
    attemptCount?: number;
    timestamp: Date;
    userAgent?: string;
    connectionType?: string;
}

export interface ErrorRecoveryOptions {
    canRetry: boolean;
    canRefresh: boolean;
    canGoOffline: boolean;
    suggestedActions: string[];
    autoRetryDelay?: number;
}

export interface TimesheetError {
    id: string;
    type: 'validation' | 'network' | 'server' | 'permission' | 'conflict' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userMessage: string;
    context: ErrorContext;
    recoveryOptions: ErrorRecoveryOptions;
    originalError?: any;
    timestamp: Date;
}

export class TimesheetErrorHandler {
    private static errorLog: TimesheetError[] = [];
    private static maxLogSize = 100;
    private static retryAttempts = new Map<string, number>();
    private static maxRetryAttempts = 3;

    /**
     * Process and categorize an error
     */
    static handleError(
        error: any,
        context: ErrorContext,
        queryClient?: QueryClient
    ): TimesheetError {
        const timesheetError = this.categorizeError(error, context);

        // Log the error
        this.logError(timesheetError);

        // Determine recovery options
        timesheetError.recoveryOptions = this.determineRecoveryOptions(timesheetError);

        // Handle automatic recovery if appropriate
        this.attemptAutoRecovery(timesheetError, queryClient);

        return timesheetError;
    }

    /**
     * Categorize error by type and severity
     */
    private static categorizeError(error: any, context: ErrorContext): TimesheetError {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const errorId = `${context.operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        let type: TimesheetError['type'] = 'unknown';
        let severity: TimesheetError['severity'] = 'medium';

        // Categorize by error message patterns
        if (this.isValidationError(errorMessage)) {
            type = 'validation';
            severity = 'low';
        } else if (this.isNetworkError(error)) {
            type = 'network';
            severity = 'medium';
        } else if (this.isServerError(error)) {
            type = 'server';
            severity = 'high';
        } else if (this.isPermissionError(errorMessage)) {
            type = 'permission';
            severity = 'high';
        } else if (this.isConflictError(errorMessage)) {
            type = 'conflict';
            severity = 'medium';
        }

        // Adjust severity based on operation
        if (context.operation === 'fetch_timesheet' && type === 'network') {
            severity = 'low'; // Fetching can be retried easily
        } else if (['clock_in', 'clock_out'].includes(context.operation) && type === 'server') {
            severity = 'critical'; // Clock operations are critical
        }

        return {
            id: errorId,
            type,
            severity,
            message: errorMessage,
            userMessage: getUserFriendlyErrorMessage(error),
            context,
            recoveryOptions: { canRetry: false, canRefresh: false, canGoOffline: false, suggestedActions: [] },
            originalError: error,
            timestamp: new Date()
        };
    }

    /**
     * Determine recovery options based on error type
     */
    private static determineRecoveryOptions(error: TimesheetError): ErrorRecoveryOptions {
        const options: ErrorRecoveryOptions = {
            canRetry: false,
            canRefresh: false,
            canGoOffline: false,
            suggestedActions: []
        };

        switch (error.type) {
            case 'network':
                options.canRetry = true;
                options.canRefresh = true;
                options.canGoOffline = true;
                options.autoRetryDelay = this.calculateRetryDelay(error.context.attemptCount || 0);
                options.suggestedActions = [
                    'Check your internet connection',
                    'Try again in a few moments',
                    'Refresh the page if the problem persists'
                ];
                break;

            case 'server':
                options.canRetry = true;
                options.canRefresh = true;
                options.autoRetryDelay = 5000; // 5 seconds for server errors
                options.suggestedActions = [
                    'The server is experiencing issues',
                    'Try again in a few moments',
                    'Contact support if the problem persists'
                ];
                break;

            case 'validation':
                options.canRefresh = true;
                options.suggestedActions = [
                    'Please correct the highlighted issues',
                    'Ensure all required fields are filled correctly'
                ];
                break;

            case 'permission':
                options.canRefresh = true;
                options.suggestedActions = [
                    'You may need to log in again',
                    'Contact your administrator if you believe this is an error'
                ];
                break;

            case 'conflict':
                options.canRetry = true;
                options.canRefresh = true;
                options.suggestedActions = [
                    'Your timesheet status may have changed',
                    'Refresh the page to see the current status',
                    'Try the operation again'
                ];
                break;

            default:
                options.canRefresh = true;
                options.suggestedActions = [
                    'An unexpected error occurred',
                    'Try refreshing the page',
                    'Contact support if the problem persists'
                ];
        }

        return options;
    }

    /**
     * Attempt automatic recovery for certain error types
     */
    private static attemptAutoRecovery(
        error: TimesheetError,
        queryClient?: QueryClient
    ): void {
        const { type, context, recoveryOptions } = error;
        const attemptKey = `${context.operation}-${context.employeeId}`;
        const currentAttempts = this.retryAttempts.get(attemptKey) || 0;

        // Don't auto-retry if we've exceeded max attempts
        if (currentAttempts >= this.maxRetryAttempts) {
            return;
        }

        // Auto-retry for network and server errors
        if ((type === 'network' || type === 'server') && recoveryOptions.autoRetryDelay) {
            this.retryAttempts.set(attemptKey, currentAttempts + 1);

            setTimeout(() => {
                if (queryClient && context.employeeId) {
                    // Invalidate relevant queries to trigger refetch
                    queryClient.invalidateQueries({
                        queryKey: ['currentTimesheet', context.employeeId]
                    });
                }
            }, recoveryOptions.autoRetryDelay);
        }

        // Auto-refresh for conflict errors
        if (type === 'conflict' && queryClient && context.employeeId) {
            setTimeout(() => {
                queryClient.invalidateQueries({
                    queryKey: ['currentTimesheet', context.employeeId]
                });
            }, 1000);
        }
    }

    /**
     * Calculate exponential backoff delay for retries
     */
    private static calculateRetryDelay(attemptCount: number): number {
        const baseDelay = 1000; // 1 second
        const maxDelay = 30000; // 30 seconds
        const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        return delay + jitter;
    }

    /**
     * Clear retry attempts for successful operations
     */
    static clearRetryAttempts(operation: string, employeeId?: string): void {
        const attemptKey = `${operation}-${employeeId}`;
        this.retryAttempts.delete(attemptKey);
    }

    /**
     * Log error for debugging and analytics
     */
    private static logError(error: TimesheetError): void {
        // Add to in-memory log
        this.errorLog.unshift(error);

        // Trim log if it gets too large
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // Console logging for development
        if (process.env.NODE_ENV === 'development') {
            console.group(`🚨 Timesheet Error [${error.type}]`);
            console.error('Error:', error.message);
            console.log('Context:', error.context);
            console.log('Recovery Options:', error.recoveryOptions);
            if (error.originalError) {
                console.error('Original Error:', error.originalError);
            }
            console.groupEnd();
        }

        // Send to monitoring service in production (if available)
        if (process.env.NODE_ENV === 'production' && error.severity === 'critical') {
            this.reportCriticalError(error);
        }
    }

    /**
     * Report critical errors to monitoring service
     */
    private static reportCriticalError(error: TimesheetError): void {
        // This would integrate with your monitoring service (e.g., Sentry, LogRocket, etc.)
        try {
            // Example implementation - replace with your monitoring service
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                    description: `Timesheet Critical Error: ${error.message}`,
                    fatal: false,
                    custom_map: {
                        error_type: error.type,
                        operation: error.context.operation,
                        employee_id: error.context.employeeId
                    }
                });
            }
        } catch (reportingError) {
            console.error('Failed to report critical error:', reportingError);
        }
    }

    /**
     * Get recent errors for debugging
     */
    static getRecentErrors(limit: number = 10): TimesheetError[] {
        return this.errorLog.slice(0, limit);
    }

    /**
     * Get error statistics
     */
    static getErrorStats(): {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        recentCount: number;
    } {
        const recentThreshold = Date.now() - (60 * 60 * 1000); // Last hour

        const stats = {
            total: this.errorLog.length,
            byType: {} as Record<string, number>,
            bySeverity: {} as Record<string, number>,
            recentCount: 0
        };

        this.errorLog.forEach(error => {
            // Count by type
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

            // Count by severity
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

            // Count recent errors
            if (error.timestamp.getTime() > recentThreshold) {
                stats.recentCount++;
            }
        });

        return stats;
    }

    /**
     * Clear error log
     */
    static clearErrorLog(): void {
        this.errorLog = [];
        this.retryAttempts.clear();
    }

    // Error type detection methods
    private static isValidationError(message: string): boolean {
        const validationPatterns = [
            'validation failed',
            'invalid input',
            'required field',
            'must be',
            'cannot be empty',
            'too long',
            'too short',
            'invalid format'
        ];

        const lowerMessage = message.toLowerCase();
        return validationPatterns.some(pattern => lowerMessage.includes(pattern));
    }

    private static isNetworkError(error: any): boolean {
        if (!error) return false;

        const networkIndicators = [
            'network error',
            'failed to fetch',
            'connection failed',
            'timeout',
            'net::',
            'cors',
            'no internet'
        ];

        const errorString = (error.message || error.toString()).toLowerCase();
        return networkIndicators.some(indicator => errorString.includes(indicator)) ||
            error.name === 'NetworkError' ||
            error.code === 'NETWORK_ERROR';
    }

    private static isServerError(error: any): boolean {
        if (!error) return false;

        const serverPatterns = [
            'internal server error',
            'service unavailable',
            'bad gateway',
            'gateway timeout',
            '500',
            '502',
            '503',
            '504'
        ];

        const errorString = (error.message || error.toString()).toLowerCase();
        return serverPatterns.some(pattern => errorString.includes(pattern)) ||
            (error.status >= 500 && error.status < 600);
    }

    private static isPermissionError(message: string): boolean {
        const permissionPatterns = [
            'unauthorized',
            'forbidden',
            'access denied',
            'permission denied',
            'not authorized',
            'authentication required',
            '401',
            '403'
        ];

        const lowerMessage = message.toLowerCase();
        return permissionPatterns.some(pattern => lowerMessage.includes(pattern));
    }

    private static isConflictError(message: string): boolean {
        const conflictPatterns = [
            'already clocked in',
            'not currently clocked in',
            'conflict',
            'concurrent modification',
            'state changed',
            'version mismatch',
            '409'
        ];

        const lowerMessage = message.toLowerCase();
        return conflictPatterns.some(pattern => lowerMessage.includes(pattern));
    }
}

/**
 * Hook for handling timesheet errors in React components
 */
export function useTimesheetErrorHandler() {
    const handleError = (
        error: any,
        context: Omit<ErrorContext, 'timestamp'>,
        queryClient?: QueryClient
    ): TimesheetError => {
        return TimesheetErrorHandler.handleError(
            error,
            { ...context, timestamp: new Date() },
            queryClient
        );
    };

    const clearRetryAttempts = (operation: string, employeeId?: string) => {
        TimesheetErrorHandler.clearRetryAttempts(operation, employeeId);
    };

    const getRecentErrors = (limit?: number) => {
        return TimesheetErrorHandler.getRecentErrors(limit);
    };

    const getErrorStats = () => {
        return TimesheetErrorHandler.getErrorStats();
    };

    return {
        handleError,
        clearRetryAttempts,
        getRecentErrors,
        getErrorStats
    };
}