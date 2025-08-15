// Tests for tour-specific conversion tracking and segmentation service

import tourSpecificTracking, {
    trackTourSpecificConversion,
    trackTourPerformance,
    trackSegmentSpecificConversion,
    trackCrossTourCampaignConversion,
    getTourPerformanceAnalytics,
    clearTourPerformanceData,
    CUSTOMER_SEGMENTS
} from '../tourSpecificTracking/index.js';

// Mock dependencies
jest.mock('../googleAdsTracker.js', () => ({
    trackCustomGoogleAdsConversion: jest.fn()
}));

jest.mock('../attributionService.js', () => ({
    getAttributionForAnalytics: jest.fn(() => ({
        source: 'google',
        medium: 'cpc',
        campaign: 'kyoto-tours',
        gclid: 'test-gclid-123'
    }))
}));

jest.mock('../privacyManager.js', () => ({
    canTrackMarketing: jest.fn(() => true)
}));

jest.mock('../analytics/helpers.js', () => ({
    getTourCategory: jest.fn((tourId) => {
        const categories = {
            'gion-tour': 'Cultural',
            'morning-tour': 'Nature',
            'night-tour': 'Cultural',
            'uji-tour': 'Cultural'
        };
        return categories[tourId] || 'Tour';
    }),
    getTourDuration: jest.fn((tourId) => {
        const durations = {
            'gion-tour': '3-hours',
            'morning-tour': '4-hours',
            'night-tour': '2-hours',
            'uji-tour': '5-hours'
        };
        return durations[tourId] || 'half-day';
    }),
    getTourLocation: jest.fn((tourId) => {
        const locations = {
            'gion-tour': 'Gion',
            'morning-tour': 'Arashiyama',
            'night-tour': 'Fushimi',
            'uji-tour': 'Uji'
        };
        return locations[tourId] || 'Kyoto';
    }),
    getPriceRange: jest.fn((price) => {
        if (price < 5000) return 'budget';
        if (price < 10000) return 'mid-range';
        return 'premium';
    })
}));

// Import mocked modules
import { trackCustomGoogleAdsConversion } from '../googleAdsTracker.js';
import attributionService from '../attributionService.js';
import privacyManager from '../privacyManager.js';
import { getTourCategory, getTourDuration, getTourLocation, getPriceRange } from '../analytics/helpers.js';

