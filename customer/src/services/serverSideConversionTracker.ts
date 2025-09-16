// Server-side Conversion Tracking Service
// Handles critical booking events that need server-side validation and tracking

import attributionService from './attributionService';
import offlineConversionService from './offlineConversionService';
import { trackServerSideConversion, trackEnhancedConversion } from './googleAdsTracker';
import privacyManager from './privacyManager';

interface ConversionData {
    event_type: string;
    transaction_id: string;
    value: number;
    currency?: string;
    tour_id?: string;
    tour_name?: string;
    tour_category?: string;
    quantity?: number;
    customer_email_hash?: string;
    customer_phone_hash?: string;
    customer_name_hash?: string;
    booking_date?: string;
    tour_date?: string;
    payment_method?: string;
    payment_provider?: string;
    original_device_id?: string;
    conversion_device_id?: string;
    time_to_conversion?: number;
}

interface ServerConversionData extends ConversionData {
    conversion_id: string;
    timestamp: number;
    gclid?: string;
    attribution_source?: string;
    attribution_medium?: string;
    attribution_campaign?: string;
    attribution_chain?: any[];
    device_id?: string;
    enhanced_conversion_data?: any;
    validation_required: boolean;
    client_timestamp: number;
    user_agent: string;
    page_url: string;
    referrer: string;
}

interface PendingConversion {
    data: ServerConversionData;
    timestamp: number;
    status: 'pending' | 'validated' | 'failed';
    updated?: number;
}

interface ServerResponse {
    success: boolean;
    error?: string;
    server_timestamp?: number;
    validation_id?: string;
}

interface BookingData {
    booking_id: string;
    total_amount: number;
    currency?: string;
    tour_id?: string;
    tour_name?: string;
    tour_category?: string;
    quantity?: number;
    customer_email?: string;
    customer_phone?: string;
    customer_name?: string;
    booking_date?: string;
    tour_date?: string;
}

interface PaymentData {
    payment_id: string;
    amount: number;
    currency?: string;
    tour_id?: string;
    tour_name?: string;
    tour_category?: string;
    quantity?: number;
    customer_email?: string;
    customer_phone?: string;
    customer_name?: string;
    payment_method?: string;
    payment_provider?: string;
}

interface CrossDeviceData {
    transactionId: string;
    value: number;
    currency?: string;
    tourId?: string;
    tourName?: string;
    tourCategory?: string;
    customerEmail?: string;
    customerPhone?: string;
    originalDeviceId?: string;
    conversionDeviceId?: string;
    timeToConversion?: number;
    originalDeviceType?: string;
    conversionDeviceType?: string;
    userId?: string;
}

interface PendingConversionsStats {
    total: number;
    pending: number;
    validated: number;
    failed: number;
    oldest: number | null;
}

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

class ServerSideConversionTracker {
    private serverEndpoint: string;
    private criticalEvents: string[];
    private pendingConversions: Map<string, PendingConversion>;

    constructor() {
        this.serverEndpoint = process.env.REACT_APP_SERVER_CONVERSION_ENDPOINT || '/api/server-conversions';
        this.criticalEvents = ['purchase', 'booking_confirmation', 'payment_success'];
        this.pendingConversions = new Map();
    }

