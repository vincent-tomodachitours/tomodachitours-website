/**
 * End-to-End Conversion Tracking Tests
 * Tests complete user journey from ad click to purchase
 * Requirements: 1.1, 2.1, 4.1 (Task 14)
 */

const { trackPurchase, trackBeginCheckout, trackTourView } = require('../analytics.js');
const attributionService = require('../attributionService.js');
const privacyManager = require('../privacyManager.js');
const dataValidator = require('../dataValidator.js');

// Mock dependencies
jest.mock('../privacyManager.js');
jest.mock('../attributionService.js');
jest.mock('../dataValidator.js');

// Mock gtag
const mockGtag = jest.fn();
global.gtag = mockGtag;
global.window = global.window || {};
global.window.dataLayer = [];

describe('End-to-End Conversion Tracking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGtag.mockClear();

        // Setup default mocks
        privacyManager.canTrackAnalytics.mockReturnValue(true);
        privacyManager.canTrackMarketing.mockReturnValue(true);

        attributionService.getAttributionForAnalytics.mockReturnValue({
            source: 'google',
            medium: 'cpc',
            campaign: 'gion_tour_2024',
            gclid: 'test_gclid_123',
            session_id: 'test_session_123'
        });

        dataValidator.validatePurchase.mockReturnValue({ isValid: true, sanitizedData: {} });
        dataValidator.validateTour.mockReturnValue({ isValid: true, sanitizedData: {} });
        dataValidator.validateTransaction.mockReturnValue({ isValid: true, sanitizedData: {} });
    });

    test('should track complete user journey from ad click to purchase', async () => {
        // Simulate user journey
        const tourData = {
            tourId: 'gion-tour',
            tourName: 'Gion District Walking Tour',
            price: 12000,
            currency: 'JPY'
        };

        const checkoutData = {
            ...tourData,
            quantity: 2,
            date: '2024-03-15'
        };

        const purchaseData = {
            transactionId: 'txn_e2e_test_123',
            value: 24000,
            currency: 'JPY',
            tourId: 'gion-tour',
            quantity: 2
        };

        // Step 1: User views tour page
        trackTourView(tourData);

        // Step 2: User begins checkout
        trackBeginCheckout(checkoutData);

        // Step 3: User completes purchase
        trackPurchase(purchaseData);

        // Verify all tracking calls were made
        expect(mockGtag).toHaveBeenCalledTimes(3);

        // Verify view_item event
        const viewItemCall = mockGtag.mock.calls.find(call =>
            call[0] === 'event' && call[1] === 'view_item'
        );
        expect(viewItemCall).toBeDefined();
        expect(viewItemCall[2]).toMatchObject({
            currency: 'JPY',
            value: 12000
        });

        // Verify begin_checkout event
        const checkoutCall = mockGtag.mock.calls.find(call =>
            call[0] === 'event' && call[1] === 'begin_checkout'
        );
        expect(checkoutCall).toBeDefined();

        // Verify purchase event
        const purchaseCall = mockGtag.mock.calls.find(call =>
            call[0] === 'event' && call[1] === 'purchase'
        );
        expect(purchaseCall).toBeDefined();
        expect(purchaseCall[2]).toMatchObject({
            transaction_id: 'txn_e2e_test_123',
            value: 24000,
            currency: 'JPY'
        });
    });

    test('should maintain data consistency across all tracking platforms', async () => {
        const purchaseData = {
            transactionId: 'txn_consistency_test',
            value: 15000,
            currency: 'JPY',
            tourId: 'gion-tour'
        };

        dataValidator.validateTransaction.mockReturnValue({
            isValid: true,
            sanitizedData: purchaseData
        });

        await trackPurchase(purchaseData);

        // Verify GA4 tracking
        const ga4Calls = mockGtag.mock.calls.filter(call =>
            call[0] === 'event' && call[1] === 'purchase'
        );
        expect(ga4Calls.length).toBeGreaterThan(0);

        // Verify Google Ads tracking
        const googleAdsCalls = mockGtag.mock.calls.filter(call =>
            call[0] === 'event' && call[1] === 'conversion'
        );
        expect(googleAdsCalls.length).toBeGreaterThan(0);

        // Verify data consistency
        if (ga4Calls.length > 0 && googleAdsCalls.length > 0) {
            const ga4Data = ga4Calls[0][2];
            const googleAdsData = googleAdsCalls[0][2];

            expect(ga4Data.transaction_id).toBe(googleAdsData.transaction_id);
            expect(ga4Data.value).toBe(googleAdsData.value);
            expect(ga4Data.currency).toBe(googleAdsData.currency);
        }
    });

    test('should handle cross-device conversion tracking', async () => {
        attributionService.getEnhancedAttributionForAnalytics.mockReturnValue({
            source: 'google',
            medium: 'cpc',
            campaign: 'gion_tour_2024',
            gclid: 'test_gclid_123',
            stored_gclid: 'stored_gclid_456',
            device_id: 'device_123',
            cross_device_available: true,
            enhanced_conversion_data: {
                gclid: 'stored_gclid_456',
                device_id: 'device_123'
            }
        });

        const crossDeviceData = {
            transactionId: 'txn_cross_device_test',
            value: 18000,
            currency: 'JPY',
            tourId: 'morning-tour'
        };

        await trackPurchase(crossDeviceData);

        expect(attributionService.getEnhancedAttributionForAnalytics).toHaveBeenCalled();
        expect(mockGtag).toHaveBeenCalled();
    });

    test('should track offline conversions with proper attribution', async () => {
        const offlineData = {
            gclid: 'offline_gclid_123',
            transactionId: 'txn_offline_phone_booking',
            value: 20000,
            currency: 'JPY',
            tourId: 'uji-tour',
            conversion_source: 'phone_booking'
        };

        attributionService.prepareOfflineConversionData.mockReturnValue({
            ...offlineData,
            attribution_source: 'google',
            attribution_medium: 'cpc',
            attribution_campaign: 'uji_tour_2024'
        });

        const preparedData = attributionService.prepareOfflineConversionData(offlineData);
        await trackPurchase(preparedData);

        expect(attributionService.prepareOfflineConversionData).toHaveBeenCalledWith(offlineData);
        expect(mockGtag).toHaveBeenCalled();
    });

    test('should handle funnel abandonment tracking', () => {
        const tourData = {
            tourId: 'gion-tour',
            price: 12000
        };

        const checkoutData = {
            ...tourData,
            quantity: 1
        };

        // User views tour
        trackTourView(tourData);

        // User begins checkout but doesn't complete
        trackBeginCheckout(checkoutData);

        // Should track both events for funnel analysis
        expect(mockGtag).toHaveBeenCalledTimes(2);

        const viewCall = mockGtag.mock.calls.find(call => call[1] === 'view_item');
        const checkoutCall = mockGtag.mock.calls.find(call => call[1] === 'begin_checkout');

        expect(viewCall).toBeDefined();
        expect(checkoutCall).toBeDefined();
    });

    test('should track multiple tour selections in single session', () => {
        const tours = [
            { tourId: 'gion-tour', price: 12000 },
            { tourId: 'morning-tour', price: 15000 },
            { tourId: 'night-tour', price: 18000 }
        ];

        tours.forEach(tour => trackTourView(tour));

        expect(mockGtag).toHaveBeenCalledTimes(3);

        // Verify each tour was tracked separately
        tours.forEach(tour => {
            const tourCall = mockGtag.mock.calls.find(call =>
                call[1] === 'view_item' &&
                call[2].items[0].item_id === tour.tourId
            );
            expect(tourCall).toBeDefined();
        });
    });
});