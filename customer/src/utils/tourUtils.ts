/**
 * Utility functions for tour-related operations
 */

/**
 * Determines if a tour requires the booking request flow (Uji tours)
 * @param tourId - The tour identifier (sheetId)
 * @returns true if the tour requires booking request flow, false for instant booking
 */
export const isBookingRequestTour = (tourId: string): boolean => {
    const requestTourIds = ['uji-tour', 'uji-walking-tour'];
    return requestTourIds.includes(tourId);
};

/**
 * Gets the appropriate button text based on tour type
 * @param tourId - The tour identifier
 * @param isProcessing - Whether payment is currently processing
 * @param finalPrice - The final price to display
 * @returns The button text to display
 */
export const getCheckoutButtonText = (
    tourId: string, 
    isProcessing: boolean, 
    finalPrice: number
): string => {
    if (isProcessing) {
        return isBookingRequestTour(tourId) ? 'Submitting Request...' : 'Processing...';
    }
    
    if (isBookingRequestTour(tourId)) {
        return 'Request Booking';
    }
    
    return `Pay ¥${finalPrice.toLocaleString()}`;
};

/**
 * Gets the appropriate confirmation message for the tour type
 * @param tourId - The tour identifier
 * @returns The confirmation message to display
 */
export const getConfirmationMessage = (tourId: string): string => {
    if (isBookingRequestTour(tourId)) {
        return 'Your booking request has been submitted and is pending confirmation. You will receive an email shortly with details about the approval process.';
    }
    
    return 'Your booking has been confirmed! You will receive a confirmation email shortly.';
};

/**
 * Gets the processing message for the tour type
 * @param tourId - The tour identifier
 * @returns The processing message to display
 */
export const getProcessingMessage = (tourId: string): string => {
    if (isBookingRequestTour(tourId)) {
        return 'Submitting your booking request. Please wait while we process your information.';
    }
    
    return 'Processing your payment. Please wait while we securely process your booking.';
};