/// <reference lib="deno.ns" />
// @deno-types="https://deno.land/std@0.177.0/http/server.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.7.1"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from '../_shared/cors.ts';
import { logSecurityEvent, SecurityEventTypes } from '../_shared/securityEvents.ts';

// Rate limit tracking interface
interface RateLimitInfo {
    requests: number
    window_start: number
    blocked?: boolean
    blocked_until?: number
}

class RateLimiter {
    private readonly supabase;
    private readonly IS_TEST: boolean;
    private readonly RATE_LIMIT_WINDOW: number;
    public readonly MAX_REQUESTS: number;
    private readonly BLOCK_DURATION: number;

    constructor(supabaseUrl: string, supabaseKey: string, isTest: boolean = false) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.IS_TEST = isTest;
        this.RATE_LIMIT_WINDOW = isTest ? 1000 : 60 * 1000; // 1 second in test, 1 minute in prod
        this.MAX_REQUESTS = isTest ? 3 : 60; // 3 requests in test, 60 in prod
        this.BLOCK_DURATION = isTest ? 1000 : 15 * 60 * 1000; // 1 second in test, 15 minutes in prod
    }

    async checkRateLimit(clientIP: string): Promise<{
        allowed: boolean;
        remaining: number;
        error?: string;
    }> {
        const now = Date.now();

        // Get current rate limit info from Supabase
        const { data: rateLimits, error: fetchError } = await this.supabase
            .from('rate_limits')
            .select('*')
            .eq('client_ip', clientIP)
            .order('created_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('Error fetching rate limit info:', fetchError.message);
            await logSecurityEvent(
                SecurityEventTypes.ERROR,
                { error: fetchError.message, clientIP },
                { ip: clientIP }
            );
            return { allowed: false, remaining: 0, error: 'Rate limit check failed' };
        }

        const rateLimit = rateLimits?.[0];
        let rateLimitInfo: RateLimitInfo;

        if (!rateLimit) {
            // First request for this IP
            rateLimitInfo = {
                requests: 1,
                window_start: now
            };

            // Create new rate limit record
            const { error: createError } = await this.supabase
                .from('rate_limits')
                .upsert({
                    client_ip: clientIP,
                    requests: rateLimitInfo.requests,
                    window_start: rateLimitInfo.window_start,
                    blocked: false,
                    blocked_until: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (createError) {
                console.error('Error creating rate limit record:', createError.message);
                return { allowed: false, remaining: 0, error: 'Rate limit check failed' };
            }

            return { allowed: true, remaining: this.MAX_REQUESTS - 1 };
        }

        rateLimitInfo = rateLimit;

        // Check if client is blocked
        if (rateLimitInfo.blocked && rateLimitInfo.blocked_until && rateLimitInfo.blocked_until > now) {
            await logSecurityEvent(
                SecurityEventTypes.IP_BLOCKED,
                {
                    clientIP,
                    blockedUntil: new Date(rateLimitInfo.blocked_until).toISOString(),
                    reason: 'Rate limit exceeded'
                },
                { ip: clientIP }
            );
            return {
                allowed: false,
                remaining: 0,
                error: `Too many requests. Please try again after ${new Date(rateLimitInfo.blocked_until).toISOString()}`
            };
        }

        // Reset window if needed
        if (now - rateLimitInfo.window_start >= this.RATE_LIMIT_WINDOW) {
            rateLimitInfo = {
                requests: 1,
                window_start: now
            };
        } else {
            rateLimitInfo.requests++;

            // Block if too many requests
            if (rateLimitInfo.requests > this.MAX_REQUESTS) {
                rateLimitInfo.blocked = true;
                rateLimitInfo.blocked_until = now + this.BLOCK_DURATION;

                await logSecurityEvent(
                    SecurityEventTypes.RATE_LIMIT_EXCEEDED,
                    {
                        clientIP,
                        requests: rateLimitInfo.requests,
                        maxRequests: this.MAX_REQUESTS,
                        windowStart: new Date(rateLimitInfo.window_start).toISOString(),
                        blockedUntil: new Date(rateLimitInfo.blocked_until).toISOString()
                    },
                    { ip: clientIP }
                );
            } else if (rateLimitInfo.requests > (this.MAX_REQUESTS * 0.8)) {
                // Warning at 80% of limit
                await logSecurityEvent(
                    SecurityEventTypes.RATE_LIMIT_WARNING,
                    {
                        clientIP,
                        requests: rateLimitInfo.requests,
                        maxRequests: this.MAX_REQUESTS,
                        windowStart: new Date(rateLimitInfo.window_start).toISOString(),
                        remainingRequests: this.MAX_REQUESTS - rateLimitInfo.requests
                    },
                    { ip: clientIP }
                );
            }
        }

        // Update rate limit info in database
        const { error: updateError } = await this.supabase
            .from('rate_limits')
            .upsert({
                client_ip: clientIP,
                requests: rateLimitInfo.requests,
                window_start: rateLimitInfo.window_start,
                blocked: rateLimitInfo.blocked,
                blocked_until: rateLimitInfo.blocked_until,
                updated_at: new Date().toISOString()
            });

        if (updateError) {
            console.error('Error updating rate limit info:', updateError.message);
            return { allowed: false, remaining: 0, error: 'Rate limit check failed' };
        }

        if (rateLimitInfo.blocked) {
            return {
                allowed: false,
                remaining: 0,
                error: `Too many requests. Please try again after ${new Date(rateLimitInfo.blocked_until!).toISOString()}`
            };
        }

        return {
            allowed: true,
            remaining: Math.max(0, this.MAX_REQUESTS - rateLimitInfo.requests)
        };
    }
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing environment variables');
        }

        const rateLimiter = new RateLimiter(supabaseUrl, supabaseKey);

        // Get client IP from request headers
        const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

        const result = await rateLimiter.checkRateLimit(clientIP);

        if (!result.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Too many requests',
                    message: result.error
                }),
                {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': rateLimiter.MAX_REQUESTS.toString(),
                        'X-RateLimit-Remaining': result.remaining.toString()
                    }
                }
            );
        }

        // If rate limit check passes, return success response
        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': rateLimiter.MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': result.remaining.toString()
                }
            }
        );
    } catch (error) {
        console.error('Error in rate limit middleware:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}); 