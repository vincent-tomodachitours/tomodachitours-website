import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Redis } from '@upstash/redis';
import {
    SecurityEventTypes,
    initializeSecurityLogger,
    getSecurityLogger,
    logSecurityEvent,
    resetSecurityLogger
} from '../securityEvents';
import { SecurityLogger, LogSeverity } from '../SecurityLogger';

// Mock Redis client
vi.mock('@upstash/redis', () => ({
    Redis: vi.fn().mockImplementation(() => ({
        xadd: vi.fn().mockResolvedValue(true),
        lpush: vi.fn().mockResolvedValue(true),
        ltrim: vi.fn().mockResolvedValue(true),
        lrange: vi.fn().mockResolvedValue([]),
        xrange: vi.fn().mockResolvedValue([]),
        hgetall: vi.fn().mockResolvedValue({}),
        hincrby: vi.fn().mockResolvedValue(1),
        eval: vi.fn().mockResolvedValue(true)
    }))
}));

// Mock SecurityLogger
vi.mock('../SecurityLogger');

describe('Security Events', () => {
    let redis: Redis;

    beforeEach(() => {
        redis = new Redis({} as any);
        vi.clearAllMocks();
        resetSecurityLogger();
    });

    afterEach(() => {
        resetSecurityLogger();
    });

    describe('initializeSecurityLogger', () => {
        it('should create a new logger instance with default config', () => {
            const logger = initializeSecurityLogger(redis, 'development');

            expect(SecurityLogger).toHaveBeenCalledWith({
                redis,
                environment: 'development',
                retentionDays: 90,
                maxLogsPerType: 10000
            });
            expect(logger).toBeDefined();
        });

        it('should create a new logger instance with custom config', () => {
            const config = {
                retentionDays: 30,
                maxLogsPerType: 5000
            };

            const logger = initializeSecurityLogger(redis, 'production', config);

            expect(SecurityLogger).toHaveBeenCalledWith({
                redis,
                environment: 'production',
                ...config
            });
            expect(logger).toBeDefined();
        });

        it('should reuse existing logger instance', () => {
            const logger1 = initializeSecurityLogger(redis, 'development');
            const logger2 = initializeSecurityLogger(redis, 'development');

            expect(SecurityLogger).toHaveBeenCalledTimes(1);
            expect(logger1).toBe(logger2);
        });
    });

    describe('getSecurityLogger', () => {
        it('should throw error if logger is not initialized', () => {
            expect(() => getSecurityLogger()).toThrow(
                'Security logger not initialized'
            );
        });

        it('should return initialized logger', () => {
            const logger = initializeSecurityLogger(redis, 'development');
            expect(getSecurityLogger()).toBe(logger);
        });
    });

    describe('logSecurityEvent', () => {
        beforeEach(() => {
            initializeSecurityLogger(redis, 'development');
        });

        it('should log authentication events with correct severity', async () => {
            const logger = getSecurityLogger();
            const details = { userId: '123', ip: '127.0.0.1' };

            await logSecurityEvent(SecurityEventTypes.LOGIN_SUCCESS, details);
            expect(logger.log).toHaveBeenCalledWith(
                LogSeverity.INFO,
                SecurityEventTypes.LOGIN_SUCCESS,
                details,
                expect.objectContaining({
                    tags: [SecurityEventTypes.LOGIN_SUCCESS]
                })
            );

            await logSecurityEvent(SecurityEventTypes.LOGIN_FAILURE, details);
            expect(logger.log).toHaveBeenCalledWith(
                LogSeverity.WARNING,
                SecurityEventTypes.LOGIN_FAILURE,
                details,
                expect.objectContaining({
                    tags: [SecurityEventTypes.LOGIN_FAILURE]
                })
            );
        });

        it('should log suspicious events with warn severity', async () => {
            const logger = getSecurityLogger();
            const details = { transactionId: '123', amount: 1000 };

            await logSecurityEvent(SecurityEventTypes.SUSPICIOUS_TRANSACTION, details);
            expect(logger.log).toHaveBeenCalledWith(
                LogSeverity.WARNING,
                SecurityEventTypes.SUSPICIOUS_TRANSACTION,
                details,
                expect.objectContaining({
                    tags: [SecurityEventTypes.SUSPICIOUS_TRANSACTION]
                })
            );
        });

        it('should log blocked events with error severity', async () => {
            const logger = getSecurityLogger();
            const details = { ip: '127.0.0.1', reason: 'Too many requests' };

            await logSecurityEvent(SecurityEventTypes.IP_BLOCKED, details);
            expect(logger.log).toHaveBeenCalledWith(
                LogSeverity.ERROR,
                SecurityEventTypes.IP_BLOCKED,
                details,
                expect.objectContaining({
                    tags: [SecurityEventTypes.IP_BLOCKED]
                })
            );
        });

        it('should merge custom options with event tags', async () => {
            const logger = getSecurityLogger();
            const details = { userId: '123' };
            const options = {
                correlationId: 'abc-123',
                tags: ['custom-tag']
            };

            await logSecurityEvent(SecurityEventTypes.LOGIN_SUCCESS, details, options);
            expect(logger.log).toHaveBeenCalledWith(
                LogSeverity.INFO,
                SecurityEventTypes.LOGIN_SUCCESS,
                details,
                expect.objectContaining({
                    correlationId: 'abc-123',
                    tags: ['custom-tag', SecurityEventTypes.LOGIN_SUCCESS]
                })
            );
        });
    });
}); 