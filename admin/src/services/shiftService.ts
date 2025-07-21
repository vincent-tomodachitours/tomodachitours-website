import { supabase } from '../lib/supabase';
import { EmployeeShift, ShiftFormData, ShiftStatus, TourType, Employee } from '../types';

export class ShiftService {
    /**
     * Fetch shifts with optional filters
     */
    static async getShifts(filters?: {
        employeeId?: string;
        tourType?: TourType[];
        status?: ShiftStatus[];
        dateRange?: { start: Date; end: Date };
        searchQuery?: string;
    }): Promise<EmployeeShift[]> {
        try {
            let query = supabase
                .from('employee_shifts')
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status
                    )
                `)
                .order('shift_date', { ascending: true })
                .order('time_slot', { ascending: true });

            // Apply filters
            if (filters) {
                if (filters.employeeId) {
                    query = query.eq('employee_id', filters.employeeId);
                }

                if (filters.tourType && filters.tourType.length > 0) {
                    query = query.in('tour_type', filters.tourType);
                }

                if (filters.status && filters.status.length > 0) {
                    query = query.in('status', filters.status);
                }

                if (filters.dateRange) {
                    query = query
                        .gte('shift_date', filters.dateRange.start.toISOString().split('T')[0])
                        .lte('shift_date', filters.dateRange.end.toISOString().split('T')[0]);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching shifts:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('ShiftService.getShifts error:', error);
            throw error;
        }
    }

    /**
     * Get shift by ID
     */
    static async getShiftById(id: string): Promise<EmployeeShift | null> {
        try {
            const { data, error } = await supabase
                .from('employee_shifts')
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status
                    )
                `)
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Shift not found
                }
                console.error('Error fetching shift:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('ShiftService.getShiftById error:', error);
            throw error;
        }
    }

    /**
     * Create a new shift
     */
    static async createShift(shiftData: ShiftFormData): Promise<EmployeeShift> {
        try {
            const { data, error } = await supabase
                .from('employee_shifts')
                .insert({
                    ...shiftData,
                    status: 'available' as ShiftStatus
                })
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status
                    )
                `)
                .single();

            if (error) {
                console.error('Error creating shift:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('ShiftService.createShift error:', error);
            throw error;
        }
    }

    /**
     * Update shift information
     */
    static async updateShift(id: string, updates: Partial<ShiftFormData>): Promise<EmployeeShift> {
        try {
            const { data, error } = await supabase
                .from('employee_shifts')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status
                    )
                `)
                .single();

            if (error) {
                console.error('Error updating shift:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('ShiftService.updateShift error:', error);
            throw error;
        }
    }

    /**
     * Update shift status
     */
    static async updateShiftStatus(id: string, status: ShiftStatus): Promise<EmployeeShift> {
        try {
            const { data, error } = await supabase
                .from('employee_shifts')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status
                    )
                `)
                .single();

            if (error) {
                console.error('Error updating shift status:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('ShiftService.updateShiftStatus error:', error);
            throw error;
        }
    }

    /**
     * Delete shift
     */
    static async deleteShift(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('employee_shifts')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting shift:', error);
                throw error;
            }
        } catch (error) {
            console.error('ShiftService.deleteShift error:', error);
            throw error;
        }
    }

    /**
     * Get available guides for a specific tour type, date, and time (checks qualification)
     */
    static async getAvailableGuides(
        tourType: TourType,
        date: string,
        timeSlot: string
    ): Promise<EmployeeShift[]> {
        try {
            // Get guides with scheduled shifts for this tour type
            const { data: shiftGuides, error: shiftError } = await supabase
                .from('employee_shifts')
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status,
                        tour_types
                    )
                `)
                .eq('tour_type', tourType)
                .eq('shift_date', date)
                .eq('time_slot', timeSlot)
                .eq('status', 'available')
                .eq('employees.status', 'active');

            if (shiftError) {
                console.error('Error fetching shift guides:', shiftError);
                throw shiftError;
            }

            // Filter to only qualified guides
            const qualifiedGuides = (shiftGuides || []).filter(shift => {
                return shift.employee?.tour_types?.includes(tourType);
            });

            return qualifiedGuides;
        } catch (error) {
            console.error('ShiftService.getAvailableGuides error:', error);
            throw error;
        }
    }

    /**
     * Get all qualified guides for a tour type (for manual assignment)
     */
    static async getQualifiedGuides(tourType: TourType): Promise<Employee[]> {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('role', 'tour_guide')
                .eq('status', 'active')
                .contains('tour_types', [tourType])
                .order('first_name');

            if (error) {
                console.error('Error fetching qualified guides:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('ShiftService.getQualifiedGuides error:', error);
            throw error;
        }
    }

    /**
     * Check for scheduling conflicts
     */
    static async checkConflicts(
        employeeId: string,
        date: string,
        timeSlot: string,
        excludeShiftId?: string
    ): Promise<EmployeeShift[]> {
        try {
            let query = supabase
                .from('employee_shifts')
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code
                    )
                `)
                .eq('employee_id', employeeId)
                .eq('shift_date', date)
                .eq('time_slot', timeSlot)
                .neq('status', 'cancelled');

            if (excludeShiftId) {
                query = query.neq('id', excludeShiftId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error checking conflicts:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('ShiftService.checkConflicts error:', error);
            throw error;
        }
    }

    /**
     * Bulk create shifts for multiple dates
     */
    static async createBulkShifts(
        employeeId: string,
        tourType: TourType,
        timeSlot: string,
        dates: string[],
        maxParticipants?: number,
        notes?: string
    ): Promise<EmployeeShift[]> {
        try {
            const shiftsToCreate = dates.map(date => ({
                employee_id: employeeId,
                tour_type: tourType,
                shift_date: date,
                time_slot: timeSlot,
                status: 'available' as ShiftStatus,
                max_participants: maxParticipants,
                notes: notes
            }));

            const { data, error } = await supabase
                .from('employee_shifts')
                .insert(shiftsToCreate)
                .select(`
                    *,
                    employee:employees!employee_id (
                        id,
                        first_name,
                        last_name,
                        employee_code,
                        email,
                        phone,
                        role,
                        status
                    )
                `);

            if (error) {
                console.error('Error creating bulk shifts:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('ShiftService.createBulkShifts error:', error);
            throw error;
        }
    }

    /**
     * Get shift statistics
     */
    static async getShiftStats(employeeId?: string): Promise<{
        totalShifts: number;
        availableShifts: number;
        assignedShifts: number;
        completedShifts: number;
        upcomingShifts: number;
    }> {
        try {
            let query = supabase
                .from('employee_shifts')
                .select('status, shift_date');

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }

            const { data: shifts, error } = await query;

            if (error) {
                console.error('Error fetching shift stats:', error);
                throw error;
            }

            const today = new Date().toISOString().split('T')[0];

            const stats = {
                totalShifts: shifts.length,
                availableShifts: shifts.filter(s => s.status === 'available').length,
                assignedShifts: shifts.filter(s => s.status === 'assigned').length,
                completedShifts: shifts.filter(s => s.status === 'completed').length,
                upcomingShifts: shifts.filter(s =>
                    s.shift_date >= today &&
                    ['available', 'assigned'].includes(s.status)
                ).length
            };

            return stats;
        } catch (error) {
            console.error('ShiftService.getShiftStats error:', error);
            throw error;
        }
    }

    /**
     * Get suggested assignments for unassigned bookings
     */
    static async getSuggestedAssignments(): Promise<{
        bookingId: number;
        suggestedGuides: EmployeeShift[];
    }[]> {
        try {
            // Get unassigned bookings
            const { data: unassignedBookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('id, tour_type, booking_date, booking_time')
                .is('assigned_guide_id', null)
                .eq('status', 'CONFIRMED')
                .gte('booking_date', new Date().toISOString().split('T')[0]);

            if (bookingsError) {
                console.error('Error fetching unassigned bookings:', bookingsError);
                throw bookingsError;
            }

            const suggestions = await Promise.all(
                (unassignedBookings || []).map(async (booking) => {
                    const suggestedGuides = await this.getAvailableGuides(
                        booking.tour_type as TourType,
                        booking.booking_date,
                        booking.booking_time
                    );

                    return {
                        bookingId: booking.id,
                        suggestedGuides
                    };
                })
            );

            return suggestions.filter(s => s.suggestedGuides.length > 0);
        } catch (error) {
            console.error('ShiftService.getSuggestedAssignments error:', error);
            throw error;
        }
    }

    /**
     * Auto-assign guides to bookings based on availability
     */
    static async autoAssignGuides(): Promise<{
        assigned: number;
        failed: number;
        results: { bookingId: number; assignedGuide?: string; error?: string }[];
    }> {
        try {
            const suggestions = await this.getSuggestedAssignments();
            let assigned = 0;
            let failed = 0;
            const results: { bookingId: number; assignedGuide?: string; error?: string }[] = [];

            for (const suggestion of suggestions) {
                try {
                    if (suggestion.suggestedGuides.length > 0) {
                        // Pick the first available guide (could be enhanced with priority logic)
                        const selectedGuide = suggestion.suggestedGuides[0];

                        // Assign the guide to the booking
                        const { error } = await supabase
                            .from('bookings')
                            .update({ assigned_guide_id: selectedGuide.employee_id })
                            .eq('id', suggestion.bookingId);

                        if (error) {
                            throw error;
                        }

                        // Update shift status to assigned
                        await this.updateShiftStatus(selectedGuide.id, 'assigned');

                        assigned++;
                        results.push({
                            bookingId: suggestion.bookingId,
                            assignedGuide: `${selectedGuide.employee.first_name} ${selectedGuide.employee.last_name}`
                        });
                    }
                } catch (error) {
                    failed++;
                    results.push({
                        bookingId: suggestion.bookingId,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            return { assigned, failed, results };
        } catch (error) {
            console.error('ShiftService.autoAssignGuides error:', error);
            throw error;
        }
    }
} 