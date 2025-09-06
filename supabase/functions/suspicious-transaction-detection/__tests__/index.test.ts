import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Redis } from '@upstash/redis';
import { Request, Response } from 'express';
import { SuspiciousTransactionDetector } from '../index';
import { logSecurityEvent } from '../../../../src/services/logging/securityEvents';

// Define the authenticated request type
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

// Mock Redis client
vi.mock('@upstash/redis', () => ({
    Redis: vi.fn().mockImplementation(() => ({
        zadd: vi.fn().mockResolvedValue(true),
        zcount: vi.fn().mockResolvedValue(0),
        zremrangebyscore: vi.fn().mockResolvedValue(true),
        lpush: vi.fn().mockResolvedValue(true)
    }))
}));

// Mock security logger
vi.mock('../../../../src/services/logging/securityEvents', () => ({
    logSecurityEvent: vi.fn().mockResolvedValue(undefined),
    SecurityEventTypes: {
        SUSPICIOUS_TRANSACTION: 'security.suspicious.transaction',
        PAYMENT_BLOCKED: 'payment.blocked'
    }
}));

describe('SuspiciousTransactionDetector', () => {
    let detector: SuspiciousTransactionDetector;
    let redis: Redis;
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let jsonMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        redis = new Redis({} as any);
        detector = new SuspiciousTransactionDetector(redis);
        jsonMock = vi.fn();

        mockReq = {
            body: {
                bookingId: 'booking123',
                tourId: 'morning-tour',
                amount: 10000,
                email: 'test@example.com'
            },
            ip: '127.0.0.1',
            headers: {
                'user-agent': 'test-agent'
            },
            user: {
                id: 'user123'
            }
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: jsonMock
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('handleRequest', () => {
        it('should handle valid transaction with normal risk', async () => {
            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    score: expect.any(Number),
                    factors: expect.any(Array),
                    details: expect.any(Object)
                })
            );
            expect(logSecurityEvent).not.toHaveBeenCalled();
        });

        it('should handle high-risk transaction', async () => {
            // Simulate multiple bookings
            vi.mocked(redis.zcount).mockResolvedValueOnce(5);

            // Use unusual amount
            if (mockReq.body) {
                mockReq.body.amount = 50000;
            }

            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(logSecurityEvent).toHaveBeenCalledWith(
                'security.suspicious.transaction',
                expect.objectContaining({
                    bookingId: 'booking123',
                    amount: 50000
                }),
                expect.objectContaining({
                    userId: 'user123',
                    ip: '127.0.0.1'
                })
            );
        });

        it('should handle critical-risk transaction', async () => {
            // Simulate multiple bookings
            vi.mocked(redis.zcount).mockResolvedValueOnce(5);

            // Use very unusual amount
            if (mockReq.body) {
                mockReq.body.amount = 100000;
            }

            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(logSecurityEvent).toHaveBeenCalledWith(
                'payment.blocked',
                expect.objectContaining({
                    bookingId: 'booking123',
                    amount: 100000
                }),
                expect.objectContaining({
                    tags: expect.arrayContaining(['critical-risk'])
                })
            );
        });

        it('should handle missing user data gracefully', async () => {
            delete mockReq.user;

            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    score: expect.any(Number)
                })
            );
        });

        it('should handle error gracefully', async () => {
            vi.mocked(redis.zcount).mockRejectedValueOnce(new Error('Redis error'));

            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Internal server error'
                })
            );
        });
    });

    describe('risk assessment', () => {
        it('should detect unusual amount', async () => {
            if (mockReq.body) {
                mockReq.body.amount = 50000; // Above max for morning tour
            }

            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            const response = jsonMock.mock.calls[0][0];
            expect(response.factors).toContain('Unusual amount');
            expect(response.score).toBeGreaterThanOrEqual(25);
        });

        it('should detect multiple bookings', async () => {
            vi.mocked(redis.zcount).mockResolvedValueOnce(5);

            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            const response = jsonMock.mock.calls[0][0];
            expect(response.factors).toContain('Multiple bookings');
            expect(response.score).toBeGreaterThanOrEqual(20);
        });

        it('should detect unusual time', async () => {
            // Mock Date to simulate 3 AM JST
            const mockDate = new Date('2024-01-01T03:00:00+09:00');
            vi.setSystemTime(mockDate);

            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            const response = jsonMock.mock.calls[0][0];
            expect(response.factors).toContain('Unusual time');
            expect(response.score).toBeGreaterThanOrEqual(15);

            vi.useRealTimers();
        });

        it('should store transaction in history', async () => {
            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(redis.zadd).toHaveBeenCalledWith(
                'transaction_history',
                expect.objectContaining({
                    score: expect.any(Number),
                    member: expect.stringContaining('booking123')
                })
            );
        });

        it('should clean up old transactions', async () => {
            await detector.handleRequest(mockReq as AuthenticatedRequest, mockRes as Response);

            expect(redis.zremrangebyscore).toHaveBeenCalledWith(
                'transaction_history',
                0,
                expect.any(Number)
            );
        });
    });
}); 