/**
 * Attribution Models Testing
 * Tests different attribution models and campaign types
 * Requirements: 1.1, 1.4, 3.3 (Task 14)
 */

const { trackPurchase, trackTourView } = require('../analytics');
const attributionService = require('../attributionService.js');
const privacyManager = require('../privacyManager.js');

// Mock dependencies
jest.mock('../privacyManager.js');
jest.mock('../attributionService.js');

// Mock gtag
const mockGtag = jest.fn();
global.gtag = mockGtag;

describe('Attribution Models Testing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGtag.mockClear();

        privacyManager.canTrackAnalytics.mockReturnValue(true);
        privacyManager.canTrackMarketing.mockReturnValue(true);
    });

    describe('First-Touch Attribution', () => {
        test('should handle first-touch attribution correctly', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                first_source: 'facebook',
                first_medium: 'social',
                first_campaign: 'awareness_campaign',
                source: 'google',
                medium: 'cpc',
                campaign: 'conversion_campaign',
                touchpoints: 3,
                attribution_chain: [
                    { source: 'facebook', medium: 'social', timestamp: Date.now() - 86400000 },
                    { source: 'organic', medium: 'search', timestamp: Date.now() - 43200000 },
                    { source: 'google', medium: 'cpc', timestamp: Date.now() }
                ]
            });

            const purchaseData = {
                transactionId: 'txn_first_touch_test',
                value: 12000,
                currency: 'JPY',
                tourId: 'gion-tour'
            };

            trackPurchase(purchaseData);

            expect(attributionService.getAttributionForAnalytics).toHaveBeenCalled();
            expect(mockGtag).toHaveBeenCalled();

            const purchaseCall = mockGtag.mock.calls.find(call =>
                call[0] === 'event' && call[1] === 'purchase'
            );
            expect(purchaseCall).toBeDefined();
        });
    });

    describe('Last-Touch Attribution', () => {
        test('should handle last-touch attribution correctly', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                first_source: 'facebook',
                first_medium: 'social',
                source: 'google',
                medium: 'cpc',
                campaign: 'final_conversion_campaign',
                gclid: 'final_gclid_123',
                touchpoints: 2
            });

            const purchaseData = {
                transactionId: 'txn_last_touch_test',
                value: 15000,
                currency: 'JPY',
                tourId: 'morning-tour'
            };

            trackPurchase(purchaseData);

            const conversionCall = mockGtag.mock.calls.find(call =>
                call[0] === 'event' && call[1] === 'conversion'
            );
            expect(conversionCall).toBeDefined();
        });
    });

    describe('Data-Driven Attribution', () => {
        test('should handle data-driven attribution model', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'google',
                medium: 'cpc',
                campaign: 'data_driven_campaign',
                attribution_chain: [
                    { source: 'facebook', medium: 'social', weight: 0.2 },
                    { source: 'email', medium: 'newsletter', weight: 0.3 },
                    { source: 'google', medium: 'cpc', weight: 0.5 }
                ],
                attribution_model: 'data_driven',
                touchpoints: 3
            });

            const purchaseData = {
                transactionId: 'txn_data_driven_test',
                value: 18000,
                currency: 'JPY',
                tourId: 'night-tour'
            };

            trackPurchase(purchaseData);

            expect(attributionService.getAttributionForAnalytics).toHaveBeenCalled();
            expect(mockGtag).toHaveBeenCalled();
        });
    });

    describe('Position-Based Attribution', () => {
        test('should handle position-based attribution model', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'google',
                medium: 'cpc',
                attribution_chain: [
                    { source: 'facebook', medium: 'social', position: 'first', weight: 0.4 },
                    { source: 'email', medium: 'newsletter', position: 'middle', weight: 0.2 },
                    { source: 'google', medium: 'cpc', position: 'last', weight: 0.4 }
                ],
                attribution_model: 'position_based',
                touchpoints: 3
            });

            const purchaseData = {
                transactionId: 'txn_position_based_test',
                value: 16000,
                currency: 'JPY',
                tourId: 'uji-tour'
            };

            trackPurchase(purchaseData);

            expect(attributionService.getAttributionForAnalytics).toHaveBeenCalled();
            expect(mockGtag).toHaveBeenCalled();
        });
    });

    describe('Campaign Type Testing', () => {
        test('should handle search campaign tracking', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'google',
                medium: 'cpc',
                campaign: 'search_kyoto_tours',
                term: 'kyoto walking tour',
                campaign_type: 'search',
                gclid: 'search_gclid_123'
            });

            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Walking Tour',
                price: 12000,
                campaign_type: 'search'
            };

            trackTourView(tourData);

            expect(mockGtag).toHaveBeenCalledWith('event', 'view_item', expect.objectContaining({
                currency: 'JPY',
                value: 12000
            }));
        });

        test('should handle display campaign tracking', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'google',
                medium: 'display',
                campaign: 'display_remarketing_tours',
                campaign_type: 'display',
                placement: 'travel_websites'
            });

            const tourData = {
                tourId: 'morning-tour',
                tourName: 'Morning Arashiyama Tour',
                price: 15000,
                campaign_type: 'display'
            };

            trackTourView(tourData);

            expect(mockGtag).toHaveBeenCalled();
            expect(attributionService.getAttributionForAnalytics).toHaveBeenCalled();
        });

        test('should handle video campaign tracking', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'youtube',
                medium: 'video',
                campaign: 'video_tour_promotion',
                campaign_type: 'video',
                video_id: 'tour_video_123'
            });

            const tourData = {
                tourId: 'night-tour',
                tourName: 'Night Fushimi Inari Tour',
                price: 18000,
                campaign_type: 'video'
            };

            trackTourView(tourData);

            expect(mockGtag).toHaveBeenCalled();
        });

        test('should handle shopping campaign tracking', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'google',
                medium: 'cpc',
                campaign: 'shopping_tour_packages',
                campaign_type: 'shopping',
                product_id: 'tour_package_123'
            });

            const purchaseData = {
                transactionId: 'txn_shopping_test',
                value: 25000,
                currency: 'JPY',
                tourId: 'uji-tour',
                campaign_type: 'shopping'
            };

            trackPurchase(purchaseData);

            expect(mockGtag).toHaveBeenCalled();
        });

        test('should handle social media campaign tracking', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'facebook',
                medium: 'social',
                campaign: 'facebook_tour_ads',
                campaign_type: 'social',
                fbclid: 'facebook_click_123'
            });

            const tourData = {
                tourId: 'gion-tour',
                price: 12000,
                campaign_type: 'social'
            };

            trackTourView(tourData);

            expect(mockGtag).toHaveBeenCalled();
        });
    });

    describe('Multi-Touch Attribution Scenarios', () => {
        test('should handle complex multi-touch journey', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'google',
                medium: 'cpc',
                campaign: 'final_conversion',
                first_source: 'facebook',
                first_medium: 'social',
                attribution_chain: [
                    { source: 'facebook', medium: 'social', timestamp: Date.now() - 604800000 }, // 7 days ago
                    { source: 'email', medium: 'newsletter', timestamp: Date.now() - 259200000 }, // 3 days ago
                    { source: 'organic', medium: 'search', timestamp: Date.now() - 86400000 }, // 1 day ago
                    { source: 'google', medium: 'cpc', timestamp: Date.now() }
                ],
                touchpoints: 4
            });

            const purchaseData = {
                transactionId: 'txn_multi_touch_test',
                value: 20000,
                currency: 'JPY',
                tourId: 'gion-tour'
            };

            trackPurchase(purchaseData);

            expect(attributionService.getAttributionForAnalytics).toHaveBeenCalled();
            expect(mockGtag).toHaveBeenCalled();
        });

        test('should handle attribution window expiration', () => {
            attributionService.getAttributionForAnalytics.mockReturnValue({
                source: 'direct',
                medium: 'none',
                campaign: null,
                attribution_chain: [
                    { source: 'google', medium: 'cpc', timestamp: Date.now() - 7776000000 } // 90+ days ago
                ],
                attribution_expired: true,
                touchpoints: 1
            });

            const purchaseData = {
                transactionId: 'txn_expired_attribution',
                value: 12000,
                currency: 'JPY',
                tourId: 'morning-tour'
            };

            trackPurchase(purchaseData);

            expect(mockGtag).toHaveBeenCalled();
        });
    });
});