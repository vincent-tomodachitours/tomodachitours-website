/**
 * Unit tests for Feed Automation Service
 */

import feedAutomationService from '../feedAutomationService.js';
import productFeedService from '../productFeedService.js';
import { fetchTours, refreshAvailabilityForDate } from '../../toursService.js';

// Mock dependencies
jest.mock('../productFeedService.js');
jest.mock('../../toursService.js');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

describe('FeedAutomationService', () => {
    const mockFeedData = {
        version: '1.0',
        title: 'Test Feed',
        products: [
            {
                id: 'tour_night-tour',
                title: 'Night Tour',
                price: '6500 JPY',
                availability: 'in stock'
            },
            {
                id: 'tour_morning-tour',
                title: 'Morning Tour',
                price: '14500 JPY',
                availability: 'in stock'
            }
        ]
    };

    const mockValidation = {
        valid: true,
        errors: [],
        warnings: [],
        productCount: 2
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup default mock responses
        productFeedService.generateJSONFeed.mockResolvedValue(mockFeedData);
        productFeedService.validateFeed.mockReturnValue(mockValidation);
        fetchTours.mockResolvedValue({});
        refreshAvailabilityForDate.mockResolvedValue();

        // Reset service state
        feedAutomationService.stop();

        // Set shorter retry delay for tests
        feedAutomationService.retryDelay = 100; // 100ms instead of 5 minutes

        // Setup environment variables
        process.env.REACT_APP_FEED_SUBMISSION_URL = 'https://api.example.com/feed';
        process.env.REACT_APP_FEED_API_TOKEN = 'test_token';
    });

    afterEach(() => {
        feedAutomationService.stop();
        jest.clearAllTimers();
    });

    describe('start and stop', () => {
        test('should start automation successfully', () => {
            jest.useFakeTimers();

            feedAutomationService.start();

            const stats = feedAutomationService.getStatistics();
            expect(stats.isRunning).toBe(true);

            jest.useRealTimers();
        });

        test('should not start if already running', () => {
            jest.useFakeTimers();

            feedAutomationService.start();
            feedAutomationService.start(); // Second call should be ignored

            const stats = feedAutomationService.getStatistics();
            expect(stats.isRunning).toBe(true);

            jest.useRealTimers();
        });

        test('should stop automation successfully', () => {
            jest.useFakeTimers();

            feedAutomationService.start();
            feedAutomationService.stop();

            const stats = feedAutomationService.getStatistics();
            expect(stats.isRunning).toBe(false);

            jest.useRealTimers();
        });

        test('should accept custom intervals', () => {
            jest.useFakeTimers();

            const options = {
                feedUpdateInterval: 60000, // 1 minute
                availabilityUpdateInterval: 30000 // 30 seconds
            };

            feedAutomationService.start(options);

            const stats = feedAutomationService.getStatistics();
            expect(stats.intervals.feedUpdate).toBe(60000);
            expect(stats.intervals.availabilityUpdate).toBe(30000);

            jest.useRealTimers();
        });
    });

    describe('updateProductFeed', () => {
        test('should update product feed successfully', async () => {
            const result = await feedAutomationService.updateProductFeed();

            expect(result.success).toBe(true);
            expect(result.productCount).toBe(2);
            expect(result.attempt).toBe(1);
            expect(productFeedService.generateJSONFeed).toHaveBeenCalled();
            expect(productFeedService.validateFeed).toHaveBeenCalled();
        });

        test('should retry on failure', async () => {
            productFeedService.generateJSONFeed
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(mockFeedData);

            const result = await feedAutomationService.updateProductFeed();

            expect(result.success).toBe(true);
            expect(result.attempt).toBe(2);
            expect(productFeedService.generateJSONFeed).toHaveBeenCalledTimes(2);
        });

        test('should fail after max retries', async () => {
            productFeedService.generateJSONFeed.mockRejectedValue(new Error('Persistent error'));

            const result = await feedAutomationService.updateProductFeed();

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(3); // Max retries
            expect(result.error).toBe('Persistent error');
        });

        test('should handle validation errors', async () => {
            const invalidValidation = {
                valid: false,
                errors: ['Missing required field'],
                warnings: []
            };
            productFeedService.validateFeed.mockReturnValue(invalidValidation);

            const result = await feedAutomationService.updateProductFeed();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Feed validation failed');
        });
    });

    describe('triggerUpdate', () => {
        test('should trigger manual update', async () => {
            const result = await feedAutomationService.triggerUpdate();

            expect(result.success).toBe(true);
            expect(productFeedService.generateJSONFeed).toHaveBeenCalled();
        });

        test('should pass options to update', async () => {
            const options = { daysAhead: 7, includeAvailability: false };

            await feedAutomationService.triggerUpdate(options);

            expect(productFeedService.generateJSONFeed).toHaveBeenCalledWith(
                expect.objectContaining(options)
            );
        });
    });

    describe('submitFeedToExternalSystems', () => {
        test('should submit to all configured systems', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ success: true })
            });

            const result = await feedAutomationService.submitFeedToExternalSystems(mockFeedData);

            expect(result.success).toBe(true);
            expect(result.results).toHaveLength(2); // Custom endpoint + local storage
            expect(fetch).toHaveBeenCalledWith(
                'https://api.example.com/feed',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test_token'
                    })
                })
            );
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        test('should handle fetch errors', async () => {
            fetch.mockRejectedValue(new Error('Network error'));

            const result = await feedAutomationService.submitFeedToExternalSystems(mockFeedData);

            expect(result.success).toBe(false);
            expect(result.results.some(r => !r.success)).toBe(true);
        });

        test('should handle HTTP errors', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            const result = await feedAutomationService.submitFeedToExternalSystems(mockFeedData);

            expect(result.success).toBe(false);
        });
    });

    describe('monitorFeedHealth', () => {
        test('should return healthy status', async () => {
            fetchTours.mockResolvedValue({ 'night-tour': {}, 'morning-tour': {} });

            const health = await feedAutomationService.monitorFeedHealth();

            expect(health.status).toBe('healthy');
            expect(health.tourDataAvailable).toBe(true);
            expect(health.tourCount).toBe(2);
            expect(health.feedGenerationWorking).toBe(true);
        });

        test('should detect critical issues', async () => {
            fetchTours.mockResolvedValue({});

            const health = await feedAutomationService.monitorFeedHealth();

            expect(health.status).toBe('critical');
            expect(health.tourDataAvailable).toBe(false);
            expect(health.tourCount).toBe(0);
        });

        test('should detect feed generation issues', async () => {
            fetchTours.mockResolvedValue({ 'night-tour': {} });
            productFeedService.generateJSONFeed.mockRejectedValue(new Error('Generation error'));

            const health = await feedAutomationService.monitorFeedHealth();

            expect(health.status).toBe('critical');
            expect(health.feedGenerationWorking).toBe(false);
            expect(health.feedGenerationError).toBe('Generation error');
        });

        test('should handle monitoring errors', async () => {
            fetchTours.mockRejectedValue(new Error('Service error'));

            const health = await feedAutomationService.monitorFeedHealth();

            expect(health.status).toBe('error');
            expect(health.error).toBe('Service error');
        });
    });

    describe('getStatistics', () => {
        test('should return correct statistics', () => {
            const stats = feedAutomationService.getStatistics();

            expect(stats).toMatchObject({
                isRunning: expect.any(Boolean),
                updateCount: expect.any(Number),
                errorCount: expect.any(Number),
                metrics: expect.any(Object),
                errorRate: expect.any(Number),
                intervals: expect.any(Object),
                configuration: expect.any(Object)
            });
        });

        test('should calculate error rate correctly', async () => {
            // Simulate some updates with errors
            productFeedService.generateJSONFeed.mockRejectedValue(new Error('Test error'));

            await feedAutomationService.updateProductFeed();

            const stats = feedAutomationService.getStatistics();
            expect(stats.errorRate).toBeGreaterThan(0);
        });
    });

    describe('_performAvailabilityUpdate', () => {
        test('should refresh availability for multiple dates', async () => {
            feedAutomationService.start();

            await feedAutomationService._performAvailabilityUpdate();

            expect(refreshAvailabilityForDate).toHaveBeenCalledTimes(7); // Next 7 days
        });

        test('should handle availability update errors', async () => {
            refreshAvailabilityForDate.mockRejectedValue(new Error('Availability error'));
            feedAutomationService.start();

            await feedAutomationService._performAvailabilityUpdate();

            // Should not throw, just log error
            expect(refreshAvailabilityForDate).toHaveBeenCalled();
        });

        test('should not run when service is stopped', async () => {
            feedAutomationService.stop();

            await feedAutomationService._performAvailabilityUpdate();

            expect(refreshAvailabilityForDate).not.toHaveBeenCalled();
        });
    });

    describe('_saveFeedLocally', () => {
        test('should save feed to localStorage', async () => {
            const result = await feedAutomationService._saveFeedLocally(mockFeedData);

            expect(result.success).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                expect.stringMatching(/^product_feed_\d{4}-\d{2}-\d{2}$/),
                expect.any(String)
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'latest_product_feed',
                expect.any(String)
            );
        });

        test('should handle localStorage errors', async () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });

            const result = await feedAutomationService._saveFeedLocally(mockFeedData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Storage full');
        });
    });

    describe('_determineHealthStatus', () => {
        test('should return critical for missing tour data', () => {
            const healthCheck = {
                tourDataAvailable: false,
                feedGenerationWorking: true,
                errorRate: 0,
                isRunning: true
            };

            const status = feedAutomationService._determineHealthStatus(healthCheck);
            expect(status).toBe('critical');
        });

        test('should return critical for broken feed generation', () => {
            const healthCheck = {
                tourDataAvailable: true,
                feedGenerationWorking: false,
                errorRate: 0,
                isRunning: true
            };

            const status = feedAutomationService._determineHealthStatus(healthCheck);
            expect(status).toBe('critical');
        });

        test('should return warning for high error rate', () => {
            const healthCheck = {
                tourDataAvailable: true,
                feedGenerationWorking: true,
                errorRate: 0.6,
                isRunning: true
            };

            const status = feedAutomationService._determineHealthStatus(healthCheck);
            expect(status).toBe('warning');
        });

        test('should return stopped when not running', () => {
            const healthCheck = {
                tourDataAvailable: true,
                feedGenerationWorking: true,
                errorRate: 0,
                isRunning: false
            };

            const status = feedAutomationService._determineHealthStatus(healthCheck);
            expect(status).toBe('stopped');
        });

        test('should return healthy for good status', () => {
            const healthCheck = {
                tourDataAvailable: true,
                feedGenerationWorking: true,
                errorRate: 0.1,
                isRunning: true
            };

            const status = feedAutomationService._determineHealthStatus(healthCheck);
            expect(status).toBe('healthy');
        });
    });
});