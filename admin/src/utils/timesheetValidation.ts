/**
 * Comprehensive validation utilities for timesheet operations
 * Implements client-side validation as per requirement 5.1, 5.2, 5.3
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

export interface TimesheetValidationContext {
    employeeId?: string;
    currentTimesheet?: any;
    isOnline?: boolean;
    lastSyncTime?: Date;
}

/**
 * Validate todo text input
 */
export function validateTodo(todo: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check length constraints
    if (todo.length > 500) {
        errors.push('Todo must be less than 500 characters');
    }

    // Check for potentially problematic content
    if (todo.trim().length === 0 && todo.length > 0) {
        warnings.push('Todo contains only whitespace');
    }

    // Check for special characters that might cause issues
    const problematicChars = /[<>{}]/g;
    if (problematicChars.test(todo)) {
        warnings.push('Todo contains special characters that may not display correctly');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validate note text input
 */
export function validateNote(note: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check length constraints
    if (note.length > 1000) {
        errors.push('Note must be less than 1000 characters');
    }

    // Check for potentially problematic content
    if (note.trim().length === 0 && note.length > 0) {
        warnings.push('Note contains only whitespace');
    }

    // Check for special characters that might cause issues
    const problematicChars = /[<>{}]/g;
    if (problematicChars.test(note)) {
        warnings.push('Note contains special characters that may not display correctly');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validate clock in operation
 */
export function validateClockIn(context: TimesheetValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if employee ID is provided
    if (!context.employeeId) {
        errors.push('Employee information is required to clock in');
        return { isValid: false, errors };
    }

    // Check if already clocked in
    if (context.currentTimesheet) {
        errors.push('You are already clocked in. Please clock out first.');
        return { isValid: false, errors };
    }

    // Check network connectivity
    if (context.isOnline === false) {
        warnings.push('You appear to be offline. Clock in will be processed when connection is restored.');
    }

    // Check if data is stale
    if (context.lastSyncTime && context.isOnline !== false) {
        const stalenessThreshold = 5 * 60 * 1000; // 5 minutes
        const timeSinceSync = Date.now() - context.lastSyncTime.getTime();

        if (timeSinceSync > stalenessThreshold) {
            warnings.push('Data may be outdated. Consider refreshing before clocking in.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validate clock out operation
 */
export function validateClockOut(context: TimesheetValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if employee ID is provided
    if (!context.employeeId) {
        errors.push('Employee information is required to clock out');
        return { isValid: false, errors };
    }

    // Check if currently clocked in
    if (!context.currentTimesheet) {
        errors.push('You are not currently clocked in. Cannot clock out.');
        return { isValid: false, errors };
    }

    // Validate timesheet has required fields
    if (!context.currentTimesheet.id) {
        errors.push('Invalid timesheet data. Please refresh and try again.');
        return { isValid: false, errors };
    }

    if (!context.currentTimesheet.clock_in) {
        errors.push('Invalid clock in time. Please contact support.');
        return { isValid: false, errors };
    }

    // Check for minimum shift duration (prevent accidental immediate clock out)
    const clockInTime = new Date(context.currentTimesheet.clock_in);
    const now = new Date();
    const durationMinutes = (now.getTime() - clockInTime.getTime()) / (1000 * 60);

    if (durationMinutes < 1) {
        warnings.push('Very short shift duration. Are you sure you want to clock out?');
    }

    // Check for unusually long shifts
    if (durationMinutes > 12 * 60) { // 12 hours
        warnings.push('This appears to be a very long shift. Please verify the clock in time is correct.');
    }

    // Check network connectivity
    if (context.isOnline === false) {
        warnings.push('You appear to be offline. Clock out will be processed when connection is restored.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
    };
}

/**
 * Validate timesheet data integrity
 */
export function validateTimesheetData(timesheet: any): ValidationResult {
    const errors: string[] = [];

    if (!timesheet) {
        errors.push('Timesheet data is missing');
        return { isValid: false, errors };
    }

    // Check required fields
    if (!timesheet.id) {
        errors.push('Timesheet ID is missing');
    }

    if (!timesheet.employee_id) {
        errors.push('Employee ID is missing');
    }

    if (!timesheet.clock_in) {
        errors.push('Clock in time is missing');
    }

    // Validate clock in time format
    if (timesheet.clock_in) {
        const clockInDate = new Date(timesheet.clock_in);
        if (isNaN(clockInDate.getTime())) {
            errors.push('Invalid clock in time format');
        } else {
            // Check if clock in time is in the future
            if (clockInDate > new Date()) {
                errors.push('Clock in time cannot be in the future');
            }

            // Check if clock in time is too far in the past (more than 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (clockInDate < sevenDaysAgo) {
                errors.push('Clock in time is too far in the past');
            }
        }
    }

    // Validate clock out time if present
    if (timesheet.clock_out) {
        const clockOutDate = new Date(timesheet.clock_out);
        if (isNaN(clockOutDate.getTime())) {
            errors.push('Invalid clock out time format');
        } else {
            // Check if clock out time is in the future
            if (clockOutDate > new Date()) {
                errors.push('Clock out time cannot be in the future');
            }

            // Check if clock out is after clock in
            if (timesheet.clock_in) {
                const clockInDate = new Date(timesheet.clock_in);
                if (clockOutDate <= clockInDate) {
                    errors.push('Clock out time must be after clock in time');
                }
            }
        }
    }

    // Validate text fields
    if (timesheet.todo && typeof timesheet.todo === 'string') {
        const todoValidation = validateTodo(timesheet.todo);
        errors.push(...todoValidation.errors);
    }

    if (timesheet.note && typeof timesheet.note === 'string') {
        const noteValidation = validateNote(timesheet.note);
        errors.push(...noteValidation.errors);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate employee permissions for timesheet operations
 */
export function validateEmployeePermissions(
    employee: any,
    operation: 'clock_in' | 'clock_out' | 'view' | 'manage'
): ValidationResult {
    const errors: string[] = [];

    if (!employee) {
        errors.push('Employee information is required');
        return { isValid: false, errors };
    }

    // Check if employee is active
    if (employee.status !== 'active') {
        errors.push('Only active employees can use the timesheet system');
        return { isValid: false, errors };
    }

    // Check role-based permissions
    switch (operation) {
        case 'clock_in':
        case 'clock_out':
        case 'view':
            // All active employees can perform these operations
            break;

        case 'manage':
            // Only admins and managers can manage timesheets
            if (!['admin', 'manager'].includes(employee.role)) {
                errors.push('You do not have permission to manage timesheets');
            }
            break;

        default:
            errors.push('Invalid operation specified');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize text input to prevent potential issues
 */
export function sanitizeTextInput(input: string): string {
    if (typeof input !== 'string') {
        return '';
    }

    return input
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .slice(0, 1000); // Truncate to reasonable length
}

/**
 * Format validation errors for user display
 */
export function formatValidationErrors(errors: string[]): string {
    if (errors.length === 0) {
        return '';
    }

    if (errors.length === 1) {
        return errors[0];
    }

    return `Multiple issues found:\n• ${errors.join('\n• ')}`;
}

/**
 * Check if operation should be retried based on error type
 */
export function shouldRetryOperation(error: any): boolean {
    if (!error) return false;

    const retryableErrors = [
        'network error',
        'timeout',
        'connection failed',
        'service unavailable',
        'internal server error',
        'bad gateway',
        'gateway timeout'
    ];

    const errorMessage = (error.message || error.toString()).toLowerCase();

    return retryableErrors.some(retryableError =>
        errorMessage.includes(retryableError)
    );
}

/**
 * Get user-friendly error message from technical error
 */
export function getUserFriendlyErrorMessage(error: any): string {
    if (!error) {
        return 'An unknown error occurred';
    }

    const errorMessage = error.message || error.toString();

    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
        'Employee is already clocked in': 'You are already clocked in. Please clock out first before clocking in again.',
        'Employee is not currently clocked in': 'You are not currently clocked in. Please clock in first before trying to clock out.',
        'Employee not found': 'Your employee profile could not be found. Please contact support.',
        'Employee is not active': 'Your employee account is not active. Please contact support.',
        'Invalid timesheet for clock out operation': 'There was an issue with your current timesheet. Please refresh the page and try again.',
        'Network request failed': 'Unable to connect to the server. Please check your internet connection and try again.',
        'Failed to fetch': 'Unable to connect to the server. Please check your internet connection and try again.',
        'Unauthorized': 'You are not authorized to perform this action. Please log in again.',
        'Forbidden': 'You do not have permission to perform this action.',
        'Internal Server Error': 'A server error occurred. Please try again in a few moments.',
        'Service Unavailable': 'The service is temporarily unavailable. Please try again in a few moments.',
        'Timeout': 'The request timed out. Please try again.',
        'Bad Gateway': 'There was a problem with the server connection. Please try again.',
        'Gateway Timeout': 'The server took too long to respond. Please try again.'
    };

    // Check for exact matches first
    if (errorMappings[errorMessage]) {
        return errorMappings[errorMessage];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMappings)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    // Return original message if no mapping found, but make it more user-friendly
    return `An error occurred: ${errorMessage}. Please try again or contact support if the problem persists.`;
}