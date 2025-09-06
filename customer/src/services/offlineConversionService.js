// Offline Conversion Service for phone bookings and server-side conversion tracking
// Handles cross-device and offline conversion attribution for Google Ads

import attributionService from './attributionService.js';
import privacyManager from './privacyManager.js';

class OfflineConversionService {
    constructor() {
        this.offlineConversionsKey = 'offline_conversions_queue';
        this.serverEndpoint = process.env.REACT_APP_OFFLINE_CONVERSION_ENDPOINT || '/api/offline-conversions';
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
    }

    /**
     * Queue an offline conversion for processing
     * @param {Object} conversionData - Offline conversion data
     * @returns {Promise<boolean>} Success status
     */
    async queueOfflineConversion(conversionData) {
        if (!privacyManager.canTrackMarketing()) {
            console.log('Offline conversion tracking disabled due to privacy preferences');
            return false;
        }

        try {
            // Prepare enhanced conversion data
            const enhancedData = attributionService.prepareOfflineConversionData(conversionData);

            const offlineConversion = {
                id: this.generateConversionId(),
                timestamp: Date.now(),
                type: 'offline',
                status: 'queued',
                retries: 0,
                data: enhancedData
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
     * @param {Object} phoneBookingData - Phone booking details
     * @returns {Promise<boolean>} Success status
     */
    async recordPhoneBooking(phoneBookingData) {
        const conversionData = {
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
     * @param {Object} crossDeviceData - Cross-device conversion details
     * @returns {Promise<boolean>} Success status
     */
    async recordCrossDeviceConversion(crossDeviceData) {
        const conversionData = {
            conversion_action: 'cross_device_purchase',
            conversion_value: crossDeviceData.value,
            currency: crossDeviceData.currency || 'JPY',
            transaction_id: crossDeviceData.transactionId,
            original_device_id: crossDeviceData.originalDeviceId,
            conversion_device_id: crossDeviceData.conversionDeviceId,
            tour_id: crossDeviceData.tourId,
            tour_name: crossDeviceData.tourName,
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
     * @param {Array} conversions - Array of conversion data
     * @returns {Promise<Object>} Import results
     */
    async importOfflineConversions(conversions) {
        const results = {
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
                results.errors.push(`Error processing conversion ${conversion.transaction_id}: ${error.message}`);
            }
        }

        console.log('Offline conversion import results:', results);
        return results;
    }

    /**
     * Process queued offline conversions
     * @returns {Promise<void>}
     */
    async processQueuedConversions() {
        const queue = this.getQueue();
        const pendingConversions = queue.filter(conv => conv.status === 'queued' || conv.status === 'retry');

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
     * @param {Object} conversion - Conversion data to send
     * @returns {Promise<void>}
     */
    async sendOfflineConversion(conversion) {
        const response = await fetch(this.serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversion_id: conversion.id,
                timestamp: conversion.timestamp,
                data: conversion.data
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Offline conversion sent successfully:', result);
    }

    /**
     * Add conversion to queue
     * @param {Object} conversion - Conversion to add
     */
    addToQueue(conversion) {
        try {
            const queue = this.getQueue();
            queue.push(conversion);
            localStorage.setItem(this.offlineConversionsKey, JSON.stringify(queue));
        } catch (error) {
            console.error('Error adding conversion to queue:', error);
        }
    }

    /**
     * Get conversion queue
     * @returns {Array} Queue of conversions
     */
    getQueue() {
        try {
            const queue = localStorage.getItem(this.offlineConversionsKey);
            return queue ? JSON.parse(queue) : [];
        } catch (error) {
            console.error('Error retrieving conversion queue:', error);
            return [];
        }
    }

    /**
     * Update conversion status in queue
     * @param {string} conversionId - Conversion ID
     * @param {string} status - New status
     */
    updateConversionStatus(conversionId, status) {
        try {
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
     * @param {Object} updatedConversion - Updated conversion data
     */
    updateConversionInQueue(updatedConversion) {
        try {
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
    cleanupOldConversions() {
        try {
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

    /**
     * Generate unique conversion ID
     * @returns {string} Unique conversion ID
     */
    generateConversionId() {
        return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    }

    /**
     * Hash phone number for privacy compliance
     * @param {string} phoneNumber - Phone number to hash
     * @returns {string} Hashed phone number
     */
    hashPhoneNumber(phoneNumber) {
        if (!phoneNumber) return null;

        // Remove all non-digit characters and normalize
        const normalized = phoneNumber.replace(/\D/g, '');

        // Simple hash for privacy (in production, use proper hashing)
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash email for privacy compliance
     * @param {string} email - Email to hash
     * @returns {string} Hashed email
     */
    hashEmail(email) {
        if (!email) return null;

        // Normalize email (lowercase, trim)
        const normalized = email.toLowerCase().trim();

        // Simple hash for privacy (in production, use proper hashing)
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash personal data for privacy compliance
     * @param {string} data - Personal data to hash
     * @returns {string} Hashed data
     */
    hashPersonalData(data) {
        if (!data) return null;

        // Normalize data (lowercase, trim)
        const normalized = data.toLowerCase().trim();

        // Simple hash for privacy (in production, use proper hashing)
        return btoa(normalized).substring(0, 12);
    }

    /**
     * Get queue statistics
     * @returns {Object} Queue statistics
     */
    getQueueStats() {
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
    clearQueue() {
        localStorage.removeItem(this.offlineConversionsKey);
        console.log('Offline conversion queue cleared');
    }

    /**
     * Initialize offline conversion service
     */
    initialize() {
        // Set up periodic processing of queued conversions
        setInterval(() => {
            this.processQueuedConversions();
        }, 60000); // Process every minute

        // Process any existing queued conversions on startup
        setTimeout(() => {
            this.processQueuedConversions();
        }, 5000); // Wait 5 seconds after initialization

        console.log('Offline conversion service initialized');
    }
}

// Create singleton instance
const offlineConversionService = new OfflineConversionService();

export default offlineConversionService;