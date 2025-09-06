import { describe, it, expect } from 'vitest'
import { validateRequest, sanitizeOutput } from '../../supabase/functions/validation-middleware'
import { refundSchema, chargeSchema } from '../../supabase/functions/validation-middleware'

describe('Validation Middleware Tests', () => {
    describe('Refund Schema Validation', () => {
        it('should validate correct refund data', async () => {
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'test@example.com'
                })
            })

            const { data, error } = await validateRequest(mockRequest, refundSchema)
            expect(error).toBeNull()
            expect(data).toEqual({
                bookingId: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com'
            })
        })

        it('should reject invalid refund data', async () => {
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingId: 'invalid-uuid',
                    email: 'not-an-email'
                })
            })

            const { data, error } = await validateRequest(mockRequest, refundSchema)
            expect(data).toBeNull()
            expect(error).toBeTruthy()
        })
    })

    describe('Charge Schema Validation', () => {
        it('should validate correct charge data', async () => {
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tourId: '123e4567-e89b-12d3-a456-426614174000',
                    tourType: 'Standard Tour',
                    tourDate: '2024-04-01',
                    tourTime: '09:00',
                    adults: 2,
                    children: 1,
                    infants: 0,
                    customerName: 'John Doe',
                    customerEmail: 'john@example.com',
                    customerPhone: '+1234567890',
                    paymentToken: 'tok_test_12345',
                    totalAmount: 15000,
                    currency: 'JPY'
                })
            })

            const { data, error } = await validateRequest(mockRequest, chargeSchema)
            expect(error).toBeNull()
            expect(data).toBeTruthy()
        })

        it('should reject invalid charge data', async () => {
            const mockRequest = new Request('http://localhost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tourId: 'invalid-uuid',
                    tourType: '',
                    tourDate: '2024-13-45', // invalid date
                    tourTime: '25:00', // invalid time
                    adults: 0, // must be at least 1
                    children: -1, // cannot be negative
                    customerName: '', // empty name
                    customerEmail: 'not-an-email',
                    totalAmount: -1000, // negative amount
                    currency: 'USD' // must be JPY
                })
            })

            const { data, error } = await validateRequest(mockRequest, chargeSchema)
            expect(data).toBeNull()
            expect(error).toBeTruthy()
        })
    })

    describe('Output Sanitization', () => {
        it('should sanitize sensitive data', () => {
            const input = {
                id: '123',
                customerName: 'John Doe',
                email: 'john@example.com',
                password: 'secret123',
                token: 'sensitive_token',
                paymentDetails: {
                    cardNumber: '4242424242424242',
                    secret: 'cvv'
                }
            }

            const sanitized = sanitizeOutput(input)
            expect(sanitized).toHaveProperty('id')
            expect(sanitized).toHaveProperty('customerName')
            expect(sanitized).toHaveProperty('email')
            expect(sanitized).not.toHaveProperty('password')
            expect(sanitized).not.toHaveProperty('token')
            expect(sanitized.paymentDetails).not.toHaveProperty('cardNumber')
            expect(sanitized.paymentDetails).not.toHaveProperty('secret')
        })

        it('should handle nested objects and arrays', () => {
            const input = {
                data: [
                    { id: 1, token: 'secret1' },
                    { id: 2, token: 'secret2' }
                ],
                nested: {
                    deep: {
                        password: 'secret',
                        visible: 'public'
                    }
                }
            }

            const sanitized = sanitizeOutput(input)
            expect(sanitized.data[0]).not.toHaveProperty('token')
            expect(sanitized.data[1]).not.toHaveProperty('token')
            expect(sanitized.nested.deep).not.toHaveProperty('password')
            expect(sanitized.nested.deep.visible).toBe('public')
        })
    })
}) 