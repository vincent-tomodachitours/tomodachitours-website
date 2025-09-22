/**
 * Tests for timesheet validation utilities
 * Tests requirements 5.1, 5.2, 5.3, 6.2, 6.3
 */

import {
    validateTodo,
    validateNote,
    validateClockIn,
    validateClockOut,
    sanitizeTextInput,
    getUserFriendlyErrorMessage,
    shouldRetryOperation,
    formatValidationErrors
} from '../timesheetValidation';

describe('Timesheet Validation', () => {
    describe('validateTodo', () => {
        it('should validate todo text length', () => {
            const shortTodo = 'Short todo';
            const longTodo = 'a'.repeat(501);

            expect(validateTodo(shortTodo).isValid).toBe(true);
            expect(validateTodo(longTodo).isValid).toBe(false);
            expect(validateTodo(longTodo).errors[0]).toContain('500 characters');
        });

        it('should warn about whitespace-only content', () => {
            const whitespaceTodo = '   ';
            const result = validateTodo(whitespaceTodo);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Todo contains only whitespace');
        });

        it('should warn about problematic characters', () => {
            const problematicTodo = 'Todo with <script> tags';
            const result = validateTodo(problematicTodo);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Todo contains special characters that may not display correctly');
        });
    });

    describe('validateNote', () => {
        it('should validate note text length', () => {
            const shortNote = 'Short note';
            const longNote = 'a'.repeat(1001);

            expect(validateNote(shortNote).isValid).toBe(true);
            expect(validateNote(longNote).isValid).toBe(false);
            expect(validateNote(longNote).errors[0]).toContain('1000 characters');
        });

        it('should warn about whitespace-only content', () => {
            const whitespaceNote = '   ';
            const result = validateNote(whitespaceNote);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('Note contains only whitespace');
        });
    });

    describe('validateClockIn', () => {
        it('should require employee ID', () => {
            const result = validateClockIn({});
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Employee information is required');
        });

        it('should prevent clock in when already clocked in', () => {
            const result = validateClockIn({
                employeeId: 'test-id',
                currentTimesheet: { id: 'active-timesheet' }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('already clocked in');
        });

        it('should warn when offline', () => {
            const result = validateClockIn({
                employeeId: 'test-id',
                isOnline: false
            });
            expect(result.isValid).toBe(true);
            expect(result.warnings?.[0]).toContain('You appear to be offline');
        });

        it('should warn about stale data', () => {
            const oldSyncTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
            const result = validateClockIn({
                employeeId: 'test-id',
                lastSyncTime: oldSyncTime,
                isOnline: true
            });
            expect(result.isValid).toBe(true);
            expect(result.warnings?.[0]).toContain('Data may be outdated');
        });
    });

    describe('validateClockOut', () => {
        it('should require active timesheet', () => {
            const result = validateClockOut({
                employeeId: 'test-id'
            });
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('not currently clocked in');
        });

        it('should validate timesheet data', () => {
            const result = validateClockOut({
                employeeId: 'test-id',
                currentTimesheet: { id: null }
            });
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Invalid timesheet data');
        });

        it('should warn about very short shifts', () => {
            const now = new Date();
            const result = validateClockOut({
                employeeId: 'test-id',
                currentTimesheet: {
                    id: 'test-id',
                    clock_in: now.toISOString()
                }
            });
            expect(result.isValid).toBe(true);
            expect(result.warnings?.[0]).toContain('Very short shift duration');
        });

        it('should warn about very long shifts', () => {
            const thirteenHoursAgo = new Date(Date.now() - 13 * 60 * 60 * 1000);
            const result = validateClockOut({
                employeeId: 'test-id',
                currentTimesheet: {
                    id: 'test-id',
                    clock_in: thirteenHoursAgo.toISOString()
                }
            });
            expect(result.isValid).toBe(true);
            expect(result.warnings?.[0]).toContain('very long shift');
        });
    });

    describe('sanitizeTextInput', () => {
        it('should sanitize text input', () => {
            const input = '  Multiple   spaces   and\n\nnewlines  ';
            const sanitized = sanitizeTextInput(input);
            expect(sanitized).toBe('Multiple spaces and newlines');
        });

        it('should truncate very long input', () => {
            const longInput = 'a'.repeat(2000);
            const sanitized = sanitizeTextInput(longInput);
            expect(sanitized.length).toBe(1000);
        });

        it('should handle non-string input', () => {
            expect(sanitizeTextInput(null as any)).toBe('');
            expect(sanitizeTextInput(undefined as any)).toBe('');
            expect(sanitizeTextInput(123 as any)).toBe('');
        });
    });

    describe('getUserFriendlyErrorMessage', () => {
        it('should translate technical errors to user-friendly messages', () => {
            const technicalError = new Error('Employee is already clocked in');
            const userMessage = getUserFriendlyErrorMessage(technicalError);
            expect(userMessage).toContain('You are already clocked in');
        });

        it('should handle network errors', () => {
            const networkError = new Error('Failed to fetch');
            const userMessage = getUserFriendlyErrorMessage(networkError);
            expect(userMessage).toContain('Unable to connect to the server');
        });

        it('should provide fallback for unknown errors', () => {
            const unknownError = new Error('Some unknown technical error');
            const userMessage = getUserFriendlyErrorMessage(unknownError);
            expect(userMessage).toContain('An error occurred');
            expect(userMessage).toContain('contact support');
        });
    });

    describe('shouldRetryOperation', () => {
        it('should identify retryable network errors', () => {
            const networkError = new Error('Network error');
            expect(shouldRetryOperation(networkError)).toBe(true);
        });

        it('should identify retryable timeout errors', () => {
            const timeoutError = new Error('Timeout');
            expect(shouldRetryOperation(timeoutError)).toBe(true);
        });

        it('should not retry validation errors', () => {
            const validationError = new Error('Validation failed');
            expect(shouldRetryOperation(validationError)).toBe(false);
        });

        it('should handle null/undefined errors', () => {
            expect(shouldRetryOperation(null)).toBe(false);
            expect(shouldRetryOperation(undefined)).toBe(false);
        });
    });

    describe('formatValidationErrors', () => {
        it('should format single error', () => {
            const errors = ['Single error message'];
            const formatted = formatValidationErrors(errors);
            expect(formatted).toBe('Single error message');
        });

        it('should format multiple errors', () => {
            const errors = ['First error', 'Second error'];
            const formatted = formatValidationErrors(errors);
            expect(formatted).toContain('Multiple issues found:');
            expect(formatted).toContain('• First error');
            expect(formatted).toContain('• Second error');
        });

        it('should handle empty error array', () => {
            const errors: string[] = [];
            const formatted = formatValidationErrors(errors);
            expect(formatted).toBe('');
        });
    });
});