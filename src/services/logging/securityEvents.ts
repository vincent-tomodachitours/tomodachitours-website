import { Redis } from '@upstash/redis';
import { SecurityLogger } from './SecurityLogger';
import { LoggerConfig, LogOptions, LogSeverity } from './types';

// Security event types
export const SecurityEventTypes = {
    // Authentication events
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILURE: 'auth.login.failure',
    LOGOUT: 'auth.logout',
    PASSWORD_RESET_REQUEST: 'auth.password.reset.request',
    PASSWORD_RESET_SUCCESS: 'auth.password.reset.success',
    MFA_ENABLED: 'auth.mfa.enabled',
    MFA_DISABLED: 'auth.mfa.disabled',

    // Access control events
    ACCESS_DENIED: 'access.denied',
    PERMISSION_CHANGE: 'access.permission.change',
    ROLE_CHANGE: 'access.role.change',

    // Rate limiting events
    RATE_LIMIT_WARNING: 'rate.limit.warning',
    RATE_LIMIT_EXCEEDED: 'rate.limit.exceeded',
    IP_BLOCKED: 'rate.limit.ip.blocked',

    // Suspicious activity events
    SUSPICIOUS_LOGIN_ATTEMPT: 'security.suspicious.login',
    SUSPICIOUS_TRANSACTION: 'security.suspicious.transaction',
    BLACKLIST_ADDED: 'security.blacklist.added',
    BLACKLIST_REMOVED: 'security.blacklist.removed',

    // Payment security events
    PAYMENT_SUSPICIOUS: 'payment.suspicious',
    PAYMENT_BLOCKED: 'payment.blocked',
    PAYMENT_REVIEW_REQUIRED: 'payment.review.required',
    PAYMENT_REFUNDED: 'payment.refunded',

    // System events
    CONFIG_CHANGE: 'system.config.change',
    SECURITY_SCAN: 'system.security.scan',
    ERROR: 'system.error'
} as const;

export type SecurityEventType = typeof SecurityEventTypes[keyof typeof SecurityEventTypes];

// Default configuration values
const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_MAX_LOGS_PER_TYPE = 10000;

let logger: SecurityLogger | null = null;

/**
 * Reset the security logger (for testing purposes)
 */
export function resetSecurityLogger(): void {
    logger = null;
}

/**
 * Initialize the security logger
 */
export function initializeSecurityLogger(
    redis: Redis,
    environment: 'development' | 'staging' | 'production',
    config: Partial<Omit<LoggerConfig, 'redis' | 'environment'>> = {}
): SecurityLogger {
    if (!logger) {
        const loggerConfig = {
            redis,
            environment,
            retentionDays: config.retentionDays ?? DEFAULT_RETENTION_DAYS,
            maxLogsPerType: config.maxLogsPerType ?? DEFAULT_MAX_LOGS_PER_TYPE
        };
        logger = new SecurityLogger(loggerConfig);
    }
    return logger;
}

/**
 * Get the security logger instance
 */
export function getSecurityLogger(): SecurityLogger {
    if (!logger) {
        throw new Error('Security logger not initialized. Call initializeSecurityLogger first.');
    }
    return logger;
}

/**
 * Helper function to log security events with consistent structure
 */
export async function logSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, unknown>,
    options: LogOptions = {}
): Promise<void> {
    const securityLogger = getSecurityLogger();

    // Determine severity based on event type
    const severity = getSeverityForEvent(eventType);

    // Add event type to tags if not present
    const tags = options.tags || [];
    if (!tags.includes(eventType)) {
        tags.push(eventType);
    }

    await securityLogger.log(severity, eventType, JSON.stringify(details), {
        ...options,
        ...details,
        tags
    });
}

/**
 * Helper function to determine severity based on event type
 */
function getSeverityForEvent(eventType: SecurityEventType): LogSeverity {
    if (eventType.startsWith('system.error')) {
        return LogSeverity.ERROR;
    }

    if (
        eventType.startsWith('security.suspicious') ||
        eventType.startsWith('payment.suspicious') ||
        eventType === SecurityEventTypes.PAYMENT_REVIEW_REQUIRED
    ) {
        return LogSeverity.WARNING;
    }

    if (
        eventType.includes('.blocked') ||
        eventType.includes('.denied') ||
        eventType === SecurityEventTypes.PAYMENT_BLOCKED
    ) {
        return LogSeverity.ERROR;
    }

    if (eventType.includes('.failure')) {
        return LogSeverity.WARNING;
    }

    return LogSeverity.INFO;
} 