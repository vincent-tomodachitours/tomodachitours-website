import { supabase } from '../lib/supabase';
import { EmployeeShift, TourType } from '../types';

export class AvailabilityService {
    /**
     * Get my availability for a date range
     */
    static async getMyAvailability(
        employeeId: string,
        startDate: string,
        endDate: string
    ): Promise<EmployeeShift[]> {
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
                .eq('employee_id', employeeId)
                .gte('shift_date', startDate)
                .lte('shift_date', endDate)
                .order('shift_date', { ascending: true })
                .order('time_slot', { ascending: true });

            if (error) {
                console.error('Error fetching my availability:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('AvailabilityService.getMyAvailability error:', error);
            throw error;
        }
    }

    /**
     * Add availability for a specific date, time, and tour type
     */
    static async addAvailability(
        employeeId: string,
        date: string,
        timeSlot: string,
        tourType: TourType
    ): Promise<EmployeeShift> {
        try {
            // Check if this availability already exists
            const { data: existing, error: checkError } = await supabase
                .from('employee_shifts')
                .select('id')
                .eq('employee_id', employeeId)
                .eq('shift_date', date)
                .eq('time_slot', timeSlot)
                .eq('tour_type', tourType)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing availability:', checkError);
                throw checkError;
            }

            if (existing) {
                throw new Error('Availability already exists for this date, time, and tour type');
            }

            // Create new availability
            const { data, error } = await supabase
                .from('employee_shifts')
                .insert({
                    employee_id: employeeId,
                    tour_type: tourType,
                    shift_date: date,
                    time_slot: timeSlot,
                    status: 'available',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
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
                console.error('Error adding availability:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('AvailabilityService.addAvailability error:', error);
            throw error;
        }
    }

    /**
     * Remove availability
     */
    static async removeAvailability(shiftId: string): Promise<void> {
        try {
            // First check if the shift is assigned to a booking
            const { data: shift, error: shiftError } = await supabase
                .from('employee_shifts')
                .select('status')
                .eq('id', shiftId)
                .single();

            if (shiftError) {
                console.error('Error checking shift status:', shiftError);
                throw shiftError;
            }

            if (shift.status === 'assigned') {
                throw new Error('Cannot remove availability that is already assigned to a booking');
            }

            // Remove the availability
            const { error } = await supabase
                .from('employee_shifts')
                .delete()
                .eq('id', shiftId);

            if (error) {
                console.error('Error removing availability:', error);
                throw error;
            }
        } catch (error) {
            console.error('AvailabilityService.removeAvailability error:', error);
            throw error;
        }
    }

    /**
     * Update availability status (usually called by admin when assigning)
     */
    static async updateAvailabilityStatus(
        shiftId: string,
        status: 'available' | 'assigned' | 'unavailable' | 'completed' | 'cancelled'
    ): Promise<EmployeeShift> {
        try {
            const { data, error } = await supabase
                .from('employee_shifts')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', shiftId)
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
                console.error('Error updating availability status:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('AvailabilityService.updateAvailabilityStatus error:', error);
            throw error;
        }
    }

    /**
     * Get my upcoming assigned shifts
     */
    static async getMyUpcomingShifts(employeeId: string): Promise<EmployeeShift[]> {
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
                .eq('employee_id', employeeId)
                .eq('status', 'assigned')
                .gte('shift_date', new Date().toISOString().split('T')[0])
                .order('shift_date', { ascending: true })
                .order('time_slot', { ascending: true });

            if (error) {
                console.error('Error fetching upcoming shifts:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('AvailabilityService.getMyUpcomingShifts error:', error);
            throw error;
        }
    }

    /**
     * Bulk add availability for multiple dates
     */
    static async bulkAddAvailability(
        employeeId: string,
        dates: string[],
        timeSlots: string[],
        tourTypes: TourType[]
    ): Promise<EmployeeShift[]> {
        try {
            const availabilityToCreate: any[] = [];

            // Create all combinations
            for (const date of dates) {
                for (const timeSlot of timeSlots) {
                    for (const tourType of tourTypes) {
                        availabilityToCreate.push({
                            employee_id: employeeId,
                            tour_type: tourType,
                            shift_date: date,
                            time_slot: timeSlot,
                            status: 'available',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        });
                    }
                }
            }

            const { data, error } = await supabase
                .from('employee_shifts')
                .insert(availabilityToCreate)
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
                console.error('Error bulk adding availability:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('AvailabilityService.bulkAddAvailability error:', error);
            throw error;
        }
    }
} 