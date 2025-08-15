// Server-side Conversion Tracking Service
// Handles critical booking events that need server-side validation and tracking

import attributionService from './attributionService.js';
import offlineConversionService from './offlineConversionService.js';
import { trackServerSideConversion, trackEnhancedConversion } from './googleAdsTracker.js';
import privacyManager from './privacyManager.js';

class ServerSideConversionTracker {
    constructor() {
        this.serverEndpoint = process.env.REACT_APP_SERVER_CONVERSION_ENDPOINT || '/api/server-conversions';
        this.criticalEvents = ['purchase', 'booking_confirmation', 'payment_success'];
        this.pendingConversions = new Map();
    }

    /**
     * Track a critical conversion event with server-side validation
     * @param {Object} conversionData - Conversion data
     * @returns {Promise<boolean>} Success status
     */
    async trackCriticalConversion(conversionData) {
        if (!privacyManager.canTrackMarketing()) {
            console.log('Server-side conversion tracking disabled due to privacy preferences');
            return false;
        }

        try {
            // Get enhanced attribution data
            const enhancedAttribution = attributionService.getEnhancedAttributionForAnalytics();

            // Prepare server-side conversion data
            const serverConversionData = {
                conversion_id: this.generateConversionId(),
                timestamp: Date.now(),
                event_type: conversionData.event_type,
                transaction_id: conversionData.transaction_id,
                value: conversionData.value,
                currency: conversionData.currency || 'JPY',

                // Tour-specific data
                tour_id: conversionData.tour_id,
                tour_name: conversionData.tour_name,
                tour_category: conversionData.tour_category,
                quantity: conversionData.quantity || 1,

                // Enhanced attribution data
                gclid: enhancedAttribution.stored_gclid || enhancedAttribution.gclid,
                attribution_source: enhancedAttribution.source,
                attribution_medium: enhancedAttribution.medium,
                attribution_campaign: enhancedAttribution.campaign,
                attribution_chain: enhancedAttribution.attribution_chain,
                device_id: enhancedAttribution.device_id,

                // Enhanced conversion data for cross-device tracking
                enhanced_conversion_data: enhancedAttribution.enhanced_conversion_data,

                // Customer data (hashed for privacy)
                customer_email_hash: conversionData.customer_email_hash,
                customer_phone_hash: conversionData.customer_phone_hash,
                customer_name_hash: conversionData.customer_name_hash,

                // Validation data
                validation_required: this.criticalEvents.includes(conversionData.event_type),
                client_timestamp: Date.now(),
                user_agent: navigator.userAgent,
                page_url: window.location.href,
                referrer: document.referrer
            };

            // Store pending conversion for validation
            this.pendingConversions.set(serverConversionData.conversion_id, {
                data: serverConversionData,
                timestamp: Date.now(),
                status: 'pending'
            });

            // Send to server for validation and processing
            const serverResponse = await this.sendToServer(serverConversionData);

            if (serverResponse.success) {
                // Track client-side conversion with server validation
                await this.trackValidatedConversion(serverConversionData, serverResponse);

                // Update pending conversion status
                this.updatePendingConversion(serverConversionData.conversion_id, 'validated');

                console.log('Critical conversion tracked with server validation:', serverConversionData.conversion_id);
                return true;
            } else {
                console.error('Server validation failed for conversion:', serverResponse.error);
                this.updatePendingConversion(serverConversionData.conversion_id, 'failed');
                return false;
            }
        } catch (error) {
            console.error('Error tracking critical conversion:', error);
            return false;
        }
    }

    /**
     * Track a validated conversion after server confirmation
     * @param {Object} conversionData - Original conversion data
     * @param {Object} serverResponse - Server validation response
     */
    async trackValidatedConversion(conversionData, serverResponse) {
        // Track enhanced conversion with server-validated data
        trackEnhancedConversion(conversionData.event_type, {
            value: conversionData.value,
            currency: conversionData.currency,
            transaction_id: conversionData.transaction_id,
            tour_id: conversionData.tour_id,
            tour_name: conversionData.tour_name,
            server_validated: true,
            server_timestamp: serverResponse.server_timestamp,
            validation_id: serverResponse.validation_id
        }, {
            gclid: conversionData.gclid,
            device_id: conversionData.device_id,
            email: conversionData.customer_email_hash,
            phone_number: conversionData.customer_phone_hash,
            conversion_environment: conversionData.enhanced_conversion_data?.conversion_environment
        });

        // Also track server-side conversion
        trackServerSideConversion({
            value: conversionData.value,
            currency: conversionData.currency,
            transaction_id: conversionData.transaction_id,
            gclid: conversionData.gclid,
            conversion_date_time: new Date(serverResponse.server_timestamp).toISOString(),
            enhanced_conversion_data: conversionData.enhanced_conversion_data,
            attribution_source: conversionData.attribution_source,
            attribution_medium: conversionData.attribution_medium,
            attribution_campaign: conversionData.attribution_campaign,
            tour_id: conversionData.tour_id,
            tour_name: conversionData.tour_name,
            tour_category: conversionData.tour_category
        });
    }

