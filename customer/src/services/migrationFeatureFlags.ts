/**
 * Feature Flag System for GTM Migration
 * Manages gradual rollout of GTM tracking alongside existing system
 */

interface FeatureFlags {
    // Core GTM migration flags
    gtmEnabled: boolean;
    gtmParallelTracking: boolean;

    // Component-specific migration flags
    gtmCheckoutTracking: boolean;
    gtmPaymentTracking: boolean;
    gtmThankyouTracking: boolean;

    // Advanced features
    enhancedConversionsEnabled: boolean;
    serverSideBackupEnabled: boolean;

    // Migration monitoring
    migrationMonitoringEnabled: boolean;
    conversionValidationEnabled: boolean;

    // Rollback controls
    emergencyRollbackEnabled: boolean;
    legacyTrackingFallback: boolean;
}

type MigrationPhase = 'rollback' | 'legacy' | 'parallel' | 'full_gtm' | 'partial_gtm';

interface MigrationEvent {
    timestamp: string;
    event: string;
    migrationPhase: MigrationPhase;
    sessionId: string;
    [key: string]: any;
}

interface MigrationStatus {
    phase: MigrationPhase;
    rolloutPercentage: number;
    shouldUseGTM: boolean;
    shouldUseParallelTracking: boolean;
    flags: FeatureFlags;
    sessionId: string;
}

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

class MigrationFeatureFlags {
    private flags: FeatureFlags;
    private migrationPhase: MigrationPhase;
    private rolloutPercentage: number;

    constructor() {
        this.flags = {
            // Core GTM migration flags
            gtmEnabled: this.getFlag('GTM_ENABLED', false),
            gtmParallelTracking: this.getFlag('GTM_PARALLEL_TRACKING', true),

            // Component-specific migration flags
            gtmCheckoutTracking: this.getFlag('GTM_CHECKOUT_TRACKING', false),
            gtmPaymentTracking: this.getFlag('GTM_PAYMENT_TRACKING', false),
            gtmThankyouTracking: this.getFlag('GTM_THANKYOU_TRACKING', false),

            // Advanced features
            enhancedConversionsEnabled: this.getFlag('ENHANCED_CONVERSIONS_ENABLED', false),
            serverSideBackupEnabled: this.getFlag('SERVER_SIDE_BACKUP_ENABLED', false),

            // Migration monitoring
            migrationMonitoringEnabled: this.getFlag('MIGRATION_MONITORING_ENABLED', true),
            conversionValidationEnabled: this.getFlag('CONVERSION_VALIDATION_ENABLED', true),

            // Rollback controls
            emergencyRollbackEnabled: this.getFlag('EMERGENCY_ROLLBACK_ENABLED', false),
            legacyTrackingFallback: this.getFlag('LEGACY_TRACKING_FALLBACK', true)
        };

        this.migrationPhase = this.determineMigrationPhase();
        this.rolloutPercentage = this.getRolloutPercentage();

        // Initialize monitoring if enabled
        if (this.flags.migrationMonitoringEnabled) {
            this.initializeMigrationMonitoring();
        }
    }

    /**
     * Get feature flag value from environment or localStorage
     */
    getFlag(flagName: string, defaultValue: boolean): boolean {
        // Check environment variables first
        const envValue = process.env[`REACT_APP_${flagName}`];
        if (envValue !== undefined) {
            return envValue === 'true';
        }

        // Check localStorage for runtime overrides (browser only)
        const localValue = (typeof localStorage !== 'undefined') ? localStorage.getItem(`migration_flag_${flagName}`) : null;
        if (localValue !== null) {
            return localValue === 'true';
        }

        return defaultValue;
    }

    /**
     * Determine current migration phase based on flags
     */
    determineMigrationPhase(): MigrationPhase {
        if (this.flags.emergencyRollbackEnabled) {
            return 'rollback';
        }

        if (!this.flags.gtmEnabled) {
            return 'legacy';
        }

        if (this.flags.gtmParallelTracking) {
            return 'parallel';
        }

        if (this.flags.gtmCheckoutTracking && this.flags.gtmPaymentTracking && this.flags.gtmThankyouTracking) {
            return 'full_gtm';
        }

        return 'partial_gtm';
    }

    /**
     * Get rollout percentage for gradual deployment
     */
    getRolloutPercentage(): number {
        const percentage = parseInt(process.env.REACT_APP_GTM_ROLLOUT_PERCENTAGE || '0');
        return Math.max(0, Math.min(100, percentage));
    }

