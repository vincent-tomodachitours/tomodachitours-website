import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Common validation schemas
const emailSchema = z.string().email()
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/)
const nameSchema = z.string().min(1).max(100).regex(/^[a-zA-Z\s-']+$/)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
const countSchema = z.number().int().min(0).max(99)
const priceSchema = z.number().int().min(0).max(1000000)
const idSchema = z.number().int().positive()
const statusSchema = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'])
const discountCodeSchema = z.string().max(50).nullable().optional()

// Booking validation schema
export const bookingSchema = z.object({
    customer_name: nameSchema,
    customer_email: emailSchema,
    customer_phone: phoneSchema,
    booking_date: dateSchema,
    booking_time: timeSchema,
    adults: countSchema,
    children: countSchema,
    infants: countSchema.optional(),
    tour_type: z.string(),
    tour_price: priceSchema,
    discount_code: discountCodeSchema,
})

// Payment validation schema
export const paymentSchema = z.object({
    token: z.string(),
    amount: priceSchema,
    bookingId: idSchema,
    discountCode: discountCodeSchema,
    originalAmount: priceSchema.optional(),
})

// Refund validation schema
export const refundSchema = z.object({
    bookingId: idSchema, // Using idSchema (number) instead of UUID string
    email: z.string().email()
})

// Charge validation schema
export const chargeSchema = z.object({
    tourId: z.string().uuid(),
    tourType: z.string(),
    tourDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tourTime: z.string().regex(/^\d{2}:\d{2}$/),
    adults: z.number().int().min(1),
    children: z.number().int().min(0),
    infants: z.number().int().min(0),
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().optional(),
    discountCode: z.string().optional(),
    paymentToken: z.string(),
    totalAmount: z.number().int().positive(),
    currency: z.enum(['JPY']),
    language: z.enum(['en', 'ja']).optional(),
    specialRequests: z.string().optional()
})

// Notification validation schema
export const notificationSchema = z.object({
    to: z.string().email(),
    templateId: z.string(),
    templateData: z.record(z.any())
})

// Security headers
export const addSecurityHeaders = (headers: Headers): Headers => {
    // Content type protection
    headers.set('X-Content-Type-Options', 'nosniff');

    // Frame protection
    headers.set('X-Frame-Options', 'DENY');

    // XSS protection
    headers.set('X-XSS-Protection', '1; mode=block');

    // HTTPS enforcement
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Content Security Policy
    headers.set('Content-Security-Policy', [
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
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy (replaces Feature-Policy)
    headers.set('Permissions-Policy', [
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
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Resource-Policy', 'same-site');

    return headers;
}

// Sanitize sensitive data from output
export const sanitizeOutput = (data: any): any => {
    if (!data) return data;
    const sensitiveFields = ['secret', 'key', 'password', 'token', 'cardNumber'];

    if (Array.isArray(data)) {
        return data.map(item => sanitizeOutput(item));
    }

    if (typeof data === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (!sensitiveFields.includes(key)) {
                sanitized[key] = sanitizeOutput(value);
            }
        }
        return sanitized;
    }

    return data;
}

// Validate request data against schema
export async function validateRequest<T>(
    req: Request,
    schema: z.Schema<T>
): Promise<{ data: T | null; error: string | null }> {
    try {
        const body = await req.json()
        const result = schema.safeParse(body)

        if (!result.success) {
            return {
                data: null,
                error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            }
        }

        return {
            data: result.data,
            error: null
        }
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to parse request body'
        }
    }
}

