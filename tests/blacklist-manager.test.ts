import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Redis } from '@upstash/redis';
import { BlacklistManager } from '../scripts/manage-blacklist';

// Mock Redis
vi.mock('@upstash/redis');

describe('Blacklist Manager', () => {
    let redis: Redis;
    let manager: BlacklistManager;

    beforeEach(() => {
        // Reset Redis mock
        redis = {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            lpush: vi.fn(),
            lrange: vi.fn(),
            ltrim: vi.fn(),
            expire: vi.fn(),
            keys: vi.fn(),
        } as unknown as Redis;

        // Reset console.log mock to prevent noise in test output
        console.log = vi.fn();

        // Create new manager instance
        manager = new BlacklistManager(redis);

        // Mock Date.now() to return a consistent timestamp
        vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Adding Entries', () => {
        it('should add an entry without expiration', async () => {
            const identifier = 'test@example.com';
            const reason = 'Suspicious activity';
            const addedBy = 'admin';

            await manager.add(identifier, reason, addedBy);

            expect(redis.set).toHaveBeenCalledWith(
                'blacklist:test@example.com',
                expect.stringContaining('"reason":"Suspicious activity"')
            );
            expect(redis.lpush).toHaveBeenCalledWith(
                'blacklist_log',
                expect.stringContaining('"action":"add"')
            );
        });

        it('should add an entry with expiration', async () => {
            const identifier = 'test@example.com';
            const reason = 'Temporary block';
            const addedBy = 'admin';
            const expirationDays = 7;

            await manager.add(identifier, reason, addedBy, expirationDays);

            expect(redis.set).toHaveBeenCalledWith(
                'blacklist:test@example.com',
                expect.stringContaining('"reason":"Temporary block"')
            );
            expect(redis.expire).toHaveBeenCalledWith(
                'blacklist:test@example.com',
                7 * 24 * 60 * 60
            );
        });
    });

    describe('Removing Entries', () => {
        it('should remove an existing entry', async () => {
            const identifier = 'test@example.com';
            const removedBy = 'admin';

            vi.mocked(redis.get).mockResolvedValue(JSON.stringify({
                identifier,
                reason: 'Test reason',
                addedAt: Date.now(),
                addedBy: 'someone',
            }));

            await manager.remove(identifier, removedBy);

            expect(redis.del).toHaveBeenCalledWith('blacklist:test@example.com');
            expect(redis.lpush).toHaveBeenCalledWith(
                'blacklist_log',
                expect.stringContaining('"action":"remove"')
            );
        });

        it('should handle non-existent entry removal gracefully', async () => {
            const identifier = 'nonexistent@example.com';
            const removedBy = 'admin';

            vi.mocked(redis.get).mockResolvedValue(null);

            await manager.remove(identifier, removedBy);

            expect(redis.del).not.toHaveBeenCalled();
            expect(redis.lpush).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('not found in blacklist')
            );
        });
    });

    describe('Listing Entries', () => {
        it('should list all entries', async () => {
            const entries = [
                {
                    identifier: 'test1@example.com',
                    reason: 'Reason 1',
                    addedAt: Date.now(),
                    addedBy: 'admin1',
                },
                {
                    identifier: 'test2@example.com',
                    reason: 'Reason 2',
                    addedAt: Date.now(),
                    addedBy: 'admin2',
                    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
                },
            ];

            vi.mocked(redis.keys).mockResolvedValue([
                'blacklist:test1@example.com',
                'blacklist:test2@example.com',
            ]);

            vi.mocked(redis.get).mockImplementation(async (key) => {
                const index = key === 'blacklist:test1@example.com' ? 0 : 1;
                return JSON.stringify(entries[index]);
            });

            await manager.list();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Current Blacklist Entries')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('test1@example.com')
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('test2@example.com')
            );
        });

        it('should handle empty blacklist', async () => {
            vi.mocked(redis.keys).mockResolvedValue([]);

            await manager.list();

            expect(console.log).toHaveBeenCalledWith('No entries in blacklist');
        });
    });

    describe('History', () => {
        it('should show history with default limit', async () => {
            const logs = [
                {
                    action: 'add',
                    timestamp: Date.now(),
                    entry: {
                        identifier: 'test@example.com',
                        reason: 'Test reason',
                        addedAt: Date.now(),
                        addedBy: 'admin',
                    },
                },
                {
                    action: 'remove',
                    timestamp: Date.now() + 1000,
                    identifier: 'test@example.com',
                    removedBy: 'admin',
                },
            ];

            vi.mocked(redis.lrange).mockResolvedValue(
                logs.map(log => JSON.stringify(log))
            );

            await manager.getHistory();

            expect(redis.lrange).toHaveBeenCalledWith('blacklist_log', 0, 49);
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('Blacklist History')
            );
        });

        it('should handle empty history', async () => {
            vi.mocked(redis.lrange).mockResolvedValue([]);

            await manager.getHistory();

            expect(console.log).toHaveBeenCalledWith('No history found');
        });
    });

    describe('Cleanup', () => {
        it('should remove expired entries', async () => {
            const now = Date.now();
            const entries = [
                {
                    identifier: 'expired@example.com',
                    reason: 'Expired entry',
                    addedAt: now - 8 * 24 * 60 * 60 * 1000,
                    expiresAt: now - 24 * 60 * 60 * 1000,
                    addedBy: 'admin',
                },
                {
                    identifier: 'valid@example.com',
                    reason: 'Valid entry',
                    addedAt: now,
                    expiresAt: now + 7 * 24 * 60 * 60 * 1000,
                    addedBy: 'admin',
                },
            ];

            vi.mocked(redis.keys).mockResolvedValue([
                'blacklist:expired@example.com',
                'blacklist:valid@example.com',
            ]);

            vi.mocked(redis.get).mockImplementation(async (key) => {
                const index = key === 'blacklist:expired@example.com' ? 0 : 1;
                return JSON.stringify(entries[index]);
            });

            await manager.cleanup();

            expect(redis.del).toHaveBeenCalledWith('blacklist:expired@example.com');
            expect(redis.del).not.toHaveBeenCalledWith('blacklist:valid@example.com');
            expect(redis.lpush).toHaveBeenCalledWith(
                'blacklist_log',
                expect.stringContaining('"action":"remove"')
            );
            expect(console.log).toHaveBeenCalledWith('Cleaned up 1 expired entries');
        });

        it('should handle no expired entries', async () => {
            const now = Date.now();
            const entries = [
                {
                    identifier: 'valid1@example.com',
                    reason: 'Valid entry 1',
                    addedAt: now,
                    expiresAt: now + 7 * 24 * 60 * 60 * 1000,
                    addedBy: 'admin',
                },
                {
                    identifier: 'valid2@example.com',
                    reason: 'Valid entry 2',
                    addedAt: now,
                    addedBy: 'admin',
                },
            ];

            vi.mocked(redis.keys).mockResolvedValue([
                'blacklist:valid1@example.com',
                'blacklist:valid2@example.com',
            ]);

            vi.mocked(redis.get).mockImplementation(async (key) => {
                const index = key === 'blacklist:valid1@example.com' ? 0 : 1;
                return JSON.stringify(entries[index]);
            });

            await manager.cleanup();

            expect(redis.del).not.toHaveBeenCalled();
            expect(redis.lpush).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Cleaned up 0 expired entries');
        });
    });
}); 