import { supabase } from '../lib/supabase';
import { Booking, BookingFilters, EmployeeShift, Employee } from '../types';
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

            // Filter out past bookings (tours that have already happened)
            const now = new Date();
            const upcomingBookings = filteredBookings.filter(booking => {
                const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
                return bookingDateTime >= now;
            });

            // Sort by booking date (soonest first)
            upcomingBookings.sort((a, b) => {
                const dateA = new Date(`${a.booking_date}T${a.booking_time}`);
                const dateB = new Date(`${b.booking_date}T${b.booking_time}`);
                return dateA.getTime() - dateB.getTime();
            });

            filteredBookings = upcomingBookings;

            console.log(`✅ BookingService: Returning ${filteredBookings.length} upcoming bookings (past tours filtered out)`);
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
     * Assign guide to booking (handles both website and Bokun bookings)
     */
    static async assignGuide(bookingId: number, guideId: string, notes?: string): Promise<void> {
        try {
            // First, try to update as a regular website booking
            const { data: regularBooking, error: regularError } = await supabase
                .from('bookings')
                .select('id, external_source, booking_date, tour_type')
                .eq('id', bookingId)
                .single();

            if (regularBooking && !regularError) {
                // This is a regular website booking - update the bookings table
                const updateData: any = { assigned_guide_id: guideId };
                if (notes) {
                    updateData.guide_notes = notes;
                }

                const { error } = await supabase
                    .from('bookings')
                    .update(updateData)
                    .eq('id', bookingId);

                if (error) {
                    console.error('Error assigning guide to website booking:', error);
                    throw error;
                }

                // Update employee shift status if applicable
                try {
                    await supabase
                        .from('employee_shifts')
                        .update({ status: 'assigned' })
                        .eq('employee_id', guideId)
                        .eq('shift_date', regularBooking.booking_date)
                        .eq('tour_type', regularBooking.tour_type);
                } catch (shiftError) {
                    console.warn('Could not update shift status for website booking:', shiftError);
                }
            } else {
                // This might be a Bokun booking - try updating the cache table
                console.log(`Booking ${bookingId} not found in main table, checking Bokun cache...`);

                const updateData: any = { assigned_guide_id: guideId };
                if (notes) {
                    updateData.guide_notes = notes;
                }

                const { data: bokunBooking, error: bokunError } = await supabase
                    .from('bokun_bookings_cache')
                    .update(updateData)
                    .eq('id', bookingId)
                    .select('*')
                    .single();

                if (bokunError) {
                    console.error('Error assigning guide to Bokun booking:', bokunError);
                    throw new Error(`Booking ${bookingId} not found in either bookings or Bokun cache tables`);
                }

                console.log(`✅ Successfully assigned guide to Bokun booking ${bookingId}`);

                // Update employee shift status if applicable
                try {
                    await supabase
                        .from('employee_shifts')
                        .update({ status: 'assigned' })
                        .eq('employee_id', guideId)
                        .eq('shift_date', bokunBooking.booking_date)
                        .eq('tour_type', bokunBooking.tour_type);
                } catch (shiftError) {
                    console.warn('Could not update shift status for Bokun booking:', shiftError);
                }
            }

        } catch (error) {
            console.error('BookingService.assignGuide error:', error);
            throw error;
        }
    }

    /**
     * Remove guide from booking (handles both website and Bokun bookings)
     */
    static async removeGuide(bookingId: number): Promise<void> {
        try {
            // First, try to update as a regular website booking
            const { data: regularBooking, error: regularError } = await supabase
                .from('bookings')
                .select('id')
                .eq('id', bookingId)
                .single();

            if (regularBooking && !regularError) {
                // This is a regular website booking
                const { error } = await supabase
                    .from('bookings')
                    .update({
                        assigned_guide_id: null,
                        guide_notes: null
                    })
                    .eq('id', bookingId);

                if (error) {
                    console.error('Error removing guide from website booking:', error);
                    throw error;
                }
            } else {
                // This might be a Bokun booking
                console.log(`Booking ${bookingId} not found in main table, checking Bokun cache...`);

                const { error: bokunError } = await supabase
                    .from('bokun_bookings_cache')
                    .update({
                        assigned_guide_id: null,
                        guide_notes: null
                    })
                    .eq('id', bookingId);

                if (bokunError) {
                    console.error('Error removing guide from Bokun booking:', bokunError);
                    throw new Error(`Booking ${bookingId} not found in either bookings or Bokun cache tables`);
                }

                console.log(`✅ Successfully removed guide from Bokun booking ${bookingId}`);
            }
        } catch (error) {
            console.error('BookingService.removeGuide error:', error);
            throw error;
        }
    }

    /**
     * Update guide notes for a booking (handles both website and Bokun bookings)
     */
    static async updateGuideNotes(bookingId: number, notes: string): Promise<void> {
        try {
            // First, try to update as a regular website booking
            const { data: regularBooking, error: regularError } = await supabase
                .from('bookings')
                .select('id')
                .eq('id', bookingId)
                .single();

            if (regularBooking && !regularError) {
                // This is a regular website booking
                const { error } = await supabase
                    .from('bookings')
                    .update({ guide_notes: notes })
                    .eq('id', bookingId);

                if (error) {
                    console.error('Error updating guide notes for website booking:', error);
                    throw error;
                }
            } else {
                // This might be a Bokun booking
                console.log(`Booking ${bookingId} not found in main table, checking Bokun cache...`);

                const { error: bokunError } = await supabase
                    .from('bokun_bookings_cache')
                    .update({ guide_notes: notes })
                    .eq('id', bookingId);

                if (bokunError) {
                    console.error('Error updating guide notes for Bokun booking:', bokunError);
                    throw new Error(`Booking ${bookingId} not found in either bookings or Bokun cache tables`);
                }

                console.log(`✅ Successfully updated guide notes for Bokun booking ${bookingId}`);
            }
        } catch (error) {
            console.error('BookingService.updateGuideNotes error:', error);
            throw error;
        }
    }

    /**
     * Get truly available guides for a specific tour type (checks both availability and conflicts)
     */
    static async getAvailableGuides(tourType: string, date: string, timeSlot: string): Promise<EmployeeShift[]> {
        try {
            // Step 1: Get guides already assigned to bookings at this exact time
            const { data: conflictingBookings, error: _conflictError } = await supabase
                .from('bookings')
                .select('assigned_guide_id')
                .eq('booking_date', date)
                .eq('booking_time', timeSlot)
                .in('status', ['CONFIRMED', 'PENDING_PAYMENT'])
                .not('assigned_guide_id', 'is', null);

            if (_conflictError) {
                console.error('Error checking booking conflicts:', _conflictError);
            }

            // Step 2: Check Bokun bookings cache for conflicts too
            const { data: bokunConflicts, error: _bokunConflictError } = await supabase
                .from('bokun_bookings_cache')
                .select('assigned_guide_id')
                .eq('booking_date', date)
                .eq('booking_time', timeSlot)
                .eq('status', 'CONFIRMED')
                .not('assigned_guide_id', 'is', null);

            if (_bokunConflictError) {
                console.error('Error checking Bokun booking conflicts:', _bokunConflictError);
            }

            // Combine all conflicting guide IDs
            const conflictingGuideIds = new Set([
                ...(conflictingBookings || []).map(b => b.assigned_guide_id),
                ...(bokunConflicts || []).map(b => b.assigned_guide_id)
            ].filter(Boolean));

            console.log(`Found ${conflictingGuideIds.size} guides already assigned at ${date} ${timeSlot}`);

            // Step 3: Get guides with scheduled shifts for this tour type
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
                .in('status', ['available', 'assigned'])
                .eq('employees.status', 'active');

            if (shiftError) {
                console.error('Error fetching shift guides:', shiftError);
                throw shiftError;
            }

            // Step 4: Filter out guides who are not qualified or have conflicts
            const availableShiftGuides = (shiftGuides || []).filter(shift => {
                const isQualified = shift.employee?.tour_types?.includes(tourType as any);
                const hasConflict = conflictingGuideIds.has(shift.employee_id);

                return isQualified && !hasConflict;
            });

            // Return only guides who have explicitly posted their availability
            console.log(`Found ${availableShiftGuides.length} available scheduled guides for ${tourType} at ${date} ${timeSlot}`);
            return availableShiftGuides;
        } catch (error) {
            console.error('BookingService.getAvailableGuides error:', error);
            throw error;
        }
    }

    /**
     * Get qualified guides who have posted availability for a tour type
     * Now requires explicit availability posting - no fallback to all qualified guides
     */
    static async getQualifiedGuides(tourType: string, date?: string, timeSlot?: string): Promise<Employee[]> {
        try {
            // If date is provided, return guides with explicit availability for that date (any time slot)
            if (date) {
                // Get guides already assigned to bookings at this exact time to exclude them
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { data: conflictingBookings, error: _conflictError } = await supabase
                    .from('bookings')
                    .select('assigned_guide_id')
                    .eq('booking_date', date)
                    .eq('booking_time', timeSlot || '')
                    .in('status', ['CONFIRMED', 'PENDING_PAYMENT'])
                    .not('assigned_guide_id', 'is', null);

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { data: bokunConflicts, error: _bokunConflictError } = await supabase
                    .from('bokun_bookings_cache')
                    .select('assigned_guide_id')
                    .eq('booking_date', date)
                    .eq('booking_time', timeSlot || '')
                    .eq('status', 'CONFIRMED')
                    .not('assigned_guide_id', 'is', null);

                const conflictingGuideIds = new Set([
                    ...(conflictingBookings || []).map(b => b.assigned_guide_id),
                    ...(bokunConflicts || []).map(b => b.assigned_guide_id)
                ].filter(Boolean));

                const { data, error } = await supabase
                    .from('employee_shifts')
                    .select(`
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
                    .eq('status', 'available')
                    .eq('employees.status', 'active');

                if (error) {
                    console.error('Error fetching qualified guides with availability:', error);
                    throw error;
                }

                // Extract unique employees and filter for qualified guides without conflicts
                const uniqueGuides = new Map<string, any>();
                (data || []).forEach((shift: any) => {
                    const employee = shift.employee;
                    if (employee &&
                        employee.tour_types?.includes(tourType as any) &&
                        !conflictingGuideIds.has(employee.id)) {
                        uniqueGuides.set(employee.id, employee);
                    }
                });

                return Array.from(uniqueGuides.values()).sort((a, b) => a.first_name.localeCompare(b.first_name));
            }

            // Fallback for legacy calls without date/time - return empty array to enforce availability requirement
            console.warn('getQualifiedGuides called without date/time - returning empty array to enforce availability requirement');
            return [];
        } catch (error) {
            console.error('BookingService.getQualifiedGuides error:', error);
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

    /**
     * Get bookings assigned to a specific employee
     */
    static async getEmployeeBookings(employeeId: string, startDate?: string, endDate?: string): Promise<Booking[]> {
        try {
            // Get regular bookings assigned to this employee
            let query = supabase
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
                .eq('assigned_guide_id', employeeId)
                .in('status', ['CONFIRMED', 'PENDING_PAYMENT'])
                .order('booking_date', { ascending: true })
                .order('booking_time', { ascending: true });

            // Apply date filters if provided
            if (startDate && endDate) {
                query = query
                    .gte('booking_date', startDate)
                    .lte('booking_date', endDate);
            }

            const { data: regularBookings, error } = await query;

            if (error) {
                console.error('Error fetching employee bookings:', error);
                throw error;
            }

            // Get Bokun bookings assigned to this employee
            let bokunQuery = supabase
                .from('bokun_bookings_cache')
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
                        status,
                        tour_types
                    )
                `)
                .eq('assigned_guide_id', employeeId)
                .eq('status', 'CONFIRMED')
                .order('booking_date', { ascending: true })
                .order('booking_time', { ascending: true });

            // Apply date filters to Bokun bookings too
            if (startDate && endDate) {
                bokunQuery = bokunQuery
                    .gte('booking_date', startDate)
                    .lte('booking_date', endDate);
            }

            const { data: bokunBookings, error: bokunError } = await bokunQuery;

            if (bokunError) {
                console.error('Error fetching employee Bokun bookings:', bokunError);
                // Don't throw error, just log and continue with regular bookings
            }

            // Transform Bokun bookings to match regular booking format
            const transformedBokunBookings = (bokunBookings || []).map((booking: any) => ({
                id: booking.id,
                tour_type: booking.tour_type,
                booking_date: booking.booking_date,
                booking_time: booking.booking_time,
                customer_name: booking.customer_name,
                customer_email: booking.customer_email,
                customer_phone: booking.customer_phone,
                adults: booking.adults,
                children: booking.children,
                infants: booking.infants,
                total_participants: booking.total_participants,
                status: 'CONFIRMED' as any,
                external_source: 'bokun',
                bokun_booking_id: booking.bokun_booking_id,
                created_at: booking.last_synced,
                bokun_synced: true,
                assigned_guide_id: booking.assigned_guide_id,
                guide_notes: booking.guide_notes,
                assigned_guide: booking.assigned_guide,
                charge_id: undefined,
                discount_amount: undefined,
                discount_code: undefined,
                discount_code_id: undefined
            }));

            // Combine and sort all bookings
            const allBookings = [...(regularBookings || []), ...transformedBokunBookings];

            // Sort by date and time
            allBookings.sort((a, b) => {
                const dateCompare = a.booking_date.localeCompare(b.booking_date);
                if (dateCompare === 0) {
                    return a.booking_time.localeCompare(b.booking_time);
                }
                return dateCompare;
            });

            return allBookings;
        } catch (error) {
            console.error('BookingService.getEmployeeBookings error:', error);
            throw error;
        }
    }
} 