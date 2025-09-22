// Mock Supabase first
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockOn = jest.fn();

jest.mock('../../lib/supabase', () => {
    const mockChannel = jest.fn().mockReturnValue({
        on: mockOn.mockReturnThis(),
        subscribe: mockSubscribe
    });

    return {
        supabase: {
            channel: mockChannel,
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        is: jest.fn().mockReturnValue({
                            order: jest.fn().mockReturnValue({
                                limit: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                                })
                            })
                        })
                    })
                })
            })
        }
    };
});

import { TimesheetService, TimesheetRealtimeManager } from '../timesheetService';

describe('TimesheetService Real-time Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        TimesheetRealtimeManager.cleanup();
    });

    afterEach(() => {
        TimesheetRealtimeManager.cleanup();
    });

    describe('Optimistic Updates', () => {
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

        it('should create optimistic timesheet entry', () => {
            const optimisticTimesheet = TimesheetService.createOptimisticTimesheet(
                'employee-123',
                mockEmployee,
                'Test todo'
            );

            expect(optimisticTimesheet).toMatchObject({
                employee_id: 'employee-123',
                todo: 'Test todo',
                clock_out: null,
                note: null,
                hours_worked: null,
                employee: mockEmployee
            });

            expect(optimisticTimesheet.id).toMatch(/^optimistic-\d+$/);
            expect(optimisticTimesheet.clock_in).toBeDefined();
            expect(new Date(optimisticTimesheet.clock_in)).toBeInstanceOf(Date);
        });

        it('should create optimistic clock out update', () => {
            const baseTimesheet = {
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

            const optimisticClockOut = TimesheetService.createOptimisticClockOut(
                baseTimesheet,
                'Completed tasks'
            );

            expect(optimisticClockOut).toMatchObject({
                ...baseTimesheet,
                note: 'Completed tasks',
                clock_out: expect.any(String),
                hours_worked: expect.any(Number),
                updated_at: expect.any(String)
            });

            expect(optimisticClockOut.hours_worked).toBeGreaterThan(0);
            expect(new Date(optimisticClockOut.clock_out!)).toBeInstanceOf(Date);
        });

        it('should calculate hours worked correctly in optimistic update', () => {
            const clockInTime = new Date('2024-01-01T09:00:00Z');
            const baseTimesheet = {
                id: 'timesheet-123',
                employee_id: 'employee-123',
                clock_in: clockInTime.toISOString(),
                todo: null,
                clock_out: null,
                note: null,
                hours_worked: null,
                created_at: clockInTime.toISOString(),
                updated_at: clockInTime.toISOString(),
                employee: mockEmployee
            };

            // Mock current time to be 8 hours later
            const mockNow = new Date(clockInTime.getTime() + 8 * 60 * 60 * 1000);
            jest.spyOn(Date, 'now').mockReturnValue(mockNow.getTime());
            jest.spyOn(global, 'Date').mockImplementation((...args) => {
                if (args.length === 0) {
                    return mockNow;
                }
                return new (jest.requireActual('Date'))(...args);
            });

            const optimisticClockOut = TimesheetService.createOptimisticClockOut(baseTimesheet);

            expect(optimisticClockOut.hours_worked).toBe(8);

            // Restore mocks
            jest.restoreAllMocks();
        });
    });

    describe('Real-time Manager Integration', () => {
        it('should integrate with TimesheetService methods', async () => {
            const onUpdate = jest.fn();

            // Set up subscription
            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                'employee-123',
                onUpdate,
                'test-integration'
            );

            expect(mockChannel).toHaveBeenCalledWith('timesheet-employee-employee-123');
            expect(mockOn).toHaveBeenCalledWith(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timesheets',
                    filter: 'employee_id=eq.employee-123'
                },
                expect.any(Function)
            );
            expect(mockSubscribe).toHaveBeenCalled();
        });

        it('should handle subscription cleanup properly', () => {
            const mockSubscription = { unsubscribe: jest.fn() };
            mockSubscribe.mockReturnValue(mockSubscription);

            const onUpdate = jest.fn();

            // Set up subscription
            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                'employee-123',
                onUpdate,
                'test-cleanup'
            );

            // Clean up
            TimesheetRealtimeManager.unsubscribe('test-cleanup');

            expect(mockSubscription.unsubscribe).toHaveBeenCalled();
        });

        it('should handle multiple subscriptions', () => {
            const mockSubscription1 = { unsubscribe: jest.fn() };
            const mockSubscription2 = { unsubscribe: jest.fn() };

            mockSubscribe
                .mockReturnValueOnce(mockSubscription1)
                .mockReturnValueOnce(mockSubscription2);

            // Set up multiple subscriptions
            TimesheetRealtimeManager.subscribeToEmployeeTimesheets('emp1', jest.fn(), 'key1');
            TimesheetRealtimeManager.subscribeToAllTimesheets(jest.fn(), 'key2');

            expect(mockChannel).toHaveBeenCalledTimes(2);
            expect(mockSubscribe).toHaveBeenCalledTimes(2);

            // Clean up all
            TimesheetRealtimeManager.cleanup();

            expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
            expect(mockSubscription2.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('Error Handling and State Management', () => {
        it('should handle subscription errors gracefully', () => {
            const onUpdate = jest.fn();
            mockSubscribe.mockImplementation(() => {
                throw new Error('Subscription failed');
            });

            expect(() => {
                TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                    'employee-123',
                    onUpdate,
                    'error-test'
                );
            }).toThrow('Subscription failed');
        });

        it('should handle callback errors gracefully', () => {
            const onUpdate = jest.fn().mockImplementation(() => {
                throw new Error('Callback error');
            });

            let callbackHandler: (payload: any) => void;
            mockOn.mockImplementation((event, config, handler) => {
                callbackHandler = handler;
                return mockOn;
            });

            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                'employee-123',
                onUpdate,
                'callback-error-test'
            );

            // Simulate payload that causes callback error
            expect(() => {
                callbackHandler!({ eventType: 'INSERT', new: {} });
            }).toThrow('Callback error');
        });
    });
});