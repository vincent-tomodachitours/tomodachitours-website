import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Redis } from '@upstash/redis';
import { SecurityLogger } from '../src/services/logging/SecurityLogger';
import { SecurityEventTypes } from '../src/services/logging/SecurityEventTypes';
import { SuspiciousTransactionDetector } from '../src/services/suspicious-transaction';
import { TransactionData } from '../src/types/TransactionData';
import { Request, Response } from 'express';
import { Socket } from 'net';

// Mock Redis client
vi.mock('@upstash/redis', () => ({
    Redis: vi.fn().mockImplementation(() => ({
        zadd: vi.fn().mockResolvedValue(true),
        zcount: vi.fn().mockResolvedValue(0),
        zremrangebyscore: vi.fn().mockResolvedValue(true),
        lpush: vi.fn().mockResolvedValue(true),
        get: vi.fn().mockResolvedValue(null)
    }))
}));

// Mock SecurityLogger
vi.mock('../src/services/logging/SecurityLogger', () => ({
    SecurityLogger: vi.fn().mockImplementation(() => ({
        info: vi.fn().mockResolvedValue(undefined),
        warning: vi.fn().mockResolvedValue(undefined),
        error: vi.fn().mockResolvedValue(undefined),
        critical: vi.fn().mockResolvedValue(undefined)
    }))
}));

