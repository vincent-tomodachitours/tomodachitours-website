export enum SecurityEventTypes {
    // Authentication Events
    LOGIN_SUCCESS = 'auth.login.success',
    LOGIN_FAILURE = 'auth.login.failure',
    LOGOUT = 'auth.logout',
    PASSWORD_CHANGE = 'auth.password.change',
    PASSWORD_RESET_REQUEST = 'auth.password.reset.request',
    MFA_ENABLED = 'auth.mfa.enabled',
    MFA_DISABLED = 'auth.mfa.disabled',
    MFA_CHALLENGE = 'auth.mfa.challenge',

    // Access Control Events
    ACCESS_DENIED = 'access.denied',
    PERMISSION_CHANGE = 'access.permission.change',
    ROLE_CHANGE = 'access.role.change',

    // Rate Limiting Events
    RATE_LIMIT_WARNING = 'rate.limit.warning',
    RATE_LIMIT_EXCEEDED = 'rate.limit.exceeded',
    IP_BLOCKED = 'rate.limit.ip.blocked',

    // Payment Security Events
    PAYMENT_ATTEMPT = 'payment.attempt',
    PAYMENT_SUCCESS = 'payment.success',
    PAYMENT_FAILURE = 'payment.failure',
    PAYMENT_BLOCKED = 'payment.blocked',
    SUSPICIOUS_TRANSACTION = 'payment.suspicious',
    REFUND_ATTEMPT = 'payment.refund.attempt',
    REFUND_SUCCESS = 'payment.refund.success',
    REFUND_FAILURE = 'payment.refund.failure',

    // System Events
    CONFIG_CHANGE = 'system.config.change',
    API_KEY_GENERATED = 'system.api_key.generated',
    API_KEY_REVOKED = 'system.api_key.revoked',
    SYSTEM_ERROR = 'system.error',

    // Data Access Events
    SENSITIVE_DATA_ACCESS = 'data.sensitive.access',
    BULK_DATA_EXPORT = 'data.bulk.export',
    DATA_MODIFICATION = 'data.modification',

    // User Management Events
    USER_CREATED = 'user.created',
    USER_UPDATED = 'user.updated',
    USER_DELETED = 'user.deleted',
    USER_LOCKED = 'user.locked',
    USER_UNLOCKED = 'user.unlocked',

    // Tour Booking Events
    TOUR_BOOKING_ATTEMPT = 'tour.booking.attempt',
    TOUR_BOOKING_SUCCESS = 'tour.booking.success',
    TOUR_BOOKING_FAILURE = 'tour.booking.failure',
    TOUR_CANCELLATION = 'tour.cancellation',
    TOUR_MODIFICATION = 'tour.modification'
} 