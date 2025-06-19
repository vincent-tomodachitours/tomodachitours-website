import { Redis } from '@upstash/redis';

interface TransactionData {
    email: string;
    amount: number;
    bookingId: string;
    tourId: string;
    countryCode: string;
    ip?: string;
}

interface RiskScore {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: {
        unusualAmount: boolean;
        unusualTime: boolean;
        unusualLocation: boolean;
        unusualDevice: boolean;
        multipleBookings: boolean;
        recentFailures: boolean;
        knownBadActor: boolean;
    };
}

export class SuspiciousTransactionDetector {
    private readonly ALLOWED_COUNTRIES = ['JP', 'US', 'GB', 'CA', 'AU', 'NZ', 'SG'];
    private readonly RISK_THRESHOLDS = {
        low: 30,
        medium: 60,
        high: 90,
        critical: 90,
    };
    private readonly QUEUE_KEY = 'manual_review_queue';

    constructor(private redis: Redis) { }

    async calculateRiskScore(transactionData: TransactionData): Promise<RiskScore> {
        const factors = {
            unusualAmount: this.isUnusualAmount(transactionData),
            unusualTime: this.isUnusualTime(),
            unusualLocation: !this.ALLOWED_COUNTRIES.includes(transactionData.countryCode),
            unusualDevice: await this.isUnusualDevice(transactionData),
            multipleBookings: await this.hasMultipleBookings(transactionData),
            recentFailures: await this.hasRecentFailures(transactionData),
            knownBadActor: await this.isKnownBadActor(transactionData),
        };

        let score = 0;
        if (factors.unusualAmount) score += 20;
        if (factors.unusualTime) score += 15;
        if (factors.unusualLocation) score += 25;
        if (factors.unusualDevice) score += 20;
        if (factors.multipleBookings) score += 15;
        if (factors.recentFailures) score += 25;
        if (factors.knownBadActor) score += 50;

        let level: RiskScore['level'] = 'low';
        if (score >= this.RISK_THRESHOLDS.critical) level = 'critical';
        else if (score >= this.RISK_THRESHOLDS.high) level = 'high';
        else if (score >= this.RISK_THRESHOLDS.medium) level = 'medium';

        return { score, level, factors };
    }

    private isUnusualAmount(transactionData: TransactionData): boolean {
        const typicalAmounts: Record<string, { min: number; max: number }> = {
            'morning-tour': { min: 5000, max: 15000 },
            'night-tour': { min: 8000, max: 20000 },
            'gion-tour': { min: 10000, max: 25000 },
            'uji-tour': { min: 15000, max: 35000 },
        };

        const typical = typicalAmounts[transactionData.tourId];
        if (!typical) return true;

        return transactionData.amount < typical.min || transactionData.amount > typical.max;
    }

    private isUnusualTime(): boolean {
        const hour = new Date().getHours();
        return hour >= 1 && hour <= 5; // Unusual between 1 AM and 5 AM JST
    }

    private async isUnusualDevice(transactionData: TransactionData): Promise<boolean> {
        // Implementation depends on how we track and identify suspicious devices
        return false; // Placeholder
    }

    private async hasMultipleBookings(transactionData: TransactionData): Promise<boolean> {
        const key = `transactions:${transactionData.email}`;
        const recentTransactions = await this.redis.lrange(key, 0, -1);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        const recentCount = recentTransactions.filter(t => {
            const transaction = JSON.parse(t);
            return transaction.timestamp > oneHourAgo;
        }).length;

        return recentCount >= 3;
    }

    private async hasRecentFailures(transactionData: TransactionData): Promise<boolean> {
        const key = `failed_attempts:${transactionData.email}`;
        const failures = await this.redis.get<string>(key);
        return failures !== null && parseInt(failures, 10) >= 3;
    }

    private async isKnownBadActor(transactionData: TransactionData): Promise<boolean> {
        const emailKey = `blacklist:email:${transactionData.email}`;
        const ipKey = transactionData.ip ? `blacklist:ip:${transactionData.ip}` : null;

        const [emailBlacklisted, ipBlacklisted] = await Promise.all([
            this.redis.get(emailKey),
            ipKey ? this.redis.get(ipKey) : Promise.resolve(null),
        ]);

        return emailBlacklisted !== null || ipBlacklisted !== null;
    }

    async middleware(transactionData: TransactionData) {
        // Calculate risk score first
        const riskScore = await this.calculateRiskScore(transactionData);

        // Block critical risk transactions
        if (riskScore.level === 'critical') {
            throw new Error('Transaction blocked due to high risk score');
        }

        // Track transaction
        const transactionKey = `transactions:${transactionData.email}`;
        await this.redis.lpush(
            transactionKey,
            JSON.stringify({
                ...transactionData,
                timestamp: Date.now(),
            })
        );

        // Add high-risk transactions to review queue
        if (riskScore.level === 'high' || riskScore.level === 'critical') {
            await this.redis.lpush(
                'manual_review_queue',
                JSON.stringify({
                    transactionData,
                    riskScore,
                    queuedAt: Date.now(),
                })
            );
        }

        return riskScore;
    }
} 