import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClockInOutWidget } from '../ClockInOutWidget';
import { TimesheetService, TimesheetRealtimeManager } from '../../../services/timesheetService';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';

// Setup DOM environment
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('../../../contexts/AdminAuthContext');
jest.mock('../../../services/timesheetService');

const mockUseAdminAuth = useAdminAuth as jest.MockedFunction<typeof useAdminAuth>;
const mockTimesheetService = TimesheetService as jest.Mocked<typeof TimesheetService>;
const mockRealtimeManager = TimesheetRealtimeManager as jest.Mocked<typeof TimesheetRealtimeManager>;

const mockEmployee = {
    id: 'employee-123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    role: 'employee' as const,
    status: 'active' as const,
    employee_code: 'EMP001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
};

const mockTimesheet = {
    id: 'timesheet-123',
    employee_id: 'employee-123',
    clock_in: '2024-01-01T09:00:00Z',
    todo: 'Test todo',
    clock_out: null,
    note: null,
    hours_worked: null,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2024-01-01T09:00:00Z',
    employee: mockEmployee
};

describe('ClockInOutWidget Real-time Features', () => {
    let queryClient: QueryClient;
    let mockOnStatusChange: jest.Mock;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '<div id="root"></div>';

        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    refetchOnWindowFocus: false
                },
                mutations: { retry: false }
            }
        });

        mockOnStatusChange = jest.fn();

        mockUseAdminAuth.mockReturnValue({
            employee: mockEmployee,
            hasPermission: jest.fn().mockReturnValue(true),
            isLoading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn()
        });

        // Reset all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const renderWidget = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ClockInOutWidget onStatusChange={mockOnStatusChange} />
            </QueryClientProvider>
        );
    };

    describe('Real-time Subscription', () => {
        it('should set up real-time subscription on mount', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(null);

            renderWidget();

            await waitFor(() => {
                expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalledWith(
                    mockEmployee.id,
                    expect.any(Function),
                    `widget-${mockEmployee.id}`
                );
            });
        });

        it('should clean up subscription on unmount', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(null);

            const { unmount } = renderWidget();

            await waitFor(() => {
                expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalled();
            });

            unmount();

            expect(mockRealtimeManager.unsubscribe).toHaveBeenCalledWith(`widget-${mockEmployee.id}`);
        });

        it('should handle real-time updates', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(null);

            let realtimeCallback: (payload: any) => void;
            mockRealtimeManager.subscribeToEmployeeTimesheets.mockImplementation(
                (employeeId, callback, key) => {
                    realtimeCallback = callback;
                    return {} as any;
                }
            );

            renderWidget();

            await waitFor(() => {
                expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalled();
            });

            // Simulate real-time update
            const mockPayload = { eventType: 'INSERT', new: mockTimesheet };

            act(() => {
                realtimeCallback!(mockPayload);
            });

            // Should invalidate queries
            await waitFor(() => {
                expect(mockTimesheetService.getCurrentTimesheet).toHaveBeenCalledTimes(2); // Initial + after real-time update
            });
        });
    });

    describe('Optimistic Updates', () => {
        it('should perform optimistic update on clock in', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(null);
            mockTimesheetService.createOptimisticTimesheet.mockReturnValue({
                ...mockTimesheet,
                id: 'optimistic-123'
            });

            // Mock successful clock in
            mockTimesheetService.clockIn.mockResolvedValue(mockTimesheet);

            renderWidget();

            await waitFor(() => {
                expect(screen.getByText('Clock In')).toBeInTheDocument();
            });

            // Click clock in
            fireEvent.click(screen.getByText('Clock In'));

            // Should create optimistic update
            await waitFor(() => {
                expect(mockTimesheetService.createOptimisticTimesheet).toHaveBeenCalledWith(
                    mockEmployee.id,
                    mockEmployee,
                    undefined
                );
            });

            // Should call onStatusChange optimistically
            expect(mockOnStatusChange).toHaveBeenCalledWith(true);
        });

        it('should rollback optimistic update on clock in failure', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(null);
            mockTimesheetService.createOptimisticTimesheet.mockReturnValue({
                ...mockTimesheet,
                id: 'optimistic-123'
            });

            // Mock failed clock in
            mockTimesheetService.clockIn.mockRejectedValue(new Error('Clock in failed'));

            renderWidget();

            await waitFor(() => {
                expect(screen.getByText('Clock In')).toBeInTheDocument();
            });

            // Click clock in
            fireEvent.click(screen.getByText('Clock In'));

            // Should show error and rollback
            await waitFor(() => {
                expect(screen.getByText(/Clock in failed/)).toBeInTheDocument();
            });

            // Should rollback onStatusChange
            expect(mockOnStatusChange).toHaveBeenCalledWith(false);
        });

        it('should perform optimistic update on clock out', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(mockTimesheet);
            mockTimesheetService.createOptimisticClockOut.mockReturnValue({
                ...mockTimesheet,
                clock_out: '2024-01-01T17:00:00Z',
                hours_worked: 8
            });

            // Mock successful clock out
            mockTimesheetService.clockOut.mockResolvedValue({
                ...mockTimesheet,
                clock_out: '2024-01-01T17:00:00Z',
                hours_worked: 8
            });

            renderWidget();

            await waitFor(() => {
                expect(screen.getByText('Clock Out')).toBeInTheDocument();
            });

            // Click clock out
            fireEvent.click(screen.getByText('Clock Out'));

            // Should create optimistic update
            await waitFor(() => {
                expect(mockTimesheetService.createOptimisticClockOut).toHaveBeenCalledWith(
                    mockTimesheet,
                    undefined
                );
            });
        });
    });

    describe('Connection State', () => {
        it('should show connection status indicator', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(null);

            renderWidget();

            await waitFor(() => {
                expect(screen.getByText('Live')).toBeInTheDocument();
            });
        });

        it('should show offline status when disconnected', async () => {
            mockTimesheetService.getCurrentTimesheet.mockRejectedValue(new Error('Network error'));

            renderWidget();

            await waitFor(() => {
                expect(screen.getByText('Offline')).toBeInTheDocument();
            });
        });

        it('should show retry connection option when offline', async () => {
            mockTimesheetService.getCurrentTimesheet.mockRejectedValue(new Error('Network error'));

            renderWidget();

            await waitFor(() => {
                expect(screen.getByText('Connection lost. Data may not be up to date.')).toBeInTheDocument();
                expect(screen.getByText('Retry connection')).toBeInTheDocument();
            });
        });

        it('should retry connection when retry button is clicked', async () => {
            mockTimesheetService.getCurrentTimesheet.mockRejectedValue(new Error('Network error'));

            renderWidget();

            await waitFor(() => {
                expect(screen.getByText('Retry connection')).toBeInTheDocument();
            });

            // Click retry
            fireEvent.click(screen.getByText('Retry connection'));

            // Should attempt to reconnect
            expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalledTimes(2);
        });
    });

    describe('Concurrent Access Handling', () => {
        it('should handle state conflicts gracefully', async () => {
            mockTimesheetService.getCurrentTimesheet.mockResolvedValue(null);

            renderWidget();

            // Simulate concurrent state change via real-time update
            let realtimeCallback: (payload: any) => void;
            mockRealtimeManager.subscribeToEmployeeTimesheets.mockImplementation(
                (employeeId, callback, key) => {
                    realtimeCallback = callback;
                    return {} as any;
                }
            );

            await waitFor(() => {
                expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalled();
            });

            // Simulate another user clocking in this employee
            const conflictPayload = { eventType: 'INSERT', new: mockTimesheet };

            act(() => {
                realtimeCallback!(conflictPayload);
            });

            // Should refresh data to resolve conflict
            await waitFor(() => {
                expect(mockTimesheetService.getCurrentTimesheet).toHaveBeenCalledTimes(2);
            });
        });
    });
});