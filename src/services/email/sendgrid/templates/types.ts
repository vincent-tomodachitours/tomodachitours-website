export interface BookingConfirmationTemplateData {
    bookingId: string;
    tourName: string;
    tourDate: string;
    tourTime: string;
    adults: number;
    children?: number;
    infants?: number;
    totalAmount: string;
}

export interface BookingNotificationTemplateData {
    bookingId: string;
    productBookingRef: string;
    extBookingRef: string;
    productId: string;
    tourName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    tourDate: string;
    tourTime: string;
    adults: number;
    adultPlural: boolean;
    children?: number;
    infants?: number;
    createdDate: string;
    createdTime: string;
    totalAmount: string;
}

export interface CancellationConfirmationTemplateData {
    bookingId: string;
    tourName: string;
    tourDate: string;
    tourTime: string;
    adults: number;
    children?: number;
    infants?: number;
    refundAmount: string;
}

export interface CancellationNotificationTemplateData {
    bookingId: string;
    tourName: string;
    customerName: string;
    customerEmail: string;
    tourDate: string;
    tourTime: string;
    adults: number;
    adultPlural: boolean;
    children?: number;
    infants?: number;
    cancelledDate: string;
    cancelledTime: string;
    refundAmount: string;
} 