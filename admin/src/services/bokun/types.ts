import { Employee, Booking, BookingStatus } from '../../types';

// Bokun API booking interface (based on actual API response)
export interface BokunBooking {
    id: string;
    confirmationCode: string;
    productId?: string;
    product?: {
        id: number;
        title: string;
    };
    status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        phone?: string;
    };
    totalPrice?: number;
    totalPriceAmount?: number;
    currency: string;
    creationDate?: number;
    bookingCreationDate?: number;
    startDate?: number;
    startDateTime?: number;
    fields?: {
        startTimeStr?: string;
        totalParticipants?: number;
        priceCategoryBookings?: Array<{
            pricingCategoryId: number;
            pricingCategory: {
                id: number;
                title: string;
                ticketCategory: 'ADULT' | 'CHILD' | 'INFANT';
                minAge?: number;
                maxAge?: number;
                fullTitle?: string;
            };
            quantity: number;
            bookedTitle: string;
        }>;
    };
    channel?: {
        title: string;
        channelType: string;
    };
}

export interface BokunBookingFilters {
    startDate?: string;
    endDate?: string;
    status?: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
    limit?: number;
}

// Transformed booking interface to match admin expectations
export interface TransformedBooking {
    id: number; // Convert string to number for compatibility
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

    // Bokun-specific fields
    tour_name: string;
    external_source: string;
    bokun_booking_id: string;
    confirmation_code: string;
    total_amount: number;
    currency: string;

    // Admin fields for compatibility
    assigned_guide_id?: string;
    guide_notes?: string;
    assigned_guide?: Employee;
    charge_id?: string;
    discount_amount?: number;
    discount_code?: string;
    discount_code_id?: number;
}