describe('Suspicious Transaction Detection', () => {
    let detector: SuspiciousTransactionDetector;
    let redis: Redis;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockData: TransactionData;

    beforeEach(() => {
        redis = new Redis({
            url: 'redis://localhost:6379',
            token: 'dummy-token'
        });
        detector = new SuspiciousTransactionDetector(redis);

        mockData = {
            bookingId: 'test-booking',
            tourId: 'morning-tour',
            amount: 10000,
            email: 'test@example.com',
            ip: '1.2.3.4',
            userId: 'test-user',
            userAgent: 'test-agent',
            correlationId: 'test-correlation'
        };

        // Create a mock socket with all required methods
        const mockSocket = {
            remoteAddress: '1.2.3.4',
            // Add minimal required Socket methods
            destroy: vi.fn(),
            destroySoon: vi.fn(),
            setEncoding: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            setTimeout: vi.fn(),
            setNoDelay: vi.fn(),
            setKeepAlive: vi.fn(),
            address: vi.fn(),
            unref: vi.fn(),
            ref: vi.fn(),
            // Add event emitter methods
            addListener: vi.fn(),
            emit: vi.fn(),
            on: vi.fn(),
            once: vi.fn(),
            prependListener: vi.fn(),
            prependOnceListener: vi.fn(),
            removeListener: vi.fn(),
            removeAllListeners: vi.fn(),
            setMaxListeners: vi.fn(),
            getMaxListeners: vi.fn(),
            listeners: vi.fn(),
            rawListeners: vi.fn(),
            listenerCount: vi.fn(),
            eventNames: vi.fn()
        } as unknown as Socket;

        mockRequest = {
            body: { ...mockData },
            ip: '1.2.3.4',
            headers: {
                'user-agent': 'test-agent',
                'x-correlation-id': 'test-correlation'
            },
            socket: mockSocket
        };

        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
    });

    describe('Risk Assessment', () => {
        it('should identify unusual transaction amounts', async () => {
            mockData.amount = 100000; // Way above normal range
            const assessment = await detector.assessTransaction(mockData);
            expect(assessment.factors).toContain('Unusual amount');
            expect(assessment.score).toBeGreaterThanOrEqual(25);
        });

        it('should identify unusual transaction times', async () => {
            // Mock time to 3 AM
            vi.setSystemTime(new Date('2024-01-01T03:00:00'));
            const assessment = await detector.assessTransaction(mockData);
            expect(assessment.factors).toContain('Unusual time');
            expect(assessment.score).toBeGreaterThanOrEqual(15);
            vi.useRealTimers();
        });

        it('should identify unusual locations', async () => {
            mockData.ip = '10.0.0.1'; // IP not in allowed countries
            const assessment = await detector.assessTransaction(mockData);
            expect(assessment.factors).toContain('Unusual location');
            expect(assessment.score).toBeGreaterThanOrEqual(25);
        });

        it('should identify multiple bookings', async () => {
            vi.mocked(redis.zcount).mockResolvedValue(3);
            const assessment = await detector.assessTransaction(mockData);
            expect(assessment.factors).toContain('Multiple bookings');
            expect(assessment.score).toBeGreaterThanOrEqual(20);
        });
    });

    describe('Risk Levels', () => {
        it('should block critical risk transactions', async () => {
            // Set up conditions for critical risk
            mockData.amount = 100000;
            vi.mocked(redis.zcount).mockResolvedValue(5);
            vi.setSystemTime(new Date('2024-01-01T03:00:00'));
            mockData.ip = '10.0.0.1'; // Add unusual location condition

            mockRequest.body = mockData;
            mockRequest.socket = {
                ...mockRequest.socket,
                remoteAddress: mockData.ip
            } as Socket;

            await detector.handleRequest(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Critical risk')
                })
            );
        });

        it('should flag high risk transactions for review but allow them', async () => {
            // Set up conditions for high risk but not critical
            mockData.amount = 50000;
            vi.mocked(redis.zcount).mockResolvedValue(3);

            await detector.handleRequest(mockRequest as Request, mockResponse as Response);

            // Verify transaction was added to review queue
            expect(vi.mocked(redis.lpush)).toHaveBeenCalledWith(
                'review_queue',
                expect.stringContaining('"status":"pending_review"')
            );

            // Verify response
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    riskAssessment: expect.objectContaining({
                        score: expect.any(Number),
                        factors: expect.any(Array)
                    })
                })
            );
        });

        it('should reject requests with missing required fields', async () => {
            mockRequest.body = {
                email: 'test@example.com',
                // Missing amount, bookingId, and tourId
            };

            await detector.handleRequest(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('required fields')
                })
            );
        });
    });

    describe('Edge Cases', () => {
        describe('Amount Edge Cases', () => {
            it('should handle zero amount transactions', async () => {
                mockData.amount = 0;
                const assessment = await detector.assessTransaction(mockData);
                expect(assessment.factors).toContain('Unusual amount');
                expect(assessment.score).toBeGreaterThanOrEqual(25);
            });

            it('should handle extremely large amounts', async () => {
                mockData.amount = Number.MAX_SAFE_INTEGER;
                const assessment = await detector.assessTransaction(mockData);
                expect(assessment.factors).toContain('Unusual amount');
                expect(assessment.score).toBeGreaterThanOrEqual(25);
            });

            it('should handle fractional amounts', async () => {
                mockData.amount = 10000.50;
                const assessment = await detector.assessTransaction(mockData);
                expect(assessment.factors).toContain('Unusual amount');
                expect(assessment.score).toBeGreaterThanOrEqual(25);
            });
        });

        describe('Time Zone Edge Cases', () => {
            it('should handle DST transitions', async () => {
                // Test during DST transition
                const dstDate = new Date('2024-03-10T02:00:00');
                vi.setSystemTime(dstDate);

                const assessment1 = await detector.assessTransaction(mockData);

                // Move time 2 minutes forward
                vi.setSystemTime(new Date(dstDate.getTime() + 120000));

                const assessment2 = await detector.assessTransaction(mockData);

                // Both assessments should be consistent
                expect(assessment1.score).toBe(assessment2.score);

                vi.useRealTimers();
            });

            it('should handle midnight boundary transactions', async () => {
                // Test just before midnight
                const beforeMidnight = new Date('2024-01-01T23:59:59');
                vi.setSystemTime(beforeMidnight);

                const assessment1 = await detector.assessTransaction(mockData);

                // Test just after midnight
                vi.setSystemTime(new Date('2024-01-02T00:00:01'));

                const assessment2 = await detector.assessTransaction(mockData);

                // Risk assessment should be consistent across midnight boundary
                expect(assessment1.score).toBe(assessment2.score);

                vi.useRealTimers();
            });
        });

        describe('Rate Limiting Edge Cases', () => {
            it('should handle rapid sequential transactions', async () => {
                // Simulate 3 transactions in quick succession
                vi.mocked(redis.zcount).mockResolvedValue(3);

                const assessment = await detector.assessTransaction(mockData);
                expect(assessment.factors).toContain('Multiple bookings');
                expect(assessment.score).toBeGreaterThanOrEqual(20);
            });

            it('should handle transactions at exactly the rate limit threshold', async () => {
                // Simulate exactly 3 transactions in the last hour
                vi.mocked(redis.zcount).mockResolvedValue(3);

                const assessment = await detector.assessTransaction(mockData);
                expect(assessment.factors).toContain('Multiple bookings');
            });

            it('should handle concurrent transactions from same IP but different emails', async () => {
                const ip = '1.2.3.4';
                mockData.ip = ip;

                // Simulate multiple transactions from same IP
                vi.mocked(redis.zcount).mockResolvedValue(3);

                const assessment = await detector.assessTransaction(mockData);
                expect(assessment.factors).toContain('Multiple bookings');
                expect(assessment.score).toBeGreaterThanOrEqual(20);
            });
        });
    });
}); 