    /**
     * Check if user should receive GTM tracking based on rollout percentage
     */
    shouldUseGTM(): boolean {
        if (this.flags.emergencyRollbackEnabled) {
            return false;
        }

        if (!this.flags.gtmEnabled) {
            return false;
        }

        // Always use GTM if rollout is 100%
        if (this.rolloutPercentage >= 100) {
            return true;
        }

        // Use session-based consistent rollout
        const sessionId = this.getOrCreateSessionId();
        const hash = this.hashString(sessionId);
        const userPercentile = hash % 100;

        return userPercentile < this.rolloutPercentage;
    }

    /**
     * Check if parallel tracking should be enabled
     */
    shouldUseParallelTracking(): boolean {
        return this.flags.gtmParallelTracking && this.shouldUseGTM();
    }

    /**
     * Check if specific component should use GTM
     */
    shouldUseGTMForComponent(component: string): boolean {
        if (!this.shouldUseGTM()) {
            return false;
        }

        const componentFlags: Record<string, boolean> = {
            checkout: this.flags.gtmCheckoutTracking,
            payment: this.flags.gtmPaymentTracking,
            thankyou: this.flags.gtmThankyouTracking
        };

        return componentFlags[component] || false;
    }

    /**
     * Get or create session ID for consistent rollout
     */
    getOrCreateSessionId(): string {
        if (typeof sessionStorage === 'undefined') {
            return 'server_session_' + Math.random().toString(36).substring(2, 15);
        }

        let sessionId = sessionStorage.getItem('migration_session_id');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('migration_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Simple hash function for consistent user bucketing
     */
    hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Initialize migration monitoring
     */
    initializeMigrationMonitoring(): void {
        // Track migration events
        this.trackMigrationEvent('migration_phase_determined', {
            phase: this.migrationPhase,
            rolloutPercentage: this.rolloutPercentage,
            shouldUseGTM: this.shouldUseGTM(),
            flags: this.flags
        });
    }

    /**
     * Track migration-related events
     */
    trackMigrationEvent(eventName: string, data: any): void {
        if (!this.flags.migrationMonitoringEnabled) {
            return;
        }

        const event: MigrationEvent = {
            timestamp: new Date().toISOString(),
            event: eventName,
            migrationPhase: this.migrationPhase,
            sessionId: this.getOrCreateSessionId(),
            ...data
        };

        // Store in localStorage for debugging (browser only)
        if (typeof localStorage !== 'undefined') {
            const events = JSON.parse(localStorage.getItem('migration_events') || '[]');
            events.push(event);

            // Keep only last 100 events
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }

            localStorage.setItem('migration_events', JSON.stringify(events));
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Migration]', eventName, data);
        }
    }

    /**
     * Update feature flag at runtime
     */
    updateFlag(flagName: keyof FeatureFlags, value: boolean): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`migration_flag_${flagName}`, value.toString());
        }
        this.flags[flagName] = value;

        // Recalculate migration phase
        this.migrationPhase = this.determineMigrationPhase();

        this.trackMigrationEvent('flag_updated', {
            flagName,
            value,
            newPhase: this.migrationPhase
        });
    }

    /**
     * Get current migration status
     */
    getMigrationStatus(): MigrationStatus {
        return {
            phase: this.migrationPhase,
            rolloutPercentage: this.rolloutPercentage,
            shouldUseGTM: this.shouldUseGTM(),
            shouldUseParallelTracking: this.shouldUseParallelTracking(),
            flags: { ...this.flags },
            sessionId: this.getOrCreateSessionId()
        };
    }

    /**
     * Emergency rollback - disable all GTM features
     */
    emergencyRollback(reason: string): void {
        this.updateFlag('emergencyRollbackEnabled', true);
        this.updateFlag('gtmEnabled', false);

        this.trackMigrationEvent('emergency_rollback_triggered', {
            reason,
            timestamp: new Date().toISOString()
        });

        // Alert monitoring systems
        if (window.gtag) {
            window.gtag('event', 'migration_emergency_rollback', {
                event_category: 'migration',
                event_label: reason
            });
        }

        console.error('[Migration] Emergency rollback triggered:', reason);
    }

    /**
     * Get migration events for debugging
     */
    getMigrationEvents(): MigrationEvent[] {
        if (typeof localStorage === 'undefined') return [];
        return JSON.parse(localStorage.getItem('migration_events') || '[]');
    }

    /**
     * Clear migration events
     */
    clearMigrationEvents(): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('migration_events');
        }
    }
}

// Create singleton instance
const migrationFeatureFlags = new MigrationFeatureFlags();

export default migrationFeatureFlags;