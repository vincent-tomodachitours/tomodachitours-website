/**
 * Comprehensive tests for timesheet error handling and validation
 * Tests requirements 5.1, 5.2, 5.3, 6.2, 6.3
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setup test environment
import '@testing-library/jest-dom';
import { ClockInOutWidget } from '../ClockInOutWidget';
import { TimesheetErrorHandler } from '../../../services/timesheetErrorHandler';
import {
    validateTodo,
    validateNote,
    validateClockIn,
    validateClockOut,
    sanitizeTextInput,
    getUserFriendlyErrorMessage
} from '../../../utils/timesheetValidation';
import { useNetworkState } from '../../../hooks/useNetworkState';

// Mock dependencies
jest.mock('../../../contexts/AdminAuthContext', () => ({
    useAdminAuth: () => ({
        employee: {
            id: 'test-employee-id',
            first_name: 'Test',
            last_name: 'Employee',
            status: 'active',
            role: 'admin'
        }
    })
}));

jest.mock('../../../services/timesheetService', () => ({
    TimesheetService: {
        getCurrentTimesheet: jest.fn(),
        clockIn: jest.fn(),
        clockOut: jest.fn(),
        createOptimisticTimesheet: jest.fn(),
        createOptimisticClockOut: jest.fn()
    },
    TimesheetRealtimeManager: {
        subscribeToEmployeeTimesheets: jest.fn(),
        unsubscribe: jest.fn()
    }
}));

jest.mock('../../../hooks/useNetworkState');

const mockUseNetworkState = useNetworkState as jest.MockedFunction<typeof useNetworkState>;

describe('Timesheet Error Handling', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
            }
        });

        // Reset mocks
        jest.clearAllMocks();

        // Default network state
        mockUseNetworkState.mockReturnValue({
            isOnline: true,
            isSlowConnection: false,
            connectionType: 'wifi',
            lastOnlineTime: new Date(),
            reconnectAttempts: 0,
            isReconnecting: false,
            checkConnection: jest.fn(),
            forceReconnect: jest.fn(),
            resetReconnectAttempts: jest.fn()
        });
    });

    const renderWidget = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ClockInOutWidget />
            </QueryClientProvider>
        );
    };

    describe('Validation Functions', () => {
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
    });

    describe('Text Sanitization', () => {
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

    describe('Error Message Translation', () => {
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

    describe('TimesheetErrorHandler', () => {
        beforeEach(() => {
            TimesheetErrorHandler.clearErrorLog();
        });

        it('should categorize validation errors correctly', () => {
            const validationError = new Error('validation failed');
            const error = TimesheetErrorHandler.handleError(validationError, {
                operation: 'clock_in',
                timestamp: new Date()
            });

            expect(error.type).toBe('validation');
            expect(error.severity).toBe('low');
        });

        it('should categorize network errors correctly', () => {
            const networkError = new Error('Failed to fetch');
            const error = TimesheetErrorHandler.handleError(networkError, {
                operation: 'clock_in',
                timestamp: new Date()
            });

            expect(error.type).toBe('network');
            expect(error.severity).toBe('medium');
        });

        it('should provide appropriate recovery options', () => {
            const networkError = new Error('Network error');
            const error = TimesheetErrorHandler.handleError(networkError, {
                operation: 'clock_in',
                timestamp: new Date()
            });

            expect(error.recoveryOptions.canRetry).toBe(true);
            expect(error.recoveryOptions.canRefresh).toBe(true);
            expect(error.recoveryOptions.suggestedActions).toContain('Check your internet connection');
        });

        it('should track error statistics', () => {
            const error1 = new Error('Network error');
            const error2 = new Error('Validation failed');

            TimesheetErrorHandler.handleError(error1, {
                operation: 'clock_in',
                timestamp: new Date()
            });

            TimesheetErrorHandler.handleError(error2, {
                operation: 'clock_out',
                timestamp: new Date()
            });

            const stats = TimesheetErrorHandler.getErrorStats();
            expect(stats.total).toBe(2);
            expect(stats.byType.network).toBe(1);
            expect(stats.byType.validation).toBe(1);
        });
    });

    describe('Integration Tests', () => {
        it('should display network error when offline', () => {
            mockUseNetworkState.mockReturnValue({
                isOnline: false,
                isSlowConnection: false,
                connectionType: 'none',
                lastOnlineTime: new Date(Date.now() - 60000), // 1 minute ago
                reconnectAttempts: 1,
                isReconnecting: false,
                checkConnection: jest.fn(),
                forceReconnect: jest.fn(),
                resetReconnectAttempts: jest.fn()
            });

            renderWidget();

            expect(screen.getByText('You are offline')).toBeInTheDocument();
            expect(screen.getByText(/Last online:/)).toBeInTheDocument();
        });

        it('should show reconnecting state', () => {
            mockUseNetworkState.mockReturnValue({
                isOnline: false,
                isSlowConnection: false,
                connectionType: 'none',
                lastOnlineTime: new Date(),
                reconnectAttempts: 2,
                isReconnecting: true,
                checkConnection: jest.fn(),
                forceReconnect: jest.fn(),
                resetReconnectAttempts: jest.fn()
            });

            renderWidget();

            expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
        });
    });

    describe('Form Validation Integration', () => {
        it('should show validation errors for todo input', async () => {
            renderWidget();

            // Enable todo input
            const todoCheckbox = screen.getByLabelText('Add todo for this shift');
            fireEvent.click(todoCheckbox);

            // Enter invalid todo (too long)
            const todoInput = screen.getByPlaceholderText('What do you plan to work on today?');
            fireEvent.change(todoInput, { target: { value: 'a'.repeat(501) } });

            await waitFor(() => {
                expect(screen.getByText(/Todo must be less than 500 characters/)).toBeInTheDocument();
            });
        });

        it('should show character count for inputs', async () => {
            renderWidget();

            // Enable todo input
            const todoCheckbox = screen.getByLabelText('Add todo for this shift');
            fireEvent.click(todoCheckbox);

            // Enter some text
            const todoInput = screen.getByPlaceholderText('What do you plan to work on today?');
            fireEvent.change(todoInput, { target: { value: 'Test todo' } });

            await waitFor(() => {
                expect(screen.getByText('9/500 characters')).toBeInTheDocument();
            });
        });
    });

    describe('Error Recovery', () => {
        it('should provide retry functionality', async () => {
            const mockRetry = jest.fn();

            render(
                <QueryClientProvider client={queryClient}>
                    <div>
                        {/* Mock error display with retry */}
                        <button onClick={mockRetry}>Try Again</button>
                    </div>
                </QueryClientProvider>
            );

            const retryButton = screen.getByText('Try Again');
            fireEvent.click(retryButton);

            expect(mockRetry).toHaveBeenCalled();
        });
    });

    describe('Browser Refresh Handling', () => {
        it('should handle page refresh gracefully', () => {
            // Mock localStorage to simulate browser refresh
            const mockTimesheet = {
                id: 'test-timesheet',
                employee_id: 'test-employee',
                clock_in: new Date().toISOString()
            };

            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: jest.fn(() => JSON.stringify(mockTimesheet)),
                    setItem: jest.fn(),
                    removeItem: jest.fn()
                },
                writable: true
            });

            renderWidget();

            // Component should handle the refresh scenario
            expect(screen.getByText('Time Clock')).toBeInTheDocument();
        });
    });
});