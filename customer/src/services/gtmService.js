/**
 * Google Tag Manager Service
 * Provides centralized GTM integration and dataLayer management
 * Replaces direct gtag calls with GTM-managed tags
 * Integrated with migration system for gradual rollout
 */

import GTMConversionConfig from './gtmConversionConfig.js';
import gtmGA4Config from './gtmGA4Config.js';
import conversionValueOptimizer from './conversionValueOptimizer.js';
import migrationFeatureFlags from './migrationFeatureFlags.js';

class GTMService {
    constructor() {
        this.isInitialized = false;
        this.containerId = null;
        this.fallbackToGtag = false;
        this.initializationTimeout = 5000; // 5 seconds timeout
        this.debugMode = false;
        this.migrationMode = true; // Enable migration-aware behavior

        // Initialize conversion configuration
        this.conversionConfig = new GTMConversionConfig();

        // Initialize GA4 configuration
        this.ga4Config = gtmGA4Config;

        // Initialize dataLayer if not exists
        window.dataLayer = window.dataLayer || [];

        // Check if GTM should be initialized based on migration flags
        if (this.shouldInitializeGTM()) {
            // Auto-initialize if container ID is available and migration allows it
            const containerId = process.env.REACT_APP_GTM_CONTAINER_ID;
            if (containerId) {
                this.initialize(containerId);
            }
        }

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.pushEvent = this.pushEvent.bind(this);
        this.setUserProperties = this.setUserProperties.bind(this);
        this.enableDebugMode = this.enableDebugMode.bind(this);
        this.validateTagFiring = this.validateTagFiring.bind(this);
        this.trackConversion = this.trackConversion.bind(this);
    }

