/**
 * Initialization Service for GTM
 * Handles GTM container loading and initialization
 */

import type { GTMInitializationOptions } from './types';
import { GTM_CONFIG } from './constants';
import { sessionService } from '../dynamicRemarketing/sessionService';
import migrationFeatureFlags from '../migrationFeatureFlags';

export class InitializationService {
    private isInitialized: boolean = false;
    private containerId: string | null = null;
    private fallbackToGtag: boolean = false;
    private migrationMode: boolean = true;

    /**
     * Check if GTM should be initialized based on migration flags
     */
    shouldInitializeGTM(): boolean {
        if (!this.migrationMode) {
            return true; // Always initialize if not in migration mode
        }

        return migrationFeatureFlags.shouldUseGTM();
    }

    /**
     * Initialize GTM container
     */
    async initialize(containerId: string | null = null, options: GTMInitializationOptions = {}): Promise<boolean> {
        try {
            // Use provided containerId or environment variable
            this.containerId = containerId || process.env.REACT_APP_GTM_CONTAINER_ID || null;

            if (!this.containerId) {
                console.warn('GTM: No container ID provided, falling back to gtag');
                this.fallbackToGtag = true;
                this.initializeFallback();
                return false;
            }

            // Check if GTM is already loaded
            if (window.google_tag_manager && window.google_tag_manager[this.containerId]) {
                console.log('GTM: Container already loaded');
                this.isInitialized = true;
                return true;
            }

            // Load GTM script
            await this.loadGTMScript(options);

            // Wait for GTM to initialize with timeout
            const initialized = await this.waitForGTMInitialization();

            if (initialized) {
                this.isInitialized = true;
                console.log('GTM: Successfully initialized');

                // Push initial configuration with session data
                this.pushInitialConfiguration();

                return true;
            } else {
                console.warn('GTM: Initialization timeout, falling back to gtag');
                this.fallbackToGtag = true;
                this.initializeFallback();
                return false;
            }

        } catch (error) {
            console.error('GTM: Initialization failed:', error);
            this.fallbackToGtag = true;
            this.initializeFallback();
            return false;
        }
    }

    /**
     * Load GTM script dynamically
     */
    private async loadGTMScript(options: GTMInitializationOptions = {}): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector(`script[src*="${this.containerId}"]`)) {
                resolve();
                return;
            }

            // Create GTM script
            const script = document.createElement('script');
            script.async = true;
            script.src = `${GTM_CONFIG.SCRIPT_BASE_URL}?id=${this.containerId}`;

            // Add auth and preview parameters if provided
            if (options.auth || process.env.REACT_APP_GTM_AUTH) {
                script.src += `&gtm_auth=${options.auth || process.env.REACT_APP_GTM_AUTH}`;
            }

            if (options.preview || process.env.REACT_APP_GTM_PREVIEW) {
                script.src += `&gtm_preview=${options.preview || process.env.REACT_APP_GTM_PREVIEW}`;
            }

            script.onload = () => {
                console.log('GTM: Script loaded successfully');
                resolve();
            };

            script.onerror = (error) => {
                console.error('GTM: Script loading failed:', error);
                reject(error);
            };

            // Insert script
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode!.insertBefore(script, firstScript);
        });
    }

    /**
     * Wait for GTM to initialize
     */
    private async waitForGTMInitialization(): Promise<boolean> {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkInitialization = () => {
                // Check if GTM is loaded
                if (window.google_tag_manager && window.google_tag_manager[this.containerId!]) {
                    resolve(true);
                    return;
                }

                // Check timeout
                if (Date.now() - startTime > GTM_CONFIG.INITIALIZATION_TIMEOUT) {
                    resolve(false);
                    return;
                }

                // Continue checking
                setTimeout(checkInitialization, 100);
            };

            checkInitialization();
        });
    }

    /**
     * Push initial configuration to dataLayer with session data
     */
    private pushInitialConfiguration(): void {
        if (window.dataLayer) {
            const sessionData = sessionService.getCurrentSessionData();

            window.dataLayer.push({
                event: 'gtm_initialized',
                gtm_container_id: this.containerId,
                gtm_service_version: GTM_CONFIG.SERVICE_VERSION,
                session_id: sessionData.sessionId,
                user_id: sessionData.userId,
                _timestamp: Date.now()
            });
        }
    }

    /**
     * Initialize fallback gtag functionality
     */
    private initializeFallback(): void {
        try {
            // Initialize gtag if not already available
            if (!window.gtag) {
                window.gtag = function () {
                    if (window.dataLayer) {
                        window.dataLayer.push(arguments);
                    }
                };
            }

            // Configure GA4 if measurement ID is available
            const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
            if (measurementId && window.gtag) {
                window.gtag('config', measurementId);
                console.log('GTM: Fallback gtag initialized with GA4');
            }

        } catch (error) {
            console.error('GTM: Fallback initialization failed:', error);
        }
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            containerId: this.containerId,
            fallbackMode: this.fallbackToGtag,
            migrationMode: this.migrationMode
        };
    }

    /**
     * Check if using fallback mode
     */
    isFallbackMode(): boolean {
        return this.fallbackToGtag;
    }

    /**
     * Get container ID
     */
    getContainerId(): string | null {
        return this.containerId;
    }
}

export const initializationService = new InitializationService();