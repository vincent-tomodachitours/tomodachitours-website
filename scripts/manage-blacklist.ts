#!/usr/bin/env ts-node

import { Redis } from '@upstash/redis';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface BlacklistEntry {
    identifier: string;
    reason: string;
    addedAt: number;
    expiresAt?: number;
    addedBy: string;
}

export class BlacklistManager {
    private redis: Redis;
    private readonly BLACKLIST_PREFIX = 'blacklist:';
    private readonly BLACKLIST_LOG = 'blacklist_log';

    constructor(redis?: Redis) {
        this.redis = redis || new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
    }

    async add(
        identifier: string,
        reason: string,
        addedBy: string,
        expirationDays?: number
    ): Promise<void> {
        const entry: BlacklistEntry = {
            identifier,
            reason,
            addedAt: Date.now(),
            addedBy,
        };

        if (expirationDays) {
            entry.expiresAt = Date.now() + expirationDays * 24 * 60 * 60 * 1000;
        }

        const key = this.BLACKLIST_PREFIX + identifier;
        await this.redis.set(key, JSON.stringify(entry));

        if (expirationDays) {
            await this.redis.expire(key, expirationDays * 24 * 60 * 60);
        }

        // Log the addition
        await this.redis.lpush(
            this.BLACKLIST_LOG,
            JSON.stringify({
                action: 'add',
                timestamp: Date.now(),
                entry,
            })
        );

        console.log(`Added ${identifier} to blacklist`);
    }

    async remove(identifier: string, removedBy: string): Promise<void> {
        const key = this.BLACKLIST_PREFIX + identifier;
        const entry = await this.redis.get(key) as string | null;

        if (!entry) {
            console.log(`${identifier} not found in blacklist`);
            return;
        }

        await this.redis.del(key);

        // Log the removal
        await this.redis.lpush(
            this.BLACKLIST_LOG,
            JSON.stringify({
                action: 'remove',
                timestamp: Date.now(),
                identifier,
                removedBy,
            })
        );

        console.log(`Removed ${identifier} from blacklist`);
    }

    async list(): Promise<void> {
        const keys = await this.redis.keys(this.BLACKLIST_PREFIX + '*') as string[];
        const entries: BlacklistEntry[] = [];

        for (const key of keys) {
            const entry = await this.redis.get(key) as string | null;
            if (entry) {
                entries.push(JSON.parse(entry));
            }
        }

        if (entries.length === 0) {
            console.log('No entries in blacklist');
            return;
        }

        console.log('\nCurrent Blacklist Entries:');
        console.log('==========================');

        entries.forEach(entry => {
            console.log(`\nIdentifier: ${entry.identifier}`);
            console.log(`Reason: ${entry.reason}`);
            console.log(`Added By: ${entry.addedBy}`);
            console.log(`Added At: ${new Date(entry.addedAt).toLocaleString()}`);
            if (entry.expiresAt) {
                console.log(`Expires At: ${new Date(entry.expiresAt).toLocaleString()}`);
            }
        });
    }

    async getHistory(limit: number = 50): Promise<void> {
        const logs = await this.redis.lrange(this.BLACKLIST_LOG, 0, limit - 1) as string[];

        if (logs.length === 0) {
            console.log('No history found');
            return;
        }

        console.log('\nBlacklist History:');
        console.log('=================');

        logs.forEach(log => {
            const entry = JSON.parse(log);
            console.log(`\nAction: ${entry.action.toUpperCase()}`);
            console.log(`Timestamp: ${new Date(entry.timestamp).toLocaleString()}`);
            if (entry.action === 'add') {
                console.log(`Identifier: ${entry.entry.identifier}`);
                console.log(`Reason: ${entry.entry.reason}`);
                console.log(`Added By: ${entry.entry.addedBy}`);
                if (entry.entry.expiresAt) {
                    console.log(`Expires At: ${new Date(entry.entry.expiresAt).toLocaleString()}`);
                }
            } else {
                console.log(`Identifier: ${entry.identifier}`);
                console.log(`Removed By: ${entry.removedBy}`);
            }
        });
    }

    async cleanup(): Promise<void> {
        const keys = await this.redis.keys(this.BLACKLIST_PREFIX + '*') as string[];
        let removed = 0;

        for (const key of keys) {
            const entry = await this.redis.get(key) as string | null;
            if (entry) {
                const parsed: BlacklistEntry = JSON.parse(entry);
                if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
                    await this.redis.del(key);
                    removed++;

                    // Log the automatic removal
                    await this.redis.lpush(
                        this.BLACKLIST_LOG,
                        JSON.stringify({
                            action: 'remove',
                            timestamp: Date.now(),
                            identifier: parsed.identifier,
                            removedBy: 'system:cleanup',
                        })
                    );
                }
            }
        }

        console.log(`Cleaned up ${removed} expired entries`);
    }
}

async function main() {
    const manager = new BlacklistManager();

    yargs(hideBin(process.argv))
        .command(
            'add <identifier> <reason>',
            'Add an identifier to the blacklist',
            (yargs) => {
                return yargs
                    .positional('identifier', {
                        describe: 'Email or IP to blacklist',
                        type: 'string',
                        demandOption: true,
                    })
                    .positional('reason', {
                        describe: 'Reason for blacklisting',
                        type: 'string',
                        demandOption: true,
                    })
                    .option('expiration', {
                        alias: 'e',
                        describe: 'Number of days until expiration',
                        type: 'number',
                    })
                    .option('addedBy', {
                        alias: 'b',
                        describe: 'Person adding the entry',
                        type: 'string',
                        default: process.env.USER || 'unknown',
                    });
            },
            async (argv) => {
                await manager.add(
                    argv.identifier as string,
                    argv.reason as string,
                    argv.addedBy as string,
                    argv.expiration
                );
            }
        )
        .command(
            'remove <identifier>',
            'Remove an identifier from the blacklist',
            (yargs) => {
                return yargs
                    .positional('identifier', {
                        describe: 'Email or IP to remove',
                        type: 'string',
                        demandOption: true,
                    })
                    .option('removedBy', {
                        alias: 'b',
                        describe: 'Person removing the entry',
                        type: 'string',
                        default: process.env.USER || 'unknown',
                    });
            },
            async (argv) => {
                await manager.remove(
                    argv.identifier as string,
                    argv.removedBy as string
                );
            }
        )
        .command(
            'list',
            'List all blacklist entries',
            (yargs) => yargs,
            async () => {
                await manager.list();
            }
        )
        .command(
            'history',
            'Show blacklist history',
            (yargs) => {
                return yargs.option('limit', {
                    alias: 'l',
                    describe: 'Number of entries to show',
                    type: 'number',
                    default: 50,
                });
            },
            async (argv) => {
                await manager.getHistory(argv.limit);
            }
        )
        .command(
            'cleanup',
            'Remove expired entries',
            (yargs) => yargs,
            async () => {
                await manager.cleanup();
            }
        )
        .demandCommand(1, 'You must provide a valid command')
        .strict()
        .help().argv;
}

main().catch(console.error); 