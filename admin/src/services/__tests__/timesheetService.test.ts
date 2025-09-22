import { TimesheetService } from '../timesheetService';
import { supabase } from '../../lib/supabase';
import { Timesheet, Employee, PayrollSummary } from '../../types';

// Mock Supabase client
jest.mock('../../lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn(),
            single: jest.fn(),
        }))
    }
}));

// Mock console methods to avoid noise in tests
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

describe('TimesheetService', () => {
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
        clock_out: '2024-01-15T17:00:00Z',
        note: 'Good day',
        hours_worked: 8,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T17:00:00Z',
        employee: mockEmployee
    };

    beforeEach(() => {
        jest.clearAllMocks();
        consoleSpy.mockClear();
    });

    afterAll(() => {
        consoleSpy.mockRestore();
    });

    describe('getCurrentTimesheet', () => {
        it('should return current active timesheet for employee', async () => {
            const mockSupabaseChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: mockTimesheet, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

            const result = await TimesheetService.getCurrentTimesheet('emp-1');

            expect(supabase.from).toHaveBeenCalledWith('timesheets');
            expect(mockSupabaseChain.select).toHaveBeenCalledWith(`
                    *,
                    employee:employees(*)
                `);
            expect(mockSupabaseChain.eq).toHaveBeenCalledWith('employee_id', 'emp-1');
            expect(mockSupabaseChain.is).toHaveBeenCalledWith('clock_out', null);
            expect(mockSupabaseChain.order).toHaveBeenCalledWith('clock_in', { ascending: false });
            expect(mockSupabaseChain.limit).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockTimesheet);
        });

        it('should return null when no active timesheet exists', async () => {
            const mockSupabaseChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

            const result = await TimesheetService.getCurrentTimesheet('emp-1');

            expect(result).toBeNull();
        });

        it('should throw error when database query fails', async () => {
            const mockError = new Error('Database error');
            const mockSupabaseChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: mockError })
            };

            (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

            await expect(TimesheetService.getCurrentTimesheet('emp-1')).rejects.toThrow('Database error');
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching current timesheet:', mockError);
        });
    });

    describe('clockIn', () => {
        it('should successfully clock in employee with todo', async () => {
            // Mock getCurrentTimesheet to return null (not clocked in)
            const getCurrentTimesheetSpy = jest.spyOn(TimesheetService, 'getCurrentTimesheet')
                .mockResolvedValue(null);

            // Mock employee verification
            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
            };

            // Mock timesheet insertion
            const timesheetChain = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockTimesheet, error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(employeeChain) // First call for employee verification
                .mockReturnValueOnce(timesheetChain); // Second call for timesheet insertion

            const result = await TimesheetService.clockIn('emp-1', 'Morning tour prep');

            expect(getCurrentTimesheetSpy).toHaveBeenCalledWith('emp-1');
            expect(employeeChain.select).toHaveBeenCalledWith('id, status');
            expect(employeeChain.eq).toHaveBeenCalledWith('id', 'emp-1');
            expect(employeeChain.eq).toHaveBeenCalledWith('status', 'active');
            expect(timesheetChain.insert).toHaveBeenCalledWith({
                employee_id: 'emp-1',
                clock_in: expect.any(String),
                todo: 'Morning tour prep'
            });
            expect(result).toEqual(mockTimesheet);

            getCurrentTimesheetSpy.mockRestore();
        });

        it('should successfully clock in employee without todo', async () => {
            const getCurrentTimesheetSpy = jest.spyOn(TimesheetService, 'getCurrentTimesheet')
                .mockResolvedValue(null);

            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
            };

            const timesheetChain = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockTimesheet, error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(employeeChain)
                .mockReturnValueOnce(timesheetChain);

            const result = await TimesheetService.clockIn('emp-1');

            expect(timesheetChain.insert).toHaveBeenCalledWith({
                employee_id: 'emp-1',
                clock_in: expect.any(String),
                todo: null
            });
            expect(result).toEqual(mockTimesheet);

            getCurrentTimesheetSpy.mockRestore();
        });

        it('should throw error when employee is already clocked in', async () => {
            const getCurrentTimesheetSpy = jest.spyOn(TimesheetService, 'getCurrentTimesheet')
                .mockResolvedValue(mockTimesheet);

            await expect(TimesheetService.clockIn('emp-1', 'Test todo'))
                .rejects.toThrow('Employee is already clocked in. Please clock out first.');

            getCurrentTimesheetSpy.mockRestore();
        });

        it('should throw error when employee is not found or inactive', async () => {
            const getCurrentTimesheetSpy = jest.spyOn(TimesheetService, 'getCurrentTimesheet')
                .mockResolvedValue(null);

            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
            };

            (supabase.from as jest.Mock).mockReturnValue(employeeChain);

            await expect(TimesheetService.clockIn('emp-1'))
                .rejects.toThrow('Employee not found or not active');

            getCurrentTimesheetSpy.mockRestore();
        });

        it('should throw error when timesheet insertion fails', async () => {
            const getCurrentTimesheetSpy = jest.spyOn(TimesheetService, 'getCurrentTimesheet')
                .mockResolvedValue(null);

            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
            };

            const timesheetChain = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(employeeChain)
                .mockReturnValueOnce(timesheetChain);

            await expect(TimesheetService.clockIn('emp-1'))
                .rejects.toThrow('Insert failed');

            getCurrentTimesheetSpy.mockRestore();
        });
    });

    describe('clockOut', () => {
        it('should successfully clock out with note', async () => {
            const activeTimesheet = { ...mockTimesheet, clock_out: null };
            const completedTimesheet = { ...mockTimesheet, clock_out: '2024-01-15T17:00:00Z', note: 'Shift completed' };

            // Mock timesheet verification
            const verifyChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: activeTimesheet, error: null })
            };

            // Mock timesheet update
            const updateChain = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: completedTimesheet, error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(verifyChain)
                .mockReturnValueOnce(updateChain);

            const result = await TimesheetService.clockOut('ts-1', 'Shift completed');

            expect(verifyChain.select).toHaveBeenCalledWith('id, employee_id, clock_in, clock_out');
            expect(verifyChain.eq).toHaveBeenCalledWith('id', 'ts-1');
            expect(verifyChain.is).toHaveBeenCalledWith('clock_out', null);
            expect(updateChain.update).toHaveBeenCalledWith({
                clock_out: expect.any(String),
                note: 'Shift completed',
                updated_at: expect.any(String)
            });
            expect(result).toEqual(completedTimesheet);
        });

        it('should successfully clock out without note', async () => {
            const activeTimesheet = { ...mockTimesheet, clock_out: null };
            const completedTimesheet = { ...mockTimesheet, clock_out: '2024-01-15T17:00:00Z' };

            const verifyChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: activeTimesheet, error: null })
            };

            const updateChain = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: completedTimesheet, error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(verifyChain)
                .mockReturnValueOnce(updateChain);

            const result = await TimesheetService.clockOut('ts-1');

            expect(updateChain.update).toHaveBeenCalledWith({
                clock_out: expect.any(String),
                note: null,
                updated_at: expect.any(String)
            });
            expect(result).toEqual(completedTimesheet);
        });

        it('should throw error when active timesheet not found', async () => {
            const verifyChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
            };

            (supabase.from as jest.Mock).mockReturnValue(verifyChain);

            await expect(TimesheetService.clockOut('ts-1'))
                .rejects.toThrow('Active timesheet not found');
        });

        it('should throw error when update fails', async () => {
            const activeTimesheet = { ...mockTimesheet, clock_out: null };

            const verifyChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: activeTimesheet, error: null })
            };

            const updateChain = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(verifyChain)
                .mockReturnValueOnce(updateChain);

            await expect(TimesheetService.clockOut('ts-1'))
                .rejects.toThrow('Update failed');
        });
    });

    describe('getTimesheets', () => {
        const mockTimesheets = [mockTimesheet];

        it('should return all timesheets without filters', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockTimesheets, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const result = await TimesheetService.getTimesheets();

            expect(supabase.from).toHaveBeenCalledWith('timesheets');
            expect(queryChain.select).toHaveBeenCalledWith(`
                    *,
                    employee:employees(
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        role
                    )
                `);
            expect(queryChain.order).toHaveBeenCalledWith('clock_in', { ascending: false });
            expect(result).toEqual(mockTimesheets);
        });

        it('should apply employee filter', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ data: mockTimesheets, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const filters = { employeeId: 'emp-1' };
            const result = await TimesheetService.getTimesheets(filters);

            expect(queryChain.eq).toHaveBeenCalledWith('employee_id', 'emp-1');
            expect(result).toEqual(mockTimesheets);
        });

        it('should apply date range filter', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockResolvedValue({ data: mockTimesheets, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const filters = {
                dateRange: {
                    start: new Date('2024-01-01'),
                    end: new Date('2024-01-31')
                }
            };
            const result = await TimesheetService.getTimesheets(filters);

            expect(queryChain.gte).toHaveBeenCalledWith('clock_in', '2024-01-01T00:00:00.000Z');
            expect(queryChain.lte).toHaveBeenCalledWith('clock_in', '2024-01-31T00:00:00.000Z');
            expect(result).toEqual(mockTimesheets);
        });

        it('should apply status filter for active timesheets', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                is: jest.fn().mockResolvedValue({ data: mockTimesheets, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const filters = { status: 'active' as const };
            const result = await TimesheetService.getTimesheets(filters);

            expect(queryChain.is).toHaveBeenCalledWith('clock_out', null);
            expect(result).toEqual(mockTimesheets);
        });

        it('should apply status filter for completed timesheets', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                not: jest.fn().mockResolvedValue({ data: mockTimesheets, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const filters = { status: 'completed' as const };
            const result = await TimesheetService.getTimesheets(filters);

            expect(queryChain.not).toHaveBeenCalledWith('clock_out', 'is', null);
            expect(result).toEqual(mockTimesheets);
        });

        it('should apply search query filter', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                or: jest.fn().mockResolvedValue({ data: mockTimesheets, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const filters = { searchQuery: 'morning' };
            const result = await TimesheetService.getTimesheets(filters);

            expect(queryChain.or).toHaveBeenCalledWith('todo.ilike.%morning%,note.ilike.%morning%');
            expect(result).toEqual(mockTimesheets);
        });

        it('should return empty array when no data found', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const result = await TimesheetService.getTimesheets();

            expect(result).toEqual([]);
        });

        it('should throw error when query fails', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: new Error('Query failed') })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            await expect(TimesheetService.getTimesheets()).rejects.toThrow('Query failed');
        });
    });

    describe('getPayrollSummary', () => {
        const mockPayrollSummary: PayrollSummary = {
            employee_id: 'emp-1',
            employee_name: 'John Doe',
            month: 'January',
            year: 2024,
            total_hours: 16,
            total_shifts: 2,
            average_shift_length: 8,
            shifts: [
                {
                    date: '1/15/2024',
                    clock_in: '9:00:00 AM',
                    clock_out: '5:00:00 PM',
                    hours_worked: 8,
                    todo: 'Morning tour prep',
                    note: 'Good day'
                },
                {
                    date: '1/16/2024',
                    clock_in: '9:00:00 AM',
                    clock_out: '5:00:00 PM',
                    hours_worked: 8,
                    todo: 'Equipment check',
                    note: 'Late finish'
                }
            ]
        };

        const mockTimesheetData = [
            {
                id: 'ts-1',
                employee_id: 'emp-1',
                clock_in: '2024-01-15T09:00:00Z',
                clock_out: '2024-01-15T17:00:00Z',
                hours_worked: 8,
                todo: 'Morning tour prep',
                note: 'Good day'
            },
            {
                id: 'ts-2',
                employee_id: 'emp-1',
                clock_in: '2024-01-16T09:00:00Z',
                clock_out: '2024-01-16T17:00:00Z',
                hours_worked: 8,
                todo: 'Equipment check',
                note: 'Late finish'
            }
        ];

        it('should generate payroll summary successfully', async () => {
            // Mock employee verification
            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
            };

            // Mock timesheet data fetch
            const timesheetChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockTimesheetData, error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(employeeChain)
                .mockReturnValueOnce(timesheetChain);

            const result = await TimesheetService.getPayrollSummary('emp-1', 1, 2024);

            expect(employeeChain.select).toHaveBeenCalledWith('id, first_name, last_name');
            expect(employeeChain.eq).toHaveBeenCalledWith('id', 'emp-1');
            expect(timesheetChain.select).toHaveBeenCalledWith('*');
            expect(timesheetChain.eq).toHaveBeenCalledWith('employee_id', 'emp-1');
            expect(timesheetChain.not).toHaveBeenCalledWith('clock_out', 'is', null);
            expect(timesheetChain.gte).toHaveBeenCalledWith('clock_in', expect.any(String));
            expect(timesheetChain.lte).toHaveBeenCalledWith('clock_in', expect.any(String));
            expect(timesheetChain.order).toHaveBeenCalledWith('clock_in', { ascending: true });

            expect(result.employee_id).toBe('emp-1');
            expect(result.employee_name).toBe('John Doe');
            expect(result.month).toBe('January');
            expect(result.year).toBe(2024);
            expect(result.total_hours).toBe(16);
            expect(result.total_shifts).toBe(2);
            expect(result.average_shift_length).toBe(8);
            expect(result.shifts).toHaveLength(2);
        });

        it('should handle empty timesheet data', async () => {
            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
            };

            const timesheetChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [], error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(employeeChain)
                .mockReturnValueOnce(timesheetChain);

            const result = await TimesheetService.getPayrollSummary('emp-1', 1, 2024);

            expect(result.total_hours).toBe(0);
            expect(result.total_shifts).toBe(0);
            expect(result.average_shift_length).toBe(0);
            expect(result.shifts).toEqual([]);
        });

        it('should throw error when employee not found', async () => {
            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
            };

            (supabase.from as jest.Mock).mockReturnValue(employeeChain);

            await expect(TimesheetService.getPayrollSummary('emp-1', 1, 2024))
                .rejects.toThrow('Employee not found');
        });

        it('should throw error when timesheet query fails', async () => {
            const employeeChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
            };

            const timesheetChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: new Error('Query failed') })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(employeeChain)
                .mockReturnValueOnce(timesheetChain);

            await expect(TimesheetService.getPayrollSummary('emp-1', 1, 2024))
                .rejects.toThrow('Query failed');
        });
    });

    describe('getTimesheetStats', () => {
        it('should return timesheet statistics', async () => {
            const mockActiveTimesheets = [
                { employee_id: 'emp-1' },
                { employee_id: 'emp-2' }
            ];

            const mockTodayHours = [{ hours_worked: 8 }, { hours_worked: 6 }];
            const mockWeekHours = [{ hours_worked: 8 }, { hours_worked: 6 }, { hours_worked: 7 }];
            const mockMonthHours = [{ hours_worked: 8 }, { hours_worked: 6 }, { hours_worked: 7 }, { hours_worked: 8 }];

            // Mock active timesheets query
            const activeChain = {
                select: jest.fn().mockReturnThis(),
                is: jest.fn().mockResolvedValue({ data: mockActiveTimesheets, error: null })
            };

            // Mock Promise.all results
            const todayChain = {
                select: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockResolvedValue({ data: mockTodayHours, error: null })
            };

            const weekChain = {
                select: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockResolvedValue({ data: mockWeekHours, error: null })
            };

            const monthChain = {
                select: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockResolvedValue({ data: mockMonthHours, error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(activeChain)
                .mockReturnValueOnce(todayChain)
                .mockReturnValueOnce(weekChain)
                .mockReturnValueOnce(monthChain);

            const result = await TimesheetService.getTimesheetStats();

            expect(result.activeEmployees).toBe(2);
            expect(result.totalHoursToday).toBe(14);
            expect(result.totalHoursThisWeek).toBe(21);
            expect(result.totalHoursThisMonth).toBe(29);
        });

        it('should handle null data gracefully', async () => {
            const activeChain = {
                select: jest.fn().mockReturnThis(),
                is: jest.fn().mockResolvedValue({ data: null, error: null })
            };

            const hoursChain = {
                select: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                gte: jest.fn().mockResolvedValue({ data: null, error: null })
            };

            (supabase.from as jest.Mock)
                .mockReturnValueOnce(activeChain)
                .mockReturnValueOnce(hoursChain)
                .mockReturnValueOnce(hoursChain)
                .mockReturnValueOnce(hoursChain);

            const result = await TimesheetService.getTimesheetStats();

            expect(result.activeEmployees).toBe(0);
            expect(result.totalHoursToday).toBe(0);
            expect(result.totalHoursThisWeek).toBe(0);
            expect(result.totalHoursThisMonth).toBe(0);
        });

        it('should throw error when active timesheets query fails', async () => {
            const activeChain = {
                select: jest.fn().mockReturnThis(),
                is: jest.fn().mockResolvedValue({ data: null, error: new Error('Query failed') })
            };

            (supabase.from as jest.Mock).mockReturnValue(activeChain);

            await expect(TimesheetService.getTimesheetStats()).rejects.toThrow('Query failed');
        });
    });

    describe('getRecentTimesheets', () => {
        it('should return recent timesheets for employee', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue({ data: [mockTimesheet], error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            const result = await TimesheetService.getRecentTimesheets('emp-1', 5);

            expect(queryChain.eq).toHaveBeenCalledWith('employee_id', 'emp-1');
            expect(queryChain.order).toHaveBeenCalledWith('clock_in', { ascending: false });
            expect(queryChain.limit).toHaveBeenCalledWith(5);
            expect(result).toEqual([mockTimesheet]);
        });

        it('should use default limit when not specified', async () => {
            const queryChain = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue({ data: [mockTimesheet], error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(queryChain);

            await TimesheetService.getRecentTimesheets('emp-1');

            expect(queryChain.limit).toHaveBeenCalledWith(10);
        });
    });

    describe('updateTimesheet', () => {
        it('should update timesheet successfully', async () => {
            const updates = { todo: 'Updated todo', note: 'Updated note' };
            const updatedTimesheet = { ...mockTimesheet, ...updates };

            const updateChain = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: updatedTimesheet, error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(updateChain);

            const result = await TimesheetService.updateTimesheet('ts-1', updates);

            expect(updateChain.update).toHaveBeenCalledWith({
                ...updates,
                updated_at: expect.any(String)
            });
            expect(updateChain.eq).toHaveBeenCalledWith('id', 'ts-1');
            expect(result).toEqual(updatedTimesheet);
        });

        it('should throw error when update fails', async () => {
            const updateChain = {
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
            };

            (supabase.from as jest.Mock).mockReturnValue(updateChain);

            await expect(TimesheetService.updateTimesheet('ts-1', { todo: 'Updated' }))
                .rejects.toThrow('Update failed');
        });
    });

    describe('deleteTimesheet', () => {
        it('should delete timesheet successfully', async () => {
            const deleteChain = {
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null })
            };

            (supabase.from as jest.Mock).mockReturnValue(deleteChain);

            await TimesheetService.deleteTimesheet('ts-1');

            expect(deleteChain.delete).toHaveBeenCalled();
            expect(deleteChain.eq).toHaveBeenCalledWith('id', 'ts-1');
        });

        it('should throw error when delete fails', async () => {
            const deleteChain = {
                delete: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') })
            };

            (supabase.from as jest.Mock).mockReturnValue(deleteChain);

            await expect(TimesheetService.deleteTimesheet('ts-1'))
                .rejects.toThrow('Delete failed');
        });
    });
});