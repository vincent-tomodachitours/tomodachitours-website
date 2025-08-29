// @deno-types="https://esm.sh/@upstash/redis@1.20.6"
import { Redis } from 'https://esm.sh/@upstash/redis@1.20.6';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface TransactionData {
    bookingId: string;
    userId: string;
    tourId: string;
    amount: number;
    email: string;
    ip: string;
    userAgent?: string;
    correlationId?: string;
}

interface RiskAssessment {
    score: number;
    factors: string[];
    details: Record<string, any>;
}

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

export class SuspiciousTransactionDetector {
    private readonly redis: Redis;
    private readonly TRANSACTION_HISTORY = 'transaction_history';
    private readonly REVIEW_QUEUE = 'review_queue';
    private readonly HIGH_RISK_THRESHOLD = 60;
    private readonly CRITICAL_RISK_THRESHOLD = 90;

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async handleRequest(req: AuthenticatedRequest): Promise<Response> {
        try {
            const body = await req.json();
            const { bookingId, tourId, amount, email } = body;

            // Validate required fields
            if (!bookingId || !tourId || !amount || !email) {
                return new Response(
                    JSON.stringify({
                        error: 'Missing required fields',
                        details: {
                            bookingId: !bookingId,
                            tourId: !tourId,
                            amount: !amount,
                            email: !email
                        }
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

            const correlationId = req.headers.get('x-correlation-id') || undefined;
            const userAgent = req.headers.get('user-agent') || undefined;
            const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
            const userId = 'anonymous'; // In Edge Functions, we'll handle auth differently

            // Extract request metadata
            const transactionData: TransactionData = {
                bookingId,
                tourId,
                amount,
                email,
                ip,
                userId,
                ...(userAgent && { userAgent }),
                ...(correlationId && { correlationId })
            };

            // Calculate risk assessment
            const riskAssessment = await this.assessTransaction(transactionData);

            // Handle critical risk transactions
            if (riskAssessment.score >= this.CRITICAL_RISK_THRESHOLD) {
                console.log(
                    `Critical risk transaction blocked for booking ${bookingId}`,
                    {
                        ...transactionData,
                        riskAssessment,
                        correlationId
                    }
                );

                return new Response(
                    JSON.stringify({
                        error: 'Critical risk transaction detected',
                        riskAssessment
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

            // Handle high risk transactions
            if (riskAssessment.score >= this.HIGH_RISK_THRESHOLD) {
                console.log(
                    `High risk transaction detected for booking ${bookingId}`,
                    {
                        ...transactionData,
                        riskAssessment,
                        correlationId
                    }
                );

                // Add to review queue but allow transaction
                await this.addToReviewQueue(transactionData, riskAssessment.score, riskAssessment.factors);
            }

            // Store transaction history
            await this.storeTransaction(transactionData, riskAssessment.score, riskAssessment.factors);

            return new Response(
                JSON.stringify({ riskAssessment }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error(
                'Error processing transaction',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );

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

    async assessTransaction(data: TransactionData): Promise<RiskAssessment> {
        const riskFactors: string[] = [];
        const details: Record<string, any> = {};
        let riskScore = 0;

        // Check for unusual amount
        const amountRisk = await this.checkUnusualAmount(data);
        if (amountRisk.isUnusual) {
            riskFactors.push('Unusual amount');
            riskScore += 25;
            details.amountAnalysis = amountRisk.details;
        }

        // Check for multiple bookings
        const bookingRisk = await this.checkMultipleBookings(data);
        if (bookingRisk.isUnusual) {
            riskFactors.push('Multiple bookings');
            riskScore += 20;
            details.bookingAnalysis = bookingRisk.details;
        }

        // Check for unusual time
        const timeRisk = this.checkUnusualTime();
        if (timeRisk.isUnusual) {
            riskFactors.push('Unusual time');
            riskScore += 15;
            details.timeAnalysis = timeRisk.details;
        }

        // Check for unusual location
        const locationRisk = await this.checkUnusualLocation(data.ip);
        if (locationRisk.isUnusual) {
            riskFactors.push('Unusual location');
            riskScore += 25;
            details.locationAnalysis = locationRisk.details;
        }

        // Store transaction in history
        await this.storeTransaction(data, riskScore, riskFactors);

        // If high risk, add to review queue
        if (riskScore >= this.HIGH_RISK_THRESHOLD) {
            await this.addToReviewQueue(data, riskScore, riskFactors);

            // Log the suspicious transaction
            console.log(
                `Suspicious transaction detected for booking ${data.bookingId}`,
                {
                    ...data,
                    riskScore,
                    riskFactors,
                    details
                }
            );

            // If critical risk, log additional event
            if (riskScore >= this.CRITICAL_RISK_THRESHOLD) {
                console.log(
                    `Critical risk transaction blocked for booking ${data.bookingId}`,
                    {
                        ...data,
                        riskScore,
                        riskFactors,
                        details
                    }
                );
            }
        }

        return {
            score: riskScore,
            factors: riskFactors,
            details
        };
    }

    private async checkUnusualAmount(data: TransactionData) {
        const tourPriceRanges = {
            'morning-tour': { min: 5000, max: 15000 },
            'night-tour': { min: 8000, max: 20000 },
            'gion-tour': { min: 10000, max: 25000 },
            'uji-tour': { min: 15000, max: 35000 },
            'uji-walking-tour': { min: 12000, max: 30000 }
        };

        const priceRange = tourPriceRanges[data.tourId as keyof typeof tourPriceRanges];
        if (!priceRange) {
            return {
                isUnusual: true,
                details: { reason: 'Unknown tour type', amount: data.amount }
            };
        }

        // Check for fractional amounts (all prices should be in whole yen)
        if (Math.floor(data.amount) !== data.amount) {
            return {
                isUnusual: true,
                details: { reason: 'Fractional amount detected', amount: data.amount }
            };
        }

        const isUnusual = data.amount < priceRange.min || data.amount > priceRange.max;
        return {
            isUnusual,
            details: {
                amount: data.amount,
                expectedRange: priceRange,
                deviation: isUnusual
                    ? data.amount < priceRange.min
                        ? priceRange.min - data.amount
                        : data.amount - priceRange.max
                    : 0
            }
        };
    }

    private async checkMultipleBookings(data: TransactionData) {
        const hourAgo = Date.now() - 60 * 60 * 1000;
        const recentBookings = await this.redis.zcount(
            this.TRANSACTION_HISTORY,
            hourAgo.toString(),
            '+inf'
        );

        return {
            isUnusual: recentBookings >= 3,
            details: {
                bookingsLastHour: recentBookings,
                threshold: 3
            }
        };
    }

    private checkUnusualTime() {
        const hour = new Date().getHours();
        const isUnusual = hour >= 1 && hour <= 5; // Unusual between 1 AM and 5 AM JST

        return {
            isUnusual,
            details: {
                hour,
                unusualRange: { start: 1, end: 5 }
            }
        };
    }

    private async checkUnusualLocation(ip: string) {
        // This would typically use a geolocation service
        const allowedCountries = ['JP', 'US', 'GB', 'CA', 'AU', 'NZ', 'SG'];

        // For testing purposes, we'll consider certain IP ranges as suspicious
        const isPrivateIP = ip.startsWith('10.') ||
            ip.startsWith('172.16.') ||
            ip.startsWith('192.168.');

        // In production, this would use a real geolocation service
        const mockCountry = isPrivateIP ? 'UNKNOWN' : 'JP';

        return {
            isUnusual: isPrivateIP || !allowedCountries.includes(mockCountry),
            details: {
                ip,
                country: mockCountry,
                allowedCountries,
                reason: isPrivateIP ? 'Private IP address detected' : 'Country not in allowed list'
            }
        };
    }

    private async storeTransaction(
        data: TransactionData,
        riskScore: number,
        riskFactors: string[]
    ) {
        const transaction = {
            ...data,
            timestamp: Date.now(),
            riskScore,
            riskFactors
        };

        // Store transaction with score as timestamp
        await this.redis.zadd(
            this.TRANSACTION_HISTORY,
            { score: transaction.timestamp, member: JSON.stringify(transaction) }
        );

        // Keep only last 24 hours of transactions
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        await this.redis.zremrangebyscore(this.TRANSACTION_HISTORY, 0, dayAgo);
    }

    private async addToReviewQueue(
        data: TransactionData,
        riskScore: number,
        riskFactors: string[]
    ) {
        const reviewEntry = {
            ...data,
            timestamp: Date.now(),
            riskScore,
            riskFactors,
            status: 'pending_review'
        };

        await this.redis.lpush(
            this.REVIEW_QUEUE,
            JSON.stringify(reviewEntry)
        );
    }
}

// Initialize Redis client
const redis = new Redis({
    url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
    token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

const detector = new SuspiciousTransactionDetector(redis);

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

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

    return detector.handleRequest(req);
}); 