// Integration tests for cross-device and offline conversion tracking functionality
// These tests focus on the actual functionality rather than mocking everything

// Mock dependencies first
jest.mock('../privacyManager.js', () => ({
    canTrackMarketing: jest.fn(() => true),
    initialize: jest.fn()
}));

import attributionService from '../attributionService.js';
import offlineConversionService from '../offlineConversionService.js';
import serverSideConversionTracker from '../serverSideConversionTracker.js';
import { trackEnhancedConversion, trackCrossDeviceConversion, trackServerSideConversion } from '../googleAdsTracker.js';

// Mock gtag
global.gtag = jest.fn();
global.window = {
    location: {
        href: 'https://example.com/tour?utm_source=google&utm_medium=cpc&gclid=test_gclid',
        pathname: '/tour',
        search: '?utm_source=google&utm_medium=cpc&gclid=test_gclid'
    },
    screen: {
        width: 1920,
        height: 1080
    },
    innerWidth: 1920,
    innerHeight: 1080,
    dataLayer: []
};

global.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'en-US',
    platform: 'Win32'
};

global.document = {
    referrer: 'https://google.com/search'
};

global.Intl = {
    DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
};

// Mock fetch
global.fetch = jest.fn();

describe('Cross-Device and Offline Conversion Tracking Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Set up environment variables
        process.env.NODE_ENV = 'production';
        process.env.REACT_APP_ENABLE_ANALYTICS = 'true';
        process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID = 'AW-123456789';
        process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = JSON.stringify({
            purchase: 'abcdef123456/conversion_label_123'
        });

        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // Mock successful fetch responses
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                conversion_id: 'server_123',
                server_timestamp: Date.now(),
                validation_id: 'validation_123'
            })
        });
    });

    describe('GCLID Storage and Retrieval', () => {
        test('should store and retrieve GCLID data', () => {
            const gclid = 'test_gclid_123';
            const additionalData = {
                source: 'google',
                medium: 'cpc',
                campaign: 'summer_tours',
                landing_page: '/gion-tour'
            };

            // Store GCLID
            attributionService.storeGCLID(gclid, additionalData);

            // Retrieve GCLID
            const storedGclid = attributionService.getStoredGCLID();

            expect(storedGclid).toBeTruthy();
            expect(storedGclid.gclid).toBe(gclid);
            expect(storedGclid.source).toBe('google');
            expect(storedGclid.campaign).toBe('summer_tours');
        });

        test('should handle expired GCLID', () => {
            const gclid = 'test_gclid_123';

            // Store GCLID
            attributionService.storeGCLID(gclid);

            // Manually set expiration to past date
            const gclidData = JSON.parse(localStorage.getItem('gclid_data'));
            gclidData.expiration = Date.now() - 1000; // 1 second ago
            localStorage.setItem('gclid_data', JSON.stringify(gclidData));

            // Try to retrieve expired GCLID
            const storedGclid = attributionService.getStoredGCLID();

            expect(storedGclid).toBeNull();
        });
    });

    describe('Cross-Device Data Management', () => {
        test('should generate and store device ID', () => {
            const deviceId1 = attributionService.generateDeviceId();
            const deviceId2 = attributionService.generateDeviceId();

            expect(deviceId1).toMatch(/^device_\d+_[a-z0-9]+$/);
            expect(deviceId1).toBe(deviceId2); // Should return same ID on subsequent calls
        });

        test('should store cross-device attribution data', () => {
            const deviceData = {
                gclid: 'test_gclid_123',
                attribution_data: {
                    source: 'google',
                    medium: 'cpc',
                    campaign: 'summer_tours'
                }
            };

            attributionService.storeCrossDeviceData(deviceData);

            const crossDeviceData = attributionService.getCrossDeviceData();
            expect(crossDeviceData).toBeTruthy();
            expect(crossDeviceData.gclid).toBe('test_gclid_123');
        });
    });

    describe('Enhanced Attribution Data', () => {
        test('should provide enhanced attribution with cross-device info', () => {
            // Set up attribution data
            const gclid = 'test_gclid_123';
            attributionService.storeGCLID(gclid, {
                source: 'google',
                medium: 'cpc',
                campaign: 'summer_tours'
            });

            attributionService.storeCrossDeviceData({
                gclid: gclid,
                attribution_data: { source: 'google' }
            });

            const enhancedAttribution = attributionService.getEnhancedAttributionForAnalytics();

            expect(enhancedAttribution.stored_gclid).toBe(gclid);
            expect(enhancedAttribution.cross_device_available).toBe(true);
            expect(enhancedAttribution.device_id).toBeTruthy();
        });

        test('should prepare offline conversion data', () => {
            const gclid = 'test_gclid_123';
            attributionService.storeGCLID(gclid, {
                source: 'google',
                medium: 'cpc',
                campaign: 'summer_tours'
            });

            const conversionData = {
                transaction_id: 'booking_123',
                value: 15000,
                currency: 'JPY'
            };

            const offlineData = attributionService.prepareOfflineConversionData(conversionData);

            expect(offlineData.transaction_id).toBe('booking_123');
            expect(offlineData.value).toBe(15000);
            expect(offlineData.gclid).toBe(gclid);
            expect(offlineData.enhanced_conversion_data).toBeTruthy();
        });
    });

    describe('Offline Conversion Service', () => {
        test('should queue and process phone booking conversion', async () => {
            const phoneBookingData = {
                value: 15000,
                currency: 'JPY',
                transactionId: 'phone_booking_123',
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                customerPhone: '+81-90-1234-5678',
                customerEmail: 'customer@example.com',
                bookingDate: '2024-03-15',
                tourDate: '2024-03-20',
                quantity: 2
            };

            const result = await offlineConversionService.recordPhoneBooking(phoneBookingData);

            expect(result).toBe(true);

            // Check that conversion was queued
            const stats = offlineConversionService.getQueueStats();
            expect(stats.total).toBeGreaterThan(0);
        });

        test('should hash personal information', () => {
            const phoneNumber = '+81-90-1234-5678';
            const email = 'customer@example.com';

            const hashedPhone = offlineConversionService.hashPhoneNumber(phoneNumber);
            const hashedEmail = offlineConversionService.hashEmail(email);

            expect(hashedPhone).toBeTruthy();
            expect(hashedPhone).not.toBe(phoneNumber);
            expect(hashedEmail).toBeTruthy();
            expect(hashedEmail).not.toBe(email);
        });

        test('should record cross-device conversion', async () => {
            const crossDeviceData = {
                value: 12000,
                currency: 'JPY',
                transactionId: 'cross_device_123',
                originalDeviceId: 'device_mobile_123',
                conversionDeviceId: 'device_desktop_456',
                tourId: 'morning-tour',
                tourName: 'Arashiyama Morning Tour',
                timeToConversion: 7200000,
                originalDeviceType: 'mobile',
                conversionDeviceType: 'desktop',
                customerEmail: 'customer@example.com',
                customerPhone: '+81-90-1234-5678'
            };

            const result = await offlineConversionService.recordCrossDeviceConversion(crossDeviceData);

            expect(result).toBe(true);

            // Check that conversion was queued
            const stats = offlineConversionService.getQueueStats();
            expect(stats.total).toBeGreaterThan(0);
        });
    });

    describe('Server-Side Conversion Tracker', () => {
        test('should track booking confirmation with server validation', async () => {
            const bookingData = {
                booking_id: 'booking_123',
                total_amount: 15000,
                currency: 'JPY',
                tour_id: 'gion-tour',
                tour_name: 'Gion District Walking Tour',
                tour_category: 'Cultural Tour',
                quantity: 2,
                customer_email: 'customer@example.com',
                customer_phone: '+81-90-1234-5678',
                customer_name: 'John Doe',
                booking_date: '2024-03-15',
                tour_date: '2024-03-20'
            };

            const result = await serverSideConversionTracker.trackBookingConfirmation(bookingData);

            expect(result).toBe(true);
            expect(fetch).toHaveBeenCalledWith(
                '/api/server-conversions',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        test('should manage pending conversions', () => {
            // Add some test conversions
            serverSideConversionTracker.pendingConversions.set('conv_1', {
                data: { event_type: 'purchase' },
                timestamp: Date.now(),
                status: 'pending'
            });

            serverSideConversionTracker.pendingConversions.set('conv_2', {
                data: { event_type: 'booking_confirmation' },
                timestamp: Date.now() - 1000,
                status: 'validated'
            });

            const stats = serverSideConversionTracker.getPendingConversionsStats();

            expect(stats.total).toBe(2);
            expect(stats.pending).toBe(1);
            expect(stats.validated).toBe(1);
        });
    });

    describe('Enhanced Google Ads Tracking', () => {
        test('should track enhanced conversion', () => {
            const conversionData = {
                value: 15000,
                currency: 'JPY',
                transaction_id: 'booking_123'
            };

            const enhancedData = {
                email: 'hashed_email_123',
                phone_number: 'hashed_phone_123',
                gclid: 'test_gclid_123',
                device_id: 'device_123456789_abcdef'
            };

            trackEnhancedConversion('purchase', conversionData, enhancedData);

            expect(gtag).toHaveBeenCalledWith(
                'event',
                'conversion',
                expect.objectContaining({
                    send_to: 'AW-123456789/abcdef123456/conversion_label_123',
                    value: 15000,
                    currency: 'JPY',
                    transaction_id: 'booking_123',
                    gclid: 'test_gclid_123',
                    device_id: 'device_123456789_abcdef'
                })
            );
        });

        test('should track cross-device conversion', () => {
            const crossDeviceData = {
                customer_email_hash: 'hashed_email_123',
                customer_phone_hash: 'hashed_phone_123',
                gclid: 'test_gclid_123',
                device_id: 'device_123456789_abcdef',
                value: 12000,
                currency: 'JPY',
                transaction_id: 'cross_device_123',
                tour_id: 'gion-tour',
                tour_name: 'Gion District Walking Tour',
                original_device_type: 'mobile',
                conversion_device_type: 'desktop',
                time_to_conversion: 3600000
            };

            trackCrossDeviceConversion(crossDeviceData);

            expect(gtag).toHaveBeenCalledWith(
                'event',
                'conversion',
                expect.objectContaining({
                    conversion_type: 'cross_device',
                    enhanced_conversion_data: expect.objectContaining({
                        email: 'hashed_email_123',
                        phone_number: 'hashed_phone_123'
                    })
                })
            );
        });

        test('should track server-side conversion', () => {
            const serverConversionData = {
                value: 15000,
                currency: 'JPY',
                transaction_id: 'server_123',
                gclid: 'test_gclid_123',
                conversion_date_time: '2024-03-15T10:30:00Z',
                enhanced_conversion_data: {
                    email: 'hashed_email_123',
                    phone_number: 'hashed_phone_123'
                },
                attribution_source: 'google',
                attribution_medium: 'cpc',
                attribution_campaign: 'summer_tours',
                tour_id: 'gion-tour',
                tour_name: 'Gion District Walking Tour',
                tour_category: 'Cultural Tour'
            };

            trackServerSideConversion(serverConversionData);

            expect(gtag).toHaveBeenCalledWith(
                'event',
                'conversion',
                expect.objectContaining({
                    send_to: 'AW-123456789/abcdef123456/conversion_label_123',
                    value: 15000,
                    currency: 'JPY',
                    transaction_id: 'server_123',
                    gclid: 'test_gclid_123',
                    conversion_source: 'server_side'
                })
            );
        });
    });

    describe('End-to-End Cross-Device Flow', () => {
        test('should handle complete cross-device conversion flow', async () => {
            // Step 1: User clicks ad on mobile device
            const gclid = 'test_gclid_mobile_123';
            attributionService.storeGCLID(gclid, {
                source: 'google',
                medium: 'cpc',
                campaign: 'summer_tours',
                landing_page: '/gion-tour'
            });

            // Step 2: Store cross-device data
            attributionService.storeCrossDeviceData({
                gclid: gclid,
                attribution_data: {
                    source: 'google',
                    medium: 'cpc',
                    campaign: 'summer_tours'
                }
            });

            // Step 3: User completes booking on desktop
            const crossDeviceData = {
                value: 15000,
                currency: 'JPY',
                transactionId: 'cross_device_booking_123',
                originalDeviceId: 'device_mobile_123',
                conversionDeviceId: 'device_desktop_456',
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                timeToConversion: 7200000, // 2 hours
                originalDeviceType: 'mobile',
                conversionDeviceType: 'desktop',
                customerEmail: 'customer@example.com',
                customerPhone: '+81-90-1234-5678'
            };

            // Step 4: Track cross-device conversion with server validation
            const result = await serverSideConversionTracker.trackCrossDeviceConversionWithValidation(crossDeviceData);

            expect(result).toBe(true);

            // Step 5: Verify offline conversion was queued
            const offlineStats = offlineConversionService.getQueueStats();
            expect(offlineStats.total).toBeGreaterThan(0);

            // Step 6: Verify server-side conversion was tracked
            const serverStats = serverSideConversionTracker.getPendingConversionsStats();
            expect(serverStats.total).toBeGreaterThan(0);

            // Step 7: Verify enhanced attribution data is available
            const enhancedAttribution = attributionService.getEnhancedAttributionForAnalytics();
            expect(enhancedAttribution.stored_gclid).toBe(gclid);
            expect(enhancedAttribution.cross_device_available).toBe(true);
        });
    });
});