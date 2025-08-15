/**
 * Integration tests for Dynamic Remarketing Service with Analytics
 */

import { trackTourView } from '../analytics/ecommerceTracking.js';
import dynamicRemarketingService from '../dynamicRemarketingService.js';

// Mock dependencies
jest.mock('../analytics/config.js', () => ({
    getShouldTrack: jest.fn(() => true),
    getShouldTrackMarketing: jest.fn(() => true),
    isTestEnvironment: false
}));

jest.mock('../analytics/helpers.js', () => ({
    getTourCategory: jest.fn((tourId) => 'Cultural'),
    getTourLocation: jest.fn((tourId) => 'Gion'),
    getTourDuration: jest.fn((tourId) => '3 hours'),
    getPriceRange: jest.fn((price) => 'mid-range'),
    getUserEngagementLevel: jest.fn(() => 'medium'),
    storeUserInteraction: jest.fn()
}));

jest.mock('../googleAdsTracker.js', () => ({
    trackGoogleAdsViewItem: jest.fn()
}));

jest.mock('../tourSpecificTracking/index.js', () => ({
    trackTourSpecificConversion: jest.fn()
}));

jest.mock('../attributionService.js', () => ({
    getAttributionForAnalytics: jest.fn(() => ({
        source: 'google',
        medium: 'cpc',
        campaign: 'summer-tours'
    })),
    getCurrentSource: jest.fn(() => 'google'),
    getCurrentCampaign: jest.fn(() => 'summer-tours')
}));

jest.mock('../remarketingManager.js', () => ({
    processTourView: jest.fn()
}));

// Mock global gtag function
global.gtag = jest.fn();

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

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
});

describe('Dynamic Remarketing Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        sessionStorageMock.getItem.mockReturnValue('session_123');
    });

    it('should integrate dynamic remarketing with tour view tracking', () => {
        const tourData = {
            tourId: 'gion-tour',
            tourName: 'Gion District Cultural Walking Tour',
            price: 8000
        };

        // Track tour view (this should trigger dynamic remarketing)
        trackTourView(tourData);

        // Verify that gtag was called for dynamic remarketing
        expect(global.gtag).toHaveBeenCalledWith('event', 'view_item', expect.objectContaining({
            event_category: 'dynamic_remarketing',
            ecomm_prodid: 'gion-tour',
            ecomm_totalvalue: 8000
        }));
    });

    it('should create product catalog data for all tour types', () => {
        const tourIds = ['gion-tour', 'morning-tour', 'night-tour', 'uji-tour'];

        tourIds.forEach(tourId => {
            const productData = dynamicRemarketingService.getProductCatalogData(tourId);

            expect(productData).toBeTruthy();
            expect(productData.id).toBe(tourId);
            expect(productData.title).toBeTruthy();
            expect(productData.price).toMatch(/\d+ JPY/);
            expect(productData.brand).toBe('Tomodachi Tours');
        });
    });

    it('should handle user preferences tracking', () => {
        const tourData = {
            tourId: 'gion-tour',
            tourName: 'Gion District Cultural Walking Tour',
            price: 8000
        };

        // Simulate multiple tour views to build preferences
        dynamicRemarketingService.addDynamicRemarketingParameters(tourData);

        // Verify that user preferences are being stored
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            expect.stringMatching(/tour_preferences_/),
            expect.any(String)
        );
    });

    it('should calculate engagement levels correctly', () => {
        const mockInteractions = JSON.stringify([
            { type: 'view_item', timestamp: Date.now() - 1000 },
            { type: 'add_to_cart', timestamp: Date.now() - 2000 },
            { type: 'begin_checkout', timestamp: Date.now() - 3000 }
        ]);

        sessionStorageMock.getItem.mockReturnValue(mockInteractions);

        const engagementLevel = dynamicRemarketingService.calculateEngagementLevel('test_user');

        expect(engagementLevel).toBeGreaterThan(0);
        expect(typeof engagementLevel).toBe('number');
    });

    it('should provide comprehensive statistics', () => {
        const stats = dynamicRemarketingService.getDynamicRemarketingStats();

        expect(stats).toEqual(expect.objectContaining({
            totalAudiences: expect.any(Number),
            totalUsers: expect.any(Number),
            audienceBreakdown: expect.any(Object),
            productCatalogSize: 4
        }));

        // Verify all expected audiences are present
        expect(stats.audienceBreakdown).toHaveProperty('dynamic_gion_viewers');
        expect(stats.audienceBreakdown).toHaveProperty('dynamic_morning_viewers');
        expect(stats.audienceBreakdown).toHaveProperty('dynamic_night_viewers');
        expect(stats.audienceBreakdown).toHaveProperty('dynamic_uji_viewers');
    });
});