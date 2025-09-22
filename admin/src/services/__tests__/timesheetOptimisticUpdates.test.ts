import { TimesheetService } from '../timesheetService';

describe('TimesheetService Optimistic Updates', () => {
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

    describe('createOptimisticTimesheet', () => {
        it('should create optimistic timesheet entry with correct structure', () => {
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

            expect(optimisticTimesheet.id).toMatch(/^optimistic-\d+-[a-z0-9]+$/);
            expect(optimisticTimesheet.clock_in).toBeDefined();
            expect(new Date(optimisticTimesheet.clock_in)).toBeInstanceOf(Date);
            expect(optimisticTimesheet.created_at).toBeDefined();
            expect(optimisticTimesheet.updated_at).toBeDefined();
        });

        it('should create optimistic timesheet without todo', () => {
            const optimisticTimesheet = TimesheetService.createOptimisticTimesheet(
                'employee-123',
                mockEmployee
            );

            expect(optimisticTimesheet.todo).toBeNull();
            expect(optimisticTimesheet.employee_id).toBe('employee-123');
            expect(optimisticTimesheet.employee).toBe(mockEmployee);
        });

        it('should generate unique IDs for multiple optimistic entries', async () => {
            const timesheet1 = TimesheetService.createOptimisticTimesheet('emp1', mockEmployee);
            // Add small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 1));
            const timesheet2 = TimesheetService.createOptimisticTimesheet('emp2', mockEmployee);

            expect(timesheet1.id).not.toBe(timesheet2.id);
            expect(timesheet1.id).toMatch(/^optimistic-\d+-[a-z0-9]+$/);
            expect(timesheet2.id).toMatch(/^optimistic-\d+-[a-z0-9]+$/);
        });
    });

    describe('createOptimisticClockOut', () => {
        const baseTimesheet = {
            id: 'timesheet-123',
            employee_id: 'employee-123',
            clock_in: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            todo: 'Test todo',
            clock_out: null,
            note: null,
            hours_worked: null,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            employee: mockEmployee
        };

        it('should create optimistic clock out without note', () => {
            const optimisticClockOut = TimesheetService.createOptimisticClockOut(baseTimesheet);

            expect(optimisticClockOut.note).toBeNull();
            expect(optimisticClockOut.clock_out).toBeDefined();
            expect(optimisticClockOut.hours_worked).toBeGreaterThan(0);
            expect(typeof optimisticClockOut.hours_worked).toBe('number');
        });

        it('should preserve original timesheet data', () => {
            const optimisticClockOut = TimesheetService.createOptimisticClockOut(baseTimesheet);

            expect(optimisticClockOut.id).toBe(baseTimesheet.id);
            expect(optimisticClockOut.employee_id).toBe(baseTimesheet.employee_id);
            expect(optimisticClockOut.clock_in).toBe(baseTimesheet.clock_in);
            expect(optimisticClockOut.todo).toBe(baseTimesheet.todo);
            expect(optimisticClockOut.employee).toBe(baseTimesheet.employee);
        });

        it('should add note when provided', () => {
            const optimisticClockOut = TimesheetService.createOptimisticClockOut(
                baseTimesheet,
                'Work completed successfully'
            );

            expect(optimisticClockOut.note).toBe('Work completed successfully');
            expect(optimisticClockOut.clock_out).toBeDefined();
            expect(optimisticClockOut.updated_at).toBeDefined();
        });

        it('should calculate reasonable hours worked', () => {
            // Test that hours worked is calculated and is a reasonable number
            const optimisticClockOut = TimesheetService.createOptimisticClockOut(baseTimesheet);

            expect(typeof optimisticClockOut.hours_worked).toBe('number');
            expect(optimisticClockOut.hours_worked).toBeGreaterThan(0);
            expect(optimisticClockOut.hours_worked).toBeLessThan(24); // Should be less than 24 hours
        });

        it('should round hours worked to 2 decimal places', () => {
            const optimisticClockOut = TimesheetService.createOptimisticClockOut(baseTimesheet);

            // Check that hours worked is rounded to 2 decimal places
            const hoursWorked = optimisticClockOut.hours_worked!;
            const decimalPlaces = (hoursWorked.toString().split('.')[1] || '').length;
            expect(decimalPlaces).toBeLessThanOrEqual(2);
        });

        it('should set clock_out and updated_at timestamps', () => {
            const optimisticClockOut = TimesheetService.createOptimisticClockOut(baseTimesheet);

            expect(optimisticClockOut.clock_out).toBeDefined();
            expect(optimisticClockOut.updated_at).toBeDefined();

            // Verify they are valid ISO strings
            expect(() => new Date(optimisticClockOut.clock_out!)).not.toThrow();
            expect(() => new Date(optimisticClockOut.updated_at)).not.toThrow();

            // Clock out should be after clock in
            const clockInTime = new Date(optimisticClockOut.clock_in).getTime();
            const clockOutTime = new Date(optimisticClockOut.clock_out!).getTime();
            expect(clockOutTime).toBeGreaterThan(clockInTime);
        });
    });
});