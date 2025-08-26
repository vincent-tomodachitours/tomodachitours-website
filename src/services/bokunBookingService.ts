// This file exists to satisfy build requirements
// The actual implementation is in admin/src/services/bokunBookingService.ts

export type { BokunBookingFilters, TransformedBooking } from './bokun/types';

export class BokunBookingService {
    static async getAllBookings() {
        throw new Error('This is a placeholder. Use admin/src/services/bokunBookingService.ts instead.');
    }

    static async syncBokunCache() {
        throw new Error('This is a placeholder. Use admin/src/services/bokunBookingService.ts instead.');
    }

    static async clearCache() {
        throw new Error('This is a placeholder. Use admin/src/services/bokunBookingService.ts instead.');
    }

    static async getCacheHealth() {
        throw new Error('This is a placeholder. Use admin/src/services/bokunBookingService.ts instead.');
    }

    static async inspectBokunApiResponse() {
        throw new Error('This is a placeholder. Use admin/src/services/bokunBookingService.ts instead.');
    }
}