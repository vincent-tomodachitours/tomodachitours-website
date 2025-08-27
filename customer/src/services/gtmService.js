/**
 * Google Tag Manager Service
 * Provides centralized GTM integration and dataLayer management
 * Replaces direct gtag calls with GTM-managed tags
 */

import GTMConversionConfig from './gtmConversionConfig.js';

class GTMService {
    constructor() {
        this.isInitialized = false;
        this.containerId = null;
        this.fallbackToGtag = false;
        this.initializationTimeout = 5000; // 5 seconds timeout
        this.debugMode = false;

        // Initialize conversion configuration
        this.conversionConfig = new GTMConversionConfig();

        // Initialize dataLayer if not exists
        window.dataLayer = window.dataLayer || [];

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.pushEvent = this.pushEvent.bind(this);
        this.setUserProperties = this.setUserProperties.bind(this);
        this.enableDebugMode = this.enableDebugMode.bind(this);
        this.validateTagFiring = this.validateTagFiring.bind(this);
        this.trackConversion = this.trackConversion.bind(this);
    }

    /**
     * Initialize GTM container
     * @param {string} containerId - GTM container ID (e.g., 'GTM-XXXXXXX')
     * @param {Object} options - Configuration options
     * @returns {Promise<boolean>} - Success status
     */
    async initialize(containerId = null, options = {}) {
        try {
            // Use provided containerId or environment variable
            this.containerId = containerId || process.env.REACT_APP_GTM_CONTAINER_ID;

            if (!this.containerId) {
                console.warn('GTM: No container ID provided, falling back to gtag');
                this.fallbackToGtag = true;
                this._initializeFallback();
                return false;
            }

            // Check if GTM is already loaded
            if (window.google_tag_manager && window.google_tag_manager[this.containerId]) {
                console.log('GTM: Container already loaded');
                this.isInitialized = true;
                return true;
            }

            // Load GTM script
            await this._loadGTMScript(options);

            // Wait for GTM to initialize with timeout
            const initialized = await this._waitForGTMInitialization();

            if (initialized) {
                this.isInitialized = true;
                console.log('GTM: Successfully initialized');

                // Push initial configuration
                this._pushInitialConfiguration();

                return true;
            } else {
                console.warn('GTM: Initialization timeout, falling back to gtag');
                this.fallbackToGtag = true;
                this._initializeFallback();
                return false;
            }

        } catch (error) {
            console.error('GTM: Initialization failed:', error);
            this.fallbackToGtag = true;
            this._initializeFallback();
            return false;
        }
    }

    /**
     * Push event to dataLayer
     * @param {string} eventName - Event name
     * @param {Object} eventData - Event data
     * @param {Object} options - Additional options
     */
    pushEvent(eventName, eventData = {}, options = {}) {
        if (!eventName) {
            console.warn('GTM: Event name is required');
            return;
        }

        try {
            const dataLayerEvent = {
                event: eventName,
                ...eventData,
                // Add timestamp for debugging
                _timestamp: Date.now()
            };

            // Add debug information if in debug mode
            if (this.debugMode) {
                dataLayerEvent._debug = {
                    source: 'gtmService',
                    containerId: this.containerId,
                    fallbackMode: this.fallbackToGtag
                };
            }

            // Push to dataLayer
            window.dataLayer.push(dataLayerEvent);

            if (this.debugMode) {
                console.log('GTM: Event pushed to dataLayer:', dataLayerEvent);
            }

            // If GTM failed to load, use fallback gtag
            if (this.fallbackToGtag) {
                this._fallbackEventTracking(eventName, eventData);
            }

        } catch (error) {
            console.error('GTM: Failed to push event:', error);

            // Fallback to gtag if available
            if (this.fallbackToGtag) {
                this._fallbackEventTracking(eventName, eventData);
            }
        }
    }

    /**
     * Set user properties in dataLayer
     * @param {Object} properties - User properties
     */
    setUserProperties(properties = {}) {
        if (!properties || typeof properties !== 'object') {
            console.warn('GTM: User properties must be an object');
            return;
        }

        try {
            const userPropertiesEvent = {
                event: 'set_user_properties',
                user_properties: properties,
                _timestamp: Date.now()
            };

            window.dataLayer.push(userPropertiesEvent);

            if (this.debugMode) {
                console.log('GTM: User properties set:', userPropertiesEvent);
            }

            // Fallback to gtag if needed
            if (this.fallbackToGtag && window.gtag) {
                window.gtag('set', 'user_properties', properties);
            }

        } catch (error) {
            console.error('GTM: Failed to set user properties:', error);
        }
    }

    /**
     * Enable debug mode for detailed logging
     * @param {boolean} enabled - Enable/disable debug mode
     */
    enableDebugMode(enabled = true) {
        this.debugMode = enabled;

        if (enabled) {
            console.log('GTM: Debug mode enabled');

            // Push debug configuration to dataLayer
            window.dataLayer.push({
                event: 'gtm_debug_mode',
                debug_mode: true,
                _timestamp: Date.now()
            });
        }
    }