    /**
     * Check if GTM should be initialized based on migration flags
     */
    shouldInitializeGTM() {
        if (!this.migrationMode) {
            return true; // Always initialize if not in migration mode
        }

        return migrationFeatureFlags.shouldUseGTM();
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

                // Initialize GA4 configuration
                await this.ga4Config.initialize();

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

        // Check if GTM should be used based on migration flags
        if (this.migrationMode && !migrationFeatureFlags.shouldUseGTM()) {
            if (this.debugMode) {
                console.log('GTM: Event skipped due to migration flags:', eventName);
            }
            return;
        }

        try {
            const dataLayerEvent = {
                event: eventName,
                ...eventData,
                // Add timestamp for debugging
                _timestamp: Date.now()
            };

            // Add migration information if in migration mode
            if (this.migrationMode) {
                dataLayerEvent._migration = {
                    phase: migrationFeatureFlags.migrationPhase,
                    sessionId: migrationFeatureFlags.getOrCreateSessionId(),
                    rolloutPercentage: migrationFeatureFlags.rolloutPercentage
                };
            }

            // Add debug information if in debug mode
            if (this.debugMode) {
                dataLayerEvent._debug = {
                    source: 'gtmService',
                    containerId: this.containerId,
                    fallbackMode: this.fallbackToGtag,
                    migrationMode: this.migrationMode
                };
            }

            // Push to dataLayer
            window.dataLayer.push(dataLayerEvent);

            if (this.debugMode) {
                console.log('GTM: Event pushed to dataLayer:', dataLayerEvent);
            }

            // Track migration event
            if (this.migrationMode) {
                migrationFeatureFlags.trackMigrationEvent('gtm_event_pushed', {
                    eventName,
                    containerId: this.containerId,
                    fallbackMode: this.fallbackToGtag
                });
            }

            // If GTM failed to load, use fallback gtag
            if (this.fallbackToGtag) {
                this._fallbackEventTracking(eventName, eventData);
            }

        } catch (error) {
            console.error('GTM: Failed to push event:', error);

            // Track migration error
            if (this.migrationMode) {
                migrationFeatureFlags.trackMigrationEvent('gtm_event_push_failed', {
                    eventName,
                    error: error.message
                });
            }

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
     * Track Google Ads conversion with proper configuration and dynamic pricing
     * @param {string} conversionType - Type of conversion (purchase, begin_checkout, view_item, add_payment_info)
     * @param {Object} eventData - Event data including value, currency, items, etc.
     * @param {Object} customerData - Customer data for enhanced conversions (optional)
     * @param {Object} pricingContext - Additional pricing context for value optimization
     */
    trackConversion(conversionType, eventData = {}, customerData = null, pricingContext = {}) {
        try {
            // Optimize conversion value with dynamic pricing
            let optimizedEventData = { ...eventData };

            if (eventData.value && (eventData.originalPrice || pricingContext.originalPrice)) {
                const priceData = {
                    basePrice: pricingContext.basePrice || eventData.originalPrice || eventData.value,
                    quantity: pricingContext.quantity || 1,
                    currency: eventData.currency || 'JPY'
                };

                const discountData = pricingContext.discount || eventData.discount || null;

                const optimizationResult = conversionValueOptimizer.calculateDynamicPrice(
                    priceData,
                    discountData,
                    pricingContext.options || {}
                );

                if (optimizationResult.success) {
                    // Use optimized pricing data
                    optimizedEventData.value = optimizationResult.pricing.finalPrice;
                    optimizedEventData.original_value = optimizationResult.pricing.originalTotal;
                    optimizedEventData.discount_amount = optimizationResult.pricing.discountAmount;
                    optimizedEventData.discount_percentage = optimizationResult.pricing.discountPercentage;

                    // Add Target ROAS optimization data
                    const roasData = conversionValueOptimizer.getTargetROASData(
                        { conversionValue: optimizedEventData.value, ...pricingContext },
                        optimizationResult.pricing
                    );

                    if (roasData) {
                        optimizedEventData.roas_data = roasData;
                    }

                    // Track revenue attribution if this is a purchase
                    if (conversionType === 'purchase') {
                        const attributionResult = conversionValueOptimizer.trackRevenueAttribution(
                            {
                                conversionId: eventData.transaction_id,
                                campaign: pricingContext.campaign,
                                adGroup: pricingContext.adGroup,
                                keyword: pricingContext.keyword,
                                gclid: pricingContext.gclid,
                                productId: eventData.items?.[0]?.item_id,
                                productName: eventData.items?.[0]?.item_name,
                                productCategory: eventData.items?.[0]?.item_category,
                                conversionValue: optimizedEventData.value
                            },
                            optimizationResult.pricing
                        );

                        if (attributionResult.success) {
                            optimizedEventData.attribution_id = attributionResult.attributionId;
                        }
                    }

                    if (this.debugMode) {
                        console.log('GTM: Conversion value optimized:', {
                            original: eventData.value,
                            optimized: optimizedEventData.value,
                            validation: optimizationResult.validation
                        });
                    }
                } else {
                    console.warn('GTM: Conversion value optimization failed:', optimizationResult.error);
                }
            }

            // Validate conversion event data
            if (!this.conversionConfig.validateConversionEvent(conversionType, optimizedEventData)) {
                console.warn(`GTM: Invalid conversion event data for ${conversionType}`);
                return false;
            }

            // Get conversion configuration based on type
            let conversionConfig;
            switch (conversionType) {
                case 'purchase':
                    conversionConfig = this.conversionConfig.getPurchaseConversionConfig(optimizedEventData);
                    break;
                case 'begin_checkout':
                    conversionConfig = this.conversionConfig.getBeginCheckoutConversionConfig(optimizedEventData);
                    break;
                case 'view_item':
                    conversionConfig = this.conversionConfig.getViewItemConversionConfig(optimizedEventData);
                    break;
                case 'add_payment_info':
                    conversionConfig = this.conversionConfig.getAddPaymentInfoConversionConfig(optimizedEventData);
                    break;
                default:
                    console.error(`GTM: Unknown conversion type: ${conversionType}`);
                    return false;
            }

            // Prepare event data with customer data if provided
            const enhancedEventData = {
                ...optimizedEventData,
                ...(customerData && { user_data: customerData })
            };

            // Generate dataLayer event for Google Ads conversion
            const conversionEvent = this.debugMode ?
                this.conversionConfig.debugConversionEvent(conversionType, enhancedEventData, conversionConfig) :
                this.conversionConfig.generateConversionDataLayerEvent(conversionType, enhancedEventData, conversionConfig);

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
     * Track purchase conversion with enhanced data and dynamic pricing
     * @param {Object} transactionData - Transaction data
     * @param {Object} customerData - Customer data for enhanced conversions
     * @param {Object} pricingContext - Pricing context for value optimization
     */
    trackPurchaseConversion(transactionData, customerData = null, pricingContext = {}) {
        // Track Google Ads conversion with pricing optimization
        const conversionSuccess = this.trackConversion('purchase', transactionData, customerData, pricingContext);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4Purchase(transactionData, transactionData.tourData);

        return conversionSuccess && ga4Success;
    }

    /**
     * Track begin checkout conversion with dynamic pricing
     * @param {Object} checkoutData - Checkout data
     * @param {Object} customerData - Customer data for enhanced conversions
     * @param {Object} pricingContext - Pricing context for value optimization
     */
    trackBeginCheckoutConversion(checkoutData, customerData = null, pricingContext = {}) {
        // Track Google Ads conversion with pricing optimization
        const conversionSuccess = this.trackConversion('begin_checkout', checkoutData, customerData, pricingContext);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4BeginCheckout(checkoutData, checkoutData.tourData);

        return conversionSuccess && ga4Success;
    }

    /**
     * Track view item conversion
     * @param {Object} itemData - Item data
     */
    trackViewItemConversion(itemData) {
        // Track Google Ads conversion
        const conversionSuccess = this.trackConversion('view_item', itemData);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4ViewItem(itemData, itemData.tourData);

        return conversionSuccess && ga4Success;
    }

    /**
     * Track specific tour view with detailed tour information
     * @param {Object} tourViewData - Tour view data with specific tour details
     */
    trackSpecificTourView(tourViewData) {
        // Track the specific tour view event in GA4
        const ga4Success = this.ga4Config.trackGA4SpecificTourView(tourViewData);

        if (this.debugMode) {
            console.log('GTM: Specific tour view tracked:', tourViewData);
        }

        return ga4Success;
    }

    /**
     * Track add payment info conversion
     * @param {Object} paymentData - Payment data
     * @param {Object} customerData - Customer data for enhanced conversions
     */
    trackAddPaymentInfoConversion(paymentData, customerData = null) {
        // Track Google Ads conversion
        const conversionSuccess = this.trackConversion('add_payment_info', paymentData, customerData);

        // Track GA4 ecommerce event
        const ga4Success = this.ga4Config.trackGA4AddPaymentInfo(paymentData, paymentData.tourData);

        return conversionSuccess && ga4Success;
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
            conversionConfig: this.conversionConfig.getDebugInfo(),
            ga4Config: this.ga4Config.getStatus()
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

    /**
     * Track Google Ads conversion directly (fallback for GTM verification issues)
     * @param {string} conversionLabel - Conversion label from Google Ads
     * @param {Object} conversionData - Conversion data
     */
    trackDirectGoogleAdsConversion(conversionLabel, conversionData = {}) {
        try {
            // Use direct gtag if available
            if (window.gtagConversion && conversionLabel) {
                const conversionId = process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID || 'AW-17482092392';
                const conversionConfig = {
                    send_to: `${conversionId}/${conversionLabel}`,
                    value: conversionData.value || 0,
                    currency: conversionData.currency || 'JPY',
                    transaction_id: conversionData.transaction_id || ''
                };

                // Add enhanced conversion data if available
                if (conversionData.user_data) {
                    conversionConfig.user_data = conversionData.user_data;
                }

                window.gtagConversion('event', 'conversion', conversionConfig);

                if (this.debugMode) {
                    console.log('Direct Google Ads conversion tracked:', conversionConfig);
                }

                return true;
            } else {
                console.warn('Direct Google Ads tracking not available');
                return false;
            }
        } catch (error) {
            console.error('Direct Google Ads conversion tracking failed:', error);
            return false;
        }
    }

    /**
     * Track conversion with both GTM and direct Google Ads (for verification)
     * @param {string} conversionType - Type of conversion
     * @param {Object} eventData - Event data
     * @param {Object} customerData - Customer data for enhanced conversions
     * @param {Object} pricingContext - Pricing context
     */
    trackConversionWithFallback(conversionType, eventData = {}, customerData = null, pricingContext = {}) {
        // Track via GTM (primary method)
        const gtmSuccess = this.trackConversion(conversionType, eventData, customerData, pricingContext);

        // Also track directly for Google Ads verification
        const conversionLabels = {
            'purchase': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ?
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).purchase : null,
            'begin_checkout': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ?
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).begin_checkout : null,
            'view_item': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ?
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).view_item : null,
            'add_payment_info': process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS ?
                JSON.parse(process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABELS).add_payment_info : null
        };

        const conversionLabel = conversionLabels[conversionType];
        let directSuccess = false;

        if (conversionLabel) {
            const directConversionData = {
                value: eventData.value,
                currency: eventData.currency,
                transaction_id: eventData.transaction_id,
                user_data: customerData
            };

            directSuccess = this.trackDirectGoogleAdsConversion(conversionLabel, directConversionData);
        }

        if (this.debugMode) {
            console.log(`Conversion tracking results - GTM: ${gtmSuccess}, Direct: ${directSuccess}`);
        }

        return gtmSuccess || directSuccess;
    }
}

// Create singleton instance
const gtmService = new GTMService();

export default gtmService;