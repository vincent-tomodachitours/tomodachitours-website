import {
    getBusinessReviews,
    refreshCache,
    clearCache,
    getCacheStatus,
    healthCheck,
    warmCache,
    config
} from '../tripAdvisorService';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
    supabase: {
        rpc: jest.fn(),
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(),
                    limit: jest.fn()
                })),
                limit: jest.fn()
            })),
            update: jest.fn(() => ({
                eq: jest.fn()
            }))
        }))
    }
}));

// Mock fetch
global.fetch = jest.fn();

describe('TripAdvisor Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset environment variables
        process.env.REACT_APP_TRIPADVISOR_API_KEY = 'test-api-key';
        process.env.REACT_APP_TRIPADVISOR_LOCATION_ID = 'test-location-id';
        process.env.REACT_APP_TRIPADVISOR_API_URL = 'https://api.content.tripadvisor.com/api/v1';

        // Reset the module to pick up new environment variables
        jest.resetModules();
    });

    describe('Configuration', () => {
        test('should have correct configuration', () => {
            expect(config.apiUrl).toBe('https://api.content.tripadvisor.com/api/v1');
            expect(config.locationId).toBe('test-location-id');
            expect(config.cacheDurationHours).toBe(6);
            expect(config.hasApiKey).toBe(true);
        });
    });

    describe('Health Check', () => {
        test('should perform health check', async () => {
            const { supabase } = require('../../lib/supabase');
            supabase.from().select().limit.mockResolvedValue({ error: null });
            supabase.rpc.mockResolvedValue({ data: false, error: null });

            const health = await healthCheck();

            expect(health).toHaveProperty('service', 'TripAdvisor Reviews');
            expect(health).toHaveProperty('healthy');
            expect(health).toHaveProperty('checks');
            expect(health.checks).toHaveProperty('apiKey');
            expect(health.checks).toHaveProperty('locationId');
            expect(health.checks).toHaveProperty('database');
        });
    });

    describe('Cache Management', () => {
        test('should get cache status', async () => {
            const { supabase } = require('../../lib/supabase');
            const mockCacheData = {
                cached_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 3600000).toISOString(),
                total_reviews: 10
            };

            supabase.from().select().eq().single.mockResolvedValue({
                data: mockCacheData,
                error: null
            });

            const status = await getCacheStatus();

            expect(status).toHaveProperty('cached', true);
            expect(status).toHaveProperty('valid', true);
            expect(status).toHaveProperty('totalReviews', 10);
        });

        test('should clear cache', async () => {
            const { supabase } = require('../../lib/supabase');
            supabase.from().update().eq.mockResolvedValue({ error: null });

            const result = await clearCache();

            expect(result).toBe(true);
            expect(supabase.from).toHaveBeenCalledWith('tripadvisor_reviews_cache');
        });
    });

    describe('API Integration', () => {
        test('should handle API errors gracefully', async () => {
            const { supabase } = require('../../lib/supabase');

            // Mock cache check to return invalid
            supabase.rpc.mockResolvedValue({ data: false, error: null });

            // Mock fetch to return error
            global.fetch.mockRejectedValue(new Error('Network error'));

            // Mock fallback cache data
            supabase.rpc.mockResolvedValueOnce({ data: false, error: null })
                .mockResolvedValueOnce({
                    data: [{
                        reviews_data: [{ id: '1', text: 'Great tour!', rating: 5 }],
                        business_name: 'Test Business',
                        overall_rating: 4.5,
                        total_reviews: 10,
                        cached_at: new Date().toISOString()
                    }],
                    error: null
                });

            const result = await getBusinessReviews();

            expect(result).toHaveProperty('reviews');
            expect(result).toHaveProperty('businessInfo');
            expect(result).toHaveProperty('cached', true);
            expect(result).toHaveProperty('error');
        });

        test('should handle successful API response', async () => {
            const { supabase } = require('../../lib/supabase');

            // Mock cache check to return invalid
            supabase.rpc.mockResolvedValue({ data: false, error: null });

            // Mock successful API responses
            const mockReviewsResponse = {
                data: [
                    {
                        id: 'review1',
                        title: 'Amazing tour!',
                        text: 'Had a wonderful time exploring Kyoto.',
                        rating: 5,
                        published_date: '2024-01-15',
                        user: {
                            username: 'TravelLover',
                            user_location: { name: 'New York, NY' }
                        },
                        helpful_votes: 3
                    }
                ]
            };

            const mockLocationResponse = {
                location_id: 'test-location-id',
                name: 'Tomodachi Tours',
                rating: '4.8',
                num_reviews: '150',
                web_url: 'https://tripadvisor.com/test',
                ranking_data: {
                    ranking_string: '#1 of 50 Tours in Kyoto'
                }
            };

            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockReviewsResponse)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockLocationResponse)
                });

            // Mock cache upsert
            supabase.rpc.mockResolvedValueOnce({ data: 'cache-id', error: null });

            const result = await getBusinessReviews();

            expect(result).toHaveProperty('reviews');
            expect(result.reviews).toHaveLength(1);
            expect(result.reviews[0]).toHaveProperty('id', 'review1');
            expect(result.reviews[0]).toHaveProperty('title', 'Amazing tour!');
            expect(result).toHaveProperty('businessInfo');
            expect(result.businessInfo).toHaveProperty('name', 'Tomodachi Tours');
            expect(result).toHaveProperty('cached', false);
        });

        test('should handle rate limiting with retry', async () => {
            const { supabase } = require('../../lib/supabase');

            // Mock cache check to return invalid
            supabase.rpc.mockResolvedValue({ data: false, error: null });

            // Mock rate limit response followed by success
            global.fetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 429,
                    headers: new Map([['Retry-After', '1']])
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ data: [] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ location_id: 'test' })
                });

            // Mock cache upsert
            supabase.rpc.mockResolvedValueOnce({ data: 'cache-id', error: null });

            const result = await getBusinessReviews();

            expect(result).toHaveProperty('reviews');
            expect(result).toHaveProperty('cached', false);
        });
    });

    describe('Request Deduplication', () => {
        test('should deduplicate simultaneous requests', async () => {
            const { supabase } = require('../../lib/supabase');

            // Mock cache to return valid data
            supabase.rpc.mockResolvedValue({ data: true, error: null })
                .mockResolvedValueOnce({ data: true, error: null })
                .mockResolvedValueOnce({
                    data: [{
                        reviews_data: [{ id: '1', text: 'Cached review' }],
                        business_name: 'Test Business',
                        cached_at: new Date().toISOString()
                    }],
                    error: null
                });

            // Make two simultaneous requests
            const [result1, result2] = await Promise.all([
                getBusinessReviews(),
                getBusinessReviews()
            ]);

            expect(result1).toEqual(result2);
            expect(result1.reviews[0].text).toBe('Cached review');
        });
    });

    describe('Cache Warming', () => {
        test('should warm cache successfully', async () => {
            const { supabase } = require('../../lib/supabase');

            // Mock API responses
            global.fetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ data: [] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ location_id: 'test' })
                });

            // Mock cache operations
            supabase.rpc.mockResolvedValue({ data: 'cache-id', error: null });

            const result = await warmCache();

            expect(result).toBe(true);
        });
    });
});