// Analytics initialization and automatic tracking setup

import { getShouldTrack, getShouldTrackMarketing } from './config';
import { trackEngagementTime } from './basicTracking';
import { initializeGoogleAdsTracking } from '../googleAdsTracker';
import attributionService from '../attributionService';
import offlineConversionService from '../offlineConversionService';
import privacyManager from '../privacyManager';
import performanceMonitor, { ERROR_TYPES } from '../performanceMonitor';

// Initialize enhanced measurement
export const initializeAnalytics = (): void => {
    console.log('initializeAnalytics called');

    try {
        // Initialize performance monitoring first
        performanceMonitor.initialize();

        // Make performance monitor available globally for debugging
        if (process.env.NODE_ENV === 'development') {
            window.performanceMonitor = performanceMonitor;
        }

        // Set up error monitoring for analytics initialization
        performanceMonitor.onError((error: any) => {
            if (error.type === ERROR_TYPES.SCRIPT_LOAD_FAILURE) {
                console.error('Analytics script loading failed:', error);
                // Could implement fallback tracking here
            }
        });

    } catch (error) {
        console.error('Performance monitor initialization failed:', error);
        // Continue with analytics initialization even if performance monitoring fails
    }

    // Initialize privacy manager
    try {
        privacyManager.initialize();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
            service: 'privacyManager',
            error: errorMessage,
            stack: errorStack
        });
        console.error('Privacy manager initialization failed:', error);
    }

    // Set up consent change listener to reinitialize tracking when consent changes
    privacyManager.onConsentChange((consentPreferences: any) => {
        console.log('Consent preferences changed:', consentPreferences);

        // Reinitialize tracking based on new consent
        if (getShouldTrack()) {
            initializeTrackingServices();
        } else {
            console.log('Analytics tracking disabled due to consent preferences');
        }
    });

    // Initial check for tracking
    if (!getShouldTrack()) {
        console.log('Analytics tracking disabled - no consent or development mode');
        return;
    }

    initializeTrackingServices();
};

// Separate function to initialize tracking services
const initializeTrackingServices = (): void => {
    console.log('Initializing tracking services with consent');

    // Initialize attribution service with cross-device tracking
    try {
        const startTime = performance.now();
        attributionService.initializeWithCrossDevice();
        const initTime = performance.now() - startTime;

        performanceMonitor.recordMetric('service_initialization_time', {
            service: 'attributionService',
            initTime: initTime,
            timestamp: Date.now()
        });

        // Make attribution service available globally for debugging
        if (process.env.NODE_ENV === 'development') {
            window.attributionService = attributionService;
        }

        console.log(`Attribution service initialized in ${initTime.toFixed(2)}ms`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
            service: 'attributionService',
            error: errorMessage,
            stack: errorStack
        });
        console.warn('Attribution service initialization failed:', error);
    }

    // Initialize offline conversion service (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            const startTime = performance.now();
            offlineConversionService.initialize();
            const initTime = performance.now() - startTime;

            performanceMonitor.recordMetric('service_initialization_time', {
                service: 'offlineConversionService',
                initTime: initTime,
                timestamp: Date.now()
            });

            // Make offline conversion service available globally for debugging
            if (process.env.NODE_ENV === 'development') {
                window.offlineConversionService = offlineConversionService;
            }

            console.log(`Offline conversion service initialized in ${initTime.toFixed(2)}ms`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
                service: 'offlineConversionService',
                error: errorMessage,
                stack: errorStack
            });
            console.warn('Offline conversion service initialization failed:', error);
        }
    }

    // Initialize Google Ads tracking (only if marketing consent given)
    if (getShouldTrackMarketing()) {
        try {
            const startTime = performance.now();
            initializeGoogleAdsTracking();
            const initTime = performance.now() - startTime;

            performanceMonitor.recordMetric('service_initialization_time', {
                service: 'googleAdsTracking',
                initTime: initTime,
                timestamp: Date.now()
            });

            console.log(`Google Ads tracking initialized in ${initTime.toFixed(2)}ms`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
                service: 'googleAdsTracking',
                error: errorMessage,
                stack: errorStack
            });
            console.warn('Google Ads tracking initialization failed:', error);
        }
    } else {
        console.log('Google Ads tracking disabled - no marketing consent');
    }



    // Set up engagement time tracking with error handling
    let startTime = Date.now();
    let isActive = true;

    const trackEngagementAutomatically = (): void => {
        try {
            if (isActive) {
                const engagementTime = Math.round((Date.now() - startTime) / 1000);
                if (engagementTime > 10) { // Only track meaningful engagement
                    trackEngagementTime(engagementTime);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                function: 'trackEngagementAutomatically',
                error: errorMessage,
                stack: errorStack,
                engagementTime: Math.round((Date.now() - startTime) / 1000)
            });
        }
    };

    // Event listeners with error handling
    try {
        window.addEventListener('beforeunload', trackEngagementAutomatically);

        // Set up visibility change listener
        // In Jest test environment, use global.document, otherwise use regular document
        if (typeof (global as any).jest !== 'undefined' && global.document && global.document.addEventListener) {
            console.log('Using global.document.addEventListener in test environment');
            global.document.addEventListener('visibilitychange', () => {
                try {
                    const isHidden = global.document.hidden;
                    if (isHidden) {
                        isActive = false;
                        trackEngagementAutomatically();
                    } else {
                        isActive = true;
                        startTime = Date.now();
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorStack = error instanceof Error ? error.stack : undefined;
                    performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                        function: 'visibilitychange_handler',
                        error: errorMessage,
                        stack: errorStack
                    });
                }
            });
        } else {
            console.log('Using regular document.addEventListener');
            document.addEventListener('visibilitychange', () => {
                try {
                    if (document.hidden) {
                        isActive = false;
                        trackEngagementAutomatically();
                    } else {
                        isActive = true;
                        startTime = Date.now();
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorStack = error instanceof Error ? error.stack : undefined;
                    performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                        function: 'visibilitychange_handler',
                        error: errorMessage,
                        stack: errorStack
                    });
                }
            });
        }

        console.log('Event listeners set up successfully');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
            function: 'event_listeners_setup',
            error: errorMessage,
            stack: errorStack
        });
        console.error('Failed to set up event listeners:', error);
    }

    console.log('Google Analytics 4 and Google Ads tracking initialized with privacy compliance');
};