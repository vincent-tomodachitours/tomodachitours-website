import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { NextFunction, Request, Response } from 'express';

interface IPConfig {
    allowedCountries: string[];
    blacklistedIPs: string[];
    maxRequestsPerIP: number;
    trackingWindowInMinutes: number;
}

export class IPProtection {
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

    middleware = async (req: Request, res: Response, next: NextFunction) => {
        const clientIP = req.headers['x-forwarded-for']?.toString() || req.ip;

        // Ensure we have a valid IP
        if (!clientIP) {
            return res.status(400).json({
                error: 'Invalid IP address',
            });
        }

        // Use the first IP if x-forwarded-for contains multiple IPs
        const ip = clientIP.split(',')[0].trim();

        try {
            // Check if IP is blacklisted
            if (await this.isIPBlacklisted(ip)) {
                return res.status(403).json({
                    error: 'Access denied: IP is blacklisted',
                });
            }

            // Check country restriction
            if (!(await this.isCountryAllowed(ip))) {
                await this.addToBlacklist(ip, 'Country not allowed');
                return res.status(403).json({
                    error: 'Access denied: Country not allowed',
                });
            }

            // Track request count
            const requestCount = await this.trackIPRequest(ip);
            if (requestCount > this.config.maxRequestsPerIP) {
                await this.addToBlacklist(ip, 'Exceeded request limit');
                return res.status(429).json({
                    error: 'Too many requests from this IP',
                });
            }

            // Add IP tracking headers
            res.setHeader('X-IP-Requests-Remaining',
                Math.max(0, this.config.maxRequestsPerIP - requestCount).toString()
            );

            next();
        } catch (error) {
            console.error('IP Protection Error:', error);
            next(error);
        }
    };
}

// Default configuration
const defaultConfig: IPConfig = {
    allowedCountries: ['JP', 'US', 'GB', 'CA', 'AU', 'NZ', 'SG'],
    blacklistedIPs: [],
    maxRequestsPerIP: 1000,
    trackingWindowInMinutes: 60,
};

// Create middleware instance
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ipProtection = new IPProtection(redis, defaultConfig);
export const ipProtectionMiddleware = ipProtection.middleware; 