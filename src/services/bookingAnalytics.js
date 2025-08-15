// Booking Analytics Helper Service
// This service helps store and retrieve booking data for conversion tracking

export const storeBookingForAnalytics = (bookingData) => {
    try {
        const analyticsData = {
            transactionId: bookingData.transactionId || bookingData.booking_id || `booking_${Date.now()}`,
            tourId: mapTourTypeToAnalyticsId(bookingData.tour_type || bookingData.tourType),
            tourName: bookingData.tour_name || bookingData.tourName || 'Tour Booking',
            price: parseFloat(bookingData.total_price || bookingData.price || 0),
            currency: 'JPY',
            quantity: parseInt(bookingData.total_participants || bookingData.participants || 1),
            customerEmail: bookingData.customer_email || bookingData.email,
            bookingDate: bookingData.booking_date || bookingData.date,
            bookingTime: bookingData.booking_time || bookingData.time,
            timestamp: Date.now()
        };

        // Store in session storage for the thank you page
        sessionStorage.setItem('completedBooking', JSON.stringify(analyticsData));

        console.log('📊 Booking data stored for analytics:', analyticsData);
        return analyticsData;
    } catch (error) {
        console.error('Failed to store booking analytics data:', error);
        return null;
    }
};

export const getStoredBookingData = () => {
    try {
        const storedData = sessionStorage.getItem('completedBooking');
        if (storedData) {
            return JSON.parse(storedData);
        }
        return null;
    } catch (error) {
        console.error('Failed to retrieve booking analytics data:', error);
        return null;
    }
};

export const clearStoredBookingData = () => {
    try {
        sessionStorage.removeItem('completedBooking');
    } catch (error) {
        console.error('Failed to clear booking analytics data:', error);
    }
};

// Helper function to map tour types to analytics IDs
const mapTourTypeToAnalyticsId = (tourType) => {
    const tourMap = {
        'NIGHT_TOUR': 'night_tour',
        'MORNING_TOUR': 'morning_tour',
        'UJI_TOUR': 'uji_tour',
        'GION_TOUR': 'gion_tour',
        // Keep backwards compatibility
        'Night tour': 'night_tour',
        'Morning tour': 'morning_tour',
        'Uji tour': 'uji_tour',
        'Gion tour': 'gion_tour',
        'night-tour': 'night_tour',
        'morning-tour': 'morning_tour',
        'uji-tour': 'uji_tour',
        'gion-tour': 'gion_tour'
    };

    return tourMap[tourType] || 'unknown_tour';
};

export default {
    storeBookingForAnalytics,
    getStoredBookingData,
    clearStoredBookingData
};