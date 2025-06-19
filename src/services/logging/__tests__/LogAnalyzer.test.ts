import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { Redis } from '@upstash/redis';
import { LogAnalyzer } from '../LogAnalyzer';
import { LogSeverity } from '../SecurityLogger';
import { SecurityEventTypes } from '../SecurityEventTypes';

vi.mock('@upstash/redis');

type MockRedis = {
    [K in keyof Redis]: MockInstance;
};

describe('LogAnalyzer', () => {
    let analyzer: LogAnalyzer;
    let mockRedis: MockRedis;

    beforeEach(() => {
        mockRedis = {
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue('OK'),
            zrange: vi.fn().mockResolvedValue([]),
            zadd: vi.fn().mockResolvedValue(1),
            zremrangebyscore: vi.fn().mockResolvedValue(1)
        } as unknown as MockRedis;

        analyzer = new LogAnalyzer(mockRedis as unknown as Redis);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('analyzeLoginAttempts', () => {
        it('should detect excessive login attempts from same IP', async () => {
            const mockLogs = [
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.1', userId: 'user1' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.1', userId: 'user2' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.1', userId: 'user3' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.1', userId: 'user4' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.1', userId: 'user5' }
                }
            ];

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce(
                mockLogs.map(log => JSON.stringify(log))
            );

            const results = await analyzer.analyzeLoginAttempts();

            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('excessive_login_attempts_ip');
            expect(results[0].metadata.ip).toBe('192.168.1.1');
            expect(results[0].metadata.attemptCount).toBe(5);
        });

        it('should detect excessive login attempts from same user', async () => {
            const mockLogs = [
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.1', userId: 'user1' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.2', userId: 'user1' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.3', userId: 'user1' }
                }
            ];

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce(
                mockLogs.map(log => JSON.stringify(log))
            );

            const results = await analyzer.analyzeLoginAttempts();

            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('excessive_login_attempts_user');
            expect(results[0].metadata.userId).toBe('user1');
            expect(results[0].metadata.attemptCount).toBe(3);
        });
    });

    describe('analyzePaymentPatterns', () => {
        it('should detect high payment frequency from same user', async () => {
            const mockLogs = [
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.INFO,
                    eventType: 'payment.success',
                    message: 'Payment successful',
                    metadata: { userId: 'user1', amount: 1000 }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.INFO,
                    eventType: 'payment.success',
                    message: 'Payment successful',
                    metadata: { userId: 'user1', amount: 2000 }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.INFO,
                    eventType: 'payment.success',
                    message: 'Payment successful',
                    metadata: { userId: 'user1', amount: 3000 }
                }
            ];

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce(
                mockLogs.map(log => JSON.stringify(log))
            );

            const results = await analyzer.analyzePaymentPatterns();

            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('high_payment_frequency_user');
            expect(results[0].metadata.userId).toBe('user1');
            expect(results[0].metadata.paymentCount).toBe(3);
        });

        it('should detect multiple suspicious transactions', async () => {
            const mockLogs = [
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.SUSPICIOUS_TRANSACTION,
                    message: 'Suspicious transaction detected',
                    metadata: { userId: 'user1', amount: 10000 }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.SUSPICIOUS_TRANSACTION,
                    message: 'Suspicious transaction detected',
                    metadata: { userId: 'user2', amount: 20000 }
                }
            ];

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce(
                mockLogs.map(log => JSON.stringify(log))
            );

            const results = await analyzer.analyzePaymentPatterns();

            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('multiple_suspicious_transactions');
            expect(results[0].metadata.suspiciousCount).toBe(2);
            expect(results[0].metadata.totalAmount).toBe(30000);
        });
    });

    describe('analyzeRateLimiting', () => {
        it('should detect repeated rate limit violations', async () => {
            const mockLogs = [
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.RATE_LIMIT_EXCEEDED,
                    message: 'Rate limit exceeded',
                    metadata: { ip: '192.168.1.1' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.RATE_LIMIT_EXCEEDED,
                    message: 'Rate limit exceeded',
                    metadata: { ip: '192.168.1.1' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.RATE_LIMIT_EXCEEDED,
                    message: 'Rate limit exceeded',
                    metadata: { ip: '192.168.1.1' }
                }
            ];

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce(
                mockLogs.map(log => JSON.stringify(log))
            );

            const results = await analyzer.analyzeRateLimiting();

            expect(results).toHaveLength(1);
            expect(results[0].type).toBe('repeated_rate_limit_violations');
            expect(results[0].metadata.ip).toBe('192.168.1.1');
            expect(results[0].metadata.exceededCount).toBe(3);
        });
    });

    describe('getSecurityInsights', () => {
        it('should provide comprehensive security insights', async () => {
            const mockLogs = [
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.WARNING,
                    eventType: SecurityEventTypes.LOGIN_FAILURE,
                    message: 'Login failed',
                    metadata: { ip: '192.168.1.1', userId: 'user1' }
                },
                {
                    timestamp: Date.now(),
                    severity: LogSeverity.INFO,
                    eventType: SecurityEventTypes.LOGIN_SUCCESS,
                    message: 'Login successful',
                    metadata: { ip: '192.168.1.1', userId: 'user1' }
                }
            ];

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce(
                mockLogs.map(log => JSON.stringify(log))
            );

            const insights = await analyzer.getSecurityInsights();

            expect(insights).toHaveProperty('totalEvents', 2);
            expect(insights).toHaveProperty('severityDistribution');
            expect(insights).toHaveProperty('topEventTypes');
            expect(insights).toHaveProperty('topIPs');
            expect(insights).toHaveProperty('topUsers');
            expect(insights).toHaveProperty('riskFactors');
            expect(insights).toHaveProperty('timeBasedPatterns');
        });
    });

    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            (mockRedis.zrange as MockInstance).mockRejectedValueOnce(new Error('Redis error'));

            await expect(analyzer.analyzeLoginAttempts()).rejects.toThrow('Failed to retrieve logs by time range');
        });
    });
}); 