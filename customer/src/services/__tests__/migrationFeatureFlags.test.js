/**
 * Migration Feature Flags Tests
 * Tests for the feature flag system functionality
 */

import migrationFeatureFlags from '../migrationFeatureFlags';

describe('MigrationFeatureFlags', () => {
    beforeEach(() => {
        // Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // Reset environment variables
        delete process.env.REACT_APP_GTM_ENABLED;
        delete process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE;

        // Clear console methods
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Flag Management', () => {
        test('should get flag from environment variables', () => {
            process.env.REACT_APP_GTM_ENABLED = 'true';

            const flag = migrationFeatureFlags.getFlag('GTM_ENABLED', false);
            expect(flag).toBe(true);
        });

        test('should get flag from localStorage override', () => {
            localStorage.setItem('migration_flag_GTM_ENABLED', 'true');

            const flag = migrationFeatureFlags.getFlag('GTM_ENABLED', false);
            expect(flag).toBe(true);
        });

        test('should return default value when flag not found', () => {
            const flag = migrationFeatureFlags.getFlag('NONEXISTENT_FLAG', true);
            expect(flag).toBe(true);
        });

        test('should update flag at runtime', () => {
            migrationFeatureFlags.updateFlag('gtmEnabled', true);

            expect(localStorage.getItem('migration_flag_gtmEnabled')).toBe('true');
            expect(migrationFeatureFlags.flags.gtmEnabled).toBe(true);
        });
    });

    describe('Migration Phase Determination', () => {
        test('should return rollback phase when emergency rollback enabled', () => {
            migrationFeatureFlags.flags.emergencyRollbackEnabled = true;

            const phase = migrationFeatureFlags.determineMigrationPhase();
            expect(phase).toBe('rollback');
        });

        test('should return legacy phase when GTM not enabled', () => {
            migrationFeatureFlags.flags.gtmEnabled = false;

            const phase = migrationFeatureFlags.determineMigrationPhase();
            expect(phase).toBe('legacy');
        });

        test('should return parallel phase when GTM and parallel tracking enabled', () => {
            migrationFeatureFlags.flags.gtmEnabled = true;
            migrationFeatureFlags.flags.gtmParallelTracking = true;

            const phase = migrationFeatureFlags.determineMigrationPhase();
            expect(phase).toBe('parallel');
        });

        test('should return full_gtm phase when all GTM components enabled', () => {
            migrationFeatureFlags.flags.gtmEnabled = true;
            migrationFeatureFlags.flags.gtmParallelTracking = false;
            migrationFeatureFlags.flags.gtmCheckoutTracking = true;
            migrationFeatureFlags.flags.gtmPaymentTracking = true;
            migrationFeatureFlags.flags.gtmThankyouTracking = true;

            const phase = migrationFeatureFlags.determineMigrationPhase();
            expect(phase).toBe('full_gtm');
        });
    });

    describe('Rollout Percentage', () => {
        test('should get rollout percentage from environment', () => {
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '50';

            const percentage = migrationFeatureFlags.getRolloutPercentage();
            expect(percentage).toBe(50);
        });

        test('should clamp rollout percentage to valid range', () => {
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '150';

            const percentage = migrationFeatureFlags.getRolloutPercentage();
            expect(percentage).toBe(100);
        });

        test('should default to 0 when not configured', () => {
            const percentage = migrationFeatureFlags.getRolloutPercentage();
            expect(percentage).toBe(0);
        });
    });

    describe('GTM Usage Decision', () => {
        test('should not use GTM when emergency rollback enabled', () => {
            migrationFeatureFlags.flags.emergencyRollbackEnabled = true;
            migrationFeatureFlags.flags.gtmEnabled = true;

            const shouldUse = migrationFeatureFlags.shouldUseGTM();
            expect(shouldUse).toBe(false);
        });

        test('should not use GTM when not enabled', () => {
            migrationFeatureFlags.flags.gtmEnabled = false;

            const shouldUse = migrationFeatureFlags.shouldUseGTM();
            expect(shouldUse).toBe(false);
        });

        test('should use GTM when rollout is 100%', () => {
            migrationFeatureFlags.flags.gtmEnabled = true;
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '100';

            const shouldUse = migrationFeatureFlags.shouldUseGTM();
            expect(shouldUse).toBe(true);
        });

        test('should use consistent session-based rollout', () => {
            migrationFeatureFlags.flags.gtmEnabled = true;
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '50';

            // First call should set session ID
            const firstResult = migrationFeatureFlags.shouldUseGTM();

            // Second call should return same result
            const secondResult = migrationFeatureFlags.shouldUseGTM();

            expect(firstResult).toBe(secondResult);
            expect(sessionStorage.getItem('migration_session_id')).toBeTruthy();
        });
    });

    describe('Component-Specific GTM Usage', () => {
        beforeEach(() => {
            migrationFeatureFlags.flags.gtmEnabled = true;
            process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE = '100';
        });

        test('should use GTM for checkout when flag enabled', () => {
            migrationFeatureFlags.flags.gtmCheckoutTracking = true;

            const shouldUse = migrationFeatureFlags.shouldUseGTMForComponent('checkout');
            expect(shouldUse).toBe(true);
        });

        test('should not use GTM for checkout when flag disabled', () => {
            migrationFeatureFlags.flags.gtmCheckoutTracking = false;

            const shouldUse = migrationFeatureFlags.shouldUseGTMForComponent('checkout');
            expect(shouldUse).toBe(false);
        });

        test('should not use GTM for component when GTM globally disabled', () => {
            migrationFeatureFlags.flags.gtmEnabled = false;
            migrationFeatureFlags.flags.gtmCheckoutTracking = true;

            const shouldUse = migrationFeatureFlags.shouldUseGTMForComponent('checkout');
            expect(shouldUse).toBe(false);
        });
    });

    describe('Session Management', () => {
        test('should create session ID when not exists', () => {
            const sessionId = migrationFeatureFlags.getOrCreateSessionId();

            expect(sessionId).toBeTruthy();
            expect(sessionStorage.getItem('migration_session_id')).toBe(sessionId);
        });

        test('should return existing session ID', () => {
            sessionStorage.setItem('migration_session_id', 'existing_id');

            const sessionId = migrationFeatureFlags.getOrCreateSessionId();
            expect(sessionId).toBe('existing_id');
        });
    });

    describe('Hash Function', () => {
        test('should produce consistent hash for same input', () => {
            const input = 'test_string';

            const hash1 = migrationFeatureFlags.hashString(input);
            const hash2 = migrationFeatureFlags.hashString(input);

            expect(hash1).toBe(hash2);
        });

        test('should produce different hashes for different inputs', () => {
            const hash1 = migrationFeatureFlags.hashString('input1');
            const hash2 = migrationFeatureFlags.hashString('input2');

            expect(hash1).not.toBe(hash2);
        });

        test('should return positive integers', () => {
            const hash = migrationFeatureFlags.hashString('test');

            expect(hash).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(hash)).toBe(true);
        });
    });

    describe('Event Tracking', () => {
        test('should track migration events when monitoring enabled', () => {
            migrationFeatureFlags.flags.migrationMonitoringEnabled = true;

            migrationFeatureFlags.trackMigrationEvent('test_event', { data: 'test' });

            const events = JSON.parse(localStorage.getItem('migration_events') || '[]');
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                event: 'test_event',
                data: 'test'
            });
        });

        test('should not track events when monitoring disabled', () => {
            migrationFeatureFlags.flags.migrationMonitoringEnabled = false;

            migrationFeatureFlags.trackMigrationEvent('test_event', { data: 'test' });

            const events = localStorage.getItem('migration_events');
            expect(events).toBeNull();
        });

        test('should limit stored events to 100', () => {
            migrationFeatureFlags.flags.migrationMonitoringEnabled = true;

            // Add 105 events
            for (let i = 0; i < 105; i++) {
                migrationFeatureFlags.trackMigrationEvent(`event_${i}`, {});
            }

            const events = JSON.parse(localStorage.getItem('migration_events') || '[]');
            expect(events).toHaveLength(100);
            expect(events[0].event).toBe('event_5'); // First 5 should be removed
        });
    });

    describe('Emergency Rollback', () => {
        test('should trigger emergency rollback', () => {
            const reason = 'Test rollback';

            migrationFeatureFlags.emergencyRollback(reason);

            expect(migrationFeatureFlags.flags.emergencyRollbackEnabled).toBe(true);
            expect(migrationFeatureFlags.flags.gtmEnabled).toBe(false);

            const events = JSON.parse(localStorage.getItem('migration_events') || '[]');
            const rollbackEvent = events.find(e => e.event === 'emergency_rollback_triggered');
            expect(rollbackEvent).toBeTruthy();
            expect(rollbackEvent.reason).toBe(reason);
        });

        test('should log error on emergency rollback', () => {
            const consoleSpy = jest.spyOn(console, 'error');

            migrationFeatureFlags.emergencyRollback('Test reason');

            expect(consoleSpy).toHaveBeenCalledWith(
                '[Migration] Emergency rollback triggered:',
                'Test reason'
            );
        });
    });

    describe('Migration Status', () => {
        test('should return comprehensive migration status', () => {
            const status = migrationFeatureFlags.getMigrationStatus();

            expect(status).toHaveProperty('phase');
            expect(status).toHaveProperty('rolloutPercentage');
            expect(status).toHaveProperty('shouldUseGTM');
            expect(status).toHaveProperty('shouldUseParallelTracking');
            expect(status).toHaveProperty('flags');
            expect(status).toHaveProperty('sessionId');
        });
    });

    describe('Event Management', () => {
        test('should get migration events', () => {
            const testEvents = [
                { event: 'test1', timestamp: Date.now() },
                { event: 'test2', timestamp: Date.now() }
            ];

            localStorage.setItem('migration_events', JSON.stringify(testEvents));

            const events = migrationFeatureFlags.getMigrationEvents();
            expect(events).toEqual(testEvents);
        });

        test('should clear migration events', () => {
            localStorage.setItem('migration_events', JSON.stringify([{ event: 'test' }]));

            migrationFeatureFlags.clearMigrationEvents();

            expect(localStorage.getItem('migration_events')).toBeNull();
        });

        test('should handle corrupted events data gracefully', () => {
            localStorage.setItem('migration_events', 'invalid_json');

            const events = migrationFeatureFlags.getMigrationEvents();
            expect(events).toEqual([]);
        });
    });
});