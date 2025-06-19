import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Redis } from '@upstash/redis';
import { Request, Response } from 'express';
import { VelocityChecker } from '../src/services/velocity-check';

// Mock Redis
vi.mock('@upstash/redis');

describe('Velocity Checker', () => {
    let redis: Redis;
    let velocityChecker: VelocityChecker;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: any;

    const testConfig = {
        maxAmountPerTransaction: 1000,
        maxDailyAmount: 2000,
        maxTransactionsPerHour: 2,
        maxTransactionsPerDay: 5,
        maxTransactionsPerEmail: 3,
        maxTransactionsPerIP: 3,
        suspiciousAmountThreshold: 800,
    };

    beforeEach(() => {
        // Reset Redis mock
        redis = {
            get: vi.fn(),
            set: vi.fn(),
            incr: vi.fn(),
            incrby: vi.fn(),
            expire: vi.fn(),
            lpush: vi.fn(),
        } as unknown as Redis;

        velocityChecker = new VelocityChecker(redis, testConfig);

        // Reset response mock
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        // Reset next mock
        mockNext = vi.fn();

        // Mock console.error to prevent noise in test output
        console.error = vi.fn();
    });

    describe('Transaction Amount Limits', () => {
        it('should block transactions exceeding single transaction limit', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                    amount: 1500, // Exceeds maxAmountPerTransaction
                },
            };

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Transaction amount too high',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should block transactions exceeding daily amount limit', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                    amount: 500,
                },
            };

            // Mock Redis to return high daily amount
            vi.mocked(redis.incrby).mockResolvedValue(2500); // Exceeds maxDailyAmount

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Daily transaction limit exceeded',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should flag suspicious amounts but allow transaction', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                    amount: 900, // Above suspiciousAmountThreshold but below maxAmountPerTransaction
                },
            };

            // Mock Redis for request tracking
            vi.mocked(redis.get).mockResolvedValue('0');
            vi.mocked(redis.incrby).mockResolvedValue(900);
            vi.mocked(redis.incr).mockResolvedValue(1);

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(redis.lpush).toHaveBeenCalled(); // Should be added to suspicious queue
            expect(mockNext).toHaveBeenCalled(); // But transaction should be allowed
        });
    });

    describe('Transaction Frequency Limits', () => {
        it('should block transactions exceeding hourly limit', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                    amount: 100,
                },
            };

            // Mock Redis to return high hourly count
            vi.mocked(redis.get).mockResolvedValue('2'); // Equals maxTransactionsPerHour
            vi.mocked(redis.incrby).mockResolvedValue(100);

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Too many transactions per hour',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should block transactions exceeding daily email limit', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                    amount: 100,
                },
            };

            // Mock Redis responses
            vi.mocked(redis.get).mockResolvedValue('1'); // Hourly count OK
            vi.mocked(redis.incrby).mockResolvedValue(100); // Daily amount OK
            vi.mocked(redis.incr).mockImplementation(async (key: string) => {
                if (key.includes('daily_count')) {
                    return 4; // Exceeds maxTransactionsPerEmail
                }
                return 1;
            });

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Too many transactions for this email today',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should block transactions exceeding daily IP limit', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                    amount: 100,
                },
            };

            // Mock Redis responses
            vi.mocked(redis.get).mockResolvedValue('1'); // Hourly count OK
            vi.mocked(redis.incrby).mockResolvedValue(100); // Daily amount OK
            vi.mocked(redis.incr).mockImplementation(async (key: string) => {
                if (key.includes('1.2.3.4')) {
                    return 4; // Exceeds maxTransactionsPerIP
                }
                return 1;
            });

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Too many transactions from this IP today',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Input Validation', () => {
        it('should reject requests with missing IP', async () => {
            mockRequest = {
                headers: {},
                ip: undefined,
                body: {
                    email: 'test@example.com',
                    amount: 100,
                },
            };

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing required fields: ip, email, or amount',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject requests with missing email', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    amount: 100,
                },
            };

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing required fields: ip, email, or amount',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject requests with missing amount', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                },
            };

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Missing required fields: ip, email, or amount',
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Successful Transactions', () => {
        it('should allow valid transactions within all limits', async () => {
            mockRequest = {
                headers: { 'x-forwarded-for': '1.2.3.4' },
                ip: '1.2.3.4',
                body: {
                    email: 'test@example.com',
                    amount: 500,
                },
            };

            // Mock Redis responses - all within limits
            vi.mocked(redis.get).mockResolvedValue('1');
            vi.mocked(redis.incrby).mockResolvedValue(500);
            vi.mocked(redis.incr).mockResolvedValue(1);

            await velocityChecker.middleware(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect((mockRequest as any).velocityCheck).toEqual({
                allowed: true,
            });
        });
    });
}); 