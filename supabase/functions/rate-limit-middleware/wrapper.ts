// @deno-types="https://esm.sh/@upstash/redis@1.20.6"
import { Redis } from 'https://esm.sh/@upstash/redis@1.20.6';
import { logSecurityEvent, SecurityEventTypes } from '../_shared/securityEvents.ts';

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
}

type EdgeFunction = (req: Request) => Promise<Response>

export function withRateLimit(redis: Redis): EdgeFunction {
    return async (req: Request): Promise<Response> => {
        const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const endpoint = new URL(req.url).pathname;
        const key = `rate_limit:${clientIP}:${endpoint}`;

        // Get current window data
        const now = Date.now();
        const windowSize = 60 * 1000; // 1 minute
        const maxRequests = getMaxRequests(endpoint);

        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: new Headers(corsHeaders) });
        }

        try {
            // Get and increment counter
            const counter = await redis.incr(key);

            // Set expiry on first request
            if (counter === 1) {
                await redis.pexpire(key, windowSize);
            }

            // Get TTL for response headers
            const ttl = await redis.pttl(key);

            // Check if limit exceeded
            if (counter > maxRequests) {
                // Log rate limit exceeded event
                await logSecurityEvent(
                    SecurityEventTypes.RATE_LIMIT_EXCEEDED,
                    {
                        clientIP,
                        endpoint,
                        requestCount: counter,
                        timeWindow: windowSize,
                        maxRequests
                    },
                    {
                        ip: clientIP,
                        tags: ['rate-limit', endpoint]
                    }
                );

                return new Response(
                    JSON.stringify({
                        error: 'Too many requests',
                        retryAfter: Math.ceil(ttl / 1000)
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': Math.ceil(ttl / 1000).toString(),
                            'X-RateLimit-Limit': maxRequests.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': Math.ceil((now + ttl) / 1000).toString(),
                            ...corsHeaders
                        }
                    }
                );
            }

            // If approaching limit, log a warning
            if (counter > maxRequests * 0.8) {
                await logSecurityEvent(
                    SecurityEventTypes.RATE_LIMIT_WARNING,
                    {
                        clientIP,
                        endpoint,
                        requestCount: counter,
                        timeWindow: windowSize,
                        maxRequests
                    },
                    {
                        ip: clientIP,
                        tags: ['rate-limit', endpoint]
                    }
                );
            }

            // Create response with rate limit headers
            const headers = new Headers({
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': (maxRequests - counter).toString(),
                'X-RateLimit-Reset': Math.ceil((now + ttl) / 1000).toString(),
                ...corsHeaders
            });

            return new Response(null, {
                status: 200,
                headers
            });
        } catch (error) {
            console.error('Rate limit error:', error);
            // Log error but return a successful response
            await logSecurityEvent(
                SecurityEventTypes.ERROR,
                {
                    message: 'Rate limiting error',
                    error: error instanceof Error ? error.message : String(error),
                    clientIP,
                    endpoint
                },
                {
                    ip: clientIP,
                    tags: ['rate-limit', 'error', endpoint]
                }
            );

            return new Response(null, {
                status: 200,
                headers: new Headers(corsHeaders)
            });
        }
    }
}

function getMaxRequests(endpoint: string): number {
    // Configure rate limits based on endpoint
    if (endpoint.includes('/payment')) {
        return 3; // 3 requests per minute for payment endpoints
    }
    if (endpoint.includes('/booking')) {
        return 5; // 5 requests per minute for booking endpoints
    }
    return 10; // 10 requests per minute for all other endpoints
} 