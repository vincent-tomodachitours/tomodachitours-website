export interface TransactionData {
    bookingId: string;
    tourId: string;
    amount: number;
    email: string;
    ip: string;
    userId: string;
    userAgent?: string;
    correlationId?: string;
} 