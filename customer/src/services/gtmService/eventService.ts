/**
 * Event Service for GTM
 * Reuses dataLayer service and session management
 */

import type { DataLayerEvent } from './types';
import { GTM_EVENTS } from './constants';
import { dataLayerService } from '../gtm/dataLayerService';
import { initializationService } from './initializationService';
import migrationFeatureFlags from '../migrationFeatureFlags';

export class EventService {
    private debugMode: boolean = false;
    private migrationMode: boolean = true;

    /**
     * Push event to dataLayer
     */
    pushEvent(eventName: string, eventData: Record<string, any> = {}, _options: Record<string, any> = {}): void {
        if (!eventName) {
            console.warn('GTM: Event name is required');
            return;
        }

        // Check if GTM should be used based on migration flags
        if (this.migrationMode && !migrationFeatureFlags.shouldUseGTM()) {
            if (this.debugMode) {
                console.log('GTM: Event skipped due to migration flags:', eventName);
            }
            return;
        }

        try {
            const dataLayerEvent: DataLayerEvent = {
                event: eventName,
                ...eventData,
                _timestamp: Date.now()
            };

            // Add migration information if in migration mode
            if (this.migrationMode) {
                const migrationStatus = migrationFeatureFlags.getMigrationStatus();
                dataLayerEvent._migration = {
                    phase: migrationStatus.phase,
                    sessionId: migrationStatus.sessionId,
                    rolloutPercentage: migrationStatus.rolloutPercentage
                };
            }

            // Add debug information if in debug mode
            if (this.debugMode) {
                const status = initializationService.getStatus();
                dataLayerEvent._debug = {
                    source: 'gtmService',
                    containerId: status.containerId,
                    fallbackMode: status.fallbackMode,
                    migrationMode: this.migrationMode
                };
            }

            // Use the existing dataLayer service
            const success = dataLayerService.pushEvent(dataLayerEvent);

            if (this.debugMode) {
                console.log('GTM: Event pushed to dataLayer:', dataLayerEvent);
            }

            // Track migration event
            if (this.migrationMode) {
                migrationFeatureFlags.trackMigrationEvent('gtm_event_pushed', {
                    eventName,
                    containerId: initializationService.getContainerId(),
                    fallbackMode: initializationService.isFallbackMode()
                });
            }

            // If GTM failed to load, use fallback gtag
            if (initializationService.isFallbackMode() && !success) {
                this.fallbackEventTracking(eventName, eventData);
            }

        } catch (error) {
            console.error('GTM: Failed to push event:', error);

            // Track migration error
            if (this.migrationMode) {
                migrationFeatureFlags.trackMigrationEvent('gtm_event_push_failed', {
                    eventName,
                    error: (error as Error).message
                });
            }

            // Fallback to gtag if available
            if (initializationService.isFallbackMode()) {
                this.fallbackEventTracking(eventName, eventData);
            }
        }
    }

    /**
     * Set user properties in dataLayer
     */
    setUserProperties(properties: Record<string, any> = {}): void {
        if (!properties || typeof properties !== 'object') {
            console.warn('GTM: User properties must be an object');
            return;
        }

        try {
            const userPropertiesEvent = {
                event: GTM_EVENTS.SET_USER_PROPERTIES,
                user_properties: properties,
                _timestamp: Date.now()
            };

            dataLayerService.pushEvent(userPropertiesEvent);

            if (this.debugMode) {
                console.log('GTM: User properties set:', userPropertiesEvent);
            }

            // Fallback to gtag if needed
            if (initializationService.isFallbackMode() && window.gtag) {
                window.gtag('set', 'user_properties', properties);
            }

        } catch (error) {
            console.error('GTM: Failed to set user properties:', error);
        }
    }

    /**
     * Enable debug mode for detailed logging
     */
    enableDebugMode(enabled: boolean = true): void {
        this.debugMode = enabled;
        dataLayerService.setDebugMode(enabled);

        // Also enable debug mode for event tracking service
        const { eventTrackingService } = require('../gtm/eventTrackingService');
        eventTrackingService.setDebugMode(enabled);

        if (enabled) {
            console.log('GTM: Debug mode enabled');

            // Push debug configuration to dataLayer
            dataLayerService.pushEvent({
                event: GTM_EVENTS.DEBUG_MODE,
                debug_mode: true,
                _timestamp: Date.now()
            });
        }
    }

    /**
     * Validate if a specific tag is firing
     */
    async validateTagFiring(tagName: string): Promise<boolean> {
        if (!tagName) {
            console.warn('GTM: Tag name is required for validation');
            return false;
        }

        try {
            // Push validation event
            const validationId = `validation_${Date.now()}`;

            dataLayerService.pushEvent({
                event: GTM_EVENTS.TAG_VALIDATION,
                tag_name: tagName,
                validation_id: validationId,
                _timestamp: Date.now()
            });

            // Wait for validation response (simplified approach)
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (this.debugMode) {
                console.log(`GTM: Tag validation requested for: ${tagName}`);
            }

            return true;

        } catch (error) {
            console.error('GTM: Tag validation failed:', error);
            return false;
        }
    }

    /**
     * Fallback event tracking using gtag
     */
    private fallbackEventTracking(eventName: string, eventData: Record<string, any>): void {
        try {
            if (window.gtag) {
                window.gtag('event', eventName, eventData);

                if (this.debugMode) {
                    console.log('GTM: Fallback gtag event:', eventName, eventData);
                }
            }
        } catch (error) {
            console.error('GTM: Fallback event tracking failed:', error);
        }
    }

    /**
     * Get debug mode status
     */
    isDebugMode(): boolean {
        return this.debugMode;
    }
}

export const eventService = new EventService();