/// <reference lib="deno.ns" />

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// Security headers for all responses
export function addSecurityHeaders(headers: Headers): Headers {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return headers
}

// Sanitize output to prevent XSS
export function sanitizeOutput(data: any): any {
  if (typeof data === 'string') {
    return data.replace(/[<>]/g, '')
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeOutput)
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeOutput(value)
    }
    return sanitized
  }
  return data
}

// Booking request validation schema
export const bookingRequestSchema = z.object({
  tour_type: z.string().min(1, "Tour type is required"),
  booking_date: z.string().refine((date) => {
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }, "Booking date must be today or in the future"),
  booking_time: z.string().min(1, "Booking time is required"),
  adults: z.number().min(1, "At least 1 adult is required").max(20, "Maximum 20 adults allowed"),
  children: z.number().min(0).max(20, "Maximum 20 children allowed").optional(),
  infants: z.number().min(0).max(20, "Maximum 20 infants allowed").optional(),
  customer_name: z.string().min(1, "Customer name is required").max(100, "Name too long"),
  customer_email: z.string().email("Valid email is required"),
  customer_phone: z.string().optional(),
  payment_method_id: z.string().min(1, "Payment method is required"),
  total_amount: z.number().min(0, "Total amount must be positive"),
  discount_code: z.string().optional(),
  special_requests: z.string().max(1000, "Special requests too long").optional()
})

// Booking management validation schema
export const bookingManagementSchema = z.object({
  booking_id: z.number().min(1, "Valid booking ID is required"),
  action: z.enum(['approve', 'reject'], "Action must be 'approve' or 'reject'"),
  rejection_reason: z.string().optional(),
  admin_notes: z.string().max(1000, "Admin notes too long").optional()
})

// Refund processing validation schema
export const refundSchema = z.object({
  bookingId: z.number().min(1, "Valid booking ID is required"),
  email: z.string().email("Valid email is required").optional()
})

// Generic request validation function
export async function validateRequest<T>(
  req: Request, 
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { data: null, error: `Validation failed: ${errors}` }
    }
    
    return { data: result.data, error: null }
  } catch (error) {
    return { data: null, error: 'Invalid JSON in request body' }
  }
}

// Rate limiting (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(clientId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const clientData = rateLimitMap.get(clientId)
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (clientData.count >= maxRequests) {
    return false
  }
  
  clientData.count++
  return true
}