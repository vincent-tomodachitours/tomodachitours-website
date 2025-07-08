import { Redis } from '@upstash/redis';
import { Request, Response, NextFunction } from 'express';

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

    async middleware(req: Request, res: Response, next: NextFunction): Promise<void> {
        const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip;

        // Ensure we have a valid IP
        if (!clientIP) {
            res.status(400).json({ error: 'Invalid IP address' });
            return;
        }

        try {
            // Check if IP is blacklisted
            if (await this.isIPBlacklisted(clientIP)) {
                res.status(403).json({ error: 'Access denied: IP is blacklisted' });
                return;
            }

            // Check country restriction
            if (!(await this.isCountryAllowed(clientIP))) {
                await this.addToBlacklist(clientIP, 'Country not allowed');
                res.status(403).json({ error: 'Access denied: Country not allowed' });
                return;
            }

            // Track request count
            const requestCount = await this.trackIPRequest(clientIP);
            if (requestCount > this.config.maxRequestsPerIP) {
                await this.addToBlacklist(clientIP, 'Exceeded request limit');
                res.status(429).json({ error: 'Too many requests from this IP' });
                return;
            }

            // Add IP tracking headers
            res.setHeader(
                'X-IP-Requests-Remaining',
                Math.max(0, this.config.maxRequestsPerIP - requestCount).toString()
            );

            next();
        } catch (error) {
            console.error('IP Protection Error:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
} 