// Tests for cross-device and offline conversion tracking functionality

// Mock dependencies first
jest.mock('../privacyManager.js', () => ({
    canTrackMarketing: jest.fn(() => true),
    initialize: jest.fn()
}));

import attributionService from '../attributionService.js';
import offlineConversionService from '../offlineConversionService.js';
import serverSideConversionTracker from '../serverSideConversionTracker.js';
import { trackEnhancedConversion, trackCrossDeviceConversion, trackServerSideConversion } from '../googleAdsTracker.js';
import privacyManager from '../privacyManager.js';

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

// Mock localStorage and sessionStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

describe('Attribution Service Cross-Device Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        sessionStorageMock.getItem.mockReturnValue(null);
        privacyManager.canTrackMarketing.mockReturnValue(true);

        // Set up environment variables
        process.env.NODE_ENV = 'production';
        process.env.REACT_APP_ENABLE_ANALYTICS = 'true';
    });

    describe('GCLID Capture and Storage', () => {
        test('should capture and store GCLID from URL parameters', () => {
            const gclid = 'test_gclid_123';
            const additionalData = {
                source: 'google',
                medium: 'cpc',
                campaign: 'summer_tours',
                landing_page: '/gion-tour'
            };

            attributionService.storeGCLID(gclid, additionalData);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'gclid_data',
                expect.any(String)
            );

            // Verify the stored data contains the GCLID
            const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(storedData.gclid).toBe(gclid);
            expect(storedData.source).toBe('google');
            expect(storedData.campaign).toBe('summer_tours');
        });

        test('should retrieve stored GCLID if not expired', () => {
            const gclidData = {
                gclid: 'test_gclid_123',
                timestamp: Date.now(),
                expiration: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
                source: 'google',
                medium: 'cpc'
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(gclidData));

            const result = attributionService.getStoredGCLID();

            expect(result.gclid).toBe('test_gclid_123');
            expect(result.source).toBe('google');
            expect(result.medium).toBe('cpc');
            expect(localStorageMock.getItem).toHaveBeenCalledWith('gclid_data');
        });

        test('should return null for expired GCLID', () => {
            const expiredGclidData = {
                gclid: 'test_gclid_123',
                timestamp: Date.now() - (100 * 24 * 60 * 60 * 1000), // 100 days ago
                expiration: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
                source: 'google',
                medium: 'cpc'
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredGclidData));

            const result = attributionService.getStoredGCLID();

            expect(result).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('gclid_data');
        });
    });

    describe('Cross-Device Data Storage', () => {
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

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'cross_device_data',
                expect.any(String)
            );

            // Verify the stored data contains the GCLID
            const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(storedData.gclid).toBe('test_gclid_123');
        });

        test('should generate and store device ID', () => {
            localStorageMock.getItem.mockReturnValue(null);

            const deviceId = attributionService.generateDeviceId();

            expect(deviceId).toMatch(/^device_\d+_[a-z0-9]+$/);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('device_id', deviceId);
        });

        test('should return existing device ID if available', () => {
            const existingDeviceId = 'device_123456789_abcdef';
            localStorageMock.getItem.mockReturnValue(existingDeviceId);

            const deviceId = attributionService.generateDeviceId();

            expect(deviceId).toBe(existingDeviceId);
            expect(localStorageMock.getItem).toHaveBeenCalledWith('device_id');
        });
    });

    describe('Enhanced Attribution Data', () => {
        test('should provide enhanced attribution data with cross-device information', () => {
            const gclidData = {
                gclid: 'test_gclid_123',
                timestamp: Date.now(),
                expiration: Date.now() + (90 * 24 * 60 * 60 * 1000)
            };

            const crossDeviceData = {
                device_id: 'device_123456789_abcdef'
            };

            localStorageMock.getItem
                .mockReturnValueOnce(JSON.stringify(gclidData))
                .mockReturnValueOnce(JSON.stringify(crossDeviceData));

            sessionStorageMock.getItem.mockReturnValue(JSON.stringify({
                source: 'google',
                medium: 'cpc',
                campaign: 'summer_tours'
            }));

            const enhancedAttribution = attributionService.getEnhancedAttributionForAnalytics();

            expect(enhancedAttribution.stored_gclid).toBe('test_gclid_123');
            expect(enhancedAttribution.device_id).toBe('device_123456789_abcdef');
            expect(enhancedAttribution.cross_device_available).toBe(true);
        });

        test('should prepare offline conversion data with all attribution information', () => {
            const conversionData = {
                transaction_id: 'booking_123',
                value: 15000,
                currency: 'JPY'
            };

            const gclidData = {
                gclid: 'test_gclid_123',
                timestamp: Date.now() - 3600000, // 1 hour ago
                landing_page: '/gion-tour'
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(gclidData));
            sessionStorageMock.getItem.mockReturnValue(JSON.stringify({
                source: 'google',
                medium: 'cpc',
                campaign: 'summer_tours',
                session_id: 'session_123'
            }));

            const offlineData = attributionService.prepareOfflineConversionData(conversionData);

            expect(offlineData.transaction_id).toBe('booking_123');
            expect(offlineData.value).toBe(15000);
            expect(offlineData.currency).toBe('JPY');
            expect(offlineData.gclid).toBe('test_gclid_123');
        });
    });
});

