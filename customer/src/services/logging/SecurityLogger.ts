import { Redis } from '@upstash/redis';
import { LoggerConfig, LogSeverity } from './types';

export { LogSeverity };

export interface SecurityLogEntry {
    timestamp: number;
    severity: LogSeverity;
    eventType: string;
    message: string;
    metadata: {
        userId?: string;
        ip?: string;
        userAgent?: string;
        correlationId?: string;
        tags?: string[];
        [key: string]: any;
    };
}

export interface SecurityLoggerConfig {
    redis?: Redis;
    logKey?: string;
    criticalEventsKey?: string;
    retentionDays?: number;
    environment?: 'development' | 'staging' | 'production';
}

export class SecurityLogger {
    private readonly redis: Redis;
    private readonly LOG_KEY: string;
    private readonly CRITICAL_EVENTS_KEY: string;
    private readonly RETENTION_DAYS: number;
    private correlationId?: string;

    constructor(redisOrConfig: Redis | SecurityLoggerConfig | LoggerConfig, config: SecurityLoggerConfig = {}) {
        if (redisOrConfig instanceof Redis) {
            this.redis = redisOrConfig;
            this.LOG_KEY = config.logKey || 'security_logs';
            this.CRITICAL_EVENTS_KEY = config.criticalEventsKey || 'critical_security_events';
            this.RETENTION_DAYS = config.retentionDays || 90;
        } else {
            const fullConfig = redisOrConfig as (SecurityLoggerConfig | LoggerConfig);
            this.redis = (fullConfig as LoggerConfig).redis || (fullConfig as SecurityLoggerConfig).redis;
            if (!this.redis) {
                throw new Error('Redis client is required');
            }
            this.LOG_KEY = (fullConfig as SecurityLoggerConfig).logKey || 'security_logs';
            this.CRITICAL_EVENTS_KEY = (fullConfig as SecurityLoggerConfig).criticalEventsKey || 'critical_security_events';
            this.RETENTION_DAYS = fullConfig.retentionDays || 90;
        }
    }

    setCorrelationId(id: string) {
        this.correlationId = id;
    }

    async log(
        severity: LogSeverity,
        eventType: string,
        message: string,
        metadata: Omit<SecurityLogEntry['metadata'], 'correlationId'> = {}
    ): Promise<void> {
        try {
            const entry: SecurityLogEntry = {
                timestamp: Date.now(),
                severity,
                eventType,
                message,
                metadata: {
                    ...metadata,
                    correlationId: this.correlationId
                }
            };

            // Store log in Redis sorted set with timestamp as score
            await this.redis.zadd(this.LOG_KEY, {
                score: entry.timestamp,
                member: JSON.stringify(entry)
            });

            // Cleanup old logs (older than RETENTION_DAYS)
            const cutoff = Date.now() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
            await this.redis.zremrangebyscore(this.LOG_KEY, 0, cutoff);

            // If CRITICAL severity, also store in a separate list for immediate attention
            if (severity === LogSeverity.CRITICAL) {
                await this.redis.lpush(this.CRITICAL_EVENTS_KEY, JSON.stringify(entry));
                // Keep only the latest 1000 critical events
                await this.redis.ltrim(this.CRITICAL_EVENTS_KEY, 0, 999);
            }
        } catch (error) {
            console.error('Failed to log security event:', error);
            throw new Error('Failed to log security event');
        }
    }

    async info(eventType: string, message: string, metadata?: SecurityLogEntry['metadata']): Promise<void> {
        return this.log(LogSeverity.INFO, eventType, message, metadata);
    }

    async warning(eventType: string, message: string, metadata?: SecurityLogEntry['metadata']): Promise<void> {
        return this.log(LogSeverity.WARNING, eventType, message, metadata);
    }

    async error(eventType: string, message: string, metadata?: SecurityLogEntry['metadata']): Promise<void> {
        return this.log(LogSeverity.ERROR, eventType, message, metadata);
    }

    async critical(eventType: string, message: string, metadata?: SecurityLogEntry['metadata']): Promise<void> {
        return this.log(LogSeverity.CRITICAL, eventType, message, metadata);
    }

    async getLogsByTimeRange(startTime: number, endTime: number): Promise<SecurityLogEntry[]> {
        try {
            const logs = await this.redis.zrange(this.LOG_KEY, startTime, endTime, {
                byScore: true
            });
            return logs.map(log => JSON.parse(log as string) as SecurityLogEntry);
        } catch (error) {
            console.error('Failed to retrieve logs by time range:', error);
            throw new Error('Failed to retrieve logs by time range');
        }
    }

    async getLogsBySeverity(severity: LogSeverity, limit: number = 100): Promise<SecurityLogEntry[]> {
        try {
            const logs = await this.redis.zrange(this.LOG_KEY, 0, -1);
            return logs
                .map(log => JSON.parse(log as string) as SecurityLogEntry)
                .filter(entry => entry.severity === severity)
                .slice(0, limit);
        } catch (error) {
            console.error('Failed to retrieve logs by severity:', error);
            throw new Error('Failed to retrieve logs by severity');
        }
    }

    async getCriticalEvents(limit: number = 100): Promise<SecurityLogEntry[]> {
        try {
            const logs = await this.redis.lrange(this.CRITICAL_EVENTS_KEY, 0, limit - 1);
            return logs.map(log => JSON.parse(log as string) as SecurityLogEntry);
        } catch (error) {
            console.error('Failed to retrieve critical events:', error);
            throw new Error('Failed to retrieve critical events');
        }
    }
} 