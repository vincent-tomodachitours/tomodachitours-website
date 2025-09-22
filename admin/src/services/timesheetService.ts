import { supabase } from '../lib/supabase';
import { Timesheet, TimesheetFilters, PayrollSummary, TimesheetEntry, Employee } from '../types';

// Real-time subscription management
export class TimesheetRealtimeManager {
    private static subscriptions = new Map<string, any>();

    /**
     * Subscribe to timesheet changes for a specific employee
     */
    static subscribeToEmployeeTimesheets(
        employeeId: string,
        onUpdate: (payload: any) => void,
        subscriptionKey?: string
    ) {
        const key = subscriptionKey || `employee-${employeeId}`;

        // Clean up existing subscription if any
        this.unsubscribe(key);

        console.log(`Setting up timesheet subscription for employee: ${employeeId}`);

        const subscription = supabase
            .channel(`timesheet-employee-${employeeId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timesheets',
                    filter: `employee_id=eq.${employeeId}`
                },
                (payload) => {
                    console.log('Employee timesheet change:', payload);
                    onUpdate(payload);
                }
            )
            .subscribe();

        this.subscriptions.set(key, subscription);
        return subscription;
    }

    /**
     * Subscribe to all timesheet changes (for management views)
     */
    static subscribeToAllTimesheets(
        onUpdate: (payload: any) => void,
        subscriptionKey: string = 'all-timesheets'
    ) {
        // Clean up existing subscription if any
        this.unsubscribe(subscriptionKey);

        console.log('Setting up subscription for all timesheets');

        const subscription = supabase
            .channel('timesheet-all')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'timesheets'
                },
                (payload) => {
                    console.log('Timesheet change (all):', payload);
                    onUpdate(payload);
                }
            )
            .subscribe();

        this.subscriptions.set(subscriptionKey, subscription);
        return subscription;
    }

    /**
     * Unsubscribe from a specific subscription
     */
    static unsubscribe(subscriptionKey: string) {
        const subscription = this.subscriptions.get(subscriptionKey);
        if (subscription) {
            console.log(`Cleaning up subscription: ${subscriptionKey}`);
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionKey);
        }
    }

    /**
     * Clean up all subscriptions
     */
    static cleanup() {
        console.log('Cleaning up all timesheet subscriptions');
        this.subscriptions.forEach((subscription, key) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
    }
}

export class TimesheetService {
    /**
     * Get current active timesheet for an employee
     */
    static async getCurrentTimesheet(employeeId: string): Promise<Timesheet | null> {
        try {
            const { data, error } = await supabase
                .from('timesheets')
                .select(`
                    *,
                    employee:employees(*)
                `)
                .eq('employee_id', employeeId)
                .is('clock_out', null)
                .order('clock_in', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error fetching current timesheet:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('TimesheetService.getCurrentTimesheet error:', error);
            throw error;
        }
    }

    /**
     * Clock in - create new timesheet entry with enhanced validation
     */
    static async clockIn(employeeId: string, todo?: string): Promise<Timesheet> {
        try {
            // Use the enhanced safe_clock_in database function
            const { data: timesheetId, error } = await supabase
                .rpc('safe_clock_in', {
                    p_employee_id: employeeId,
                    p_todo: todo || undefined
                });

            if (error) {
                console.error('Error clocking in:', error);
                throw new Error(error.message || 'Failed to clock in');
            }

            // Fetch the created timesheet with employee details
            const { data: timesheet, error: fetchError } = await supabase
                .from('timesheets')
                .select(`
                    *,
                    employee:employees(*)
                `)
                .eq('id', timesheetId)
                .single();

            if (fetchError) {
                console.error('Error fetching created timesheet:', fetchError);
                throw new Error('Clock in succeeded but failed to retrieve timesheet data');
            }

            return timesheet;
        } catch (error) {
            console.error('TimesheetService.clockIn error:', error);
            throw error;
        }
    }

    /**
     * Create optimistic timesheet entry for immediate UI updates
     */
    static createOptimisticTimesheet(employeeId: string, employee: Employee, todo?: string): Timesheet {
        return {
            id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employee_id: employeeId,
            clock_in: new Date().toISOString(),
            todo: todo || undefined,
            clock_out: undefined,
            note: undefined,
            hours_worked: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            employee: employee
        };
    }

    /**
     * Clock out - complete timesheet entry with enhanced validation
     */
    static async clockOut(timesheetId: string, note?: string): Promise<Timesheet> {
        try {
            // Use the enhanced safe_clock_out database function
            const { error } = await supabase
                .rpc('safe_clock_out', {
                    p_timesheet_id: timesheetId,
                    p_note: note || undefined
                });

            if (error) {
                console.error('Error clocking out:', error);
                throw new Error(error.message || 'Failed to clock out');
            }

            // Fetch the updated timesheet with employee details
            const { data: timesheet, error: fetchError } = await supabase
                .from('timesheets')
                .select(`
                    *,
                    employee:employees(*)
                `)
                .eq('id', timesheetId)
                .single();

            if (fetchError) {
                console.error('Error fetching updated timesheet:', fetchError);
                throw new Error('Clock out succeeded but failed to retrieve timesheet data');
            }

            return timesheet;
        } catch (error) {
            console.error('TimesheetService.clockOut error:', error);
            throw error;
        }
    }

    /**
     * Create optimistic clock out update for immediate UI updates
     */
    static createOptimisticClockOut(timesheet: Timesheet, note?: string): Timesheet {
        const clockOutTime = new Date().toISOString();
        const clockInTime = new Date(timesheet.clock_in);
        const clockOutTimeObj = new Date(clockOutTime);
        const hoursWorked = (clockOutTimeObj.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

        return {
            ...timesheet,
            clock_out: clockOutTime,
            note: note || undefined,
            hours_worked: Math.round(hoursWorked * 100) / 100,
            updated_at: clockOutTime
        };
    }

    /**
     * Get timesheets with filtering capabilities for management view
     */
    static async getTimesheets(filters?: TimesheetFilters): Promise<Timesheet[]> {
        try {
            let query = supabase
                .from('timesheets')
                .select(`
                    *,
                    employee:employees(
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        role
                    )
                `)
                .order('clock_in', { ascending: false });

            // Apply filters
            if (filters) {
                if (filters.employeeId) {
                    query = query.eq('employee_id', filters.employeeId);
                }

                if (filters.dateRange) {
                    const startDate = filters.dateRange.start.toISOString();
                    const endDate = filters.dateRange.end.toISOString();
                    query = query.gte('clock_in', startDate).lte('clock_in', endDate);
                }

                if (filters.status) {
                    switch (filters.status) {
                        case 'active':
                            query = query.is('clock_out', null);
                            break;
                        case 'completed':
                            query = query.not('clock_out', 'is', null);
                            break;
                        // 'all' doesn't need additional filtering
                    }
                }

                if (filters.searchQuery) {
                    // Search in employee names and notes
                    const searchTerm = `%${filters.searchQuery}%`;
                    query = query.or(`todo.ilike.${searchTerm},note.ilike.${searchTerm}`);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching timesheets:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('TimesheetService.getTimesheets error:', error);
            throw error;
        }
    }

    /**
     * Generate payroll summary for an employee for a specific month
     */
    static async getPayrollSummary(employeeId: string, month: number, year: number): Promise<PayrollSummary> {
        try {
            // Verify employee exists
            const { data: employee, error: employeeError } = await supabase
                .from('employees')
                .select('id, first_name, last_name')
                .eq('id', employeeId)
                .single();

            if (employeeError || !employee) {
                throw new Error('Employee not found');
            }

            // Calculate date range for the month
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            // Fetch completed timesheets for the month
            const { data: timesheets, error } = await supabase
                .from('timesheets')
                .select('*')
                .eq('employee_id', employeeId)
                .not('clock_out', 'is', null)
                .gte('clock_in', startDate.toISOString())
                .lte('clock_in', endDate.toISOString())
                .order('clock_in', { ascending: true });

            if (error) {
                console.error('Error fetching payroll data:', error);
                throw error;
            }

            // Process timesheet data into summary
            const shifts: TimesheetEntry[] = (timesheets || []).map(timesheet => ({
                date: new Date(timesheet.clock_in).toLocaleDateString(),
                clock_in: new Date(timesheet.clock_in).toLocaleTimeString(),
                clock_out: timesheet.clock_out ? new Date(timesheet.clock_out).toLocaleTimeString() : undefined,
                hours_worked: timesheet.hours_worked || 0,
                todo: timesheet.todo || undefined,
                note: timesheet.note || undefined
            }));

            const totalHours = shifts.reduce((sum, shift) => sum + (shift.hours_worked || 0), 0);
            const totalShifts = shifts.length;
            const averageShiftLength = totalShifts > 0 ? totalHours / totalShifts : 0;

            const summary: PayrollSummary = {
                employee_id: employeeId,
                employee_name: `${employee.first_name} ${employee.last_name}`,
                month: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
                year,
                total_hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
                total_shifts: totalShifts,
                average_shift_length: Math.round(averageShiftLength * 100) / 100,
                shifts
            };

            return summary;
        } catch (error) {
            console.error('TimesheetService.getPayrollSummary error:', error);
            throw error;
        }
    }

    /**
     * Get timesheet statistics for dashboard
     */
    static async getTimesheetStats(): Promise<{
        activeEmployees: number;
        totalHoursToday: number;
        totalHoursThisWeek: number;
        totalHoursThisMonth: number;
    }> {
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get active employees (currently clocked in)
            const { data: activeTimesheets, error: activeError } = await supabase
                .from('timesheets')
                .select('employee_id')
                .is('clock_out', null);

            if (activeError) {
                console.error('Error fetching active timesheets:', activeError);
                throw activeError;
            }

            // Get completed timesheets for different periods
            const [todayResult, weekResult, monthResult] = await Promise.all([
                // Today's hours
                supabase
                    .from('timesheets')
                    .select('hours_worked')
                    .not('clock_out', 'is', null)
                    .gte('clock_in', startOfDay.toISOString()),

                // This week's hours
                supabase
                    .from('timesheets')
                    .select('hours_worked')
                    .not('clock_out', 'is', null)
                    .gte('clock_in', startOfWeek.toISOString()),

                // This month's hours
                supabase
                    .from('timesheets')
                    .select('hours_worked')
                    .not('clock_out', 'is', null)
                    .gte('clock_in', startOfMonth.toISOString())
            ]);

            const totalHoursToday = (todayResult.data || [])
                .reduce((sum, t) => sum + (t.hours_worked || 0), 0);

            const totalHoursThisWeek = (weekResult.data || [])
                .reduce((sum, t) => sum + (t.hours_worked || 0), 0);

            const totalHoursThisMonth = (monthResult.data || [])
                .reduce((sum, t) => sum + (t.hours_worked || 0), 0);

            return {
                activeEmployees: activeTimesheets?.length || 0,
                totalHoursToday: Math.round(totalHoursToday * 100) / 100,
                totalHoursThisWeek: Math.round(totalHoursThisWeek * 100) / 100,
                totalHoursThisMonth: Math.round(totalHoursThisMonth * 100) / 100
            };
        } catch (error) {
            console.error('TimesheetService.getTimesheetStats error:', error);
            throw error;
        }
    }

    /**
     * Get recent timesheet entries for an employee
     */
    static async getRecentTimesheets(employeeId: string, limit: number = 10): Promise<Timesheet[]> {
        try {
            const { data, error } = await supabase
                .from('timesheets')
                .select(`
                    *,
                    employee:employees(
                        id,
                        first_name,
                        last_name,
                        employee_code
                    )
                `)
                .eq('employee_id', employeeId)
                .order('clock_in', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching recent timesheets:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('TimesheetService.getRecentTimesheets error:', error);
            throw error;
        }
    }

    /**
     * Update timesheet entry (for administrative corrections)
     */
    static async updateTimesheet(
        timesheetId: string,
        updates: Partial<Pick<Timesheet, 'clock_in' | 'clock_out' | 'todo' | 'note'>>
    ): Promise<Timesheet> {
        try {
            const { data, error } = await supabase
                .from('timesheets')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', timesheetId)
                .select(`
                    *,
                    employee:employees(*)
                `)
                .single();

            if (error) {
                console.error('Error updating timesheet:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('TimesheetService.updateTimesheet error:', error);
            throw error;
        }
    }

    /**
     * Delete timesheet entry (for administrative corrections)
     */
    static async deleteTimesheet(timesheetId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('timesheets')
                .delete()
                .eq('id', timesheetId);

            if (error) {
                console.error('Error deleting timesheet:', error);
                throw error;
            }
        } catch (error) {
            console.error('TimesheetService.deleteTimesheet error:', error);
            throw error;
        }
    }

    /**
     * Resolve timesheet conflicts for an employee
     */
    static async resolveTimesheetConflicts(employeeId: string): Promise<Array<{
        conflict_type: string;
        timesheet_id: string;
        resolution: string;
    }>> {
        try {
            const { data, error } = await supabase
                .rpc('resolve_timesheet_conflicts', {
                    p_employee_id: employeeId
                });

            if (error) {
                console.error('Error resolving timesheet conflicts:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('TimesheetService.resolveTimesheetConflicts error:', error);
            throw error;
        }
    }

    /**
     * Validate timesheet data integrity
     */
    static async validateTimesheetIntegrity(): Promise<Array<{
        issue_type: string;
        timesheet_id: string;
        employee_id: string;
        description: string;
        suggested_fix: string;
    }>> {
        try {
            const { data, error } = await supabase
                .rpc('validate_timesheet_integrity');

            if (error) {
                console.error('Error validating timesheet integrity:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('TimesheetService.validateTimesheetIntegrity error:', error);
            throw error;
        }
    }

    /**
     * Check for and handle browser refresh scenarios
     */
    static async handleBrowserRefresh(employeeId: string): Promise<{
        hasActiveTimesheet: boolean;
        timesheet?: Timesheet;
        conflicts?: Array<any>;
    }> {
        try {
            // Check for active timesheet
            const currentTimesheet = await this.getCurrentTimesheet(employeeId);

            // Check for any conflicts
            const conflicts = await this.resolveTimesheetConflicts(employeeId);

            return {
                hasActiveTimesheet: !!currentTimesheet,
                timesheet: currentTimesheet || undefined,
                conflicts: conflicts.length > 0 ? conflicts : undefined
            };
        } catch (error) {
            console.error('TimesheetService.handleBrowserRefresh error:', error);
            throw error;
        }
    }
}