    /**
     * Track a critical conversion event with server-side validation
     */
    async trackCriticalConversion(conversionData: ConversionData): Promise<boolean> {
        if (!privacyManager.canTrackMarketing()) {
            console.log('Server-side conversion tracking disabled due to privacy preferences');
            return false;
        }

        try {
            // Get enhanced attribution data
            const enhancedAttribution = attributionService.getEnhancedAttributionForAnalytics();

            // Prepare server-side conversion data
            const serverConversionData: ServerConversionData = {
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
     */
    private async trackValidatedConversion(conversionData: ServerConversionData, serverResponse: ServerResponse): Promise<void> {
        // Track enhanced conversion with server-validated data
        trackEnhancedConversion(conversionData.event_type, {
            value: conversionData.value,
            currency: conversionData.currency || 'JPY',
            transaction_id: conversionData.transaction_id,
            tour_id: conversionData.tour_id,
            tour_name: conversionData.tour_name
        }, {
            gclid: conversionData.gclid,
            device_id: conversionData.device_id,
            email: conversionData.customer_email_hash,
            phone_number: conversionData.customer_phone_hash,
            conversion_environment: {
                ...conversionData.enhanced_conversion_data?.conversion_environment,
                server_validated: true,
                server_timestamp: serverResponse.server_timestamp,
                validation_id: serverResponse.validation_id
            }
        });

        // Also track server-side conversion (only if tour data is available)
        if (conversionData.tour_id && conversionData.tour_name) {
            trackServerSideConversion({
                value: conversionData.value,
                currency: conversionData.currency,
                transaction_id: conversionData.transaction_id,
                gclid: conversionData.gclid,
                conversion_date_time: new Date(serverResponse.server_timestamp!).toISOString(),
                enhanced_conversion_data: conversionData.enhanced_conversion_data,
                attribution_source: conversionData.attribution_source,
                attribution_medium: conversionData.attribution_medium,
                attribution_campaign: conversionData.attribution_campaign,
                tour_id: conversionData.tour_id,
                tour_name: conversionData.tour_name,
                tour_category: conversionData.tour_category
            });
        }
    }

    /**
     * Track booking confirmation with enhanced validation
     */
    async trackBookingConfirmation(bookingData: BookingData): Promise<boolean> {
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
     */
    async trackPaymentSuccess(paymentData: PaymentData): Promise<boolean> {
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
     */
    async trackCrossDeviceConversionWithValidation(crossDeviceData: CrossDeviceData): Promise<boolean> {
        // First record the cross-device conversion in offline service (only if we have required data)
        if (crossDeviceData.originalDeviceId &&
            crossDeviceData.conversionDeviceId &&
            crossDeviceData.tourId &&
            crossDeviceData.tourName &&
            crossDeviceData.customerEmail &&
            crossDeviceData.customerPhone &&
            crossDeviceData.timeToConversion !== undefined &&
            crossDeviceData.originalDeviceType &&
            crossDeviceData.conversionDeviceType &&
            crossDeviceData.userId) {

            await offlineConversionService.recordCrossDeviceConversion({
                transactionId: crossDeviceData.transactionId,
                value: crossDeviceData.value,
                currency: crossDeviceData.currency,
                tourId: crossDeviceData.tourId,
                tourName: crossDeviceData.tourName,
                originalDeviceId: crossDeviceData.originalDeviceId,
                conversionDeviceId: crossDeviceData.conversionDeviceId,
                timeToConversion: crossDeviceData.timeToConversion,
                originalDeviceType: crossDeviceData.originalDeviceType,
                conversionDeviceType: crossDeviceData.conversionDeviceType,
                customerEmail: crossDeviceData.customerEmail,
                customerPhone: crossDeviceData.customerPhone,
                userId: crossDeviceData.userId
            });
        }

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
     */
    private async sendToServer(conversionData: ServerConversionData): Promise<ServerResponse> {
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
     */
    private updatePendingConversion(conversionId: string, status: 'pending' | 'validated' | 'failed'): void {
        const pending = this.pendingConversions.get(conversionId);
        if (pending) {
            pending.status = status;
            pending.updated = Date.now();
        }
    }

    /**
     * Get pending conversions statistics
     */
    getPendingConversionsStats(): PendingConversionsStats {
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
    cleanupPendingConversions(): void {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

        this.pendingConversions.forEach((conversion, conversionId) => {
            if (conversion.timestamp < cutoffTime) {
                this.pendingConversions.delete(conversionId);
            }
        });
    }

    /**
     * Generate unique conversion ID
     */
    private generateConversionId(): string {
        return 'server_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
    }

    /**
     * Hash email for privacy compliance
     */
    private hashEmail(email?: string): string | undefined {
        if (!email) return undefined;
        const normalized = email.toLowerCase().trim();
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash phone number for privacy compliance
     */
    private hashPhoneNumber(phoneNumber?: string): string | undefined {
        if (!phoneNumber) return undefined;
        const normalized = phoneNumber.replace(/\D/g, '');
        return btoa(normalized).substring(0, 16);
    }

    /**
     * Hash personal data for privacy compliance
     */
    private hashPersonalData(data?: string): string | undefined {
        if (!data) return undefined;
        const normalized = data.toLowerCase().trim();
        return btoa(normalized).substring(0, 12);
    }

    /**
     * Initialize server-side conversion tracker
     */
    initialize(): void {
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