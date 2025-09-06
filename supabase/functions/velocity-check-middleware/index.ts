// @deno-types="https://esm.sh/@upstash/redis@1.20.6"
import { Redis } from 'https://esm.sh/@upstash/redis@1.20.6';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface VelocityConfig {
    maxAmountPerTransaction: number;      // Maximum amount per single transaction
    maxDailyAmount: number;               // Maximum total amount per day
    maxTransactionsPerHour: number;       // Maximum number of transactions per hour
    maxTransactionsPerDay: number;        // Maximum number of transactions per day
    maxTransactionsPerEmail: number;      // Maximum transactions per email per day
    maxTransactionsPerIP: number;         // Maximum transactions per IP per day
    suspiciousAmountThreshold: number;    // Amount that triggers extra scrutiny
}

interface VelocityCheck {
    ip: string;
    email: string;
    amount: number;
    timestamp: number;
}

class VelocityChecker {
    private redis: Redis;
    private config: VelocityConfig;

    constructor(redis: Redis, config: Partial<VelocityConfig> = {}) {
        this.redis = redis;
        this.config = {
            maxAmountPerTransaction: 200000,      // ¥200,000
            maxDailyAmount: 1000000,             // ¥1,000,000
            maxTransactionsPerHour: 3,
            maxTransactionsPerDay: 10,
            maxTransactionsPerEmail: 5,
            maxTransactionsPerIP: 5,
            suspiciousAmountThreshold: 100000,   // ¥100,000
            ...config
        };
    }

    private getKey(type: string, identifier: string): string {
        const date = new Date().toISOString().split('T')[0];
        return `velocity:${type}:${identifier}:${date}`;
    }

    private async incrementCounter(key: string, amount?: number): Promise<number> {
        if (amount) {
            return this.redis.incrby(key, amount);
        }
        return this.redis.incr(key);
    }

    private async getHourlyTransactions(identifier: string): Promise<number> {
        const now = new Date();
        const hour = now.getUTCHours();
        const key = `velocity:hourly:${identifier}:${now.toISOString().split('T')[0]}:${hour}`;
        const count = await this.redis.get(key);
        return count ? parseInt(count as string, 10) : 0;
    }

    private async trackHourlyTransaction(identifier: string): Promise<void> {
        const now = new Date();
        const hour = now.getUTCHours();
        const key = `velocity:hourly:${identifier}:${now.toISOString().split('T')[0]}:${hour}`;
        await this.redis.incr(key);
        await this.redis.expire(key, 3600); // Expire after 1 hour
    }

    private async addToSuspiciousQueue(check: VelocityCheck, reason: string): Promise<void> {
        const queue = 'suspicious_transactions';
        await this.redis.lpush(queue, JSON.stringify({
            ...check,
            reason,
            flaggedAt: Date.now()
        }));
    }

    private async sendAlert(check: VelocityCheck, reason: string): Promise<void> {
        // In a real implementation, this would send to an alert system
        console.error('Suspicious transaction detected:', {
            ...check,
            reason,
            timestamp: new Date(check.timestamp).toISOString()
        });
    }

    async checkVelocity(check: VelocityCheck): Promise<{
        allowed: boolean;
        reason?: string;
    }> {
        // Check single transaction amount limit
        if (check.amount > this.config.maxAmountPerTransaction) {
            await this.addToSuspiciousQueue(check, 'Amount exceeds per-transaction limit');
            await this.sendAlert(check, 'Amount exceeds per-transaction limit');
            return { allowed: false, reason: 'Transaction amount too high' };
        }

        // Check daily amount limit
        const dailyAmountKey = this.getKey('daily_amount', check.email);
        const dailyAmount = await this.incrementCounter(dailyAmountKey, check.amount);
        if (dailyAmount > this.config.maxDailyAmount) {
            await this.addToSuspiciousQueue(check, 'Daily amount limit exceeded');
            await this.sendAlert(check, 'Daily amount limit exceeded');
            return { allowed: false, reason: 'Daily transaction limit exceeded' };
        }

        // Check hourly transaction limit
        const hourlyCount = await this.getHourlyTransactions(check.email);
        if (hourlyCount >= this.config.maxTransactionsPerHour) {
            await this.addToSuspiciousQueue(check, 'Hourly transaction count exceeded');
            await this.sendAlert(check, 'Hourly transaction count exceeded');
            return { allowed: false, reason: 'Too many transactions per hour' };
        }

        // Check daily transaction limits
        const dailyEmailKey = this.getKey('daily_count', check.email);
        const dailyIPKey = this.getKey('daily_count', check.ip);

        const [emailCount, ipCount] = await Promise.all([
            this.incrementCounter(dailyEmailKey),
            this.incrementCounter(dailyIPKey)
        ]);

        if (emailCount > this.config.maxTransactionsPerEmail) {
            await this.addToSuspiciousQueue(check, 'Daily email transaction count exceeded');
            await this.sendAlert(check, 'Daily email transaction count exceeded');
            return { allowed: false, reason: 'Too many transactions for this email today' };
        }

        if (ipCount > this.config.maxTransactionsPerIP) {
            await this.addToSuspiciousQueue(check, 'Daily IP transaction count exceeded');
            await this.sendAlert(check, 'Daily IP transaction count exceeded');
            return { allowed: false, reason: 'Too many transactions from this IP today' };
        }

        // Track hourly transaction
        await this.trackHourlyTransaction(check.email);

        // Flag suspicious amounts for review
        if (check.amount >= this.config.suspiciousAmountThreshold) {
            await this.addToSuspiciousQueue(check, 'Suspicious amount');
            await this.sendAlert(check, 'Suspicious amount');
            // Still allow the transaction but flag for review
        }

        return { allowed: true };
    }
}

// Initialize Redis client
const redis = new Redis({
    url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
    token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

const velocityChecker = new VelocityChecker(redis);

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                {
                    status: 405,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        const body = await req.json();
        const { email, amount } = body;
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

        if (!ip || !email || !amount) {
            return new Response(
                JSON.stringify({
                    error: 'Missing required fields: ip, email, or amount',
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

        const check: VelocityCheck = {
            ip,
            email,
            amount: Number(amount),
            timestamp: Date.now(),
        };

        const result = await velocityChecker.checkVelocity(check);

        if (!result.allowed) {
            return new Response(
                JSON.stringify({
                    error: result.reason,
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

        return new Response(
            JSON.stringify({ success: true, velocityCheck: result }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Velocity Check Error:', error);
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