import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Redis } from '@upstash/redis';
import { ReviewQueueManager } from '../scripts/manage-review-queue';

// Mock Redis
vi.mock('@upstash/redis');

describe('Review Queue Manager', () => {
    let redis: Redis;
    let manager: ReviewQueueManager;

    beforeEach(() => {
        // Reset Redis mock
        redis = {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            lpush: vi.fn(),
            lrange: vi.fn(),
            lrem: vi.fn(),
        } as unknown as Redis;

        // Reset console.log mock to prevent noise in test output
        console.log = vi.fn();

        // Create new manager instance
        manager = new ReviewQueueManager(redis);

        // Mock Date.now() to return a consistent timestamp
        vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Listing Entries', () => {
        it('should list pending reviews', async () => {
            const entries = [
                {
                    transactionData: {
                        bookingId: 'booking1',
                        email: 'test1@example.com',
                        amount: 10000,
                        tourId: 'morning-tour',
                        ip: '1.2.3.4',
                        timestamp: Date.now(),
                    },
                    riskScore: {
                        score: 85,
                        level: 'high',
                        factors: {
                            unusualAmount: true,
                            unusualTime: false,
                            unusualLocation: true,
                            unusualDevice: false,
                            multipleBookings: true,
                            recentFailures: false,
                            knownBadActor: false,
                        },
                    },
                    queuedAt: Date.now() - 1000,
                },
                {
                    transactionData: {
                        bookingId: 'booking2',
                        email: 'test2@example.com',
                        amount: 15000,
                        tourId: 'night-tour',
                        ip: '5.6.7.8',
                        timestamp: Date.now(),
                    },
                    riskScore: {
                        score: 90,
                        level: 'critical',
                        factors: {
                            unusualAmount: true,
                            unusualTime: true,
                            unusualLocation: false,
                            unusualDevice: true,
                            multipleBookings: false,
                            recentFailures: true,
                            knownBadActor: false,
                        },
                    },
                    queuedAt: Date.now() - 2000,
                },
            ];

            vi.mocked(redis.lrange).mockResolvedValue(
                entries.map(entry => JSON.stringify(entry))
            );

            await manager.list();

            expect(redis.lrange).toHaveBeenCalledWith('manual_review_queue', 0, 9);
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Pending Reviews')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('booking1')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('booking2')
            );
        });

        it('should handle empty queue', async () => {
            vi.mocked(redis.lrange).mockResolvedValue([]);

            await manager.list();

            expect(console.log).toHaveBeenCalledWith('No entries in review queue');
        });
    });

    describe('Reviewing Entries', () => {
        it('should approve a transaction', async () => {
            const entry = {
                transactionData: {
                    bookingId: 'booking1',
                    email: 'test@example.com',
                    amount: 10000,
                    tourId: 'morning-tour',
                    ip: '1.2.3.4',
                    timestamp: Date.now(),
                },
                riskScore: {
                    score: 85,
                    level: 'high',
                    factors: {
                        unusualAmount: true,
                        unusualTime: false,
                        unusualLocation: true,
                        unusualDevice: false,
                        multipleBookings: true,
                        recentFailures: false,
                        knownBadActor: false,
                    },
                },
                queuedAt: Date.now() - 1000,
            };

            vi.mocked(redis.lrange).mockResolvedValue([JSON.stringify(entry)]);

            await manager.review(0, 'approve', 'admin', 'Legitimate transaction');

            expect(redis.lrem).toHaveBeenCalledWith(
                'manual_review_queue',
                1,
                JSON.stringify(entry)
            );
            expect(redis.lpush).toHaveBeenCalledWith(
                'review_decisions_log',
                expect.stringContaining('"decision":"approve"')
            );
            expect(redis.set).not.toHaveBeenCalled(); // Should not blacklist
        });

        it('should reject a transaction and blacklist identifiers', async () => {
            const entry = {
                transactionData: {
                    bookingId: 'booking1',
                    email: 'test@example.com',
                    amount: 10000,
                    tourId: 'morning-tour',
                    ip: '1.2.3.4',
                    timestamp: Date.now(),
                },
                riskScore: {
                    score: 85,
                    level: 'high',
                    factors: {
                        unusualAmount: true,
                        unusualTime: false,
                        unusualLocation: true,
                        unusualDevice: false,
                        multipleBookings: true,
                        recentFailures: false,
                        knownBadActor: false,
                    },
                },
                queuedAt: Date.now() - 1000,
            };

            vi.mocked(redis.lrange).mockResolvedValue([JSON.stringify(entry)]);

            await manager.review(0, 'reject', 'admin', 'Fraudulent activity');

            expect(redis.lrem).toHaveBeenCalledWith(
                'manual_review_queue',
                1,
                JSON.stringify(entry)
            );
            expect(redis.lpush).toHaveBeenCalledWith(
                'review_decisions_log',
                expect.stringContaining('"decision":"reject"')
            );
            expect(redis.set).toHaveBeenCalledWith(
                'blacklist:test@example.com',
                expect.stringContaining('Fraudulent activity')
            );
            expect(redis.set).toHaveBeenCalledWith(
                'blacklist:1.2.3.4',
                expect.stringContaining('Fraudulent activity')
            );
        });

        it('should handle invalid index', async () => {
            vi.mocked(redis.lrange).mockResolvedValue([]);

            await manager.review(0, 'approve', 'admin');

            expect(console.log).toHaveBeenCalledWith('Invalid entry index');
            expect(redis.lrem).not.toHaveBeenCalled();
            expect(redis.lpush).not.toHaveBeenCalled();
            expect(redis.set).not.toHaveBeenCalled();
        });
    });

    describe('History', () => {
        it('should show review history', async () => {
            const logs = [
                {
                    timestamp: Date.now(),
                    entry: {
                        transactionData: {
                            bookingId: 'booking1',
                            email: 'test@example.com',
                        },
                        reviewedAt: Date.now(),
                        reviewedBy: 'admin',
                        decision: 'approve',
                        notes: 'Legitimate transaction',
                    },
                },
                {
                    timestamp: Date.now() - 1000,
                    entry: {
                        transactionData: {
                            bookingId: 'booking2',
                            email: 'fraud@example.com',
                        },
                        reviewedAt: Date.now() - 1000,
                        reviewedBy: 'admin',
                        decision: 'reject',
                        notes: 'Fraudulent activity',
                    },
                },
            ];

            vi.mocked(redis.lrange).mockResolvedValue(
                logs.map(log => JSON.stringify(log))
            );

            await manager.getHistory();

            expect(redis.lrange).toHaveBeenCalledWith('review_decisions_log', 0, 49);
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Review History')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('booking1')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('booking2')
            );
        });

        it('should handle empty history', async () => {
            vi.mocked(redis.lrange).mockResolvedValue([]);

            await manager.getHistory();

            expect(console.log).toHaveBeenCalledWith('No review history found');
        });
    });

    describe('Cleanup', () => {
        it('should remove old entries', async () => {
            const now = Date.now();
            const entries = [
                {
                    transactionData: { bookingId: 'old1' },
                    queuedAt: now - 40 * 24 * 60 * 60 * 1000, // 40 days old
                },
                {
                    transactionData: { bookingId: 'old2' },
                    queuedAt: now - 35 * 24 * 60 * 60 * 1000, // 35 days old
                },
                {
                    transactionData: { bookingId: 'recent' },
                    queuedAt: now - 5 * 24 * 60 * 60 * 1000, // 5 days old
                },
            ];

            vi.mocked(redis.lrange).mockResolvedValue(
                entries.map(entry => JSON.stringify(entry))
            );

            await manager.cleanup(30); // Remove entries older than 30 days

            expect(redis.lrem).toHaveBeenCalledTimes(2);
            expect(redis.lrem).toHaveBeenCalledWith(
                'manual_review_queue',
                1,
                JSON.stringify(entries[0])
            );
            expect(redis.lrem).toHaveBeenCalledWith(
                'manual_review_queue',
                1,
                JSON.stringify(entries[1])
            );
            expect(console.log).toHaveBeenCalledWith('Cleaned up 2 old entries');
        });

        it('should handle no old entries', async () => {
            const now = Date.now();
            const entries = [
                {
                    transactionData: { bookingId: 'recent1' },
                    queuedAt: now - 5 * 24 * 60 * 60 * 1000,
                },
                {
                    transactionData: { bookingId: 'recent2' },
                    queuedAt: now - 10 * 24 * 60 * 60 * 1000,
                },
            ];

            vi.mocked(redis.lrange).mockResolvedValue(
                entries.map(entry => JSON.stringify(entry))
            );

            await manager.cleanup(30);

            expect(redis.lrem).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Cleaned up 0 old entries');
        });
    });
}); 