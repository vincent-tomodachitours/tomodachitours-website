import { Redis } from '@upstash/redis';
import { SecurityLogEntry, LogSeverity } from './SecurityLogger';
import { SecurityEventTypes } from './SecurityEventTypes';

interface AnalysisResult {
    timestamp: number;
    type: string;
    description: string;
    severity: LogSeverity;
    relatedEvents: SecurityLogEntry[];
    metadata: Record<string, any>;
}

interface PatternConfig {
    timeWindowMs: number;
    threshold: number;
    severity: LogSeverity;
}

export class LogAnalyzer {
    private readonly redis: Redis;
    private readonly LOG_KEY = 'security_logs';
    private readonly ANALYSIS_CACHE_KEY = 'security_analysis:';
    private readonly CACHE_TTL = 3600; // 1 hour

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async analyzeLoginAttempts(timeWindowMs: number = 3600000): Promise<AnalysisResult[]> {
        const endTime = Date.now();
        const startTime = endTime - timeWindowMs;

        const logs = await this.getLogsInTimeRange(startTime, endTime);
        const results: AnalysisResult[] = [];

        // Group login attempts by IP and user
        const attemptsByIP: Record<string, SecurityLogEntry[]> = {};
        const attemptsByUser: Record<string, SecurityLogEntry[]> = {};

        logs.forEach(log => {
            if (log.eventType === SecurityEventTypes.LOGIN_FAILURE) {
                const ip = log.metadata.ip;
                const userId = log.metadata.userId;

                if (ip) {
                    attemptsByIP[ip] = attemptsByIP[ip] || [];
                    attemptsByIP[ip].push(log);
                }

                if (userId) {
                    attemptsByUser[userId] = attemptsByUser[userId] || [];
                    attemptsByUser[userId].push(log);
                }
            }
        });

        // Analyze patterns
        Object.entries(attemptsByIP).forEach(([ip, attempts]) => {
            if (attempts.length >= 5) {
                results.push({
                    timestamp: Date.now(),
                    type: 'excessive_login_attempts_ip',
                    description: `Multiple failed login attempts from IP: ${ip}`,
                    severity: LogSeverity.WARNING,
                    relatedEvents: attempts,
                    metadata: { ip, attemptCount: attempts.length }
                });
            }
        });

        Object.entries(attemptsByUser).forEach(([userId, attempts]) => {
            if (attempts.length >= 3) {
                results.push({
                    timestamp: Date.now(),
                    type: 'excessive_login_attempts_user',
                    description: `Multiple failed login attempts for user: ${userId}`,
                    severity: LogSeverity.WARNING,
                    relatedEvents: attempts,
                    metadata: { userId, attemptCount: attempts.length }
                });
            }
        });

        return results;
    }

    async analyzePaymentPatterns(timeWindowMs: number = 3600000): Promise<AnalysisResult[]> {
        const endTime = Date.now();
        const startTime = endTime - timeWindowMs;

        const logs = await this.getLogsInTimeRange(startTime, endTime);
        const results: AnalysisResult[] = [];

        // Group payment events by user and IP
        const paymentsByUser: Record<string, SecurityLogEntry[]> = {};
        const paymentsByIP: Record<string, SecurityLogEntry[]> = {};
        let totalAmount = 0;
        let suspiciousCount = 0;

        logs.forEach(log => {
            if (log.eventType.startsWith('payment.')) {
                const userId = log.metadata.userId;
                const ip = log.metadata.ip;
                const amount = log.metadata.amount || 0;

                if (userId) {
                    paymentsByUser[userId] = paymentsByUser[userId] || [];
                    paymentsByUser[userId].push(log);
                }

                if (ip) {
                    paymentsByIP[ip] = paymentsByIP[ip] || [];
                    paymentsByIP[ip].push(log);
                }

                totalAmount += amount;
                if (log.eventType === SecurityEventTypes.SUSPICIOUS_TRANSACTION) {
                    suspiciousCount++;
                }
            }
        });

        // Analyze patterns
        Object.entries(paymentsByUser).forEach(([userId, payments]) => {
            if (payments.length >= 3) {
                results.push({
                    timestamp: Date.now(),
                    type: 'high_payment_frequency_user',
                    description: `High payment frequency for user: ${userId}`,
                    severity: LogSeverity.WARNING,
                    relatedEvents: payments,
                    metadata: { userId, paymentCount: payments.length }
                });
            }
        });

        if (suspiciousCount >= 2) {
            results.push({
                timestamp: Date.now(),
                type: 'multiple_suspicious_transactions',
                description: 'Multiple suspicious transactions detected',
                severity: LogSeverity.ERROR,
                relatedEvents: logs.filter(log => log.eventType === SecurityEventTypes.SUSPICIOUS_TRANSACTION),
                metadata: { suspiciousCount, totalAmount }
            });
        }

        return results;
    }

