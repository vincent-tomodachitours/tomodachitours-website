#!/usr/bin/env ts-node

import { Redis } from '@upstash/redis';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface TransactionData {
    ip: string;
    email: string;
    amount: number;
    timestamp: number;
    bookingId: string;
    tourId: string;
    userAgent?: string;
    countryCode?: string;
    paymentMethod?: string;
}

interface RiskFactors {
    unusualAmount: boolean;
    unusualTime: boolean;
    unusualLocation: boolean;
    unusualDevice: boolean;
    multipleBookings: boolean;
    recentFailures: boolean;
    knownBadActor: boolean;
}

interface RiskScore {
    score: number;
    factors: RiskFactors;
    level: 'low' | 'medium' | 'high' | 'critical';
}

interface QueueEntry {
    transactionData: TransactionData;
    riskScore: RiskScore;
    queuedAt: number;
    reviewedAt?: number;
    reviewedBy?: string;
    decision?: 'approve' | 'reject';
    notes?: string;
}

export class ReviewQueueManager {
    private redis: Redis;
    private readonly QUEUE_KEY = 'manual_review_queue';
    private readonly REVIEW_LOG = 'review_decisions_log';

    constructor(redis?: Redis) {
        this.redis = redis || new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
    }

    async list(limit: number = 10): Promise<void> {
        const entries = await this.redis.lrange<string>(this.QUEUE_KEY, 0, limit - 1);

        if (entries.length === 0) {
            console.log('No entries in review queue');
            return;
        }

        console.log('\nPending Reviews:');
        console.log('===============');

        entries.forEach((entry, index) => {
            const queueEntry: QueueEntry = JSON.parse(entry);
            console.log(`\nEntry #${index + 1}:`);
            console.log(`Booking ID: ${queueEntry.transactionData.bookingId}`);
            console.log(`Email: ${queueEntry.transactionData.email}`);
            console.log(`Amount: ¥${queueEntry.transactionData.amount}`);
            console.log(`Tour: ${queueEntry.transactionData.tourId}`);
            console.log(`Risk Score: ${queueEntry.riskScore.score} (${queueEntry.riskScore.level})`);
            console.log('Risk Factors:');
            Object.entries(queueEntry.riskScore.factors)
                .filter(([_, value]) => value)
                .forEach(([factor]) => console.log(`  - ${factor}`));
            console.log(`Queued At: ${new Date(queueEntry.queuedAt).toLocaleString()}`);
        });
    }

    async review(
        index: number,
        decision: 'approve' | 'reject',
        reviewedBy: string,
        notes?: string
    ): Promise<void> {
        const entries = await this.redis.lrange<string>(this.QUEUE_KEY, 0, -1);

        if (index < 0 || index >= entries.length) {
            console.log('Invalid entry index');
            return;
        }

        const entry: QueueEntry = JSON.parse(entries[index]);
        const updatedEntry: QueueEntry = {
            ...entry,
            reviewedAt: Date.now(),
            reviewedBy,
            decision,
            notes,
        };

        // Remove the original entry
        await this.redis.lrem(this.QUEUE_KEY, 1, entries[index]);

        // Log the decision
        await this.redis.lpush(
            this.REVIEW_LOG,
            JSON.stringify({
                timestamp: Date.now(),
                entry: updatedEntry,
            })
        );

        // If rejected, add to blacklist
        if (decision === 'reject') {
            const blacklistReason = notes || 'Rejected during manual review';
            await this.redis.set(
                `blacklist:${entry.transactionData.email}`,
                JSON.stringify({
                    identifier: entry.transactionData.email,
                    reason: blacklistReason,
                    addedAt: Date.now(),
                    addedBy: reviewedBy,
                })
            );

            // Also blacklist IP if it exists
            if (entry.transactionData.ip) {
                await this.redis.set(
                    `blacklist:${entry.transactionData.ip}`,
                    JSON.stringify({
                        identifier: entry.transactionData.ip,
                        reason: blacklistReason,
                        addedAt: Date.now(),
                        addedBy: reviewedBy,
                    })
                );
            }
        }

        console.log(`Entry #${index + 1} ${decision}ed`);
    }

    async getHistory(limit: number = 50): Promise<void> {
        const logs = await this.redis.lrange<string>(this.REVIEW_LOG, 0, limit - 1);

        if (logs.length === 0) {
            console.log('No review history found');
            return;
        }

        console.log('\nReview History:');
        console.log('==============');

        logs.forEach(log => {
            const { timestamp, entry } = JSON.parse(log);
            console.log(`\nBooking ID: ${entry.transactionData.bookingId}`);
            console.log(`Decision: ${entry.decision?.toUpperCase()}`);
            console.log(`Reviewed By: ${entry.reviewedBy}`);
            console.log(`Reviewed At: ${new Date(entry.reviewedAt!).toLocaleString()}`);
            if (entry.notes) {
                console.log(`Notes: ${entry.notes}`);
            }
        });
    }

    async cleanup(days: number = 30): Promise<void> {
        const entries = await this.redis.lrange<string>(this.QUEUE_KEY, 0, -1);
        let removed = 0;

        for (const entry of entries) {
            const queueEntry: QueueEntry = JSON.parse(entry);
            const ageInDays = (Date.now() - queueEntry.queuedAt) / (24 * 60 * 60 * 1000);

            if (ageInDays > days) {
                await this.redis.lrem(this.QUEUE_KEY, 1, entry);
                removed++;
            }
        }

        console.log(`Cleaned up ${removed} old entries`);
    }
}

async function main() {
    const manager = new ReviewQueueManager();

    yargs(hideBin(process.argv))
        .command(
            'list',
            'List pending reviews',
            yargs => {
                return yargs.option('limit', {
                    alias: 'l',
                    describe: 'Number of entries to show',
                    type: 'number',
                    default: 10,
                });
            },
            async argv => {
                await manager.list(argv.limit);
            }
        )
        .command(
            'review <index> <decision>',
            'Review a transaction',
            yargs => {
                return yargs
                    .positional('index', {
                        describe: 'Index of the entry to review (1-based)',
                        type: 'number',
                    })
                    .positional('decision', {
                        describe: 'Review decision (approve/reject)',
                        type: 'string',
                        choices: ['approve', 'reject'],
                    })
                    .option('notes', {
                        alias: 'n',
                        describe: 'Additional notes about the decision',
                        type: 'string',
                    })
                    .option('reviewedBy', {
                        alias: 'b',
                        describe: 'Person making the review',
                        type: 'string',
                        default: process.env.USER || 'unknown',
                    });
            },
            async argv => {
                await manager.review(
                    (argv.index as number) - 1,
                    argv.decision as 'approve' | 'reject',
                    argv.reviewedBy as string,
                    argv.notes
                );
            }
        )
        .command(
            'history',
            'Show review history',
            yargs => {
                return yargs.option('limit', {
                    alias: 'l',
                    describe: 'Number of entries to show',
                    type: 'number',
                    default: 50,
                });
            },
            async argv => {
                await manager.getHistory(argv.limit);
            }
        )
        .command(
            'cleanup',
            'Remove old entries',
            yargs => {
                return yargs.option('days', {
                    alias: 'd',
                    describe: 'Remove entries older than this many days',
                    type: 'number',
                    default: 30,
                });
            },
            async argv => {
                await manager.cleanup(argv.days);
            }
        )
        .demandCommand(1, 'You must provide a valid command')
        .strict()
        .help().argv;
}

main().catch(console.error); 