// Analytics initialization and automatic tracking setup

import { getShouldTrack, getShouldTrackMarketing } from './config.js';
import { trackEngagementTime } from './basicTracking.js';
import { initializeGoogleAdsTracking } from '../googleAdsTracker.js';
import attributionService from '../attributionService.js';
import offlineConversionService from '../offlineConversionService.js';
import privacyManager from '../privacyManager.js';
import performanceMonitor, { ERROR_TYPES } from '../performanceMonitor.js';

// Initialize enhanced measurement
export const initializeAnalytics = () => {
    console.log('initializeAnalytics called');

    try {
        // Initialize performance monitoring first
        performanceMonitor.initialize();

        // Make performance monitor available globally for debugging
        if (process.env.NODE_ENV === 'development') {
            window.performanceMonitor = performanceMonitor;
        }

        // Set up error monitoring for analytics initialization
        performanceMonitor.onError((error) => {
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
        performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
            service: 'privacyManager',
            error: error.message,
            stack: error.stack
        });
        console.error('Privacy manager initialization failed:', error);
    }

    // Set up consent change listener to reinitialize tracking when consent changes
    privacyManager.onConsentChange((consentPreferences) => {
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
const initializeTrackingServices = () => {
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
        performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
            service: 'attributionService',
            error: error.message,
            stack: error.stack
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
            performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
                service: 'offlineConversionService',
                error: error.message,
                stack: error.stack
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
            performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
                service: 'googleAdsTracking',
                error: error.message,
                stack: error.stack
            });
            console.warn('Google Ads tracking initialization failed:', error);
        }
    } else {
        console.log('Google Ads tracking disabled - no marketing consent');
    }



    // Set up engagement time tracking with error handling
    let startTime = Date.now();
    let isActive = true;

    const trackEngagementAutomatically = () => {
        try {
            if (isActive) {
                const engagementTime = Math.round((Date.now() - startTime) / 1000);
                if (engagementTime > 10) { // Only track meaningful engagement
                    trackEngagementTime(engagementTime);
                }
            }
        } catch (error) {
            performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                function: 'trackEngagementAutomatically',
                error: error.message,
                stack: error.stack,
                engagementTime: Math.round((Date.now() - startTime) / 1000)
            });
        }
    };

    // Event listeners with error handling
    try {
        window.addEventListener('beforeunload', trackEngagementAutomatically);

        // Set up visibility change listener
        // In Jest test environment, use global.document, otherwise use regular document
        if (typeof jest !== 'undefined' && global.document && global.document.addEventListener) {
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
                    performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                        function: 'visibilitychange_handler',
                        error: error.message,
                        stack: error.stack
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
                    performanceMonitor.handleError(ERROR_TYPES.TRACKING_FAILURE, {
                        function: 'visibilitychange_handler',
                        error: error.message,
                        stack: error.stack
                    });
                }
            });
        }

        console.log('Event listeners set up successfully');
    } catch (error) {
        performanceMonitor.handleError(ERROR_TYPES.CONFIGURATION_ERROR, {
            function: 'event_listeners_setup',
            error: error.message,
            stack: error.stack
        });
        console.error('Failed to set up event listeners:', error);
    }

    console.log('Google Analytics 4 and Google Ads tracking initialized with privacy compliance');
};