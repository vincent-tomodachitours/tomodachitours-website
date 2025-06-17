import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Redis } from '@upstash/redis';
import { Request, Response } from 'express';
import { IPProtection } from '../supabase/functions/ip-protection-middleware';

// Mock Redis
vi.mock('@upstash/redis');

// Mock fetch for country checks
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('IP Protection', () => {
    let redis: Redis;
    let ipProtection: IPProtection;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: any;

    const testConfig = {
        allowedCountries: ['JP', 'US'],
        blacklistedIPs: ['1.2.3.4'],
        maxRequestsPerIP: 5,
        trackingWindowInMinutes: 60,
    };

    beforeEach(() => {
        // Reset Redis mock
        redis = {
            get: vi.fn(),
            set: vi.fn(),
            incr: vi.fn(),
            expire: vi.fn(),
        } as unknown as Redis;

        ipProtection = new IPProtection(redis, testConfig);

        // Reset response mock
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            setHeader: vi.fn(),
        };

        // Reset next mock
        mockNext = vi.fn();

        // Reset fetch mock
        mockFetch.mockReset();
    });

    describe('IP Blacklisting', () => {
        it('should block statically blacklisted IPs', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
            };

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Access denied: IP is blacklisted',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should block dynamically blacklisted IPs', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '5.6.7.8' },
                ip: '5.6.7.8',
            };

            // Mock Redis to return blacklist reason
            vi.mocked(redis.get).mockResolvedValue('Exceeded request limit');

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Access denied: IP is blacklisted',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Country Restrictions', () => {
        it('should allow requests from allowed countries', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '8.8.8.8' },
                ip: '8.8.8.8',
            };

            // Mock country check to return allowed country
            mockFetch.mockResolvedValue({
                text: () => Promise.resolve('US'),
            });

            // Mock Redis for request tracking
            vi.mocked(redis.get).mockResolvedValue(null);
            vi.mocked(redis.incr).mockResolvedValue(1);

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
        });

        it('should block requests from disallowed countries', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '8.8.8.8' },
                ip: '8.8.8.8',
            };

            // Mock country check to return disallowed country
            mockFetch.mockResolvedValue({
                text: () => Promise.resolve('FR'),
            });

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Access denied: Country not allowed',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Request Tracking', () => {
        it('should track request counts per IP', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '8.8.8.8' },
                ip: '8.8.8.8',
            };

            // Mock country check
            mockFetch.mockResolvedValue({
                text: () => Promise.resolve('US'),
            });

            // Mock Redis for request tracking
            vi.mocked(redis.get).mockResolvedValue(null);
            vi.mocked(redis.incr).mockResolvedValue(3);

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(redis.incr).toHaveBeenCalledWith('ip_requests:8.8.8.8');
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'X-IP-Requests-Remaining',
                '2'
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('should block IPs that exceed request limit', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '8.8.8.8' },
                ip: '8.8.8.8',
            };

            // Mock country check
            mockFetch.mockResolvedValue({
                text: () => Promise.resolve('US'),
            });

            // Mock Redis for request tracking
            vi.mocked(redis.get).mockResolvedValue(null);
            vi.mocked(redis.incr).mockResolvedValue(6);

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Too many requests from this IP',
            });
            expect(redis.set).toHaveBeenCalledWith(
                'blacklist:8.8.8.8',
                'Exceeded request limit'
            );
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing IP address', async () => {
            mockRequest = {
                headers: {},
                ip: undefined,
            };

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid IP address',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle geolocation service errors gracefully', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '8.8.8.8' },
                ip: '8.8.8.8',
            };

            // Mock geolocation service error
            mockFetch.mockRejectedValue(new Error('Geolocation service error'));

            // Mock Redis for request tracking
            vi.mocked(redis.get).mockResolvedValue(null);
            vi.mocked(redis.incr).mockResolvedValue(1);

            await ipProtection.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Should still allow the request when geolocation fails
            expect(mockNext).toHaveBeenCalled();
        });
    });
}); 