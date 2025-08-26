// This file exists to satisfy build requirements
// The actual implementation is in admin/src/services/bokun/types.ts

export interface BokunBookingFilters {
    startDate?: string;
    endDate?: string;
    status?: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
    limit?: number;
}

export interface TransformedBooking {
    id: number;
    booking_date: string;
    booking_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    adults: number;
    children: number;
    infants: number;
    total_participants: number;
    status: string;
    tour_type: string;
    created_at: string;
    tour_name: string;
    external_source: string;
    bokun_booking_id: string;
    confirmation_code: string;
    total_amount: number;
    currency: string;
    assigned_guide_id?: string;
    guide_notes?: string;
    assigned_guide?: any;
    charge_id?: string;
    discount_amount?: number;
    discount_code?: string;
    discount_code_id?: number;
}