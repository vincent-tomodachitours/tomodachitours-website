import { Booking, BookingStatus } from '../../types';

export class BokunTransformer {
    /**
     * Transform Bokun booking to local booking format
     */
    static transformBokunBooking(bokunBooking: any, productMapping: Map<string, string>): Booking {
        // Get the actual product ID from the booking and map it to local tour type
        const bokunProductId = bokunBooking.product?.id?.toString() || bokunBooking.productId?.toString();
        const tourType = productMapping.get(bokunProductId) || 'UNKNOWN_TOUR';

        if (!bokunProductId || tourType === 'UNKNOWN_TOUR') {
            console.warn('Unknown Bokun product ID in booking:', bokunProductId, 'Available mappings:', Array.from(productMapping.keys()));
        }

        // Convert Bokun timestamp to date string (YYYY-MM-DD)
        const bookingDate = bokunBooking.startDate
            ? new Date(bokunBooking.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        // Extract time from fields.startTimeStr
        const bookingTime = bokunBooking.fields?.startTimeStr || '18:00';

        // Extract participant breakdown from Bokun booking
        // Bokun stores participant data in fields.priceCategoryBookings array
        const priceCategoryBookings = bokunBooking.fields?.priceCategoryBookings || [];

        let adults = 0;
        let children = 0;
        let infants = 0;

        // Count participants by category
        priceCategoryBookings.forEach((booking: any) => {
            const ticketCategory = booking.pricingCategory?.ticketCategory;
            const quantity = booking.quantity || 1;

            switch (ticketCategory) {
                case 'ADULT':
                    adults += quantity;
                    break;
                case 'CHILD':
                    children += quantity;
                    break;
                case 'INFANT':
                    infants += quantity;
                    break;
                default:
                    // If category is unknown, assume adult
                    console.warn('Unknown ticket category:', ticketCategory, 'treating as adult');
                    adults += quantity;
            }
        });

        const totalParticipants = adults + children + infants || bokunBooking.fields?.totalParticipants || 1;

        console.log('🔍 DEBUG: Extracted participants from priceCategoryBookings - Adults:', adults, 'Children:', children, 'Infants:', infants, 'Total:', totalParticipants);

        return {
            id: parseInt(bokunBooking.id) || Math.floor(Math.random() * 1000000),
            tour_type: tourType,
            booking_date: bookingDate,
            booking_time: bookingTime,
            customer_name: `${bokunBooking.customer?.firstName || 'External'} ${bokunBooking.customer?.lastName || 'Booking'}`,
            customer_email: bokunBooking.customer?.email || 'external@bokun.com',
            customer_phone: bokunBooking.customer?.phoneNumber || bokunBooking.customer?.phone,
            adults: adults,
            children: children,
            infants: infants,
            total_participants: totalParticipants,
            status: 'CONFIRMED' as BookingStatus, // All Bokun bookings we fetch should be confirmed
            external_source: 'bokun',
            bokun_booking_id: bokunBooking.id,
            created_at: bokunBooking.creationDate ? new Date(bokunBooking.creationDate).toISOString() : new Date().toISOString(),
            bokun_synced: true,
            // Admin specific fields
            assigned_guide_id: undefined,
            guide_notes: undefined,
            assigned_guide: undefined,
            charge_id: undefined,
            discount_amount: undefined,
            discount_code: undefined,
            discount_code_id: undefined
        };
    }

    /**
     * Transform cached booking to match the expected format
     */
    static transformCachedBooking(cached: any): Booking {
        return {
            id: cached.id,
            tour_type: cached.tour_type,
            booking_date: cached.booking_date,
            booking_time: cached.booking_time,
            customer_name: cached.customer_name,
            customer_email: cached.customer_email,
            customer_phone: cached.customer_phone,
            adults: cached.adults,
            children: cached.children,
            infants: cached.infants,
            total_participants: cached.total_participants,
            status: cached.status as BookingStatus,
            external_source: 'bokun',
            bokun_booking_id: cached.bokun_booking_id,
            created_at: cached.last_synced, // Use sync time as created_at
            bokun_synced: true,
            // Guide assignment fields from cache
            assigned_guide_id: cached.assigned_guide_id,
            guide_notes: cached.guide_notes,
            assigned_guide: cached.assigned_guide,
            // Other admin fields
            charge_id: undefined,
            discount_amount: undefined,
            discount_code: undefined,
            discount_code_id: undefined
        };
    }
}