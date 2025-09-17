/**
 * Data Layer Service for GTM GA4
 * Reuses event tracking patterns from existing services
 */

import type { GA4EventData } from './types';
import { sessionService } from '../dynamicRemarketing/sessionService';

export class DataLayerService {
    private debugMode: boolean;

    constructor(debugMode: boolean = false) {
        this.debugMode = debugMode;
        this.ensureDataLayerExists();
    }

    /**
     * Ensure dataLayer exists
     */
    private ensureDataLayerExists(): void {
        if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
        }
    }

    /**
     * Push event to dataLayer with enhanced data
     */
    pushEvent(eventData: GA4EventData): boolean {
        try {
            if (typeof window === 'undefined' || !window.dataLayer) {
                console.warn('GTM DataLayer: DataLayer not available');
                return false;
            }

            // Enhance event data with session information
            const sessionData = sessionService.getCurrentSessionData();
            const enhancedEventData = {
                ...eventData,
                _timestamp: Date.now(),
                _session_id: sessionData.sessionId,
                _user_id: sessionData.userId
            };

            window.dataLayer.push(enhancedEventData);

            if (this.debugMode) {
                console.log('GTM DataLayer: Event pushed:', enhancedEventData);
            }

            return true;
        } catch (error) {
            console.error('GTM DataLayer: Failed to push event:', error);
            return false;
        }
    }

    /**
     * Push multiple events to dataLayer
     */
    pushEvents(events: GA4EventData[]): boolean {
        try {
            let allSuccessful = true;
            events.forEach(event => {
                if (!this.pushEvent(event)) {
                    allSuccessful = false;
                }
            });
            return allSuccessful;
        } catch (error) {
            console.error('GTM DataLayer: Failed to push events:', error);
            return false;
        }
    }

    /**
     * Get dataLayer length
     */
    getDataLayerLength(): number {
        return (typeof window !== 'undefined' && window.dataLayer) ? window.dataLayer.length : 0;
    }

    /**
     * Check if dataLayer is available
     */
    isDataLayerAvailable(): boolean {
        return typeof window !== 'undefined' && Array.isArray(window.dataLayer);
    }

    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * Get debug mode status
     */
    isDebugMode(): boolean {
        return this.debugMode;
    }
}

export const dataLayerService = new DataLayerService();