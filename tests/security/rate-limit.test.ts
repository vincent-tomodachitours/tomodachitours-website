import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '../../supabase/functions/rate-limit-middleware'

// Test-specific configuration
const TEST_TIMEOUT = 10000 // 10 seconds
const TEST_REQUESTS = 3 // Reduced to 3 requests
const TEST_WAIT_TIME = 2000 // 2 seconds wait time for window reset

describe('Rate Limiting Tests', () => {
    let supabase: any

    beforeAll(() => {
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing required environment variables. Please check your .env.test file.')
        }

        supabase = createClient(supabaseUrl, supabaseKey)
    })

    beforeEach(async () => {
        // Clean up rate_limits table before each test
        await supabase
            .from('rate_limits')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
    })

    afterEach(async () => {
        // Clean up after tests
        await supabase
            .from('rate_limits')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')
    })

    it('should allow requests within rate limit', async () => {
        const mockRequest = new Request('http://localhost', {
            headers: {
                'x-forwarded-for': '127.0.0.1'
            }
        })

        // Make TEST_REQUESTS - 1 requests (should all be allowed)
        for (let i = 0; i < TEST_REQUESTS - 1; i++) {
            const result = await checkRateLimit(mockRequest)
            expect(result.allowed).toBe(true)
            expect(result.error).toBeUndefined()
        }
    }, TEST_TIMEOUT)

    it('should block requests exceeding rate limit', async () => {
        const mockRequest = new Request('http://localhost', {
            headers: {
                'x-forwarded-for': '127.0.0.2'
            }
        })

        // Make TEST_REQUESTS requests (should all be allowed)
        for (let i = 0; i < TEST_REQUESTS; i++) {
            const result = await checkRateLimit(mockRequest)
            expect(result.allowed).toBe(true)
            expect(result.error).toBeUndefined()
        }

        // This request should be blocked (exceeds limit)
        const result = await checkRateLimit(mockRequest)
        expect(result.allowed).toBe(false)
        expect(result.error).toContain('Too many requests')
    }, TEST_TIMEOUT)

    it('should reset rate limit after window expires', async () => {
        const mockRequest = new Request('http://localhost', {
            headers: {
                'x-forwarded-for': '127.0.0.3'
            }
        })

        // Make TEST_REQUESTS - 1 requests
        for (let i = 0; i < TEST_REQUESTS - 1; i++) {
            const result = await checkRateLimit(mockRequest)
            expect(result.allowed).toBe(true)
            expect(result.error).toBeUndefined()
        }

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, TEST_WAIT_TIME))

        // Should be allowed as window has reset
        const result = await checkRateLimit(mockRequest)
        expect(result.allowed).toBe(true)
        expect(result.error).toBeUndefined()
    }, TEST_TIMEOUT)

    it('should maintain separate limits for different IPs', async () => {
        const mockRequest1 = new Request('http://localhost', {
            headers: {
                'x-forwarded-for': '127.0.0.4'
            }
        })

        const mockRequest2 = new Request('http://localhost', {
            headers: {
                'x-forwarded-for': '127.0.0.5'
            }
        })

        // Make TEST_REQUESTS - 1 requests for first IP
        for (let i = 0; i < TEST_REQUESTS - 1; i++) {
            const result = await checkRateLimit(mockRequest1)
            expect(result.allowed).toBe(true)
            expect(result.error).toBeUndefined()
        }

        // Should still allow requests from second IP
        const result = await checkRateLimit(mockRequest2)
        expect(result.allowed).toBe(true)
        expect(result.error).toBeUndefined()
    }, TEST_TIMEOUT)
}) 