    /**
     * Track booking confirmation with enhanced validation
     * @param {Object} bookingData - Booking confirmation data
     * @returns {Promise<boolean>} Success status
     */
    async trackBookingConfirmation(bookingData) {
        return await this.trackCriticalConversion({
            event_type: 'booking_confirmation',
            transaction_id: bookingData.booking_id,
            value: bookingData.total_amount,
            currency: bookingData.currency || 'JPY',
            tour_id: bookingData.tour_id,
            tour_name: bookingData.tour_name,
            tour_category: bookingData.tour_category,
            quantity: bookingData.quantity,
            customer_email_hash: this.hashEmail(bookingData.customer_email),
            customer_phone_hash: this.hashPhoneNumber(bookingData.customer_phone),
            customer_name_hash: this.hashPersonalData(bookingData.customer_name),
            booking_date: bookingData.booking_date,
            tour_date: bookingData.tour_date
        });
    }

    /**
     * Track payment success with server validation
     * @param {Object} paymentData - Payment success data
     * @returns {Promise<boolean>} Success status
     */
    async trackPaymentSuccess(paymentData) {
        return await this.trackCriticalConversion({
            event_type: 'payment_success',
            transaction_id: paymentData.payment_id,
            value: paymentData.amount,
            currency: paymentData.currency || 'JPY',
            tour_id: paymentData.tour_id,
            tour_name: paymentData.tour_name,
            tour_category: paymentData.tour_category,
            quantity: paymentData.quantity,
            customer_email_hash: this.hashEmail(paymentData.customer_email),
            customer_phone_hash: this.hashPhoneNumber(paymentData.customer_phone),
            customer_name_hash: this.hashPersonalData(paymentData.customer_name),
            payment_method: paymentData.payment_method,
            payment_provider: paymentData.payment_provider
        });
    }

    /**
     * Handle cross-device conversion with server validation
     * @param {Object} crossDeviceData - Cross-device conversion data
     * @returns {Promise<boolean>} Success status
     */
    async trackCrossDeviceConversionWithValidation(crossDeviceData) {
        // First record the cross-device conversion in offline service
        await offlineConversionService.recordCrossDeviceConversion(crossDeviceData);

        // Then track with server validation
        return await this.trackCriticalConversion({
            event_type: 'cross_device_purchase',
            transaction_id: crossDeviceData.transactionId,
            value: crossDeviceData.value,
            currency: crossDeviceData.currency || 'JPY',
            tour_id: crossDeviceData.tourId,
            tour_name: crossDeviceData.tourName,
            tour_category: crossDeviceData.tourCategory,
            customer_email_hash: this.hashEmail(crossDeviceData.customerEmail),
            customer_phone_hash: this.hashPhoneNumber(crossDeviceData.customerPhone),
            original_device_id: crossDeviceData.originalDeviceId,
            conversion_device_id: crossDeviceData.conversionDeviceId,
            time_to_conversion: crossDeviceData.timeToConversion
        });
    }

    /**
     * Send conversion data to server for validation
     * @param {Object} conversionData - Conversion data to validate
     * @returns {Promise<Object>} Server response
     */
    async sendToServer(conversionData) {
        const response = await fetch(this.serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(conversionData)
        });

        if (!response.ok) {
            throw new Error(`Server validation failed with status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Update pending conversion status
     * @param {string} conversionId - Conversion ID
     * @param {string} status - New status
     */
    updatePendingConversion(conversionId, status) {
        const pending = this.pendingConversions.get(conversionId);
        if (pending) {
            pending.status = status;
            pending.updated = Date.now();
        }
    }

    /**
     * Get pending conversions statistics
     * @returns {Object} Pending conversions stats
     */
    getPendingConversionsStats() {
        const conversions = Array.from(this.pendingConversions.values());

        return {
            total: conversions.length,
            pending: conversions.filter(conv => conv.status === 'pending').length,
            validated: conversions.filter(conv => conv.status === 'validated').length,
            failed: conversions.filter(conv => conv.status === 'failed').length,
            oldest: conversions.length > 0 ? Math.min(...conversions.map(conv => conv.timestamp)) : null
        };
    }

    /**
     * Clean up old pending conversions
     */
    cleanupPendingConversions() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

        for (const [conversionId, conversion] of this.pendingConversions.entries()) {
            if (conversion.timestamp < cutoffTime) {
                this.pendingConversions.delete(conversionId);
            }
        }
    }

    /**
     * Generate unique conversion ID
     * @returns {string} Unique conversion ID
     */
    generateConversionId() {
        return 'server_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
    }

    /**
     * Hash email for privacy compliance
     * @param {string} email - Email to hash
     * @returns {string} Hashed email
     */
    hashEmail(email) {
        if (!email) return null;
        const normalized = email.toLowerCase().trim();
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash phone number for privacy compliance
     * @param {string} phoneNumber - Phone number to hash
     * @returns {string} Hashed phone number
     */
    hashPhoneNumber(phoneNumber) {
        if (!phoneNumber) return null;
        const normalized = phoneNumber.replace(/\D/g, '');
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash personal data for privacy compliance
     * @param {string} data - Personal data to hash
     * @returns {string} Hashed data
     */
    hashPersonalData(data) {
        if (!data) return null;
        const normalized = data.toLowerCase().trim();
        return btoa(normalized).substring(0, 12);
    }

    /**
     * Initialize server-side conversion tracker
     */
    initialize() {
        // Set up periodic cleanup of pending conversions
        setInterval(() => {
            this.cleanupPendingConversions();
        }, 60 * 60 * 1000); // Clean up every hour

        console.log('Server-side conversion tracker initialized');
    }
}

// Create singleton instance
const serverSideConversionTracker = new ServerSideConversionTracker();

export default serverSideConversionTracker;