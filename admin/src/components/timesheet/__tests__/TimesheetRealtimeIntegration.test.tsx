import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimesheetDashboard } from '../../../pages/timesheet/TimesheetDashboard';
import { TimesheetRealtimeManager } from '../../../services/timesheetService';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';

// Mock dependencies
jest.mock('../../../contexts/AdminAuthContext');
jest.mock('../../../services/timesheetService');
jest.mock('../../../services/employeeService');

const mockUseAdminAuth = useAdminAuth as jest.MockedFunction<typeof useAdminAuth>;
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

// Mock TimesheetService
jest.mock('../../../services/timesheetService', () => ({
    TimesheetService: {
        getCurrentTimesheet: jest.fn().mockResolvedValue(null),
        getRecentTimesheets: jest.fn().mockResolvedValue([]),
        getTimesheetStats: jest.fn().mockResolvedValue({
            activeEmployees: 0,
            totalHoursToday: 0,
            totalHoursThisWeek: 0,
            totalHoursThisMonth: 0
        })
    },
    TimesheetRealtimeManager: {
        subscribeToEmployeeTimesheets: jest.fn(),
        unsubscribe: jest.fn(),
        cleanup: jest.fn()
    }
}));

describe('Timesheet Real-time Integration', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    refetchOnWindowFocus: false
                },
                mutations: { retry: false }
            }
        });

        mockUseAdminAuth.mockReturnValue({
            employee: mockEmployee,
            hasPermission: jest.fn().mockReturnValue(true),
            isLoading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn()
        });

        jest.clearAllMocks();
    });

    const renderDashboard = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <TimesheetDashboard />
            </QueryClientProvider>
        );
    };

    it('should set up real-time subscription on mount', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalledWith(
                mockEmployee.id,
                expect.any(Function),
                `dashboard-${mockEmployee.id}`
            );
        });
    });

    it('should clean up subscription on unmount', async () => {
        const { unmount } = renderDashboard();

        await waitFor(() => {
            expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalled();
        });

        unmount();

        expect(mockRealtimeManager.unsubscribe).toHaveBeenCalledWith(`dashboard-${mockEmployee.id}`);
    });

    it('should display timesheet dashboard content', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Timesheet')).toBeInTheDocument();
            expect(screen.getByText('Track your work hours and manage your shifts')).toBeInTheDocument();
        });
    });

    it('should handle real-time updates through callback', async () => {
        let realtimeCallback: (payload: any) => void;

        mockRealtimeManager.subscribeToEmployeeTimesheets.mockImplementation(
            (employeeId, callback, key) => {
                realtimeCallback = callback;
                return {} as any;
            }
        );

        renderDashboard();

        await waitFor(() => {
            expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalled();
        });

        // Verify callback was captured
        expect(realtimeCallback!).toBeDefined();
        expect(typeof realtimeCallback!).toBe('function');

        // Test that callback can be called without errors
        expect(() => {
            realtimeCallback!({ eventType: 'INSERT', new: {} });
        }).not.toThrow();
    });

    it('should handle subscription setup with different employees', async () => {
        const employee2 = { ...mockEmployee, id: 'employee-456' };

        // First render with employee 1
        const { rerender } = renderDashboard();

        await waitFor(() => {
            expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalledWith(
                mockEmployee.id,
                expect.any(Function),
                `dashboard-${mockEmployee.id}`
            );
        });

        // Change employee and rerender
        mockUseAdminAuth.mockReturnValue({
            employee: employee2,
            hasPermission: jest.fn().mockReturnValue(true),
            isLoading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn()
        });

        rerender(
            <QueryClientProvider client={queryClient}>
                <TimesheetDashboard />
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(mockRealtimeManager.subscribeToEmployeeTimesheets).toHaveBeenCalledWith(
                employee2.id,
                expect.any(Function),
                `dashboard-${employee2.id}`
            );
        });
    });

    it('should not set up subscription when no employee', async () => {
        mockUseAdminAuth.mockReturnValue({
            employee: null,
            hasPermission: jest.fn().mockReturnValue(true),
            isLoading: false,
            error: null,
            login: jest.fn(),
            logout: jest.fn()
        });

        renderDashboard();

        // Wait a bit to ensure no subscription is set up
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockRealtimeManager.subscribeToEmployeeTimesheets).not.toHaveBeenCalled();
    });
});