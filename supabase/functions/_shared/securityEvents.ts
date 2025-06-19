// Security event types
export const SecurityEventTypes = {
    // Rate limiting events
    RATE_LIMIT_WARNING: 'rate.limit.warning',
    RATE_LIMIT_EXCEEDED: 'rate.limit.exceeded',
    IP_BLOCKED: 'rate.limit.ip.blocked',
    ERROR: 'system.error'
} as const;

export type SecurityEventType = typeof SecurityEventTypes[keyof typeof SecurityEventTypes];

/**
 * Helper function to log security events with consistent structure
 */
export async function logSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, unknown>,
    options: { ip?: string; tags?: string[] } = {}
): Promise<void> {
    // For now, just log to console in Edge Functions
    console.log(JSON.stringify({
        type: eventType,
        details,
        ip: options.ip,
        tags: options.tags,
        timestamp: new Date().toISOString()
    }));
} 