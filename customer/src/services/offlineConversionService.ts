/**
 * Offline Conversion Service for phone bookings and server-side conversion tracking
 * Handles cross-device and offline conversion attribution for Google Ads
 */

import attributionService from './attributionService';
import privacyManager from './privacyManager';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BaseConversionData {
    conversion_action: string;
    conversion_value: number;
    currency: string;
    transaction_id: string;
    tour_id: string;
    tour_name: string;
}

interface PhoneBookingData {
    value: number;
    currency?: string;
    transactionId: string;
    tourId: string;
    tourName: string;
    customerPhone: string;
    customerEmail: string;
    bookingDate: string;
    tourDate: string;
    quantity?: number;
    firstName?: string;
    lastName?: string;
}

interface CrossDeviceData {
    value: number;
    currency?: string;
    transactionId: string;
    originalDeviceId: string;
    conversionDeviceId: string;
    tourId: string;
    tourName: string;
    timeToConversion: number;
    originalDeviceType: string;
    conversionDeviceType: string;
    customerEmail: string;
    customerPhone: string;
    userId: string;
}

interface EnhancedConversionData {
    phone_number?: string | null;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    user_id?: string;
}

interface OfflineConversionData extends BaseConversionData {
    customer_phone?: string | null;
    customer_email?: string | null;
    booking_date?: string;
    tour_date?: string;
    quantity?: number;
    booking_source?: string;
    original_device_id?: string;
    conversion_device_id?: string;
    time_to_conversion?: number;
    device_type_original?: string;
    device_type_conversion?: string;
    enhanced_conversion_data?: EnhancedConversionData;
}

interface QueuedConversion {
    id: string;
    timestamp: number;
    type: 'offline';
    status: 'queued' | 'retry' | 'sent' | 'failed';
    retries: number;
    data: OfflineConversionData;
    updated?: number;
    nextRetry?: number;
}

interface ImportResults {
    total: number;
    successful: number;
    failed: number;
    errors: string[];
}

interface QueueStats {
    total: number;
    queued: number;
    retry: number;
    sent: number;
    failed: number;
    oldest: number | null;
    newest: number | null;
}

interface ConversionPayload {
    conversion_id: string;
    timestamp: number;
    data: OfflineConversionData;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

class OfflineConversionService {
    private readonly offlineConversionsKey: string = 'offline_conversions_queue';
    private readonly serverEndpoint: string;
    private readonly maxRetries: number = 3;
    private readonly retryDelay: number = 5000; // 5 seconds
    private processingInterval?: NodeJS.Timeout;

    constructor() {
        this.serverEndpoint = process.env.REACT_APP_OFFLINE_CONVERSION_ENDPOINT || '/api/offline-conversions';
    }

    // ========================================================================
    // CORE CONVERSION METHODS
    // ========================================================================

    /**
     * Queue an offline conversion for processing
     * @param conversionData - Offline conversion data
     * @returns Success status
     */
    async queueOfflineConversion(conversionData: Record<string, any>): Promise<boolean> {
        if (!privacyManager.canTrackMarketing()) {
            console.log('Offline conversion tracking disabled due to privacy preferences');
            return false;
        }

        try {
            // Prepare enhanced conversion data
            const enhancedData = attributionService.prepareOfflineConversionData(conversionData);

            const offlineConversion: QueuedConversion = {
                id: this.generateConversionId(),
                timestamp: Date.now(),
                type: 'offline',
                status: 'queued',
                retries: 0,
                data: enhancedData as OfflineConversionData
            };

            // Add to queue
            this.addToQueue(offlineConversion);

            // Attempt immediate processing
            await this.processQueuedConversions();

            console.log('Offline conversion queued:', offlineConversion.id);
            return true;
        } catch (error) {
            console.error('Error queueing offline conversion:', error);
            return false;
        }
    }

    /**
     * Record a phone booking conversion
     * @param phoneBookingData - Phone booking details
     * @returns Success status
     */
    async recordPhoneBooking(phoneBookingData: PhoneBookingData): Promise<boolean> {
        const conversionData: OfflineConversionData = {
            conversion_action: 'phone_booking',
            conversion_value: phoneBookingData.value,
            currency: phoneBookingData.currency || 'JPY',
            transaction_id: phoneBookingData.transactionId,
            tour_id: phoneBookingData.tourId,
            tour_name: phoneBookingData.tourName,
            customer_phone: this.hashPhoneNumber(phoneBookingData.customerPhone),
            customer_email: this.hashEmail(phoneBookingData.customerEmail),
            booking_date: phoneBookingData.bookingDate,
            tour_date: phoneBookingData.tourDate,
            quantity: phoneBookingData.quantity || 1,
            booking_source: 'phone',
            // Enhanced conversion data for better attribution
            enhanced_conversion_data: {
                phone_number: this.hashPhoneNumber(phoneBookingData.customerPhone),
                email: this.hashEmail(phoneBookingData.customerEmail),
                first_name: this.hashPersonalData(phoneBookingData.firstName),
                last_name: this.hashPersonalData(phoneBookingData.lastName)
            }
        };

        return await this.queueOfflineConversion(conversionData);
    }

