import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// Security headers
export const addSecurityHeaders = (headers: Headers): Headers => {
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-XSS-Protection', '1; mode=block')
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    headers.set('Content-Security-Policy', "default-src 'self'")
    return headers
}

// Sanitize sensitive data from output
export const sanitizeOutput = (data: any): any => {
    if (!data) return data
    const sensitiveFields = ['secret', 'key', 'password', 'token']
    if (typeof data === 'object') {
        const sanitized = { ...data }
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                delete sanitized[field]
            }
        }
        return sanitized
    }
    return data
}

// Notification schema
export const notificationSchema = z.object({
    type: z.enum(['confirmation', 'cancellation']),
    bookingId: z.number().int().positive()
})

// Request validation
export const validateRequest = async (req: Request, schema: z.ZodSchema) => {
    try {
        const json = await req.json()
        const data = schema.parse(json)
        return { data, error: null }
    } catch (error) {
        return { data: null, error: error.message }
    }
} 