    async analyzeRateLimiting(timeWindowMs: number = 3600000): Promise<AnalysisResult[]> {
        const endTime = Date.now();
        const startTime = endTime - timeWindowMs;

        const logs = await this.getLogsInTimeRange(startTime, endTime);
        const results: AnalysisResult[] = [];

        // Group rate limit events by IP
        const limitsByIP: Record<string, SecurityLogEntry[]> = {};

        logs.forEach(log => {
            if (log.eventType.startsWith('rate.limit.')) {
                const ip = log.metadata.ip;
                if (ip) {
                    limitsByIP[ip] = limitsByIP[ip] || [];
                    limitsByIP[ip].push(log);
                }
            }
        });

        // Analyze patterns
        Object.entries(limitsByIP).forEach(([ip, events]) => {
            const exceededCount = events.filter(e => e.eventType === SecurityEventTypes.RATE_LIMIT_EXCEEDED).length;

            if (exceededCount >= 3) {
                results.push({
                    timestamp: Date.now(),
                    type: 'repeated_rate_limit_violations',
                    description: `Repeated rate limit violations from IP: ${ip}`,
                    severity: LogSeverity.ERROR,
                    relatedEvents: events,
                    metadata: { ip, exceededCount }
                });
            }
        });

        return results;
    }

    private async getLogsInTimeRange(startTime: number, endTime: number): Promise<SecurityLogEntry[]> {
        try {
            const cacheKey = `${this.ANALYSIS_CACHE_KEY}${startTime}:${endTime}`;

            // Try to get from cache first
            const cached = await this.redis.get<string>(cacheKey);
            if (cached) {
                return JSON.parse(cached) as SecurityLogEntry[];
            }

            // Get from main log storage
            const logs = await this.redis.zrange(
                this.LOG_KEY,
                startTime,
                endTime,
                { byScore: true }
            );

            const parsedLogs = logs.map(log => JSON.parse(log as string) as SecurityLogEntry);

            // Cache the result
            await this.redis.set(cacheKey, JSON.stringify(parsedLogs), {
                ex: this.CACHE_TTL
            });

            return parsedLogs;
        } catch (error) {
            console.error('Failed to retrieve logs by time range:', error);
            throw new Error('Failed to retrieve logs by time range');
        }
    }

    async getSecurityInsights(timeWindowMs: number = 86400000): Promise<Record<string, any>> {
        const endTime = Date.now();
        const startTime = endTime - timeWindowMs;

        const logs = await this.getLogsInTimeRange(startTime, endTime);

        return {
            totalEvents: logs.length,
            severityDistribution: this.calculateSeverityDistribution(logs),
            topEventTypes: this.getTopEventTypes(logs),
            topIPs: this.getTopIPs(logs),
            topUsers: this.getTopUsers(logs),
            riskFactors: await this.calculateRiskFactors(logs),
            timeBasedPatterns: this.analyzeTimeBasedPatterns(logs)
        };
    }

