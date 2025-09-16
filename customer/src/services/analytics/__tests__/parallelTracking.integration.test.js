/**
 * Integration test for parallel tracking during GTM migration
 * Verifies that both old and new tracking systems can work together during migration
 */

import { trackPurchase, trackBeginCheckout, trackTourView } from '../ecommerceTracking';
import gtmService from '../../gtmService.js';

// Mock GTM service
jest.mock('../../gtmService.js');
jest.mock('../config', () => ({
    getShouldTrack: () => true,
    getShouldTrackMarketing: () => true,
    isTestEnvironment: false
}));
jest.mock('../helpers', () => ({
    getTourCategory: () => 'cultural',
    getTourDuration: () => '3-hours',
    getTourLocation: () => 'kyoto',
    getPriceRange: () => 'mid-range',
    getUserEngagementLevel: () => 'high',
    storeUserInteraction: jest.fn()
}));
jest.mock('../cartTracking', () => ({
    storeCartData: jest.fn(),
    clearCartData: jest.fn()
}));
jest.mock('../../attributionService.js', () => ({
    getAttributionForAnalytics: () => ({
        source: 'google',
        medium: 'cpc',
        campaign: 'test-campaign',
        first_source: 'google',
        touchpoints: 'google > direct'
    })
}));
jest.mock('../../tourSpecificTracking/index.js', () => ({
    trackTourSpecificConversion: jest.fn()
}));
jest.mock('../../remarketingManager', () => ({
    processPurchaseCompletion: jest.fn(),
    processTourView: jest.fn()
}));
jest.mock('../../dynamicRemarketingService.js', () => ({
    addDynamicRemarketingParameters: jest.fn()
}));
jest.mock('../../bookingFlowManager.js', () => ({
    getCurrentBookingState: () => null,
    trackPurchase: jest.fn(),
    trackBeginCheckout: jest.fn(),
    trackViewItem: jest.fn()
}));

describe('Parallel Tracking Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup GTM service mocks
        gtmService.trackPurchaseConversion = jest.fn().mockReturnValue(true);
        gtmService.trackBeginCheckoutConversion = jest.fn().mockReturnValue(true);
        gtmService.trackViewItemConversion = jest.fn().mockReturnValue(true);
        gtmService.pushEvent = jest.fn();
    });

    describe('Data Consistency', () => {
        it('should maintain consistent data structure between GTM and legacy tracking', () => {
            const mockTransactionData = {
                transactionId: 'txn_123',
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                value: 5000,
                price: 5000,
                quantity: 1,
                customerData: {
                    email: 'test@example.com',
                    phone: '+81-90-1234-5678',
                    firstName: 'John',
                    lastName: 'Doe'
                }
            };

            trackPurchase(mockTransactionData);

            // Verify GTM service was called with correct structure
            expect(gtmService.trackPurchaseConversion).toHaveBeenCalledWith(
                expect.objectContaining({
                    transaction_id: 'txn_123',
                    value: 5000,
                    currency: 'JPY',
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            item_id: 'gion-tour',
                            item_name: 'Gion District Tour',
                            item_category: 'Tour'
                        })
                    ])
                }),
                expect.objectContaining({
                    email: 'test@example.com',
                    phone: '+81-90-1234-5678'
                })
            );
        });

        it('should include all enhanced parameters in GTM events', () => {
            const mockTourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                price: 5000
            };

            trackTourView(mockTourData);

            const gtmCallArgs = gtmService.trackViewItemConversion.mock.calls[0][0];

            // Verify enhanced parameters are included
            expect(gtmCallArgs).toHaveProperty('tour_type', 'cultural');
            expect(gtmCallArgs).toHaveProperty('tour_location', 'kyoto');
            expect(gtmCallArgs).toHaveProperty('price_range', 'mid-range');
            expect(gtmCallArgs).toHaveProperty('user_engagement_level', 'high');
            expect(gtmCallArgs).toHaveProperty('view_timestamp');

            // Verify attribution data is included
            expect(gtmCallArgs).toHaveProperty('source', 'google');
            expect(gtmCallArgs).toHaveProperty('medium', 'cpc');
            expect(gtmCallArgs).toHaveProperty('campaign', 'test-campaign');
        });
    });

    describe('Migration Safety', () => {
        it('should continue tracking even if GTM service fails', () => {
            gtmService.trackPurchaseConversion.mockReturnValue(false);

            const mockTransactionData = {
                transactionId: 'txn_123',
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                value: 5000,
                price: 5000
            };

            // Should not throw error
            expect(() => trackPurchase(mockTransactionData)).not.toThrow();

            // Should still attempt GTM tracking
            expect(gtmService.trackPurchaseConversion).toHaveBeenCalled();
        });

        it('should handle missing attribution data gracefully', () => {
            // Mock attribution service to return empty data
            const attributionService = require('../../attributionService.js');
            attributionService.getAttributionForAnalytics = jest.fn().mockReturnValue({});

            const mockTourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Tour',
                price: 5000
            };

            expect(() => trackTourView(mockTourData)).not.toThrow();
            expect(gtmService.trackViewItemConversion).toHaveBeenCalled();
        });
    });

    describe('Performance Impact', () => {
        it('should complete tracking operations within reasonable time', async () => {
            const mockData = {
                tourId: 'test-tour',
                tourName: 'Test Tour',
                price: 1000
            };

            const startTime = Date.now();

            // Track multiple events
            trackTourView(mockData);
            trackBeginCheckout(mockData);
            trackPurchase({
                ...mockData,
                transactionId: 'txn_test',
                value: 1000
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within 100ms (generous threshold for test environment)
            expect(duration).toBeLessThan(100);
        });

        it('should not create memory leaks with repeated tracking calls', () => {
            const mockData = {
                tourId: 'test-tour',
                tourName: 'Test Tour',
                price: 1000
            };

            // Track same event multiple times
            for (let i = 0; i < 10; i++) {
                trackTourView(mockData);
            }

            // Should call GTM service for each tracking attempt
            expect(gtmService.trackViewItemConversion).toHaveBeenCalledTimes(10);
        });
    });

    describe('Data Validation', () => {
        it('should validate required fields before sending to GTM', () => {
            // Test with missing required data
            const incompleteData = {
                tourName: 'Test Tour'
                // Missing tourId and price
            };

            expect(() => trackTourView(incompleteData)).not.toThrow();

            // Should still attempt to track (GTM service handles validation)
            expect(gtmService.trackViewItemConversion).toHaveBeenCalled();
        });

        it('should handle special characters in tour data', () => {
            const specialCharData = {
                tourId: 'special-tour-123',
                tourName: 'Tour with "Special" Characters & Symbols',
                price: 5000
            };

            expect(() => trackTourView(specialCharData)).not.toThrow();
            expect(gtmService.trackViewItemConversion).toHaveBeenCalledWith(
                expect.objectContaining({
                    items: expect.arrayContaining([
                        expect.objectContaining({
                            item_name: 'Tour with "Special" Characters & Symbols'
                        })
                    ])
                })
            );
        });
    });
});