import { Request, Response, NextFunction } from 'express';
import { SecurityLogger } from './logging/SecurityLogger';
// import { SecurityEventTypes } from './logging/SecurityEventTypes'; // Unused import removed

interface SecurityMiddlewareConfig {
    logger?: SecurityLogger;
    enableSanitization?: boolean;
    enableSecurityHeaders?: boolean;
    enableRateLimitLogging?: boolean;
}

export class SecurityMiddleware {
    private readonly logger?: SecurityLogger;
    private readonly config: SecurityMiddlewareConfig;

    constructor(config: SecurityMiddlewareConfig = {}) {
        this.config = {
            enableSanitization: true,
            enableSecurityHeaders: true,
            enableRateLimitLogging: true,
            ...config
        };
        this.logger = config.logger;
    }

    // Request sanitization middleware
    sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
        if (!this.config.enableSanitization) {
            return next();
        }

        try {
            // Sanitize request body
            if (req.body && typeof req.body === 'object') {
                req.body = this.sanitizeInput(req.body);
            }

            // Sanitize query parameters
            if (req.query && typeof req.query === 'object') {
                req.query = this.sanitizeInput(req.query);
            }

            // Sanitize headers (remove potential XSS vectors)
            const dangerousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
            dangerousHeaders.forEach(header => {
                if (req.headers[header]) {
                    delete req.headers[header];
                }
            });

            next();
        } catch (error) {
            this.logSecurityEvent('REQUEST_SANITIZATION_ERROR', {
                error: error instanceof Error ? error.message : 'Unknown error',
                path: req.path,
                method: req.method
            }, req);

            res.status(400).json({ error: 'Invalid request data' });
        }
    };

    // Response sanitization middleware
    sanitizeResponse = (_req: Request, res: Response, next: NextFunction): void => {
        if (!this.config.enableSanitization) {
            return next();
        }

        // Override res.json to sanitize responses
        const originalJson = res.json.bind(res);
        res.json = (data: any) => {
            const sanitizedData = this.sanitizeOutput(data);
            return originalJson(sanitizedData);
        };

        next();
    };

    // Security headers middleware
    addSecurityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
        if (!this.config.enableSecurityHeaders) {
            return next();
        }

        // Content type protection
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Frame protection
        res.setHeader('X-Frame-Options', 'DENY');

        // XSS protection
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // HTTPS enforcement
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

        // Content Security Policy
        res.setHeader('Content-Security-Policy', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pay.jp",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.pay.jp",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; '));

        // Referrer policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions policy
        res.setHeader('Permissions-Policy', [
            "camera=()",
            "microphone=()",
            "geolocation=()",
            "payment=(self)",
            "usb=()",
            "magnetometer=()",
            "accelerometer=()",
            "gyroscope=()"
        ].join(', '));

        // Additional security headers
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

        next();
    };

    // Security event logging middleware
    logSecurityEvent = async (
        eventType: string,
        details: Record<string, unknown>,
        req: Request
    ): Promise<void> => {
        if (!this.logger) return;

        const metadata = {
            ip: this.getClientIP(req),
            userAgent: req.headers['user-agent'],
            path: req.path,
            method: req.method,
            correlationId: req.headers['x-correlation-id'] as string
        };

        try {
            await this.logger.warning(eventType, JSON.stringify(details), metadata);
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    };

    // Input sanitization
    private sanitizeInput(input: any): any {
        if (typeof input === 'string') {
            return this.sanitizeString(input);
        }

        if (Array.isArray(input)) {
            return input.map(item => this.sanitizeInput(item));
        }

        if (input && typeof input === 'object') {
            const sanitized: Record<string, any> = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[this.sanitizeString(key)] = this.sanitizeInput(value);
            }
            return sanitized;
        }

        return input;
    }

    // String sanitization
    private sanitizeString(str: string): string {
        if (typeof str !== 'string') return str;

        return str
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove SQL injection patterns
            .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)/gi, '')
            // Remove script tags and javascript
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            // Remove event handlers
            .replace(/on\w+\s*=/gi, '')
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Output sanitization
    private sanitizeOutput(data: any): any {
        if (!data) return data;

        const sensitiveFields = [
            'password', 'secret', 'key', 'token', 'cardNumber', 'cvv', 'ssn',
            'socialSecurityNumber', 'bankAccount', 'routingNumber', 'pin'
        ];

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeOutput(item));
        }

        if (typeof data === 'object') {
            const sanitized: Record<string, any> = {};
            for (const [key, value] of Object.entries(data)) {
                const lowerKey = key.toLowerCase();
                const isSensitive = sensitiveFields.some(field =>
                    lowerKey.includes(field.toLowerCase())
                );

                if (!isSensitive) {
                    sanitized[key] = this.sanitizeOutput(value);
                }
            }
            return sanitized;
        }

        return data;
    }

    // Get client IP address
    private getClientIP(req: Request): string {
        return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
            req.headers['x-real-ip'] as string ||
            req.socket.remoteAddress ||
            'unknown';
    }

    // Combined middleware for easy application
    applySecurityMiddleware = () => {
        return [
            this.addSecurityHeaders,
            this.sanitizeRequest,
            this.sanitizeResponse
        ];
    };
} 