    /**
     * Record a cross-device conversion
     * @param crossDeviceData - Cross-device conversion details
     * @returns Success status
     */
    async recordCrossDeviceConversion(crossDeviceData: CrossDeviceData): Promise<boolean> {
        const conversionData: OfflineConversionData = {
            conversion_action: 'cross_device_purchase',
            conversion_value: crossDeviceData.value,
            currency: crossDeviceData.currency || 'JPY',
            transaction_id: crossDeviceData.transactionId,
            tour_id: crossDeviceData.tourId,
            tour_name: crossDeviceData.tourName,
            original_device_id: crossDeviceData.originalDeviceId,
            conversion_device_id: crossDeviceData.conversionDeviceId,
            time_to_conversion: crossDeviceData.timeToConversion,
            device_type_original: crossDeviceData.originalDeviceType,
            device_type_conversion: crossDeviceData.conversionDeviceType,
            // Enhanced conversion data
            enhanced_conversion_data: {
                email: this.hashEmail(crossDeviceData.customerEmail),
                phone_number: this.hashPhoneNumber(crossDeviceData.customerPhone),
                user_id: crossDeviceData.userId
            }
        };

        return await this.queueOfflineConversion(conversionData);
    }

    /**
     * Import offline conversions from external systems
     * @param conversions - Array of conversion data
     * @returns Import results
     */
    async importOfflineConversions(conversions: Record<string, any>[]): Promise<ImportResults> {
        const results: ImportResults = {
            total: conversions.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        for (const conversion of conversions) {
            try {
                const success = await this.queueOfflineConversion(conversion);
                if (success) {
                    results.successful++;
                } else {
                    results.failed++;
                    results.errors.push(`Failed to queue conversion: ${conversion.transaction_id}`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Error processing conversion ${conversion.transaction_id}: ${(error as Error).message}`);
            }
        }

        console.log('Offline conversion import results:', results);
        return results;
    }

    // ========================================================================
    // QUEUE PROCESSING METHODS
    // ========================================================================

    /**
     * Process queued offline conversions
     */
    async processQueuedConversions(): Promise<void> {
        const queue = this.getQueue();
        const pendingConversions = queue.filter(conv =>
            conv.status === 'queued' ||
            (conv.status === 'retry' && (!conv.nextRetry || Date.now() >= conv.nextRetry))
        );

        for (const conversion of pendingConversions) {
            try {
                await this.sendOfflineConversion(conversion);
                this.updateConversionStatus(conversion.id, 'sent');
            } catch (error) {
                console.error(`Failed to send offline conversion ${conversion.id}:`, error);

                if (conversion.retries < this.maxRetries) {
                    conversion.retries++;
                    conversion.status = 'retry';
                    conversion.nextRetry = Date.now() + (this.retryDelay * conversion.retries);
                    this.updateConversionInQueue(conversion);
                } else {
                    this.updateConversionStatus(conversion.id, 'failed');
                }
            }
        }

        // Clean up old conversions
        this.cleanupOldConversions();
    }

    /**
     * Send offline conversion to server
     * @param conversion - Conversion data to send
     */
    private async sendOfflineConversion(conversion: QueuedConversion): Promise<void> {
        const payload: ConversionPayload = {
            conversion_id: conversion.id,
            timestamp: conversion.timestamp,
            data: conversion.data
        };

        const response = await fetch(this.serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Offline conversion sent successfully:', result);
    }

    // ========================================================================
    // QUEUE MANAGEMENT METHODS
    // ========================================================================

    /**
     * Add conversion to queue
     * @param conversion - Conversion to add
     */
    private addToQueue(conversion: QueuedConversion): void {
        try {
            if (typeof localStorage === 'undefined') {
                console.warn('localStorage not available, cannot queue offline conversion');
                return;
            }

            const queue = this.getQueue();
            queue.push(conversion);
            localStorage.setItem(this.offlineConversionsKey, JSON.stringify(queue));
        } catch (error) {
            console.error('Error adding conversion to queue:', error);
        }
    }

    /**
     * Get conversion queue
     * @returns Queue of conversions
     */
    private getQueue(): QueuedConversion[] {
        try {
            if (typeof localStorage === 'undefined') {
                return [];
            }

            const queue = localStorage.getItem(this.offlineConversionsKey);
            return queue ? JSON.parse(queue) : [];
        } catch (error) {
            console.error('Error retrieving conversion queue:', error);
            return [];
        }
    }

    /**
     * Update conversion status in queue
     * @param conversionId - Conversion ID
     * @param status - New status
     */
    private updateConversionStatus(conversionId: string, status: QueuedConversion['status']): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const queue = this.getQueue();
            const conversion = queue.find(conv => conv.id === conversionId);
            if (conversion) {
                conversion.status = status;
                conversion.updated = Date.now();
                localStorage.setItem(this.offlineConversionsKey, JSON.stringify(queue));
            }
        } catch (error) {
            console.error('Error updating conversion status:', error);
        }
    }

    /**
     * Update conversion in queue
     * @param updatedConversion - Updated conversion data
     */
    private updateConversionInQueue(updatedConversion: QueuedConversion): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const queue = this.getQueue();
            const index = queue.findIndex(conv => conv.id === updatedConversion.id);
            if (index !== -1) {
                queue[index] = updatedConversion;
                localStorage.setItem(this.offlineConversionsKey, JSON.stringify(queue));
            }
        } catch (error) {
            console.error('Error updating conversion in queue:', error);
        }
    }

    /**
     * Clean up old conversions from queue
     */
    private cleanupOldConversions(): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const queue = this.getQueue();
            const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days

            const cleanedQueue = queue.filter(conv => {
                return conv.timestamp > cutoffTime && conv.status !== 'sent';
            });

            if (cleanedQueue.length !== queue.length) {
                localStorage.setItem(this.offlineConversionsKey, JSON.stringify(cleanedQueue));
                console.log(`Cleaned up ${queue.length - cleanedQueue.length} old conversions`);
            }
        } catch (error) {
            console.error('Error cleaning up conversions:', error);
        }
    }

    // ========================================================================
    // UTILITY METHODS
    // ========================================================================

    /**
     * Generate unique conversion ID
     * @returns Unique conversion ID
     */
    private generateConversionId(): string {
        return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    }

    /**
     * Hash phone number for privacy compliance
     * @param phoneNumber - Phone number to hash
     * @returns Hashed phone number
     */
    private hashPhoneNumber(phoneNumber?: string): string | null {
        if (!phoneNumber) return null;

        // Remove all non-digit characters and normalize
        const normalized = phoneNumber.replace(/\D/g, '');

        // Simple hash for privacy (in production, use proper hashing)
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash email for privacy compliance
     * @param email - Email to hash
     * @returns Hashed email
     */
    private hashEmail(email?: string): string | null {
        if (!email) return null;

        // Normalize email (lowercase, trim)
        const normalized = email.toLowerCase().trim();

        // Simple hash for privacy (in production, use proper hashing)
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash personal data for privacy compliance
     * @param data - Personal data to hash
     * @returns Hashed data
     */
    private hashPersonalData(data?: string): string | null {
        if (!data) return null;

        // Normalize data (lowercase, trim)
        const normalized = data.toLowerCase().trim();

        // Simple hash for privacy (in production, use proper hashing)
        return btoa(normalized).substring(0, 12);
    }

    // ========================================================================
    // PUBLIC API METHODS
    // ========================================================================

    /**
     * Get queue statistics
     * @returns Queue statistics
     */
    getQueueStats(): QueueStats {
        const queue = this.getQueue();

        return {
            total: queue.length,
            queued: queue.filter(conv => conv.status === 'queued').length,
            retry: queue.filter(conv => conv.status === 'retry').length,
            sent: queue.filter(conv => conv.status === 'sent').length,
            failed: queue.filter(conv => conv.status === 'failed').length,
            oldest: queue.length > 0 ? Math.min(...queue.map(conv => conv.timestamp)) : null,
            newest: queue.length > 0 ? Math.max(...queue.map(conv => conv.timestamp)) : null
        };
    }

    /**
     * Clear all queued conversions (for testing or privacy compliance)
     */
    clearQueue(): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.offlineConversionsKey);
        }
        console.log('Offline conversion queue cleared');
    }

    /**
     * Initialize offline conversion service
     */
    initialize(): void {
        // Set up periodic processing of queued conversions
        this.processingInterval = setInterval(() => {
            this.processQueuedConversions();
        }, 60000); // Process every minute

        // Process any existing queued conversions on startup
        setTimeout(() => {
            this.processQueuedConversions();
        }, 5000); // Wait 5 seconds after initialization

        console.log('Offline conversion service initialized');
    }

    /**
     * Cleanup service resources
     */
    cleanup(): void {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = undefined;
        }
        console.log('Offline conversion service cleaned up');
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

const offlineConversionService = new OfflineConversionService();

export default offlineConversionService;
export type {
    PhoneBookingData,
    CrossDeviceData,
    OfflineConversionData,
    QueuedConversion,
    ImportResults,
    QueueStats
};