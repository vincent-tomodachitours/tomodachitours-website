import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { Redis } from '@upstash/redis';
import { SecurityLogger, LogSeverity, SecurityLoggerConfig } from '../SecurityLogger';
import { SecurityEventTypes } from '../securityEvents';

vi.mock('@upstash/redis');

type MockRedis = {
    [K in keyof Redis]: MockInstance;
};

describe('SecurityLogger', () => {
    let logger: SecurityLogger;
    let mockRedis: MockRedis;

    beforeEach(() => {
        // Create mock Redis client with proper types
        mockRedis = {
            zadd: vi.fn().mockResolvedValue(1),
            zremrangebyscore: vi.fn().mockResolvedValue(1),
            lpush: vi.fn().mockResolvedValue(1),
            ltrim: vi.fn().mockResolvedValue('OK'),
            zrange: vi.fn().mockResolvedValue([]),
            lrange: vi.fn().mockResolvedValue([])
        } as unknown as MockRedis;

        const config: SecurityLoggerConfig = {
            redis: mockRedis as unknown as Redis,
            logKey: 'test_security_logs',
            criticalEventsKey: 'test_critical_events',
            retentionDays: 7
        };

        logger = new SecurityLogger(config);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('log', () => {
        it('should successfully log a security event', async () => {
            const event = {
                severity: LogSeverity.WARNING,
                eventType: SecurityEventTypes.RATE_LIMIT_WARNING,
                message: 'Test warning message',
                metadata: {
                    userId: 'test-user',
                    ip: '127.0.0.1'
                }
            };

            await logger.log(
                event.severity,
                event.eventType,
                event.message,
                event.metadata
            );

            expect(mockRedis.zadd).toHaveBeenCalledWith(
                'test_security_logs',
                expect.objectContaining({
                    score: expect.any(Number),
                    member: expect.stringContaining(event.message)
                })
            );
        });

        it('should include correlation ID when set', async () => {
            const correlationId = 'test-correlation-id';
            logger.setCorrelationId(correlationId);

            await logger.log(
                LogSeverity.INFO,
                SecurityEventTypes.LOGIN_SUCCESS,
                'Test message',
                { userId: 'test-user' }
            );

            expect(mockRedis.zadd).toHaveBeenCalledWith(
                'test_security_logs',
                expect.objectContaining({
                    member: expect.stringContaining(correlationId)
                })
            );
        });

        it('should store critical events in a separate list', async () => {
            await logger.critical(
                SecurityEventTypes.PAYMENT_BLOCKED,
                'Critical security event',
                { userId: 'test-user' }
            );

            expect(mockRedis.lpush).toHaveBeenCalledWith(
                'test_critical_events',
                expect.stringContaining('Critical security event')
            );
            expect(mockRedis.ltrim).toHaveBeenCalledWith(
                'test_critical_events',
                0,
                999
            );
        });
    });

    describe('convenience methods', () => {
        const testCases = [
            {
                method: 'info',
                severity: LogSeverity.INFO,
                eventType: SecurityEventTypes.LOGIN_SUCCESS
            },
            {
                method: 'warning',
                severity: LogSeverity.WARNING,
                eventType: SecurityEventTypes.RATE_LIMIT_WARNING
            },
            {
                method: 'error',
                severity: LogSeverity.ERROR,
                eventType: SecurityEventTypes.ACCESS_DENIED
            },
            {
                method: 'critical',
                severity: LogSeverity.CRITICAL,
                eventType: SecurityEventTypes.PAYMENT_BLOCKED
            }
        ];

        testCases.forEach(({ method, severity: _severity, eventType }) => {
            it(`should correctly log ${method} level events`, async () => {
                const message = `Test ${method} message`;
                const metadata = { test: 'data' };

                await (logger as any)[method](eventType, message, metadata);

                expect(mockRedis.zadd).toHaveBeenCalledWith(
                    'test_security_logs',
                    expect.objectContaining({
                        member: expect.stringContaining(message)
                    })
                );
            });
        });
    });

    describe('getLogsByTimeRange', () => {
        it('should retrieve logs within the specified time range', async () => {
            const startTime = Date.now() - 3600000; // 1 hour ago
            const endTime = Date.now();
            const mockLog = {
                timestamp: Date.now(),
                severity: LogSeverity.WARNING,
                eventType: SecurityEventTypes.RATE_LIMIT_WARNING,
                message: 'Test message',
                metadata: { test: 'data' }
            };

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce([JSON.stringify(mockLog)]);

            const logs = await logger.getLogsByTimeRange(startTime, endTime);

            expect(mockRedis.zrange).toHaveBeenCalledWith(
                'test_security_logs',
                startTime,
                endTime,
                { byScore: true }
            );
            expect(logs).toHaveLength(1);
            expect(logs[0]).toMatchObject({
                severity: LogSeverity.WARNING,
                eventType: SecurityEventTypes.RATE_LIMIT_WARNING
            });
        });
    });

    describe('getLogsBySeverity', () => {
        it('should retrieve logs by severity level', async () => {
            const mockLog = {
                timestamp: Date.now(),
                severity: LogSeverity.ERROR,
                eventType: SecurityEventTypes.ACCESS_DENIED,
                message: 'Test error',
                metadata: { test: 'data' }
            };

            (mockRedis.zrange as MockInstance).mockResolvedValueOnce([JSON.stringify(mockLog)]);

            const logs = await logger.getLogsBySeverity(LogSeverity.ERROR);

            expect(mockRedis.zrange).toHaveBeenCalledWith(
                'test_security_logs',
                0,
                -1
            );
            expect(logs).toHaveLength(1);
            expect(logs[0].severity).toBe(LogSeverity.ERROR);
        });
    });

    describe('getCriticalEvents', () => {
        it('should retrieve critical events', async () => {
            const mockLog = {
                timestamp: Date.now(),
                severity: LogSeverity.CRITICAL,
                eventType: SecurityEventTypes.PAYMENT_BLOCKED,
                message: 'Critical error',
                metadata: { test: 'data' }
            };

            (mockRedis.lrange as MockInstance).mockResolvedValueOnce([JSON.stringify(mockLog)]);

            const logs = await logger.getCriticalEvents();

            expect(mockRedis.lrange).toHaveBeenCalledWith(
                'test_critical_events',
                0,
                99
            );
            expect(logs).toHaveLength(1);
            expect(logs[0].severity).toBe(LogSeverity.CRITICAL);
        });
    });

    describe('error handling', () => {
        it('should handle Redis errors gracefully', async () => {
            (mockRedis.zadd as MockInstance).mockRejectedValueOnce(new Error('Redis error'));

            await expect(logger.log(
                LogSeverity.INFO,
                SecurityEventTypes.LOGIN_SUCCESS,
                'Test message'
            )).rejects.toThrow('Failed to log security event');
        });
    });
}); 