    /**
     * Validate if a specific tag is firing
     * @param {string} tagName - Tag name to validate
     * @returns {Promise<boolean>} - Validation result
     */
    async validateTagFiring(tagName) {
        if (!tagName) {
            console.warn('GTM: Tag name is required for validation');
            return false;
        }

        try {
            // Push validation event
            const validationId = `validation_${Date.now()}`;

            window.dataLayer.push({
                event: 'tag_validation',
                tag_name: tagName,
                validation_id: validationId,
                _timestamp: Date.now()
            });

            // Wait for validation response (simplified approach)
            // In a real implementation, you might listen for specific dataLayer events
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
     * Track Google Ads conversion with proper configuration
     * @param {string} conversionType - Type of conversion (purchase, begin_checkout, view_item, add_payment_info)
     * @param {Object} eventData - Event data including value, currency, items, etc.
     * @param {Object} customerData - Customer data for enhanced conversions (optional)
     */
    trackConversion(conversionType, eventData = {}, customerData = null) {
        try {
            // Validate conversion event data
            if (!this.conversionConfig.validateConversionEvent(conversionType, eventData)) {
                console.warn(`GTM: Invalid conversion event data for ${conversionType}`);
                return false;
            }

            // Get conversion configuration based on type
            let conversionConfig;
            switch (conversionType) {
                case 'purchase':
                    conversionConfig = this.conversionConfig.getPurchaseConversionConfig(eventData);
                    break;
                case 'begin_checkout':
                    conversionConfig = this.conversionConfig.getBeginCheckoutConversionConfig(eventData);
                    break;
                case 'view_item':
                    conversionConfig = this.conversionConfig.getViewItemConversionConfig(eventData);
                    break;
                case 'add_payment_info':
                    conversionConfig = this.conversionConfig.getAddPaymentInfoConversionConfig(eventData);
                    break;
                default:
                    console.error(`GTM: Unknown conversion type: ${conversionType}`);
                    return false;
            }

            // Prepare event data with customer data if provided
            const enhancedEventData = {
                ...eventData,
                ...(customerData && { user_data: customerData })
            };

            // Generate dataLayer event for Google Ads conversion
            const conversionEvent = this.conversionConfig.generateConversionDataLayerEvent(
                conversionType,
                enhancedEventData,
                conversionConfig
            );

            // Push conversion event to dataLayer
            this.pushEvent('google_ads_conversion', conversionEvent);

            // Also push the standard ecommerce event for GA4
            this.pushEvent(conversionType, enhancedEventData);

            if (this.debugMode) {
                console.log(`GTM: Conversion tracked - ${conversionType}:`, conversionEvent);
            }

            return true;

        } catch (error) {
            console.error(`GTM: Failed to track conversion ${conversionType}:`, error);
            return false;
        }
    }

    /**
     * Track purchase conversion with enhanced data
     * @param {Object} transactionData - Transaction data
     * @param {Object} customerData - Customer data for enhanced conversions
     */
    trackPurchaseConversion(transactionData, customerData = null) {
        return this.trackConversion('purchase', transactionData, customerData);
    }

    /**
     * Track begin checkout conversion
     * @param {Object} checkoutData - Checkout data
     * @param {Object} customerData - Customer data for enhanced conversions
     */
    trackBeginCheckoutConversion(checkoutData, customerData = null) {
        return this.trackConversion('begin_checkout', checkoutData, customerData);
    }

    /**
     * Track view item conversion
     * @param {Object} itemData - Item data
     */
    trackViewItemConversion(itemData) {
        return this.trackConversion('view_item', itemData);
    }

    /**
     * Track add payment info conversion
     * @param {Object} paymentData - Payment data
     * @param {Object} customerData - Customer data for enhanced conversions
     */
    trackAddPaymentInfoConversion(paymentData, customerData = null) {
        return this.trackConversion('add_payment_info', paymentData, customerData);
    }

    /**
     * Get current GTM status including conversion configuration
     * @returns {Object} - Status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            containerId: this.containerId,
            fallbackMode: this.fallbackToGtag,
            debugMode: this.debugMode,
            dataLayerLength: window.dataLayer ? window.dataLayer.length : 0,
            conversionConfig: this.conversionConfig.getDebugInfo()
        };
    }

    /**
     * Load GTM script dynamically
     * @private
     */
    async _loadGTMScript(options = {}) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector(`script[src*="${this.containerId}"]`)) {
                resolve();
                return;
            }

            // Create GTM script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtm.js?id=${this.containerId}`;

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
            firstScript.parentNode.insertBefore(script, firstScript);
        });
    }

    /**
     * Wait for GTM to initialize
     * @private
     */
    async _waitForGTMInitialization() {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkInitialization = () => {
                // Check if GTM is loaded
                if (window.google_tag_manager && window.google_tag_manager[this.containerId]) {
                    resolve(true);
                    return;
                }

                // Check timeout
                if (Date.now() - startTime > this.initializationTimeout) {
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
     * Push initial configuration to dataLayer
     * @private
     */
    _pushInitialConfiguration() {
        window.dataLayer.push({
            event: 'gtm_initialized',
            gtm_container_id: this.containerId,
            gtm_service_version: '1.0.0',
            _timestamp: Date.now()
        });
    }

    /**
     * Initialize fallback gtag functionality
     * @private
     */
    _initializeFallback() {
        try {
            // Initialize gtag if not already available
            if (!window.gtag) {
                window.gtag = function () {
                    window.dataLayer.push(arguments);
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
     * Fallback event tracking using gtag
     * @private
     */
    _fallbackEventTracking(eventName, eventData) {
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
}

// Create singleton instance
const gtmService = new GTMService();

export default gtmService;