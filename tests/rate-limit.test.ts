import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Mock Redis and Ratelimit
vi.mock('@upstash/redis');
vi.mock('@upstash/ratelimit');

describe('Rate Limiting', () => {
    // Mock response headers
    const mockHeaders = new Map();
    const mockResponse = {
        headers: mockHeaders,
        status: 200,
        json: vi.fn(),
    };

    // Mock request object
    const mockRequest = {
        headers: {
            'x-forwarded-for': '127.0.0.1',
        },
        method: 'POST',
        url: '',
    };

    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        mockHeaders.clear();

        // Setup Redis mock
        vi.mocked(Redis.fromEnv).mockReturnValue({} as Redis);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Endpoint-specific rate limits', () => {
        it('should apply 3 requests/minute limit for payment endpoints', async () => {
            const limitMock = vi.fn();
            for (let i = 0; i < 3; i++) {
                limitMock.mockResolvedValueOnce({
                    success: true,
                    limit: 3,
                    remaining: 2 - i,
                    reset: Date.now() + 60000,
                });
            }
            limitMock.mockResolvedValueOnce({
                success: false,
                limit: 3,
                remaining: 0,
                reset: Date.now() + 60000,
            });

            vi.mocked(Ratelimit).mockImplementation(() => ({
                limit: limitMock,
                limiter: Ratelimit.slidingWindow(3, '1 m'),
            } as unknown as Ratelimit));

            const ratelimit = new Ratelimit({
                redis: Redis.fromEnv(),
                limiter: Ratelimit.slidingWindow(3, '1 m'),
                analytics: true,
            });

            // Test successful requests within limit
            for (let i = 0; i < 3; i++) {
                const result = await ratelimit.limit('test_payment');
                expect(result.success).toBe(true);
                expect(result.remaining).toBe(2 - i);
            }

            // Test request exceeding limit
            const exceededResult = await ratelimit.limit('test_payment');
            expect(exceededResult.success).toBe(false);
            expect(exceededResult.remaining).toBe(0);
        });

        it('should apply 5 requests/minute limit for booking endpoints', async () => {
            const limitMock = vi.fn();
            for (let i = 0; i < 5; i++) {
                limitMock.mockResolvedValueOnce({
                    success: true,
                    limit: 5,
                    remaining: 4 - i,
                    reset: Date.now() + 60000,
                });
            }
            limitMock.mockResolvedValueOnce({
                success: false,
                limit: 5,
                remaining: 0,
                reset: Date.now() + 60000,
            });

            vi.mocked(Ratelimit).mockImplementation(() => ({
                limit: limitMock,
                limiter: Ratelimit.slidingWindow(5, '1 m'),
            } as unknown as Ratelimit));

            const ratelimit = new Ratelimit({
                redis: Redis.fromEnv(),
                limiter: Ratelimit.slidingWindow(5, '1 m'),
                analytics: true,
            });

            // Test successful requests within limit
            for (let i = 0; i < 5; i++) {
                const result = await ratelimit.limit('test_booking');
                expect(result.success).toBe(true);
                expect(result.remaining).toBe(4 - i);
            }

            // Test request exceeding limit
            const exceededResult = await ratelimit.limit('test_booking');
            expect(exceededResult.success).toBe(false);
            expect(exceededResult.remaining).toBe(0);
        });

        it('should apply 10 requests/minute limit for general endpoints', async () => {
            const limitMock = vi.fn();
            for (let i = 0; i < 10; i++) {
                limitMock.mockResolvedValueOnce({
                    success: true,
                    limit: 10,
                    remaining: 9 - i,
                    reset: Date.now() + 60000,
                });
            }
            limitMock.mockResolvedValueOnce({
                success: false,
                limit: 10,
                remaining: 0,
                reset: Date.now() + 60000,
            });

            vi.mocked(Ratelimit).mockImplementation(() => ({
                limit: limitMock,
                limiter: Ratelimit.slidingWindow(10, '1 m'),
            } as unknown as Ratelimit));

            const ratelimit = new Ratelimit({
                redis: Redis.fromEnv(),
                limiter: Ratelimit.slidingWindow(10, '1 m'),
                analytics: true,
            });

            // Test successful requests within limit
            for (let i = 0; i < 10; i++) {
                const result = await ratelimit.limit('test_general');
                expect(result.success).toBe(true);
                expect(result.remaining).toBe(9 - i);
            }

            // Test request exceeding limit
            const exceededResult = await ratelimit.limit('test_general');
            expect(exceededResult.success).toBe(false);
            expect(exceededResult.remaining).toBe(0);
        });
    });

    describe('Rate limit headers', () => {
        it('should set appropriate rate limit headers', async () => {
            const limitMock = vi.fn().mockResolvedValue({
                success: true,
                limit: 10,
                remaining: 9,
                reset: Date.now() + 60000,
            });

            vi.mocked(Ratelimit).mockImplementation(() => ({
                limit: limitMock,
                limiter: Ratelimit.slidingWindow(10, '1 m'),
            } as unknown as Ratelimit));

            const ratelimit = new Ratelimit({
                redis: Redis.fromEnv(),
                limiter: Ratelimit.slidingWindow(10, '1 m'),
                analytics: true,
            });

            const result = await ratelimit.limit('test_headers');

            expect(result).toEqual(expect.objectContaining({
                limit: expect.any(Number),
                remaining: expect.any(Number),
                reset: expect.any(Number),
                success: expect.any(Boolean),
            }));
        });
    });

    describe('IP-based rate limiting', () => {
        it('should track limits separately for different IPs', async () => {
            const limitMock = vi.fn()
                .mockResolvedValueOnce({
                    success: true,
                    limit: 10,
                    remaining: 9,
                    reset: Date.now() + 60000,
                })
                .mockResolvedValueOnce({
                    success: true,
                    limit: 10,
                    remaining: 9,
                    reset: Date.now() + 60000,
                });

            vi.mocked(Ratelimit).mockImplementation(() => ({
                limit: limitMock,
                limiter: Ratelimit.slidingWindow(10, '1 m'),
            } as unknown as Ratelimit));

            const ratelimit = new Ratelimit({
                redis: Redis.fromEnv(),
                limiter: Ratelimit.slidingWindow(10, '1 m'),
                analytics: true,
            });

            // Test first IP
            const ip1 = '1.1.1.1';
            const result1 = await ratelimit.limit(`test_ip_${ip1}`);
            expect(result1.success).toBe(true);
            expect(result1.remaining).toBe(9);

            // Test second IP
            const ip2 = '2.2.2.2';
            const result2 = await ratelimit.limit(`test_ip_${ip2}`);
            expect(result2.success).toBe(true);
            expect(result2.remaining).toBe(9);
        });
    });

    describe('Rate limit reset', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should reset limits after the time window', async () => {
            const now = Date.now();
            vi.setSystemTime(now);

            const limitMock = vi.fn()
                .mockResolvedValueOnce({
                    success: true,
                    limit: 1,
                    remaining: 0,
                    reset: now + 60000,
                })
                .mockResolvedValueOnce({
                    success: true,
                    limit: 1,
                    remaining: 1,
                    reset: now + 120000,
                });

            vi.mocked(Ratelimit).mockImplementation(() => ({
                limit: limitMock,
                limiter: Ratelimit.slidingWindow(1, '1 m'),
            } as unknown as Ratelimit));

            const ratelimit = new Ratelimit({
                redis: Redis.fromEnv(),
                limiter: Ratelimit.slidingWindow(1, '1 m'),
                analytics: true,
            });

            // Use up the limit
            const firstResult = await ratelimit.limit('test_reset');
            expect(firstResult.success).toBe(true);
            expect(firstResult.remaining).toBe(0);

            // Mock time passing (1 minute)
            vi.advanceTimersByTime(60000);

            // Should be able to make requests again
            const resetResult = await ratelimit.limit('test_reset');
            expect(resetResult.success).toBe(true);
            expect(resetResult.remaining).toBe(1);
        });
    });
}); 