import { supabase } from '../lib/supabase';
import { Booking, BookingFilters, EmployeeShift } from '../types';
import { BokunBookingService } from './bokunBookingService';

export class BookingService {
    /**
     * Fetch bookings with optional filters (includes local + external Bokun bookings)
     */
    static async getBookings(filters?: BookingFilters): Promise<Booking[]> {
        try {
            console.log('🔍 BookingService: Fetching all bookings (local + external)');

            // Convert BookingFilters to BokunBookingFilters format
            const bokunFilters = filters ? {
                startDate: filters.dateRange?.start.toISOString().split('T')[0],
                endDate: filters.dateRange?.end.toISOString().split('T')[0],
                // Note: Bokun filters don't support all the same filters as local ones
            } : undefined;

            // Get all bookings from Bokun service (which includes local + external)
            const allBookings = await BokunBookingService.getAllBookings(bokunFilters);

            // Apply remaining filters that weren't handled by Bokun service
            let filteredBookings = allBookings;

            if (filters) {
                if (filters.tourType && filters.tourType.length > 0) {
                    filteredBookings = filteredBookings.filter(booking =>
                        filters.tourType!.includes(booking.tour_type as any)
                    );
                }

                if (filters.status && filters.status.length > 0) {
                    filteredBookings = filteredBookings.filter(booking =>
                        filters.status!.includes(booking.status as any)
                    );
                }

                if (filters.assignedGuide && filters.assignedGuide.length > 0) {
                    filteredBookings = filteredBookings.filter(booking =>
                        booking.assigned_guide_id && filters.assignedGuide!.includes(booking.assigned_guide_id)
                    );
                }

                if (filters.searchQuery) {
                    const searchTerm = filters.searchQuery.toLowerCase();
                    filteredBookings = filteredBookings.filter(booking =>
                        booking.customer_name.toLowerCase().includes(searchTerm) ||
                        booking.customer_email.toLowerCase().includes(searchTerm)
                    );
                }
            }

            // Sort by booking date (most recent first)
            filteredBookings.sort((a, b) => {
                const dateA = new Date(`${a.booking_date}T${a.booking_time}`);
                const dateB = new Date(`${b.booking_date}T${b.booking_time}`);
                return dateB.getTime() - dateA.getTime();
            });

            console.log(`✅ BookingService: Returning ${filteredBookings.length} filtered bookings`);
            return filteredBookings;
        } catch (error) {
            console.error('BookingService.getBookings error:', error);
            throw error;
        }
    }

    /**
     * Get a single booking by ID with full details
     */
    static async getBookingById(id: number): Promise<Booking | null> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    assigned_guide:employees!assigned_guide_id (
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
                console.error('Error fetching booking:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('BookingService.getBookingById error:', error);
            throw error;
        }
    }

    /**
     * Update booking status
     */
    static async updateBookingStatus(id: number, status: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', id);

            if (error) {
                console.error('Error updating booking status:', error);
                throw error;
            }
        } catch (error) {
            console.error('BookingService.updateBookingStatus error:', error);
            throw error;
        }
    }

    /**
     * Assign guide to booking
     */
    static async assignGuide(bookingId: number, guideId: string, notes?: string): Promise<void> {
        try {
            const updateData: any = { assigned_guide_id: guideId };
            if (notes) {
                updateData.guide_notes = notes;
            }

            const { error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', bookingId);

            if (error) {
                console.error('Error assigning guide:', error);
                throw error;
            }

            // Optionally update the employee shift to 'assigned' status
            // This assumes there's a corresponding shift record
            try {
                await supabase
                    .from('employee_shifts')
                    .update({ status: 'assigned' })
                    .eq('employee_id', guideId)
                    .eq('shift_date', (await this.getBookingById(bookingId))?.booking_date)
                    .eq('tour_type', (await this.getBookingById(bookingId))?.tour_type);
            } catch (shiftError) {
                console.warn('Could not update shift status:', shiftError);
                // Don't fail the main operation if shift update fails
            }
        } catch (error) {
            console.error('BookingService.assignGuide error:', error);
            throw error;
        }
    }

    /**
     * Remove guide from booking
     */
    static async removeGuide(bookingId: number): Promise<void> {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({
                    assigned_guide_id: null,
                    guide_notes: null
                })
                .eq('id', bookingId);

            if (error) {
                console.error('Error removing guide:', error);
                throw error;
            }
        } catch (error) {
            console.error('BookingService.removeGuide error:', error);
            throw error;
        }
    }

    /**
     * Update guide notes for a booking
     */
    static async updateGuideNotes(bookingId: number, notes: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ guide_notes: notes })
                .eq('id', bookingId);

            if (error) {
                console.error('Error updating guide notes:', error);
                throw error;
            }
        } catch (error) {
            console.error('BookingService.updateGuideNotes error:', error);
            throw error;
        }
    }

    /**
     * Get available guides for a specific tour type and date
     */
    static async getAvailableGuides(tourType: string, date: string, timeSlot: string): Promise<EmployeeShift[]> {
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
                .eq('tour_type', tourType)
                .eq('shift_date', date)
                .eq('time_slot', timeSlot)
                .in('status', ['available', 'assigned'])
                .eq('employees.status', 'active');

            if (error) {
                console.error('Error fetching available guides:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('BookingService.getAvailableGuides error:', error);
            throw error;
        }
    }

    /**
     * Get booking statistics for dashboard
     */
    static async getBookingStats() {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Today's bookings
            const { data: todayBookings, error: todayError } = await supabase
                .from('bookings')
                .select('id, total_participants')
                .eq('booking_date', today)
                .eq('status', 'CONFIRMED');

            if (todayError) throw todayError;

            // This week's revenue (simplified calculation)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { data: weekBookings, error: weekError } = await supabase
                .from('bookings')
                .select('id, adults, children')
                .gte('booking_date', weekAgo.toISOString().split('T')[0])
                .eq('status', 'CONFIRMED');

            if (weekError) throw weekError;

            // Count active guides (simplified - just count active employees with tour_guide role)
            const { data: activeGuides, error: guidesError } = await supabase
                .from('employees')
                .select('id')
                .eq('role', 'tour_guide')
                .eq('status', 'active');

            if (guidesError) throw guidesError;

            // Count upcoming tours (next 7 days)
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const { data: upcomingTours, error: upcomingError } = await supabase
                .from('bookings')
                .select('id')
                .gte('booking_date', today)
                .lte('booking_date', nextWeek.toISOString().split('T')[0])
                .eq('status', 'CONFIRMED');

            if (upcomingError) throw upcomingError;

            return {
                todayBookings: todayBookings?.length || 0,
                todayParticipants: todayBookings?.reduce((sum, b) => sum + (b.total_participants || 0), 0) || 0,
                activeGuides: activeGuides?.length || 0,
                weeklyRevenue: (weekBookings?.length || 0) * 8000, // Simplified calculation
                upcomingTours: upcomingTours?.length || 0
            };
        } catch (error) {
            console.error('BookingService.getBookingStats error:', error);
            return {
                todayBookings: 0,
                todayParticipants: 0,
                activeGuides: 0,
                weeklyRevenue: 0,
                upcomingTours: 0
            };
        }
    }
} 