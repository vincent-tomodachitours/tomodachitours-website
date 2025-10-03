import { supabase } from '../lib/supabase';

export interface BookingRequest {
    id: number;
    tour_type: string;
    booking_date: string;
    booking_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    adults: number;
    children: number;
    infants: number;
    total_participants: number;
    total_amount: number;
    status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
    payment_method_id?: string;
    request_submitted_at?: string;
    admin_reviewed_at?: string;
    admin_reviewed_by?: string;
    rejection_reason?: string;
    special_requests?: string;
    discount_code?: string;
    discount_amount?: number;
    created_at: string;
}

export interface BookingRequestFilters {
    status?: string[];
    tourType?: string[];
    dateRange?: { start: Date; end: Date };
    searchQuery?: string;
}

export class BookingRequestService {
    /**
     * Get all pending booking requests (Uji tours only)
     */
    static async getPendingRequests(): Promise<BookingRequest[]> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('status', 'PENDING_CONFIRMATION')
                .in('tour_type', ['uji-tour', 'uji-walking-tour', 'UJI_TOUR', 'UJI_WALKING_TOUR'])
                .order('request_submitted_at', { ascending: true });

            if (error) {
                console.error('Error fetching pending booking requests:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('BookingRequestService.getPendingRequests error:', error);
            throw error;
        }
    }

    /**
     * Get booking requests with filters (Uji tours only)
     */
    static async getBookingRequests(filters?: BookingRequestFilters): Promise<BookingRequest[]> {
        try {
            let query = supabase
                .from('bookings')
                .select('*')
                .in('tour_type', ['uji-tour', 'uji-walking-tour', 'UJI_TOUR', 'UJI_WALKING_TOUR']) // Only Uji tours (both formats)
                .order('request_submitted_at', { ascending: false });

            // Apply status filter - default to PENDING_CONFIRMATION if no status filter provided
            if (filters?.status && filters.status.length > 0) {
                query = query.in('status', filters.status);
            } else {
                // Default to only showing PENDING_CONFIRMATION if no status filter is applied
                query = query.eq('status', 'PENDING_CONFIRMATION');
            }

            // Apply other filters
            if (filters) {
                if (filters.tourType && filters.tourType.length > 0) {
                    query = query.in('tour_type', filters.tourType);
                }

                if (filters.dateRange) {
                    query = query
                        .gte('booking_date', filters.dateRange.start.toISOString().split('T')[0])
                        .lte('booking_date', filters.dateRange.end.toISOString().split('T')[0]);
                }

                if (filters.searchQuery) {
                    const searchTerm = filters.searchQuery.toLowerCase();
                    // Note: This is a simplified search. For better performance, consider using full-text search
                    query = query.or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching booking requests:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('BookingRequestService.getBookingRequests error:', error);
            throw error;
        }
    }

    /**
     * Get count of pending booking requests (Uji tours only)
     */
    static async getPendingRequestsCount(): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING_CONFIRMATION')
                .in('tour_type', ['uji-tour', 'uji-walking-tour']);

            if (error) {
                console.error('Error fetching pending requests count:', error);
                throw error;
            }

            return count || 0;
        } catch (error) {
            console.error('BookingRequestService.getPendingRequestsCount error:', error);
            throw error;
        }
    }

    /**
     * Approve a booking request
     */
    static async approveRequest(bookingId: number): Promise<void> {
        try {
            // Get current user for admin_id
            const { data: { user } } = await supabase.auth.getUser();
            const adminId = user?.id || 'unknown_admin';

            const { data, error } = await supabase.functions.invoke('manage-booking-request', {
                body: {
                    action: 'approve',
                    booking_id: bookingId,
                    admin_id: adminId
                }
            });

            if (error) {
                console.error('Error approving booking request:', error);
                // Check if it's a payment failure
                if (error.message?.includes('Payment processing failed')) {
                    throw new Error(`Payment processing failed: ${error.message}`);
                }
                throw error;
            }

            // Check response for payment failure
            if (data && !data.success && data.error?.includes('Payment processing failed')) {
                throw new Error(`Payment processing failed: ${data.error}`);
            }
        } catch (error) {
            console.error('BookingRequestService.approveRequest error:', error);
            throw error;
        }
    }

    /**
     * Reject a booking request
     */
    static async rejectRequest(bookingId: number, reason: string): Promise<void> {
        try {
            // Get current user for admin_id
            const { data: { user } } = await supabase.auth.getUser();
            const adminId = user?.id || 'unknown_admin';

            const { data, error } = await supabase.functions.invoke('manage-booking-request', {
                body: {
                    action: 'reject',
                    booking_id: bookingId,
                    rejection_reason: reason,
                    admin_id: adminId
                }
            });

            if (error) {
                console.error('Error rejecting booking request:', error);
                throw error;
            }

            if (data && !data.success) {
                throw new Error(data.error || 'Failed to reject booking request');
            }
        } catch (error) {
            console.error('BookingRequestService.rejectRequest error:', error);
            throw error;
        }
    }

    /**
     * Get booking request by ID
     */
    static async getBookingRequestById(id: number): Promise<BookingRequest | null> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching booking request:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('BookingRequestService.getBookingRequestById error:', error);
            throw error;
        }
    }
}