describe('Offline Conversion Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue('[]');
        privacyManager.canTrackMarketing.mockReturnValue(true);
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true, conversion_id: 'server_123' })
        });
    });

    describe('Phone Booking Conversions', () => {
        test('should record phone booking conversion', async () => {
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
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'offline_conversions_queue',
                expect.any(String)
            );

            // Verify the stored data contains phone booking info
            const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(storedData[0].data.conversion_action).toBe('phone_booking');
        });

        test('should hash customer personal information', () => {
            const phoneNumber = '+81-90-1234-5678';
            const email = 'customer@example.com';

            const hashedPhone = offlineConversionService.hashPhoneNumber(phoneNumber);
            const hashedEmail = offlineConversionService.hashEmail(email);

            expect(hashedPhone).toBeTruthy();
            expect(hashedPhone).not.toBe(phoneNumber);
            expect(hashedEmail).toBeTruthy();
            expect(hashedEmail).not.toBe(email);
        });
    });

    describe('Cross-Device Conversions', () => {
        test('should record cross-device conversion', async () => {
            const crossDeviceData = {
                value: 12000,
                currency: 'JPY',
                transactionId: 'cross_device_123',
                originalDeviceId: 'device_mobile_123',
                conversionDeviceId: 'device_desktop_456',
                tourId: 'morning-tour',
                tourName: 'Arashiyama Morning Tour',
                timeToConversion: 7200000, // 2 hours
                originalDeviceType: 'mobile',
                conversionDeviceType: 'desktop',
                customerEmail: 'customer@example.com',
                customerPhone: '+81-90-1234-5678'
            };

            const result = await offlineConversionService.recordCrossDeviceConversion(crossDeviceData);

            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'offline_conversions_queue',
                expect.any(String)
            );

            // Verify the stored data contains cross-device info
            const storedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
            expect(storedData[0].data.conversion_action).toBe('cross_device_purchase');
        });
    });

    describe('Conversion Queue Management', () => {
        test('should process queued conversions', async () => {
            const queuedConversions = [
                {
                    id: 'offline_123',
                    status: 'queued',
                    retries: 0,
                    data: { conversion_action: 'phone_booking' }
                }
            ];

            localStorageMock.getItem.mockReturnValue(JSON.stringify(queuedConversions));

            await offlineConversionService.processQueuedConversions();

            expect(fetch).toHaveBeenCalledWith(
                '/api/offline-conversions',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        test('should get queue statistics', () => {
            const queuedConversions = [
                { id: '1', status: 'queued', timestamp: Date.now() },
                { id: '2', status: 'sent', timestamp: Date.now() - 1000 },
                { id: '3', status: 'failed', timestamp: Date.now() - 2000 }
            ];

            localStorageMock.getItem.mockReturnValue(JSON.stringify(queuedConversions));

            const stats = offlineConversionService.getQueueStats();

            expect(stats.total).toBe(3);
            expect(stats.queued).toBe(1);
            expect(stats.sent).toBe(1);
            expect(stats.failed).toBe(1);
        });
    });
});

describe('Server-Side Conversion Tracker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        privacyManager.canTrackMarketing.mockReturnValue(true);
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                server_timestamp: Date.now(),
                validation_id: 'validation_123'
            })
        });
    });

    describe('Critical Conversion Tracking', () => {
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

        test('should track payment success with enhanced data', async () => {
            const paymentData = {
                payment_id: 'payment_123',
                amount: 15000,
                currency: 'JPY',
                tour_id: 'morning-tour',
                tour_name: 'Arashiyama Morning Tour',
                tour_category: 'Nature Tour',
                quantity: 1,
                customer_email: 'customer@example.com',
                customer_phone: '+81-90-1234-5678',
                customer_name: 'Jane Smith',
                payment_method: 'credit_card',
                payment_provider: 'stripe'
            };

            const result = await serverSideConversionTracker.trackPaymentSuccess(paymentData);

            expect(result).toBe(true);
            expect(gtag).toHaveBeenCalledWith(
                'event',
                'conversion',
                expect.objectContaining({
                    server_validated: true
                })
            );
        });
    });

    describe('Pending Conversions Management', () => {
        test('should track pending conversions statistics', () => {
            // Simulate some pending conversions
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
            expect(stats.failed).toBe(0);
        });

        test('should clean up old pending conversions', () => {
            const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago

            serverSideConversionTracker.pendingConversions.set('old_conv', {
                data: { event_type: 'purchase' },
                timestamp: oldTimestamp,
                status: 'pending'
            });

            serverSideConversionTracker.pendingConversions.set('new_conv', {
                data: { event_type: 'purchase' },
                timestamp: Date.now(),
                status: 'pending'
            });

            serverSideConversionTracker.cleanupPendingConversions();

            expect(serverSideConversionTracker.pendingConversions.has('old_conv')).toBe(false);
            expect(serverSideConversionTracker.pendingConversions.has('new_conv')).toBe(true);
        });
    });
});

describe('Enhanced Google Ads Tracking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        privacyManager.canTrackMarketing.mockReturnValue(true);
        process.env.NODE_ENV = 'production';
        process.env.REACT_APP_ENABLE_ANALYTICS = 'true';
        process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID = 'AW-123456789';
        process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS = JSON.stringify({
            purchase: 'abcdef123456/conversion_label_123'
        });
    });

    describe('Enhanced Conversion Tracking', () => {
        test('should track enhanced conversion with cross-device data', () => {
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
                    enhanced_conversion_data: expect.objectContaining({
                        email: 'hashed_email_123',
                        phone_number: 'hashed_phone_123'
                    }),
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
                        phone_number: 'hashed_phone_123',
                        conversion_environment: expect.objectContaining({
                            original_device: 'mobile',
                            conversion_device: 'desktop'
                        })
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
                    conversion_date_time: '2024-03-15T10:30:00Z',
                    conversion_source: 'server_side',
                    enhanced_conversion_data: expect.objectContaining({
                        email: 'hashed_email_123',
                        phone_number: 'hashed_phone_123'
                    })
                })
            );
        });
    });
});