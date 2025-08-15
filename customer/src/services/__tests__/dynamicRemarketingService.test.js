/**
 * Unit tests for Dynamic Remarketing Service
 */

import dynamicRemarketingService from '../dynamicRemarketingService.js';

// Mock dependencies
jest.mock('../analytics/config.js', () => ({
    getShouldTrack: jest.fn(() => true),
    getShouldTrackMarketing: jest.fn(() => true)
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
    getTourLocation: jest.fn((tourId) => {
        const locations = {
            'gion-tour': 'Gion',
            'morning-tour': 'Arashiyama',
            'night-tour': 'Fushimi',
            'uji-tour': 'Uji'
        };
        return locations[tourId] || 'Kyoto';
    }),
    getTourDuration: jest.fn((tourId) => {
        const durations = {
            'gion-tour': '3 hours',
            'morning-tour': '4 hours',
            'night-tour': '2 hours',
            'uji-tour': '5 hours'
        };
        return durations[tourId] || 'half-day';
    }),
    getPriceRange: jest.fn((price) => {
        if (price < 5000) return 'budget';
        if (price < 10000) return 'mid-range';
        return 'premium';
    })
}));

jest.mock('../remarketingManager.js', () => ({
    createAudience: jest.fn()
}));

jest.mock('../attributionService.js', () => ({
    getCurrentSource: jest.fn(() => 'google'),
    getCurrentCampaign: jest.fn(() => 'summer-tours')
}));

// Mock global gtag function
global.gtag = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        origin: 'https://tomodachitours.com',
        pathname: '/gion-tour'
    },
    writable: true
});

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