    private calculateSeverityDistribution(logs: SecurityLogEntry[]): Record<LogSeverity, number> {
        return logs.reduce((acc, log) => {
            acc[log.severity] = (acc[log.severity] || 0) + 1;
            return acc;
        }, {} as Record<LogSeverity, number>);
    }

    private getTopEventTypes(logs: SecurityLogEntry[], limit: number = 10): Array<{ type: string, count: number }> {
        const counts = logs.reduce((acc, log) => {
            acc[log.eventType] = (acc[log.eventType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    private getTopIPs(logs: SecurityLogEntry[], limit: number = 10): Array<{ ip: string, count: number }> {
        const counts = logs.reduce((acc, log) => {
            const ip = log.metadata.ip;
            if (ip) {
                acc[ip] = (acc[ip] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([ip, count]) => ({ ip, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    private getTopUsers(logs: SecurityLogEntry[], limit: number = 10): Array<{ userId: string, count: number }> {
        const counts = logs.reduce((acc, log) => {
            const userId = log.metadata.userId;
            if (userId) {
                acc[userId] = (acc[userId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    private async calculateRiskFactors(logs: SecurityLogEntry[]): Promise<Array<{ factor: string, score: number }>> {
        const riskFactors = [
            {
                factor: 'Failed Authentication',
                score: this.calculateAuthFailureRisk(logs)
            },
            {
                factor: 'Suspicious Transactions',
                score: this.calculateTransactionRisk(logs)
            },
            {
                factor: 'Rate Limiting',
                score: this.calculateRateLimitRisk(logs)
            },
            {
                factor: 'Access Control',
                score: this.calculateAccessControlRisk(logs)
            }
        ];

        return riskFactors.sort((a, b) => b.score - a.score);
    }

    private calculateAuthFailureRisk(logs: SecurityLogEntry[]): number {
        const authFailures = logs.filter(log => log.eventType === SecurityEventTypes.LOGIN_FAILURE).length;
        const totalAuth = logs.filter(log =>
            log.eventType === SecurityEventTypes.LOGIN_SUCCESS ||
            log.eventType === SecurityEventTypes.LOGIN_FAILURE
        ).length;

        return totalAuth === 0 ? 0 : (authFailures / totalAuth) * 100;
    }

    private calculateTransactionRisk(logs: SecurityLogEntry[]): number {
        const suspicious = logs.filter(log => log.eventType === SecurityEventTypes.SUSPICIOUS_TRANSACTION).length;
        const total = logs.filter(log => log.eventType.startsWith('payment.')).length;

        return total === 0 ? 0 : (suspicious / total) * 100;
    }

    private calculateRateLimitRisk(logs: SecurityLogEntry[]): number {
        const violations = logs.filter(log => log.eventType === SecurityEventTypes.RATE_LIMIT_EXCEEDED).length;
        return Math.min(violations * 10, 100); // 10 points per violation, max 100
    }

    private calculateAccessControlRisk(logs: SecurityLogEntry[]): number {
        const violations = logs.filter(log => log.eventType === SecurityEventTypes.ACCESS_DENIED).length;
        return Math.min(violations * 15, 100); // 15 points per violation, max 100
    }

    private analyzeTimeBasedPatterns(logs: SecurityLogEntry[]): Record<string, any> {
        const hourlyDistribution: number[] = new Array(24).fill(0);
        const dayOfWeekDistribution: number[] = new Array(7).fill(0);

        logs.forEach(log => {
            const date = new Date(log.timestamp);
            hourlyDistribution[date.getUTCHours()]++;
            dayOfWeekDistribution[date.getUTCDay()]++;
        });

        return {
            hourlyDistribution,
            dayOfWeekDistribution,
            peakHour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution)),
            peakDay: dayOfWeekDistribution.indexOf(Math.max(...dayOfWeekDistribution))
        };
    }
} 