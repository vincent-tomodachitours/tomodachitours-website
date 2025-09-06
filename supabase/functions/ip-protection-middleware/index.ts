// @deno-types="https://esm.sh/@upstash/redis@1.20.6"
import { Redis } from 'https://esm.sh/@upstash/redis@1.20.6';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface IPConfig {
    allowedCountries: string[];
    blacklistedIPs: string[];
    maxRequestsPerIP: number;
    trackingWindowInMinutes: number;
}

class IPProtection {
    private redis: Redis;
    private config: IPConfig;

    constructor(redis: Redis, config: IPConfig) {
        this.redis = redis;
        this.config = config;
    }

    private async isIPBlacklisted(ip: string): Promise<boolean> {
        // Check static blacklist
        if (this.config.blacklistedIPs.includes(ip)) {
            return true;
        }

        // Check dynamic blacklist in Redis
        const blacklisted = await this.redis.get(`blacklist:${ip}`);
        return !!blacklisted;
    }

    private async addToBlacklist(ip: string, reason: string): Promise<void> {
        await this.redis.set(`blacklist:${ip}`, reason);
    }

    private async trackIPRequest(ip: string): Promise<number> {
        const key = `ip_requests:${ip}`;
        const windowInSeconds = this.config.trackingWindowInMinutes * 60;

        // Increment request count and set expiry
        const count = await this.redis.incr(key);
        if (count === 1) {
            await this.redis.expire(key, windowInSeconds);
        }

        return count;
    }

    private async isCountryAllowed(ip: string): Promise<boolean> {
        try {
            // Use a geolocation service to get country code
            const response = await fetch(`https://ipapi.co/${ip}/country/`);
            const countryCode = await response.text();

            return this.config.allowedCountries.includes(countryCode.trim());
        } catch (error) {
            console.error('Error checking country:', error);
            // Default to allowed if geolocation check fails
            return true;
        }
    }

    async handleRequest(req: Request): Promise<Response> {
        const clientIP = req.headers.get('x-forwarded-for');

        // Ensure we have a valid IP
        if (!clientIP) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid IP address',
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Use the first IP if x-forwarded-for contains multiple IPs
        const ip = clientIP.split(',')[0].trim();

        try {
            // Check if IP is blacklisted
            if (await this.isIPBlacklisted(ip)) {
                return new Response(
                    JSON.stringify({
                        error: 'Access denied: IP is blacklisted',
                    }),
                    {
                        status: 403,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            // Check country restriction
            if (!(await this.isCountryAllowed(ip))) {
                await this.addToBlacklist(ip, 'Country not allowed');
                return new Response(
                    JSON.stringify({
                        error: 'Access denied: Country not allowed',
                    }),
                    {
                        status: 403,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            // Track request count
            const requestCount = await this.trackIPRequest(ip);
            if (requestCount > this.config.maxRequestsPerIP) {
                await this.addToBlacklist(ip, 'Exceeded request limit');
                return new Response(
                    JSON.stringify({
                        error: 'Too many requests from this IP',
                    }),
                    {
                        status: 429,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            // Return success response with IP tracking headers
            return new Response(
                JSON.stringify({ success: true }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'X-IP-Requests-Remaining': Math.max(0, this.config.maxRequestsPerIP - requestCount).toString()
                    }
                }
            );
        } catch (error) {
            console.error('IP Protection Error:', error);
            return new Response(
                JSON.stringify({
                    error: 'Internal server error',
                    details: error instanceof Error ? error.message : 'Unknown error'
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
    }
}

// Default configuration
const defaultConfig: IPConfig = {
    allowedCountries: ['JP', 'US', 'GB', 'CA', 'AU', 'NZ', 'SG'],
    blacklistedIPs: [],
    maxRequestsPerIP: 1000,
    trackingWindowInMinutes: 60,
};

// Initialize Redis client
const redis = new Redis({
    url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
    token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

const ipProtection = new IPProtection(redis, defaultConfig);

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    return ipProtection.handleRequest(req);
}); 