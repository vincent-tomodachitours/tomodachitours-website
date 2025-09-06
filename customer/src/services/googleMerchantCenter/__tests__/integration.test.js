/**
 * Integration tests for Google Merchant Center services
 */

import googleMerchantCenter from '../index.js';
import { fetchTours } from '../../toursService.js';

// Mock dependencies
jest.mock('../../toursService.js');
jest.mock('../../gtmService.js');

describe('Google Merchant Center Integration', () => {
    const mockTours = {
        'night-tour': {
            'tour-title': 'Kyoto Fushimi-Inari Night Walking Tour',
            'tour-description': 'Join us an unforgettable evening walking tour',
            'tour-price': 6500,
            'tour-duration': '90-120 minutes',
            'reviews': 178,
            'time-slots': ['17:00', '18:00', '19:00'],
            'max-participants': 12
        },
        'morning-tour': {
            'tour-title': 'Kyoto Early Bird English Tour',
            'tour-description': 'Early morning tour to avoid crowds',
            'tour-price': 14500,
            'tour-duration': '4.5 - 5 hours',
            'reviews': 108,
            'time-slots': ['6:30', '7:15', '8:00'],
            'max-participants': 9
        }
    };

    beforeEach(() => {
        fetchTours.mockResolvedValue(mockTours);

        // Setup environment variables
        process.env.REACT_APP_BASE_URL = 'https://tomodachitours.com';
        process.env.REACT_APP_GOOGLE_MERCHANT_ID = 'TEST_MERCHANT_123';
    });

    afterEach(() => {
        jest.clearAllMocks();
        googleMerchantCenter.automation.stop();
    });

    describe('initialize', () => {
        test('should initialize all services successfully', async () => {
            const result = await googleMerchantCenter.initialize({
                enableAutomation: false, // Disable for testing
                validateSetup: true
            });

            expect(result.success).toBe(true);
            expect(result.config).toBeDefined();
        });

        test('should start automation when enabled', async () => {
            const result = await googleMerchantCenter.initialize({
                enableAutomation: true,
                automationOptions: {
                    feedUpdateInterval: 60000
                }
            });

            expect(result.success).toBe(true);

            const automationStats = googleMerchantCenter.automation.getStatistics();
            expect(automationStats.isRunning).toBe(true);
        });

        test('should handle initialization errors', async () => {
            fetchTours.mockRejectedValue(new Error('Service unavailable'));

            const result = await googleMerchantCenter.initialize({
                validateSetup: true
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('generateAndSubmitFeed', () => {
        test('should generate and submit complete feed', async () => {
            const result = await googleMerchantCenter.generateAndSubmitFeed({
                includeAvailability: false,
                daysAhead: 7
            });

            expect(result.success).toBe(true);
            expect(result.feedData).toBeDefined();
            expect(result.feedData.products).toHaveLength(2);
            expect(result.validation.valid).toBe(true);
            expect(result.submission).toBeDefined();
        });

        test('should handle feed generation errors', async () => {
            fetchTours.mockRejectedValue(new Error('Tour service error'));

            const result = await googleMerchantCenter.generateAndSubmitFeed();

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('trackShoppingEvent', () => {
        test('should track view_item event', async () => {
            const result = await googleMerchantCenter.trackShoppingEvent(
                'view_item',
                'night-tour',
                { source: 'shopping_ad' },
                { campaign_id: 'camp_123' }
            );

            expect(result).toBe(true);
        });

        test('should track add_to_cart event', async () => {
            const result = await googleMerchantCenter.trackShoppingEvent(
                'add_to_cart',
                'night-tour',
                {
                    participants: 2,
                    date: '2025-08-28',
                    time: '18:00'
                },
                { campaign_id: 'camp_123' }
            );

            expect(result).toBe(true);
        });

        test('should track purchase event with customer data', async () => {
            const result = await googleMerchantCenter.trackShoppingEvent(
                'purchase',
                'night-tour',
                {
                    participants: 1,
                    date: '2025-08-28',
                    time: '18:00',
                    amount: 6500,
                    transaction_id: 'txn_123'
                },
                { campaign_id: 'camp_123' },
                { email_hash: 'hashed_email' }
            );

            expect(result).toBe(true);
        });

        test('should track shopping_click event', async () => {
            const result = await googleMerchantCenter.trackShoppingEvent(
                'shopping_click',
                'night-tour',
                {},
                {
                    campaign_id: 'camp_123',
                    gclid: 'gclid_789'
                }
            );

            expect(result).toBe(true);
        });

        test('should handle unknown event types', async () => {
            const result = await googleMerchantCenter.trackShoppingEvent(
                'unknown_event',
                'night-tour',
                {}
            );

            expect(result).toBe(false);
        });

        test('should handle tracking errors', async () => {
            fetchTours.mockRejectedValue(new Error('Service error'));

            const result = await googleMerchantCenter.trackShoppingEvent(
                'view_item',
                'night-tour',
                {}
            );

            expect(result).toBe(false);
        });
    });

    describe('getStatus', () => {
        test('should return status of all services', () => {
            const status = googleMerchantCenter.getStatus();

            expect(status).toMatchObject({
                productFeed: {
                    available: true,
                    lastGenerated: null
                },
                remarketing: expect.any(Object),
                shopping: expect.any(Object),
                automation: expect.any(Object)
            });
        });
    });

    describe('End-to-End Shopping Campaign Flow', () => {
        test('should handle complete shopping campaign user journey', async () => {
            const tourKey = 'night-tour';
            const shoppingData = {
                campaign_id: 'camp_123',
                ad_group_id: 'adg_456',
                gclid: 'gclid_789'
            };

            // 1. User clicks shopping ad
            const clickResult = await googleMerchantCenter.trackShoppingEvent(
                'shopping_click',
                tourKey,
                {},
                shoppingData
            );
            expect(clickResult).toBe(true);

            // 2. User views tour page
            const viewResult = await googleMerchantCenter.trackShoppingEvent(
                'view_item',
                tourKey,
                { source: 'shopping_ad' },
                shoppingData
            );
            expect(viewResult).toBe(true);

            // 3. User adds tour to cart
            const addToCartResult = await googleMerchantCenter.trackShoppingEvent(
                'add_to_cart',
                tourKey,
                {
                    participants: 2,
                    date: '2025-08-28',
                    time: '18:00'
                },
                shoppingData
            );
            expect(addToCartResult).toBe(true);

            // 4. User completes purchase
            const purchaseResult = await googleMerchantCenter.trackShoppingEvent(
                'purchase',
                tourKey,
                {
                    participants: 2,
                    date: '2025-08-28',
                    time: '18:00',
                    amount: 13000,
                    transaction_id: 'txn_123456',
                    paymentMethod: 'stripe'
                },
                shoppingData,
                {
                    email_hash: 'hashed_email',
                    phone_hash: 'hashed_phone'
                }
            );
            expect(purchaseResult).toBe(true);
        });
    });

    describe('Product Feed Management', () => {
        test('should generate feeds in multiple formats', async () => {
            // Generate JSON feed
            const jsonFeed = await googleMerchantCenter.productFeed.generateJSONFeed({
                includeAvailability: false
            });
            expect(jsonFeed.products).toHaveLength(2);

            // Generate XML feed
            const xmlFeed = await googleMerchantCenter.productFeed.generateXMLFeed({
                includeAvailability: false
            });
            expect(typeof xmlFeed).toBe('string');
            expect(xmlFeed).toContain('<?xml version="1.0"');

            // Validate feeds
            const validation = googleMerchantCenter.productFeed.validateFeed(jsonFeed.products);
            expect(validation.valid).toBe(true);

            // Get feed statistics
            const stats = googleMerchantCenter.productFeed.getFeedStatistics(jsonFeed.products);
            expect(stats.totalProducts).toBe(2);
        });
    });

    describe('Dynamic Remarketing Integration', () => {
        test('should track remarketing events for tour browsing', async () => {
            const tourKeys = ['night-tour', 'morning-tour'];

            // Track tour list view
            const listResult = await googleMerchantCenter.remarketing.trackViewItemList(
                tourKeys,
                { listName: 'Popular Tours' }
            );
            expect(listResult).toBe(true);

            // Track individual tour view
            const itemResult = await googleMerchantCenter.remarketing.trackViewItem(
                'night-tour',
                null,
                { source: 'tour_list' }
            );
            expect(itemResult).toBe(true);

            // Track search results
            const searchResult = await googleMerchantCenter.remarketing.trackViewSearchResults(
                'kyoto night tour',
                ['night-tour']
            );
            expect(searchResult).toBe(true);
        });
    });

    describe('Feed Automation Workflow', () => {
        test('should handle automated feed updates', async () => {
            // Start automation
            googleMerchantCenter.automation.start({
                feedUpdateInterval: 1000, // 1 second for testing
                availabilityUpdateInterval: 500
            });

            // Check automation status
            const stats = googleMerchantCenter.automation.getStatistics();
            expect(stats.isRunning).toBe(true);

            // Trigger manual update
            const updateResult = await googleMerchantCenter.automation.triggerUpdate({
                daysAhead: 7
            });
            expect(updateResult.success).toBe(true);

            // Monitor health
            const health = await googleMerchantCenter.automation.monitorFeedHealth();
            expect(health.status).toBe('healthy');

            // Stop automation
            googleMerchantCenter.automation.stop();
            const finalStats = googleMerchantCenter.automation.getStatistics();
            expect(finalStats.isRunning).toBe(false);
        });
    });

    describe('Error Handling and Recovery', () => {
        test('should handle service failures gracefully', async () => {
            // Simulate tour service failure
            fetchTours.mockRejectedValue(new Error('Service unavailable'));

            // Feed generation should fail gracefully
            const feedResult = await googleMerchantCenter.generateAndSubmitFeed();
            expect(feedResult.success).toBe(false);

            // Tracking should fail gracefully
            const trackingResult = await googleMerchantCenter.trackShoppingEvent(
                'view_item',
                'night-tour',
                {}
            );
            expect(trackingResult).toBe(false);

            // Health monitoring should detect issues
            const health = await googleMerchantCenter.automation.monitorFeedHealth();
            expect(health.status).toBe('error');
        });

        test('should recover from temporary failures', async () => {
            // Simulate temporary failure then recovery
            fetchTours
                .mockRejectedValueOnce(new Error('Temporary failure'))
                .mockResolvedValueOnce(mockTours);

            // First attempt should fail
            const firstResult = await googleMerchantCenter.generateAndSubmitFeed();
            expect(firstResult.success).toBe(false);

            // Second attempt should succeed
            const secondResult = await googleMerchantCenter.generateAndSubmitFeed();
            expect(secondResult.success).toBe(true);
        });
    });

    describe('Performance and Caching', () => {
        test('should cache product data efficiently', async () => {
            const tourKey = 'night-tour';
            const context = { participants: 1 };

            // First call should generate data
            await googleMerchantCenter.remarketing.trackViewItem(tourKey, null, context);

            // Second call should use cache
            await googleMerchantCenter.remarketing.trackViewItem(tourKey, null, context);

            // Check cache stats
            const cacheStats = googleMerchantCenter.remarketing.getCacheStats();
            expect(cacheStats.size).toBeGreaterThan(0);

            // Clear cache
            googleMerchantCenter.remarketing.clearCache();
            const clearedStats = googleMerchantCenter.remarketing.getCacheStats();
            expect(clearedStats.size).toBe(0);
        });
    });
});