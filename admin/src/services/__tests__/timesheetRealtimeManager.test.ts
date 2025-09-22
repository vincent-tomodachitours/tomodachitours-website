import { TimesheetRealtimeManager } from '../timesheetService';

// Mock Supabase
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockOn = jest.fn().mockReturnThis();
const mockChannel = jest.fn();

// Set up the mock return value
mockChannel.mockReturnValue({
    on: mockOn,
    subscribe: mockSubscribe
});

jest.mock('../../lib/supabase', () => ({
    supabase: {
        channel: mockChannel
    }
}));

describe('TimesheetRealtimeManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear all subscriptions before each test
        TimesheetRealtimeManager.cleanup();
    });

    afterEach(() => {
        TimesheetRealtimeManager.cleanup();
    });

    describe('subscribeToEmployeeTimesheets', () => {
        it('should set up subscription for specific employee', () => {
            const employeeId = 'employee-123';
            const onUpdate = jest.fn();
            const subscriptionKey = 'test-key';

            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                employeeId,
                onUpdate,
                subscriptionKey
            );

            expect(mockChannel).toHaveBeenCalledWith(`timesheet-employee-${employeeId}`);
            expect(mockOn).toHaveBeenCalledWith(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timesheets',
                    filter: `employee_id=eq.${employeeId}`
                },
                expect.any(Function)
            );
            expect(mockSubscribe).toHaveBeenCalled();
        });

        it('should clean up existing subscription before creating new one', () => {
            const employeeId = 'employee-123';
            const onUpdate = jest.fn();
            const subscriptionKey = 'test-key';

            // Create first subscription
            const mockSubscription1 = { unsubscribe: jest.fn() };
            mockSubscribe.mockReturnValueOnce(mockSubscription1);

            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                employeeId,
                onUpdate,
                subscriptionKey
            );

            // Create second subscription with same key
            const mockSubscription2 = { unsubscribe: jest.fn() };
            mockSubscribe.mockReturnValueOnce(mockSubscription2);

            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                employeeId,
                onUpdate,
                subscriptionKey
            );

            expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
            expect(mockChannel).toHaveBeenCalledTimes(2);
        });

        it('should call onUpdate when payload is received', () => {
            const employeeId = 'employee-123';
            const onUpdate = jest.fn();
            const testPayload = { eventType: 'INSERT', new: { id: '1' } };

            let payloadHandler: (payload: any) => void;
            mockOn.mockImplementation((event, config, handler) => {
                payloadHandler = handler;
                return mockOn;
            });

            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                employeeId,
                onUpdate
            );

            // Simulate receiving a payload
            payloadHandler!(testPayload);

            expect(onUpdate).toHaveBeenCalledWith(testPayload);
        });
    });

    describe('subscribeToAllTimesheets', () => {
        it('should set up subscription for all timesheets', () => {
            const onUpdate = jest.fn();
            const subscriptionKey = 'all-timesheets';

            TimesheetRealtimeManager.subscribeToAllTimesheets(onUpdate, subscriptionKey);

            expect(mockChannel).toHaveBeenCalledWith('timesheet-all');
            expect(mockOn).toHaveBeenCalledWith(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timesheets'
                },
                expect.any(Function)
            );
            expect(mockSubscribe).toHaveBeenCalled();
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe from specific subscription', () => {
            const employeeId = 'employee-123';
            const onUpdate = jest.fn();
            const subscriptionKey = 'test-key';

            const mockSubscription = { unsubscribe: jest.fn() };
            mockSubscribe.mockReturnValue(mockSubscription);

            TimesheetRealtimeManager.subscribeToEmployeeTimesheets(
                employeeId,
                onUpdate,
                subscriptionKey
            );

            TimesheetRealtimeManager.unsubscribe(subscriptionKey);

            expect(mockSubscription.unsubscribe).toHaveBeenCalled();
        });

        it('should handle unsubscribing non-existent subscription', () => {
            expect(() => {
                TimesheetRealtimeManager.unsubscribe('non-existent');
            }).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('should unsubscribe from all subscriptions', () => {
            const mockSubscription1 = { unsubscribe: jest.fn() };
            const mockSubscription2 = { unsubscribe: jest.fn() };

            mockSubscribe
                .mockReturnValueOnce(mockSubscription1)
                .mockReturnValueOnce(mockSubscription2);

            // Create multiple subscriptions
            TimesheetRealtimeManager.subscribeToEmployeeTimesheets('emp1', jest.fn(), 'key1');
            TimesheetRealtimeManager.subscribeToAllTimesheets(jest.fn(), 'key2');

            TimesheetRealtimeManager.cleanup();

            expect(mockSubscription1.unsubscribe).toHaveBeenCalled();
            expect(mockSubscription2.unsubscribe).toHaveBeenCalled();
        });
    });
});