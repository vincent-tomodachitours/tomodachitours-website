import { createClient } from '@supabase/supabase-js'

// Rate limit configuration
const RATE_LIMIT_WINDOW = process.env.NODE_ENV === 'test' ? 1000 : 60 * 1000 // 1 second in test, 1 minute in prod
const MAX_REQUESTS = process.env.NODE_ENV === 'test' ? 3 : 60 // 3 requests in test, 60 in prod
const BLOCK_DURATION = process.env.NODE_ENV === 'test' ? 1000 : 15 * 60 * 1000 // 1 second in test, 15 minutes in prod

// Rate limit tracking interface
interface RateLimitInfo {
    requests: number
    window_start: number
    blocked?: boolean
    blocked_until?: number
}

// Initialize Supabase client
function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient(supabaseUrl, supabaseKey)
}

// Get client IP from request
function getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    return forwarded?.split(',')[0] || realIP || 'unknown'
}

// Check if request should be rate limited
export async function checkRateLimit(req: Request): Promise<{ allowed: boolean; error?: string }> {
    try {
        const clientIP = getClientIP(req)
        const supabase = getSupabaseClient()
        const now = Date.now()

        // Get current rate limit info
        const { data: rateLimit, error: fetchError } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('client_ip', clientIP)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Error fetching rate limit:', fetchError)
            return { allowed: true } // Allow on error to prevent blocking legitimate traffic
        }

        // Initialize rate limit info
        let rateLimitInfo: RateLimitInfo
        if (!rateLimit) {
            // First request for this IP
            rateLimitInfo = {
                requests: 1,
                window_start: now
            }
        } else {
            rateLimitInfo = rateLimit

            // Check if client is blocked
            if (rateLimitInfo.blocked && rateLimitInfo.blocked_until && rateLimitInfo.blocked_until > now) {
                return {
                    allowed: false,
                    error: `Too many requests. Please try again after ${new Date(rateLimitInfo.blocked_until).toISOString()}`
                }
            }

            // Reset window if needed
            if (now - rateLimitInfo.window_start >= RATE_LIMIT_WINDOW) {
                rateLimitInfo = {
                    requests: 1,
                    window_start: now
                }
            } else {
                // Check if limit exceeded
                if (rateLimitInfo.requests >= MAX_REQUESTS) {
                    rateLimitInfo.blocked = true
                    rateLimitInfo.blocked_until = now + BLOCK_DURATION

                    // Update rate limit info in database
                    const { error: blockError } = await supabase
                        .from('rate_limits')
                        .upsert({
                            client_ip: clientIP,
                            ...rateLimitInfo,
                            updated_at: new Date().toISOString()
                        })

                    if (blockError) {
                        console.error('Error updating rate limit block:', blockError)
                        return { allowed: true } // Allow on error
                    }

                    return {
                        allowed: false,
                        error: `Too many requests. Please try again after ${new Date(rateLimitInfo.blocked_until).toISOString()}`
                    }
                }
                rateLimitInfo.requests++
            }
        }

        // Update rate limit info in database
        const { error: updateError } = await supabase
            .from('rate_limits')
            .upsert({
                client_ip: clientIP,
                ...rateLimitInfo,
                updated_at: new Date().toISOString()
            })

        if (updateError) {
            console.error('Error updating rate limit:', updateError)
            return { allowed: true } // Allow on error
        }

        return { allowed: true }

    } catch (error) {
        console.error('Rate limit check failed:', error)
        return { allowed: true } // Allow on error to prevent blocking legitimate traffic
    }
}

// Add rate limit headers to response
export function addRateLimitHeaders(headers: Headers, remaining: number): Headers {
    headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
    headers.set('X-RateLimit-Remaining', remaining.toString())
    headers.set('X-RateLimit-Reset', new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString())
    return headers
} 