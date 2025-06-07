import { z } from 'zod'

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
const discountCodeSchema = z.string().max(50).optional()

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
    bookingId: z.string().uuid(),
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

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:;",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

// Add security headers to response
export function addSecurityHeaders(headers: Headers): Headers {
    Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value)
    })
    return headers
}

// Sensitive field patterns to remove
const sensitivePatterns = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'card',
    'cvv',
    'cvc',
    'pin'
]

// Sanitize output data
export function sanitizeOutput(data: any): any {
    if (typeof data !== 'object' || data === null) {
        return data
    }

    const sanitized: any = Array.isArray(data) ? [] : {}

    for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields
        if (sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern))) {
            continue
        }

        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeOutput(value)
        } else {
            sanitized[key] = value
        }
    }

    return sanitized
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

// Rate limiting helper
const rateLimits = new Map<string, { count: number; timestamp: number }>()

export function checkRateLimit(
    ip: string,
    limit: number = 100,
    windowMs: number = 900000 // 15 minutes
): boolean {
    const now = Date.now()
    const record = rateLimits.get(ip)

    // Clean up old records
    if (record && now - record.timestamp > windowMs) {
        rateLimits.delete(ip)
        return false
    }

    if (!record) {
        rateLimits.set(ip, { count: 1, timestamp: now })
        return false
    }

    if (record.count >= limit) {
        return true
    }

    record.count++
    return false
} 