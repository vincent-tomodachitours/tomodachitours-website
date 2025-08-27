/**
 * GTM Testing Utilities
 * Provides testing and validation tools for GTM conversion tracking
 */

class GTMTestingUtils {
    constructor() {
        this.testEvents = [];
        this.debugMode = false;
    }

    /**
     * Enable GTM preview mode for testing
     * @param {string} containerId - GTM container ID
     * @param {string} previewToken - Preview token from GTM interface
     */
    enablePreviewMode(containerId, previewToken) {
        if (!containerId || !previewToken) {
            console.error('GTM Testing: Container ID and preview token are required');
            return false;
        }

        try {
            // Add preview parameters to GTM script
            const gtmScript = document.querySelector(`script[src*="${containerId}"]`);
            if (gtmScript) {
                const currentSrc = gtmScript.src;
                if (!currentSrc.includes('gtm_preview')) {
                    gtmScript.src = `${currentSrc}&gtm_preview=${previewToken}&gtm_cookies_win=x`;
                    console.log('GTM Testing: Preview mode enabled');
                    return true;
                }
            }

            // If script doesn't exist, create it with preview parameters
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}&gtm_preview=${previewToken}&gtm_cookies_win=x`;

            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(script, firstScript);

            console.log('GTM Testing: Preview mode script created');
            return true;

        } catch (error) {
            console.error('GTM Testing: Failed to enable preview mode:', error);
            return false;
        }
    }

    /**
     * Test conversion tag firing with sample data
     * @param {string} conversionType - Type of conversion to test
     * @param {Object} testData - Test data for the conversion
     */
    testConversionTagFiring(conversionType, testData = {}) {
        const testId = `test_${Date.now()}`;

        // Default test data based on conversion type
        const defaultTestData = {
            purchase: {
                value: 15000,
                currency: 'JPY',
                transaction_id: `test_txn_${testId}`,
                items: [{
                    item_id: 'morning_tour',
                    item_name: 'Morning Arashiyama Tour',
                    item_category: 'tour',
                    price: 15000,
                    quantity: 1
                }],
                tour_id: 'morning_tour',
                tour_name: 'Morning Arashiyama Tour',
                booking_date: '2025-01-15',
                payment_provider: 'stripe'
            },
            begin_checkout: {
                value: 15000,
                currency: 'JPY',
                items: [{
                    item_id: 'morning_tour',
                    item_name: 'Morning Arashiyama Tour',
                    item_category: 'tour',
                    price: 15000,
                    quantity: 1
                }],
                tour_id: 'morning_tour',
                tour_name: 'Morning Arashiyama Tour'
            },
            view_item: {
                value: 15000,
                currency: 'JPY',
                items: [{
                    item_id: 'morning_tour',
                    item_name: 'Morning Arashiyama Tour',
                    item_category: 'tour',
                    price: 15000,
                    quantity: 1
                }],
                tour_id: 'morning_tour',
                tour_name: 'Morning Arashiyama Tour',
                item_category: 'tour'
            },
            add_payment_info: {
                value: 15000,
                currency: 'JPY',
                payment_provider: 'stripe',
                tour_id: 'morning_tour'
            }
        };

        const eventData = { ...defaultTestData[conversionType], ...testData };

        // Add test identifier
        eventData._test_id = testId;
        eventData._test_timestamp = Date.now();

        try {
            // Push test event to dataLayer
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'google_ads_conversion',
                event_category: 'test',
                event_label: conversionType,
                ...eventData
            });

            // Also push standard ecommerce event
            window.dataLayer.push({
                event: conversionType,
                ...eventData
            });

            // Record test event
            this.testEvents.push({
                testId,
                conversionType,
                eventData,
                timestamp: Date.now(),
                status: 'fired'
            });

            console.log(`GTM Testing: Test conversion fired - ${conversionType}:`, eventData);
            return testId;

        } catch (error) {
            console.error(`GTM Testing: Failed to fire test conversion ${conversionType}:`, error);
            return null;
        }
    }

    /**
     * Test all conversion types with sample data
     */
    testAllConversions() {
        const results = {};

        const conversionTypes = ['view_item', 'begin_checkout', 'add_payment_info', 'purchase'];

        conversionTypes.forEach(type => {
            const testId = this.testConversionTagFiring(type);
            results[type] = {
                testId,
                success: testId !== null
            };
        });

        console.log('GTM Testing: All conversion tests completed:', results);
        return results;
    }

    /**
     * Validate GTM container loading
     */
    validateGTMLoading(containerId) {
        const validation = {
            containerLoaded: false,
            dataLayerExists: false,
            gtmObjectExists: false,
            scriptsLoaded: false
        };

        try {
            // Check if dataLayer exists
            validation.dataLayerExists = Array.isArray(window.dataLayer);

            // Check if GTM container is loaded
            validation.containerLoaded = !!(window.google_tag_manager && window.google_tag_manager[containerId]);

            // Check if GTM object exists
            validation.gtmObjectExists = !!window.google_tag_manager;

            // Check if GTM scripts are loaded
            const gtmScripts = document.querySelectorAll(`script[src*="${containerId}"]`);
            validation.scriptsLoaded = gtmScripts.length > 0;

            console.log('GTM Testing: Container validation:', validation);
            return validation;

        } catch (error) {
            console.error('GTM Testing: Container validation failed:', error);
            return validation;
        }
    }

    /**
     * Monitor dataLayer events for debugging
     * @param {number} duration - Duration to monitor in milliseconds
     */
    monitorDataLayerEvents(duration = 30000) {
        const originalPush = window.dataLayer.push;
        const monitoredEvents = [];

        console.log(`GTM Testing: Monitoring dataLayer events for ${duration}ms`);

        // Override dataLayer.push to capture events
        window.dataLayer.push = function (...args) {
            monitoredEvents.push({
                timestamp: Date.now(),
                data: args
            });

            console.log('GTM Testing: DataLayer event captured:', args);
            return originalPush.apply(this, args);
        };

        // Restore original push after duration
        setTimeout(() => {
            window.dataLayer.push = originalPush;
            console.log('GTM Testing: Monitoring completed. Captured events:', monitoredEvents);
        }, duration);

        return monitoredEvents;
    }

    /**
     * Generate conversion tracking diagnostic report
     */
    generateDiagnosticReport() {
        const containerId = process.env.REACT_APP_GTM_CONTAINER_ID;

        const report = {
            timestamp: new Date().toISOString(),
            gtmConfiguration: {
                containerId,
                containerValidation: this.validateGTMLoading(containerId)
            },
            conversionConfiguration: {
                conversionId: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID,
                conversionLabels: JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS || '{}'),
                enhancedConversionsEnabled: process.env.REACT_APP_ENHANCED_CONVERSIONS_ENABLED === 'true'
            },
            testEvents: this.testEvents,
            dataLayerStatus: {
                exists: Array.isArray(window.dataLayer),
                length: window.dataLayer ? window.dataLayer.length : 0,
                recentEvents: window.dataLayer ? window.dataLayer.slice(-5) : []
            }
        };

        console.log('GTM Testing: Diagnostic report generated:', report);
        return report;
    }

    /**
     * Clear test events history
     */
    clearTestHistory() {
        this.testEvents = [];
        console.log('GTM Testing: Test history cleared');
    }

    /**
     * Get test events history
     */
    getTestHistory() {
        return this.testEvents;
    }
}

// Create singleton instance
const gtmTestingUtils = new GTMTestingUtils();

export default gtmTestingUtils;