describe('DynamicRemarketingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        sessionStorageMock.getItem.mockReturnValue(null);
    });

    describe('addDynamicRemarketingParameters', () => {
        it('should add dynamic remarketing parameters for tour view', () => {
            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Cultural Walking Tour',
                price: 8000
            };

            dynamicRemarketingService.addDynamicRemarketingParameters(tourData);

            // Verify gtag was called with dynamic remarketing parameters
            expect(global.gtag).toHaveBeenCalledWith('event', 'view_item', expect.objectContaining({
                send_to: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
                event_category: 'dynamic_remarketing',
                event_label: 'gion-tour',
                ecomm_prodid: 'gion-tour',
                ecomm_pagetype: 'product',
                ecomm_totalvalue: 8000,
                ecomm_category: 'Cultural Tours',
                tour_title: 'Gion District Cultural Walking Tour',
                tour_location: 'Gion, Kyoto',
                tour_duration: '3 hours',
                value: 8000,
                currency: 'JPY'
            }));
        });

        it('should not add parameters when tracking is disabled', () => {
            const { getShouldTrack, getShouldTrackMarketing } = require('../analytics/config.js');
            getShouldTrack.mockReturnValue(false);
            getShouldTrackMarketing.mockReturnValue(false);

            const tourData = {
                tourId: 'gion-tour',
                tourName: 'Gion District Cultural Walking Tour',
                price: 8000
            };

            dynamicRemarketingService.addDynamicRemarketingParameters(tourData);

            expect(global.gtag).not.toHaveBeenCalled();
        });

        it('should handle missing tour data gracefully', () => {
            expect(() => {
                dynamicRemarketingService.addDynamicRemarketingParameters(null);
            }).not.toThrow();

            expect(() => {
                dynamicRemarketingService.addDynamicRemarketingParameters({});
            }).not.toThrow();
        });
    });

    describe('getProductCatalogData', () => {
        it('should return structured product data for valid tour', () => {
            const productData = dynamicRemarketingService.getProductCatalogData('gion-tour');

            expect(productData).toEqual(expect.objectContaining({
                id: 'gion-tour',
                title: 'Gion District Cultural Walking Tour',
                price: '8000 JPY',
                product_type: 'Cultural Tours',
                custom_label_0: 'Gion, Kyoto',
                custom_label_1: '3 hours',
                custom_label_2: 'easy',
                custom_label_3: 'afternoon',
                custom_label_4: 'year-round',
                brand: 'Tomodachi Tours',
                availability: 'in stock',
                condition: 'new'
            }));
        });

        it('should return null for invalid tour ID', () => {
            const productData = dynamicRemarketingService.getProductCatalogData('invalid-tour');
            expect(productData).toBeNull();
        });

        it('should include correct image and link URLs', () => {
            const productData = dynamicRemarketingService.getProductCatalogData('morning-tour');

            expect(productData.image_link).toBe('https://tomodachitours.com/IMG/Morning-Tour/bamboo-main-highres1.85.webp');
            expect(productData.link).toBe('https://tomodachitours.com/morning-tour');
            expect(productData.booking_url).toBe('https://tomodachitours.com/checkout?tour=morning-tour');
        });
    });

    describe('createTourSpecificAudience', () => {
        it('should create a new tour-specific audience', () => {
            const audienceConfig = {
                id: 'test_audience',
                name: 'Test Audience',
                description: 'Test audience for unit testing',
                criteria: {
                    tourTypes: ['gion-tour'],
                    events: ['view_item']
                },
                dynamicConfig: {
                    productId: 'gion-tour',
                    customParameters: {
                        tour_category: 'Cultural'
                    }
                },
                membershipDuration: 30
            };

            const audience = dynamicRemarketingService.createTourSpecificAudience(audienceConfig);

            expect(audience).toEqual(expect.objectContaining({
                id: 'test_audience',
                name: 'Test Audience',
                description: 'Test audience for unit testing',
                isActive: true,
                membershipDuration: 30
            }));
        });

        it('should return null when tracking is disabled', () => {
            const { getShouldTrack } = require('../analytics/config.js');
            getShouldTrack.mockReturnValue(false);

            const audienceConfig = {
                id: 'test_audience',
                name: 'Test Audience'
            };

            const audience = dynamicRemarketingService.createTourSpecificAudience(audienceConfig);
            expect(audience).toBeNull();
        });
    });

    describe('calculateEngagementLevel', () => {
        it('should calculate engagement level based on user interactions', () => {
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

        it('should return 0 for users with no interactions', () => {
            sessionStorageMock.getItem.mockReturnValue('[]');

            const engagementLevel = dynamicRemarketingService.calculateEngagementLevel('test_user');

            expect(engagementLevel).toBe(0);
        });

        it('should handle storage errors gracefully', () => {
            sessionStorageMock.getItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const engagementLevel = dynamicRemarketingService.calculateEngagementLevel('test_user');

            expect(engagementLevel).toBe(0);
        });
    });

    describe('calculateTourPreferenceScore', () => {
        it('should calculate preference score based on user tour history', () => {
            const mockPreferences = JSON.stringify({
                preferences: {
                    categories: { 'Cultural': 3, 'Nature': 1 },
                    locations: { 'Gion': 2, 'Arashiyama': 1 },
                    durations: { '3 hours': 2, '4 hours': 1 },
                    priceRanges: { 'mid-range': 3 }
                }
            });

            localStorageMock.getItem.mockReturnValue(mockPreferences);

            const score = dynamicRemarketingService.calculateTourPreferenceScore('test_user', 'gion-tour');

            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(10);
        });

        it('should return 0 for users with no preferences', () => {
            localStorageMock.getItem.mockReturnValue(null);

            const score = dynamicRemarketingService.calculateTourPreferenceScore('test_user', 'gion-tour');

            expect(score).toBe(0);
        });

        it('should return 0 for invalid tour ID', () => {
            const mockPreferences = JSON.stringify({
                preferences: {
                    categories: { 'Cultural': 3 }
                }
            });

            localStorageMock.getItem.mockReturnValue(mockPreferences);

            const score = dynamicRemarketingService.calculateTourPreferenceScore('test_user', 'invalid-tour');

            expect(score).toBe(0);
        });
    });

    describe('updateUserTourPreferences', () => {
        it('should update user preferences based on tour view', () => {
            const tourProduct = {
                id: 'gion-tour',
                category: 'Cultural Tours',
                location: 'Gion, Kyoto',
                duration: '3 hours',
                price: 8000
            };

            dynamicRemarketingService.updateUserTourPreferences('test_user', 'gion-tour', tourProduct);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'tour_preferences_test_user',
                expect.stringContaining('gion-tour')
            );
        });

        it('should handle storage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            const tourProduct = {
                id: 'gion-tour',
                category: 'Cultural Tours',
                location: 'Gion, Kyoto',
                duration: '3 hours',
                price: 8000
            };

            expect(() => {
                dynamicRemarketingService.updateUserTourPreferences('test_user', 'gion-tour', tourProduct);
            }).not.toThrow();
        });
    });

    describe('createCustomAudienceFromBehavior', () => {
        it('should create custom audience for high engagement users', () => {
            const mockPreferences = {
                categories: { 'Cultural': 5 },
                locations: { 'Gion': 3 },
                priceRanges: { 'mid-range': 4 }
            };

            const mockInteractions = JSON.stringify([
                { type: 'view_item', timestamp: Date.now() - 1000 },
                { type: 'add_to_cart', timestamp: Date.now() - 2000 },
                { type: 'begin_checkout', timestamp: Date.now() - 3000 },
                { type: 'contact_whatsapp', timestamp: Date.now() - 4000 },
                { type: 'view_item', timestamp: Date.now() - 5000 },
                { type: 'view_item', timestamp: Date.now() - 6000 },
                { type: 'view_item', timestamp: Date.now() - 7000 },
                { type: 'view_item', timestamp: Date.now() - 8000 }
            ]);

            sessionStorageMock.getItem.mockReturnValue(mockInteractions);

            const behaviorData = {
                tourViews: 5,
                engagementScore: 8
            };

            const customAudience = dynamicRemarketingService.createCustomAudienceFromBehavior(
                'test_user',
                behaviorData
            );

            expect(customAudience).toBeTruthy();
            expect(customAudience.name).toContain('High Intent');
        });

        it('should create custom audience for multi-tour browsers', () => {
            const mockPreferences = {
                tourViews: [
                    { tourId: 'gion-tour', category: 'Cultural' },
                    { tourId: 'morning-tour', category: 'Nature' },
                    { tourId: 'night-tour', category: 'Cultural' }
                ],
                categories: { 'Cultural': 2, 'Nature': 1 }
            };

            const behaviorData = {
                tourViews: 3,
                engagementScore: 4
            };

            const customAudience = dynamicRemarketingService.createCustomAudienceFromBehavior(
                'test_user',
                behaviorData
            );

            expect(customAudience).toBeTruthy();
            expect(customAudience.name).toContain('Multi-Tour Browser');
        });

        it('should return null for low engagement users', () => {
            const mockPreferences = {
                categories: { 'Cultural': 1 }
            };

            const behaviorData = {
                tourViews: 1,
                engagementScore: 1
            };

            const customAudience = dynamicRemarketingService.createCustomAudienceFromBehavior(
                'test_user',
                behaviorData
            );

            expect(customAudience).toBeNull();
        });
    });

    describe('getDynamicRemarketingStats', () => {
        it('should return comprehensive statistics', () => {
            const stats = dynamicRemarketingService.getDynamicRemarketingStats();

            expect(stats).toEqual(expect.objectContaining({
                totalAudiences: expect.any(Number),
                totalUsers: expect.any(Number),
                audienceBreakdown: expect.any(Object),
                productCatalogSize: 4 // We have 4 tours in the catalog
            }));
        });

        it('should include audience breakdown with member counts', () => {
            const stats = dynamicRemarketingService.getDynamicRemarketingStats();

            expect(stats.audienceBreakdown).toHaveProperty('dynamic_gion_viewers');
            expect(stats.audienceBreakdown).toHaveProperty('dynamic_morning_viewers');
            expect(stats.audienceBreakdown).toHaveProperty('dynamic_night_viewers');
            expect(stats.audienceBreakdown).toHaveProperty('dynamic_uji_viewers');

            Object.values(stats.audienceBreakdown).forEach(audience => {
                expect(audience).toEqual(expect.objectContaining({
                    name: expect.any(String),
                    memberCount: expect.any(Number),
                    isActive: expect.any(Boolean)
                }));
            });
        });
    });

    describe('mapToGoogleProductCategory', () => {
        it('should map tour categories to Google product categories', () => {
            const culturalCategory = dynamicRemarketingService.mapToGoogleProductCategory('Cultural Tours');
            const natureCategory = dynamicRemarketingService.mapToGoogleProductCategory('Nature Tours');
            const unknownCategory = dynamicRemarketingService.mapToGoogleProductCategory('Unknown Category');

            expect(culturalCategory).toBe('Arts & Entertainment > Events & Attractions > Tours');
            expect(natureCategory).toBe('Arts & Entertainment > Events & Attractions > Tours');
            expect(unknownCategory).toBe('Arts & Entertainment > Events & Attractions > Tours');
        });
    });

    describe('getDominantPreference', () => {
        it('should return the most frequent preference', () => {
            const preferences = {
                'Cultural': 5,
                'Nature': 2,
                'Photography': 1
            };

            const dominant = dynamicRemarketingService.getDominantPreference(preferences);
            expect(dominant).toBe('Cultural');
        });

        it('should return null for empty preferences', () => {
            const dominant = dynamicRemarketingService.getDominantPreference({});
            expect(dominant).toBeNull();

            const dominantNull = dynamicRemarketingService.getDominantPreference(null);
            expect(dominantNull).toBeNull();
        });
    });
});