import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClockInOutWidget } from '../ClockInOutWidget';
import { TimesheetService } from '../../../services/timesheetService';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { Timesheet, Employee } from '../../../types';

// Mock dependencies
jest.mock('../../../services/timesheetService');
jest.mock('../../../contexts/AdminAuthContext');

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
    ClockIcon: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
    PlayIcon: ({ className }: { className?: string }) => <div data-testid="play-icon" className={className} />,
    StopIcon: ({ className }: { className?: string }) => <div data-testid="stop-icon" className={className} />
}));

// Mock Button component
jest.mock('../../ui/Button', () => ({
    Button: ({ children, onClick, loading, variant, size, className, ...props }: any) => (
        <button
            onClick={onClick}
            disabled={loading}
            className={className}
            data-testid="button"
            data-variant={variant}
            data-size={size}
            data-loading={loading}
            {...props}
        >
            {children}
        </button>
    )
}));

const mockEmployee: Employee = {
    id: 'emp-1',
    user_id: 'user-1',
    employee_code: 'EMP001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    role: 'tour_guide',
    status: 'active',
    hire_date: '2024-01-01',
    tour_types: ['NIGHT_TOUR'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
};

const mockTimesheet: Timesheet = {
    id: 'ts-1',
    employee_id: 'emp-1',
    clock_in: '2024-01-15T09:00:00Z',
    todo: 'Morning tour prep',
    clock_out: null,
    note: null,
    hours_worked: null,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z',
    employee: mockEmployee
};

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('ClockInOutWidget', () => {
    const mockUseAdminAuth = useAdminAuth as jest.MockedFunction<typeof useAdminAuth>;
    const mockTimesheetService = TimesheetService as jest.Mocked<typeof TimesheetService>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock for useAdminAuth
        mockUseAdminAuth.mockReturnValue({
            employee: mockEmployee,
            loading: false,
            signIn: jest.fn(),
            signOut: jest.fn(),
            hasPermission: jest.fn(),
            hasRole: jest.fn()
        });

        // Mock Date to have consistent time calculations
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-15T10:30:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Loading State', () => {
        it('should show loading skeleton when data is loading', () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
            expect(screen.getByText('Time Clock')).toBeInTheDocument();
            // Loading skeleton should be present
            expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('should show error message when timesheet loading fails', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockRejectedValue(
                new Error('Failed to load')
            );

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Failed to load timesheet status')).toBeInTheDocument();
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });
        });

        it('should retry loading when retry button is clicked', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn()
                .mockRejectedValueOnce(new Error('Failed to load'))
                .mockResolvedValueOnce(null);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Retry'));

            await waitFor(() => {
                expect(screen.getByText('Clock In')).toBeInTheDocument();
            });

            expect(mockTimesheetService.getCurrentTimesheet).toHaveBeenCalledTimes(2);
        });
    });

    describe('Clock In State', () => {
        beforeEach(() => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(null);
        });

        it('should show clock in interface when not clocked in', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Ready to clock in')).toBeInTheDocument();
                expect(screen.getByText('Clock In')).toBeInTheDocument();
                expect(screen.getByText('Add todo for this shift')).toBeInTheDocument();
            });
        });

        it('should show todo input when checkbox is checked', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const todoCheckbox = screen.getByLabelText('Add todo for this shift');
                fireEvent.click(todoCheckbox);
            });

            expect(screen.getByPlaceholderText('What do you plan to work on today?')).toBeInTheDocument();
            expect(screen.getByText('0/500 characters')).toBeInTheDocument();
        });

        it('should validate todo input length', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const todoCheckbox = screen.getByLabelText('Add todo for this shift');
                fireEvent.click(todoCheckbox);
            });

            const todoInput = screen.getByPlaceholderText('What do you plan to work on today?');
            const longText = 'a'.repeat(501);

            fireEvent.change(todoInput, { target: { value: longText } });

            await waitFor(() => {
                expect(screen.getByText('Todo must be less than 500 characters')).toBeInTheDocument();
            });
        });

        it('should clock in successfully without todo', async () => {
            mockTimesheetService.clockIn = jest.fn().mockResolvedValue(mockTimesheet);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const clockInButton = screen.getByText('Clock In');
                fireEvent.click(clockInButton);
            });

            await waitFor(() => {
                expect(mockTimesheetService.clockIn).toHaveBeenCalledWith('emp-1', undefined);
            });
        });

        it('should clock in successfully with todo', async () => {
            mockTimesheetService.clockIn = jest.fn().mockResolvedValue(mockTimesheet);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const todoCheckbox = screen.getByLabelText('Add todo for this shift');
                fireEvent.click(todoCheckbox);
            });

            const todoInput = screen.getByPlaceholderText('What do you plan to work on today?');
            fireEvent.change(todoInput, { target: { value: 'Morning tour prep' } });

            const clockInButton = screen.getByText('Clock In');
            fireEvent.click(clockInButton);

            await waitFor(() => {
                expect(mockTimesheetService.clockIn).toHaveBeenCalledWith('emp-1', 'Morning tour prep');
            });
        });

        it('should show error when clock in fails', async () => {
            mockTimesheetService.clockIn = jest.fn().mockRejectedValue(
                new Error('Employee is already clocked in')
            );

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const clockInButton = screen.getByText('Clock In');
                fireEvent.click(clockInButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Employee is already clocked in')).toBeInTheDocument();
            });
        });

        it('should call onStatusChange callback when clocking in', async () => {
            const mockOnStatusChange = jest.fn();
            mockTimesheetService.clockIn = jest.fn().mockResolvedValue(mockTimesheet);

            render(<ClockInOutWidget onStatusChange={mockOnStatusChange} />, { wrapper: createWrapper() });

            await waitFor(() => {
                const clockInButton = screen.getByText('Clock In');
                fireEvent.click(clockInButton);
            });

            await waitFor(() => {
                expect(mockOnStatusChange).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('Clock Out State', () => {
        beforeEach(() => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(mockTimesheet);
        });

        it('should show clock out interface when clocked in', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Currently clocked in')).toBeInTheDocument();
                expect(screen.getByText('Clock Out')).toBeInTheDocument();
                expect(screen.getByText('Add notes about this shift')).toBeInTheDocument();
            });
        });

        it('should display current timesheet information', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText(/Clocked in at/)).toBeInTheDocument();
                expect(screen.getByText('Todo: Morning tour prep')).toBeInTheDocument();
            });
        });

        it('should show and update duration', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                // Duration should be calculated from clock_in time (09:00) to current time (10:30)
                expect(screen.getByText('1h 30m')).toBeInTheDocument();
            });

            // Advance time by 30 minutes
            act(() => {
                jest.advanceTimersByTime(30 * 60 * 1000);
            });

            await waitFor(() => {
                expect(screen.getByText('2h 0m')).toBeInTheDocument();
            });
        });

        it('should show note input when checkbox is checked', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const noteCheckbox = screen.getByLabelText('Add notes about this shift');
                fireEvent.click(noteCheckbox);
            });

            expect(screen.getByPlaceholderText(/Any notes about your shift/)).toBeInTheDocument();
            expect(screen.getByText('0/1000 characters')).toBeInTheDocument();
        });

        it('should validate note input length', async () => {
            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const noteCheckbox = screen.getByLabelText('Add notes about this shift');
                fireEvent.click(noteCheckbox);
            });

            const noteInput = screen.getByPlaceholderText(/Any notes about your shift/);
            const longText = 'a'.repeat(1001);

            fireEvent.change(noteInput, { target: { value: longText } });

            await waitFor(() => {
                expect(screen.getByText('Note must be less than 1000 characters')).toBeInTheDocument();
            });
        });

        it('should clock out successfully without note', async () => {
            const completedTimesheet = { ...mockTimesheet, clock_out: '2024-01-15T17:00:00Z' };
            mockTimesheetService.clockOut = jest.fn().mockResolvedValue(completedTimesheet);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const clockOutButton = screen.getByText('Clock Out');
                fireEvent.click(clockOutButton);
            });

            await waitFor(() => {
                expect(mockTimesheetService.clockOut).toHaveBeenCalledWith('ts-1', undefined);
            });
        });

        it('should clock out successfully with note', async () => {
            const completedTimesheet = { ...mockTimesheet, clock_out: '2024-01-15T17:00:00Z' };
            mockTimesheetService.clockOut = jest.fn().mockResolvedValue(completedTimesheet);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const noteCheckbox = screen.getByLabelText('Add notes about this shift');
                fireEvent.click(noteCheckbox);
            });

            const noteInput = screen.getByPlaceholderText(/Any notes about your shift/);
            fireEvent.change(noteInput, { target: { value: 'Completed all tasks' } });

            const clockOutButton = screen.getByText('Clock Out');
            fireEvent.click(clockOutButton);

            await waitFor(() => {
                expect(mockTimesheetService.clockOut).toHaveBeenCalledWith('ts-1', 'Completed all tasks');
            });
        });

        it('should show error when clock out fails', async () => {
            mockTimesheetService.clockOut = jest.fn().mockRejectedValue(
                new Error('No active timesheet found')
            );

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const clockOutButton = screen.getByText('Clock Out');
                fireEvent.click(clockOutButton);
            });

            await waitFor(() => {
                expect(screen.getByText('No active timesheet found')).toBeInTheDocument();
            });
        });

        it('should call onStatusChange callback when clocking out', async () => {
            const mockOnStatusChange = jest.fn();
            const completedTimesheet = { ...mockTimesheet, clock_out: '2024-01-15T17:00:00Z' };
            mockTimesheetService.clockOut = jest.fn().mockResolvedValue(completedTimesheet);

            render(<ClockInOutWidget onStatusChange={mockOnStatusChange} />, { wrapper: createWrapper() });

            await waitFor(() => {
                const clockOutButton = screen.getByText('Clock Out');
                fireEvent.click(clockOutButton);
            });

            await waitFor(() => {
                expect(mockOnStatusChange).toHaveBeenCalledWith(false);
            });
        });
    });

    describe('Form Validation', () => {
        it('should prevent clock in with invalid todo', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(null);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const todoCheckbox = screen.getByLabelText('Add todo for this shift');
                fireEvent.click(todoCheckbox);
            });

            const todoInput = screen.getByPlaceholderText('What do you plan to work on today?');
            fireEvent.change(todoInput, { target: { value: 'a'.repeat(501) } });

            const clockInButton = screen.getByText('Clock In');
            fireEvent.click(clockInButton);

            // Should not call clockIn service due to validation error
            expect(mockTimesheetService.clockIn).not.toHaveBeenCalled();
            expect(screen.getByText('Todo must be less than 500 characters')).toBeInTheDocument();
        });

        it('should prevent clock out with invalid note', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(mockTimesheet);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const noteCheckbox = screen.getByLabelText('Add notes about this shift');
                fireEvent.click(noteCheckbox);
            });

            const noteInput = screen.getByPlaceholderText(/Any notes about your shift/);
            fireEvent.change(noteInput, { target: { value: 'a'.repeat(1001) } });

            const clockOutButton = screen.getByText('Clock Out');
            fireEvent.click(clockOutButton);

            // Should not call clockOut service due to validation error
            expect(mockTimesheetService.clockOut).not.toHaveBeenCalled();
            expect(screen.getByText('Note must be less than 1000 characters')).toBeInTheDocument();
        });

        it('should clear validation errors when input becomes valid', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(null);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const todoCheckbox = screen.getByLabelText('Add todo for this shift');
                fireEvent.click(todoCheckbox);
            });

            const todoInput = screen.getByPlaceholderText('What do you plan to work on today?');

            // Enter invalid text
            fireEvent.change(todoInput, { target: { value: 'a'.repeat(501) } });

            await waitFor(() => {
                expect(screen.getByText('Todo must be less than 500 characters')).toBeInTheDocument();
            });

            // Enter valid text
            fireEvent.change(todoInput, { target: { value: 'Valid todo' } });

            await waitFor(() => {
                expect(screen.queryByText('Todo must be less than 500 characters')).not.toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing employee information', async () => {
            mockUseAdminAuth.mockReturnValue({
                employee: null,
                loading: false,
                signIn: jest.fn(),
                signOut: jest.fn(),
                hasPermission: jest.fn(),
                hasRole: jest.fn()
            });

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            // Should not make any API calls without employee
            expect(mockTimesheetService.getCurrentTimesheet).not.toHaveBeenCalled();
        });

        it('should handle timesheet without todo', async () => {
            const timesheetWithoutTodo = { ...mockTimesheet, todo: null };
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(timesheetWithoutTodo);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                expect(screen.getByText('Currently clocked in')).toBeInTheDocument();
                expect(screen.queryByText('Todo:')).not.toBeInTheDocument();
            });
        });

        it('should disable buttons during mutations', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(null);
            mockTimesheetService.clockIn = jest.fn().mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const clockInButton = screen.getByText('Clock In');
                fireEvent.click(clockInButton);
            });

            // Button should be disabled during mutation
            const button = screen.getByTestId('button');
            expect(button).toHaveAttribute('data-loading', 'true');
        });

        it('should clear form when unchecking todo checkbox', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(null);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const todoCheckbox = screen.getByLabelText('Add todo for this shift');
                fireEvent.click(todoCheckbox);
            });

            const todoInput = screen.getByPlaceholderText('What do you plan to work on today?');
            fireEvent.change(todoInput, { target: { value: 'Test todo' } });

            // Uncheck the checkbox
            const todoCheckbox = screen.getByLabelText('Add todo for this shift');
            fireEvent.click(todoCheckbox);

            // Input should be hidden and value cleared
            expect(screen.queryByPlaceholderText('What do you plan to work on today?')).not.toBeInTheDocument();
        });

        it('should clear form when unchecking note checkbox', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(mockTimesheet);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            await waitFor(() => {
                const noteCheckbox = screen.getByLabelText('Add notes about this shift');
                fireEvent.click(noteCheckbox);
            });

            const noteInput = screen.getByPlaceholderText(/Any notes about your shift/);
            fireEvent.change(noteInput, { target: { value: 'Test note' } });

            // Uncheck the checkbox
            const noteCheckbox = screen.getByLabelText('Add notes about this shift');
            fireEvent.click(noteCheckbox);

            // Input should be hidden and value cleared
            expect(screen.queryByPlaceholderText(/Any notes about your shift/)).not.toBeInTheDocument();
        });
    });

    describe('Real-time Updates', () => {
        it('should refetch timesheet data periodically', async () => {
            mockTimesheetService.getCurrentTimesheet = jest.fn().mockResolvedValue(null);

            render(<ClockInOutWidget />, { wrapper: createWrapper() });

            // Initial call
            await waitFor(() => {
                expect(mockTimesheetService.getCurrentTimesheet).toHaveBeenCalledTimes(1);
            });

            // Advance time by 30 seconds (refetch interval)
            act(() => {
                jest.advanceTimersByTime(30000);
            });

            await waitFor(() => {
                expect(mockTimesheetService.getCurrentTimesheet).toHaveBeenCalledTimes(2);
            });
        });
    });
});