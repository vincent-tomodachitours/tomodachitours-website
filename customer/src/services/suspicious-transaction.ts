import { Redis } from '@upstash/redis';
import { Request, Response } from 'express';
import { TransactionData } from '../types/TransactionData';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
    };
}

interface RiskAssessment {
    score: number;
    factors: string[];
    details: Record<string, any>;
}

export class SuspiciousTransactionDetector {
    private readonly redis: Redis;
    private readonly TRANSACTION_HISTORY = 'transaction_history';
    private readonly REVIEW_QUEUE = 'review_queue';
    private readonly HIGH_RISK_THRESHOLD = 60;
    private readonly CRITICAL_RISK_THRESHOLD = 80;

    constructor(redis: Redis) {
        this.redis = redis;
    }

    async handleRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { bookingId, tourId, amount, email } = req.body;

            // Validate required fields
            if (!bookingId || !tourId || !amount || !email) {
                res.status(400).json({
                    error: 'Missing required fields',
                    details: {
                        bookingId: !bookingId,
                        tourId: !tourId,
                        amount: !amount,
                        email: !email
                    }
                });
                return;
            }

            const correlationId = req.headers['x-correlation-id'] as string | undefined;
            const userAgent = req.headers['user-agent'];
            const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';
            const userId = req.user?.id || 'anonymous';

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

                res.status(400).json({
                    error: 'Critical risk transaction detected',
                    riskAssessment
                });
                return;
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

            res.status(200).json({ riskAssessment });
        } catch (error) {
            console.error(
                'Error processing transaction',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );

            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
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

        // Ensure risk score doesn't exceed 100
        riskScore = Math.min(riskScore, 100);

        return {
            score: riskScore,
            factors: riskFactors,
            details
        };
    }

    private async checkUnusualAmount(data: TransactionData) {
        // Check if amount has decimals
        const hasDecimals = data.amount % 1 !== 0;
        if (hasDecimals) {
            return {
                isUnusual: true,
                details: {
                    reason: 'Fractional amount not allowed',
                    amount: data.amount
                }
            };
        }

        const tourPriceRanges = {
            'morning-tour': { min: 5000, max: 15000 },
            'night-tour': { min: 8000, max: 20000 },
            'gion-tour': { min: 10000, max: 25000 },
            'uji-tour': { min: 15000, max: 35000 }
        };

        const priceRange = tourPriceRanges[data.tourId as keyof typeof tourPriceRanges];
        if (!priceRange) {
            return {
                isUnusual: true,
                details: { reason: 'Unknown tour type' }
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
        const key = `bookings:${data.userId}:${data.tourId}`;
        const count = await this.redis.zcount(key, '-inf', '+inf');
        const isUnusual = count >= 3;

        return {
            isUnusual,
            details: {
                bookingCount: count,
                threshold: 3
            }
        };
    }

    private checkUnusualTime() {
        const hour = new Date().getHours();
        const isUnusual = hour < 6 || hour > 22;

        return {
            isUnusual,
            details: {
                hour,
                normalRange: '6:00 - 22:00'
            }
        };
    }

    private async checkUnusualLocation(ip: string) {
        try {
            const response = await fetch(`https://ipapi.co/${ip}/country/`);
            const countryCode = await response.text();
            const allowedCountries = ['JP', 'US', 'GB', 'CA', 'AU', 'NZ', 'SG'];

            return {
                isUnusual: !allowedCountries.includes(countryCode.trim()),
                details: {
                    country: countryCode.trim(),
                    allowedCountries
                }
            };
        } catch (error) {
            console.error('Error checking location:', error);
            return {
                isUnusual: false,
                details: {
                    error: 'Failed to check location'
                }
            };
        }
    }

    private async storeTransaction(
        data: TransactionData,
        riskScore: number,
        riskFactors: string[]
    ) {
        const timestamp = Date.now();
        const key = `${this.TRANSACTION_HISTORY}:${data.userId}`;

        await this.redis.zadd(key, {
            score: timestamp,
            member: JSON.stringify({
                ...data,
                riskScore,
                riskFactors,
                timestamp
            })
        });
    }

    private async addToReviewQueue(
        data: TransactionData,
        riskScore: number,
        riskFactors: string[]
    ) {
        await this.redis.lpush(
            this.REVIEW_QUEUE,
            JSON.stringify({
                ...data,
                riskScore,
                riskFactors,
                timestamp: Date.now(),
                status: 'pending_review'
            })
        );
    }
} 