describe('Tour-Specific Tracking Service', () => {
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Clear session storage
        sessionStorage.clear();

        // Reset privacy manager to allow tracking
        privacyManager.canTrackMarketing.mockReturnValue(true);
    });

    describe('trackTourSpecificConversion', () => {
        it('should track tour-specific conversion with enhanced parameters', () => {
            const tourId = 'gion-tour';
            const conversionAction = 'purchase';
            const conversionData = {
                value: 8000,
                currency: 'JPY',
                transaction_id: 'test-transaction-123'
            };
            const campaignData = {
                tour_focus: 'gion-tour',
                conversion_source: 'google'
            };

            trackTourSpecificConversion(tourId, conversionAction, conversionData, campaignData);

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'gion_purchase',
                expect.objectContaining({
                    value: 8000,
                    currency: 'JPY',
                    transaction_id: 'test-transaction-123',
                    tour_id: 'gion-tour',
                    tour_category: 'Cultural',
                    tour_location: 'Gion',
                    tour_duration: '3-hours',
                    customer_segment: expect.any(String),
                    segment_score: expect.any(Number),
                    campaign_tour_focus: 'gion-tour',
                    campaign_segment_target: expect.any(String),
                    price_range: 'mid-range',
                    source: 'google',
                    medium: 'cpc',
                    campaign: 'kyoto-tours',
                    gclid: 'test-gclid-123'
                })
            );
        });

        it('should not track when marketing consent is not given', () => {
            privacyManager.canTrackMarketing.mockReturnValue(false);

            trackTourSpecificConversion('gion-tour', 'purchase', { value: 8000 });

            expect(trackCustomGoogleAdsConversion).not.toHaveBeenCalled();
        });

        it('should handle missing tour ID gracefully', () => {
            trackTourSpecificConversion(null, 'purchase', { value: 8000 });

            expect(trackCustomGoogleAdsConversion).not.toHaveBeenCalled();
        });

        it('should handle missing conversion action gracefully', () => {
            trackTourSpecificConversion('gion-tour', null, { value: 8000 });

            expect(trackCustomGoogleAdsConversion).not.toHaveBeenCalled();
        });

        it('should track different tour types with correct parameters', () => {
            const testCases = [
                { tourId: 'morning-tour', expectedAction: 'morning_purchase', expectedCategory: 'Nature', expectedLocation: 'Arashiyama' },
                { tourId: 'night-tour', expectedAction: 'night_purchase', expectedCategory: 'Cultural', expectedLocation: 'Fushimi' },
                { tourId: 'uji-tour', expectedAction: 'uji_purchase', expectedCategory: 'Cultural', expectedLocation: 'Uji' }
            ];

            testCases.forEach(({ tourId, expectedAction, expectedCategory, expectedLocation }) => {
                jest.clearAllMocks();

                trackTourSpecificConversion(tourId, 'purchase', { value: 10000 });

                expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                    expectedAction,
                    expect.objectContaining({
                        tour_id: tourId,
                        tour_category: expectedCategory,
                        tour_location: expectedLocation
                    })
                );
            });
        });
    });

    describe('trackTourPerformance', () => {
        it('should track tour performance metrics', () => {
            const tourId = 'gion-tour';
            const performanceData = {
                page_views: 5,
                engagement_time: 120,
                scroll_depth: 75,
                cta_clicks: 2
            };
            const campaignContext = {
                campaign_id: 'test-campaign-123',
                ad_group_id: 'test-adgroup-456',
                keyword: 'kyoto cultural tour',
                match_type: 'exact'
            };

            trackTourPerformance(tourId, performanceData, campaignContext);

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'tour_performance',
                expect.objectContaining({
                    tour_id: 'gion-tour',
                    page_views: 5,
                    engagement_time: 120,
                    scroll_depth: 75,
                    cta_clicks: 2,
                    campaign_id: 'test-campaign-123',
                    ad_group_id: 'test-adgroup-456',
                    keyword: 'kyoto cultural tour',
                    match_type: 'exact',
                    tour_category: 'Cultural',
                    tour_location: 'Gion'
                })
            );
        });

        it('should not track when marketing consent is not given', () => {
            privacyManager.canTrackMarketing.mockReturnValue(false);

            trackTourPerformance('gion-tour', { page_views: 5 });

            expect(trackCustomGoogleAdsConversion).not.toHaveBeenCalled();
        });
    });

    describe('trackSegmentSpecificConversion', () => {
        it('should track segment-specific conversions', () => {
            const segment = CUSTOMER_SEGMENTS.HIGH_ENGAGEMENT;
            const conversionAction = 'purchase';
            const conversionData = { value: 12000 };

            trackSegmentSpecificConversion(segment, conversionAction, conversionData);

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'segment_purchase',
                expect.objectContaining({
                    value: 12000,
                    customer_segment: segment,
                    segment_conversion_action: `${segment}_purchase`,
                    segment_value_multiplier: expect.any(Number),
                    segment_conversion_probability: expect.any(Number)
                })
            );
        });
    });

    describe('trackCrossTourCampaignConversion', () => {
        it('should track cross-tour campaign conversions', () => {
            const tourIds = ['gion-tour', 'morning-tour', 'night-tour'];
            const conversionAction = 'view_item';
            const conversionData = { value: 0 };

            trackCrossTourCampaignConversion(tourIds, conversionAction, conversionData);

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'cross_tour_view_item',
                expect.objectContaining({
                    campaign_tour_count: 3,
                    campaign_tours: 'gion-tour,morning-tour,night-tour',
                    campaign_categories: 'Cultural,Nature,Cultural',
                    campaign_locations: 'Gion,Arashiyama,Fushimi',
                    tour_diversity_score: expect.any(Number),
                    campaign_coverage: expect.any(Number),
                    customer_tour_match: expect.any(Number)
                })
            );
        });

        it('should not track when no tour IDs provided', () => {
            trackCrossTourCampaignConversion([], 'purchase', { value: 8000 });

            expect(trackCustomGoogleAdsConversion).not.toHaveBeenCalled();
        });
    });

    describe('Customer Segmentation', () => {
        it('should identify first-time visitors correctly', () => {
            // Clear session storage to simulate first visit
            sessionStorage.clear();

            trackTourSpecificConversion('gion-tour', 'view_item', { value: 8000 });

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'gion_view',
                expect.objectContaining({
                    customer_segment: CUSTOMER_SEGMENTS.FIRST_TIME_VISITOR
                })
            );
        });

        it('should identify returning visitors correctly', () => {
            // Simulate returning visitor by setting session data
            sessionStorage.setItem('returning_visitor', 'true');
            sessionStorage.setItem('user_interactions', JSON.stringify([
                { type: 'tour_view', data: { tourId: 'gion-tour' }, timestamp: Date.now() - 1000 }
            ]));

            trackTourSpecificConversion('morning-tour', 'view_item', { value: 10000 });

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'morning_view',
                expect.objectContaining({
                    customer_segment: CUSTOMER_SEGMENTS.RETURNING_VISITOR
                })
            );
        });

        it('should calculate tour affinity scores correctly', () => {
            // Set up user interactions showing preference for cultural tours
            const interactions = [
                { type: 'tour_view', data: { tourId: 'gion-tour', price: 8000 }, timestamp: Date.now() - 3000 },
                { type: 'tour_view', data: { tourId: 'gion-tour', price: 8000 }, timestamp: Date.now() - 2000 },
                { type: 'tour_view', data: { tourId: 'night-tour', price: 6000 }, timestamp: Date.now() - 1000 }
            ];
            sessionStorage.setItem('user_interactions', JSON.stringify(interactions));

            trackTourSpecificConversion('gion-tour', 'purchase', { value: 8000 });

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'gion_purchase',
                expect.objectContaining({
                    tour_affinity_gion: expect.any(Number),
                    tour_affinity_morning: expect.any(Number),
                    tour_affinity_night: expect.any(Number),
                    tour_affinity_uji: expect.any(Number)
                })
            );
        });
    });

    describe('Tour Performance Analytics', () => {
        it('should store and retrieve tour performance data', () => {
            const tourId = 'gion-tour';
            const performanceData = {
                page_views: 10,
                engagement_time: 300
            };

            trackTourPerformance(tourId, performanceData);

            const analytics = getTourPerformanceAnalytics(tourId);
            expect(Object.keys(analytics).length).toBeGreaterThan(0);

            const firstEntry = Object.values(analytics)[0];
            expect(firstEntry).toMatchObject({
                tour_id: tourId,
                page_views: 10,
                engagement_time: 300
            });
        });

        it('should retrieve all performance data when no tour ID specified', () => {
            trackTourPerformance('gion-tour', { page_views: 5 });
            trackTourPerformance('morning-tour', { page_views: 3 });

            const allAnalytics = getTourPerformanceAnalytics();
            expect(Object.keys(allAnalytics).length).toBe(2);
        });

        it('should clear performance data correctly', () => {
            trackTourPerformance('gion-tour', { page_views: 5 });

            let analytics = getTourPerformanceAnalytics();
            expect(Object.keys(analytics).length).toBeGreaterThan(0);

            clearTourPerformanceData();

            analytics = getTourPerformanceAnalytics();
            expect(Object.keys(analytics).length).toBe(0);
        });
    });

    describe('Price Range Segmentation', () => {
        it('should correctly categorize budget tours', () => {
            trackTourSpecificConversion('night-tour', 'purchase', { value: 4000 });

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'night_purchase',
                expect.objectContaining({
                    price_range: 'budget'
                })
            );
        });

        it('should correctly categorize mid-range tours', () => {
            trackTourSpecificConversion('gion-tour', 'purchase', { value: 8000 });

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'gion_purchase',
                expect.objectContaining({
                    price_range: 'mid-range'
                })
            );
        });

        it('should correctly categorize premium tours', () => {
            trackTourSpecificConversion('uji-tour', 'purchase', { value: 15000 });

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalledWith(
                'uji_purchase',
                expect.objectContaining({
                    price_range: 'premium'
                })
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle attribution service errors gracefully', () => {
            attributionService.getAttributionForAnalytics.mockImplementation(() => {
                throw new Error('Attribution service error');
            });

            expect(() => {
                trackTourSpecificConversion('gion-tour', 'purchase', { value: 8000 });
            }).not.toThrow();

            expect(trackCustomGoogleAdsConversion).toHaveBeenCalled();
        });

        it('should handle session storage errors gracefully', () => {
            // Mock sessionStorage to throw errors
            const originalSetItem = sessionStorage.setItem;
            sessionStorage.setItem = jest.fn(() => {
                throw new Error('Storage quota exceeded');
            });

            expect(() => {
                trackTourPerformance('gion-tour', { page_views: 5 });
            }).not.toThrow();

            // Restore original sessionStorage
            sessionStorage.setItem = originalSetItem;
        });
    });

    describe('CUSTOMER_SEGMENTS Export', () => {
        it('should export all customer segments', () => {
            expect(CUSTOMER_SEGMENTS).toHaveProperty('FIRST_TIME_VISITOR');
            expect(CUSTOMER_SEGMENTS).toHaveProperty('RETURNING_VISITOR');
            expect(CUSTOMER_SEGMENTS).toHaveProperty('HIGH_ENGAGEMENT');
            expect(CUSTOMER_SEGMENTS).toHaveProperty('BUDGET_CONSCIOUS');
            expect(CUSTOMER_SEGMENTS).toHaveProperty('PREMIUM_SEEKER');
            expect(CUSTOMER_SEGMENTS).toHaveProperty('CULTURAL_ENTHUSIAST');
            expect(CUSTOMER_SEGMENTS).toHaveProperty('NATURE_LOVER');
            expect(CUSTOMER_SEGMENTS).toHaveProperty('MULTI_TOUR_INTERESTED');
        });
    });
});