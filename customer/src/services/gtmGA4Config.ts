/**
 * GTM GA4 Configuration Service
 * Handles GA4 integration through Google Tag Manager with enhanced ecommerce tracking
 * Implements task 12: Configure GTM tags for GA4 integration and ecommerce tracking
 */

interface CustomDimensions {
    tour_id: string;
    tour_name: string;
    tour_category: string;
    tour_location: string;
    tour_duration: string;
    booking_date: string;
    payment_provider: string;
    price_range: string;
    user_engagement_level: string;
    conversion_source: string;
}

interface EnhancedEcommerceConfig {
    currency: string;
    send_to: string;
    enhanced_ecommerce: boolean;
    custom_map: CustomDimensions;
}





interface TourData {
    tourId?: string;
    tourName?: string;
    tourCategory?: string;
    tourLocation?: string;
    tourDuration?: string;
    bookingDate?: string;
    paymentProvider?: string;
    priceRange?: string;
}

interface TransactionData {
    transactionId?: string;
    value?: number;
    items?: any[];
    userData?: any;
}

interface CheckoutData {
    value?: number;
    items?: any[];
}

interface ItemData {
    value?: number;
    items?: any[];
}

interface PaymentData {
    value?: number;
    paymentProvider?: string;
}

interface TourViewData {
    tour_id: string;
    tour_name?: string;
    tour_category?: string;
    tour_location?: string;
    tour_duration?: string;
    tour_price?: number;
    price_range?: string;
}

interface ValidationResults {
    ga4ConfigurationValid: boolean;
    ecommerceEventsValid: boolean;
    customDimensionsValid: boolean;
    dataLayerValid: boolean;
    measurementIdValid: boolean;
    errors: string[];
}

interface TestResults {
    success: boolean;
    errors: string[];
}


interface Status {
    isInitialized: boolean;
    measurementId: string;
    debugMode: boolean;
    customDimensions: CustomDimensions;
    enhancedEcommerceEnabled: boolean;
    dataLayerLength: number;
}

declare global {
    interface Window {
        dataLayer?: any[];
    }
}

class GTMGA4Config {
    private ga4MeasurementId: string;
    private debugMode: boolean;
    private isInitialized: boolean;
    private customDimensions: CustomDimensions;
    private enhancedEcommerceConfig: EnhancedEcommerceConfig;

    constructor() {
        this.ga4MeasurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-5GVJBRE1SY';
        this.debugMode = process.env.NODE_ENV === 'development';
        this.isInitialized = false;

        // Custom dimensions mapping for tour-specific data
        this.customDimensions = {
            tour_id: 'custom_dimension_1',
            tour_name: 'custom_dimension_2',
            tour_category: 'custom_dimension_3',
            tour_location: 'custom_dimension_4',
            tour_duration: 'custom_dimension_5',
            booking_date: 'custom_dimension_6',
            payment_provider: 'custom_dimension_7',
            price_range: 'custom_dimension_8',
            user_engagement_level: 'custom_dimension_9',
            conversion_source: 'custom_dimension_10'
        };

        // Enhanced ecommerce parameters
        this.enhancedEcommerceConfig = {
            currency: 'JPY',
            send_to: this.ga4MeasurementId,
            enhanced_ecommerce: true,
            custom_map: this.customDimensions
        };

        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.configureGA4Tags = this.configureGA4Tags.bind(this);
        this.createGA4ConfigurationTag = this.createGA4ConfigurationTag.bind(this);
        this.createGA4EventTags = this.createGA4EventTags.bind(this);
        this.validateGA4DataFlow = this.validateGA4DataFlow.bind(this);
    }

    /**
     * Initialize GA4 configuration through GTM
     */
    async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized) {
                console.log('GTM GA4: Already initialized');
                return true;
            }

            // Ensure dataLayer exists
            window.dataLayer = window.dataLayer || [];

            // Configure GA4 tags through GTM
            await this.configureGA4Tags();

            // Push initial GA4 configuration
            this.pushGA4Configuration();

            this.isInitialized = true;
            console.log('GTM GA4: Successfully initialized with enhanced ecommerce');

            return true;

        } catch (error) {
            console.error('GTM GA4: Initialization failed:', error);
            return false;
        }
    }

    /**
     * Configure all GA4 tags through GTM dataLayer events
     */
    async configureGA4Tags(): Promise<void> {
        try {
            // Create GA4 configuration tag
            this.createGA4ConfigurationTag();

            // Create GA4 event tags for ecommerce
            this.createGA4EventTags();

            // Set up custom dimensions
            this.setupCustomDimensions();

            console.log('GTM GA4: Tags configured successfully');

        } catch (error) {
            console.error('GTM GA4: Tag configuration failed:', error);
            throw error;
        }
    }

    /**
     * Create GA4 configuration tag with enhanced ecommerce
     */
    createGA4ConfigurationTag(): void {
        const configEvent = {
            event: 'gtm_ga4_config',
            ga4_config: {
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                send_page_view: false, // Handled by React Router PageViewTracker
                custom_map: this.customDimensions,
                // Enhanced ecommerce settings
                allow_enhanced_conversions: true,
                allow_google_signals: true,
                allow_ad_personalization_signals: true,
                // Custom parameters for tour business
                business_type: 'tour_operator',
                industry: 'travel_tourism',
                location: 'kyoto_japan',
                currency: 'JPY'
            },
            _timestamp: Date.now()
        };

        if (window.dataLayer) {
            window.dataLayer.push(configEvent);
        }

        if (this.debugMode) {
            console.log('GTM GA4: Configuration tag created:', configEvent);
        }
    }

    /**
     * Create GA4 event tags for ecommerce tracking
     */
    createGA4EventTags(): void {
        // Purchase event configuration
        this.createPurchaseEventTag();

        // Begin checkout event configuration
        this.createBeginCheckoutEventTag();

        // View item event configuration
        this.createViewItemEventTag();

        // Add payment info event configuration
        this.createAddPaymentInfoEventTag();

        if (this.debugMode) {
            console.log('GTM GA4: All ecommerce event tags created');
        }
    }

    /**
     * Create purchase event tag configuration
     */
    createPurchaseEventTag(): void {
        const purchaseTagConfig = {
            event: 'gtm_ga4_purchase_config',
            tag_config: {
                tag_name: 'GA4 - Purchase Event',
                event_name: 'purchase',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    transaction_id: '{{Transaction ID}}',
                    value: '{{Transaction Value}}',
                    currency: 'JPY',
                    items: '{{Items Array}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    tour_category: '{{Tour Category}}',
                    tour_location: '{{Tour Location}}',
                    booking_date: '{{Booking Date}}',
                    payment_provider: '{{Payment Provider}}',
                    // Enhanced conversion parameters
                    user_data: '{{Enhanced Conversion Data}}'
                },
                trigger: 'purchase'
            },
            _timestamp: Date.now()
        };

        if (window.dataLayer) {
            window.dataLayer.push(purchaseTagConfig);
        }
    }

    /**
     * Create begin checkout event tag configuration
     */
    createBeginCheckoutEventTag(): void {
        const beginCheckoutTagConfig = {
            event: 'gtm_ga4_begin_checkout_config',
            tag_config: {
                tag_name: 'GA4 - Begin Checkout Event',
                event_name: 'begin_checkout',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    value: '{{Checkout Value}}',
                    currency: 'JPY',
                    items: '{{Items Array}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    tour_category: '{{Tour Category}}',
                    checkout_step: 1,
                    checkout_option: 'tour_booking'
                },
                trigger: 'begin_checkout'
            },
            _timestamp: Date.now()
        };

        if (window.dataLayer) {
            window.dataLayer.push(beginCheckoutTagConfig);
        }
    }

    /**
     * Create view item event tag configuration
     */
    createViewItemEventTag(): void {
        const viewItemTagConfig = {
            event: 'gtm_ga4_view_item_config',
            tag_config: {
                tag_name: 'GA4 - View Item Event',
                event_name: 'view_item',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    value: '{{Item Value}}',
                    currency: 'JPY',
                    items: '{{Items Array}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    tour_category: '{{Tour Category}}',
                    tour_location: '{{Tour Location}}',
                    item_category: 'tour',
                    content_type: 'product'
                },
                trigger: 'view_item'
            },
            _timestamp: Date.now()
        };

        if (window.dataLayer) {
            window.dataLayer.push(viewItemTagConfig);
        }
    }

    /**
     * Create add payment info event tag configuration
     */
    createAddPaymentInfoEventTag(): void {
        const addPaymentInfoTagConfig = {
            event: 'gtm_ga4_add_payment_info_config',
            tag_config: {
                tag_name: 'GA4 - Add Payment Info Event',
                event_name: 'add_payment_info',
                measurement_id: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                parameters: {
                    value: '{{Payment Value}}',
                    currency: 'JPY',
                    payment_type: '{{Payment Provider}}',
                    // Custom tour parameters
                    tour_id: '{{Tour ID}}',
                    tour_name: '{{Tour Name}}',
                    checkout_step: 2,
                    checkout_option: 'payment_info'
                },
                trigger: 'add_payment_info'
            },
            _timestamp: Date.now()
        };

        if (window.dataLayer) {
            window.dataLayer.push(addPaymentInfoTagConfig);
        }
    }

    /**
     * Set up custom dimensions for tour-specific data
     */
    setupCustomDimensions(): void {
        const customDimensionsConfig = {
            event: 'gtm_ga4_custom_dimensions_config',
            custom_dimensions_config: {
                measurement_id: this.ga4MeasurementId,
                custom_dimensions: [
                    {
                        parameter_name: 'tour_id',
                        display_name: 'Tour ID',
                        description: 'Unique identifier for the tour product',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'tour_name',
                        display_name: 'Tour Name',
                        description: 'Name of the tour product',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'tour_category',
                        display_name: 'Tour Category',
                        description: 'Category of the tour (morning, evening, etc.)',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'tour_location',
                        display_name: 'Tour Location',
                        description: 'Location where the tour takes place',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'tour_duration',
                        display_name: 'Tour Duration',
                        description: 'Duration of the tour in hours',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'booking_date',
                        display_name: 'Booking Date',
                        description: 'Date when the tour is booked for',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'payment_provider',
                        display_name: 'Payment Provider',
                        description: 'Payment method used (Stripe, PayJP, etc.)',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'price_range',
                        display_name: 'Price Range',
                        description: 'Price range category of the tour',
                        scope: 'EVENT'
                    },
                    {
                        parameter_name: 'user_engagement_level',
                        display_name: 'User Engagement Level',
                        description: 'Level of user engagement with the site',
                        scope: 'USER'
                    },
                    {
                        parameter_name: 'conversion_source',
                        display_name: 'Conversion Source',
                        description: 'Source that led to the conversion',
                        scope: 'EVENT'
                    }
                ]
            },
            _timestamp: Date.now()
        };

        if (window.dataLayer) {
            window.dataLayer.push(customDimensionsConfig);
        }

        if (this.debugMode) {
            console.log('GTM GA4: Custom dimensions configured:', customDimensionsConfig);
        }
    }

    /**
     * Push initial GA4 configuration to dataLayer
     */
    pushGA4Configuration(): void {
        const initialConfig = {
            event: 'gtm_ga4_initialize',
            ga4_measurement_id: this.ga4MeasurementId,
            enhanced_ecommerce_enabled: true,
            custom_dimensions_enabled: true,
            tour_business_config: {
                business_type: 'tour_operator',
                location: 'kyoto_japan',
                currency: 'JPY',
                industry: 'travel_tourism'
            },
            _timestamp: Date.now()
        };

        if (window.dataLayer) {
            window.dataLayer.push(initialConfig);
        }

        if (this.debugMode) {
            console.log('GTM GA4: Initial configuration pushed:', initialConfig);
        }
    }

    /**
     * Track GA4 ecommerce event with enhanced data
     */
    trackGA4EcommerceEvent(eventName: string, eventData: any, tourData: TourData = {}): boolean {
        try {
            const enhancedEventData = {
                event: eventName,
                ...eventData,
                // Add custom tour parameters
                tour_id: tourData.tourId,
                tour_name: tourData.tourName,
                tour_category: tourData.tourCategory,
                tour_location: tourData.tourLocation,
                tour_duration: tourData.tourDuration,
                booking_date: tourData.bookingDate,
                payment_provider: tourData.paymentProvider,
                price_range: tourData.priceRange,
                // GA4 specific parameters
                send_to: this.ga4MeasurementId,
                enhanced_ecommerce: true,
                _timestamp: Date.now()
            };

            if (window.dataLayer) {
                window.dataLayer.push(enhancedEventData);
            }

            if (this.debugMode) {
                console.log(`GTM GA4: ${eventName} event tracked:`, enhancedEventData);
            }

            return true;

        } catch (error) {
            console.error(`GTM GA4: Failed to track ${eventName} event:`, error);
            return false;
        }
    }

    /**
     * Track GA4 purchase event
     */
    trackGA4Purchase(transactionData: TransactionData, tourData: TourData = {}): boolean {
        if (!transactionData) {
            console.warn('GTM GA4: Transaction data is required for purchase tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent('purchase', {
            transaction_id: transactionData.transactionId,
            value: transactionData.value,
            currency: 'JPY',
            items: transactionData.items || [],
            // Enhanced conversion data
            user_data: transactionData.userData
        }, tourData);
    }

    /**
     * Track GA4 begin checkout event
     */
    trackGA4BeginCheckout(checkoutData: CheckoutData, tourData: TourData = {}): boolean {
        if (!checkoutData) {
            console.warn('GTM GA4: Checkout data is required for begin checkout tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent('begin_checkout', {
            value: checkoutData.value,
            currency: 'JPY',
            items: checkoutData.items || [],
            checkout_step: 1,
            checkout_option: 'tour_booking'
        }, tourData);
    }

    /**
     * Track GA4 view item event
     */
    trackGA4ViewItem(itemData: ItemData, tourData: TourData = {}): boolean {
        if (!itemData) {
            console.warn('GTM GA4: Item data is required for view item tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent('view_item', {
            value: itemData.value,
            currency: 'JPY',
            items: itemData.items || [],
            item_category: 'tour',
            content_type: 'product'
        }, tourData);
    }

    /**
     * Track GA4 add payment info event
     */
    trackGA4AddPaymentInfo(paymentData: PaymentData, tourData: TourData = {}): boolean {
        if (!paymentData) {
            console.warn('GTM GA4: Payment data is required for add payment info tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent('add_payment_info', {
            value: paymentData.value,
            currency: 'JPY',
            payment_type: paymentData.paymentProvider,
            checkout_step: 2,
            checkout_option: 'payment_info'
        }, tourData);
    }

    /**
     * Track specific tour view event with detailed tour information
     */
    trackGA4SpecificTourView(tourViewData: TourViewData): boolean {
        if (!tourViewData || !tourViewData.tour_id) {
            console.warn('GTM GA4: Tour ID is required for specific tour view tracking');
            return false;
        }

        return this.trackGA4EcommerceEvent('tour_view_specific', {
            tour_id: tourViewData.tour_id,
            tour_name: tourViewData.tour_name,
            tour_category: tourViewData.tour_category,
            tour_location: tourViewData.tour_location,
            tour_duration: tourViewData.tour_duration,
            tour_price: tourViewData.tour_price,
            currency: 'JPY',
            value: tourViewData.tour_price,
            content_type: 'tour',
            item_category: 'Tour',
            custom_parameter_tour_id: tourViewData.tour_id,
            custom_parameter_tour_name: tourViewData.tour_name
        }, {
            tourId: tourViewData.tour_id,
            tourName: tourViewData.tour_name,
            tourCategory: tourViewData.tour_category,
            tourLocation: tourViewData.tour_location,
            tourDuration: tourViewData.tour_duration,
            priceRange: tourViewData.price_range
        });
    }

    /**
     * Validate GA4 data flow and ecommerce reporting accuracy
     */
    async validateGA4DataFlow(): Promise<ValidationResults> {
        try {
            console.log('GTM GA4: Starting data flow validation...');

            const validationResults: ValidationResults = {
                ga4ConfigurationValid: false,
                ecommerceEventsValid: false,
                customDimensionsValid: false,
                dataLayerValid: false,
                measurementIdValid: false,
                errors: []
            };

            // Check if dataLayer exists and has events
            if (window.dataLayer && Array.isArray(window.dataLayer)) {
                validationResults.dataLayerValid = true;
                console.log('✅ GTM GA4: DataLayer is valid');
            } else {
                validationResults.errors.push('DataLayer is not available or invalid');
                console.error('❌ GTM GA4: DataLayer validation failed');
            }

            // Check measurement ID
            if (this.ga4MeasurementId && this.ga4MeasurementId.startsWith('G-')) {
                validationResults.measurementIdValid = true;
                console.log('✅ GTM GA4: Measurement ID is valid:', this.ga4MeasurementId);
            } else {
                validationResults.errors.push('Invalid GA4 measurement ID');
                console.error('❌ GTM GA4: Invalid measurement ID');
            }

            // Test ecommerce events
            const testResults = await this.runEcommerceEventTests();
            validationResults.ecommerceEventsValid = testResults.success;
            if (!testResults.success) {
                validationResults.errors.push(...testResults.errors);
            }

            // Check custom dimensions configuration
            const customDimensionsTest = this.validateCustomDimensions();
            validationResults.customDimensionsValid = customDimensionsTest.success;
            if (!customDimensionsTest.success) {
                validationResults.errors.push(...customDimensionsTest.errors);
            }

            // Overall validation
            const overallValid = validationResults.dataLayerValid &&
                validationResults.measurementIdValid &&
                validationResults.ecommerceEventsValid &&
                validationResults.customDimensionsValid;

            validationResults.ga4ConfigurationValid = overallValid;

            if (overallValid) {
                console.log('✅ GTM GA4: All validation checks passed');
            } else {
                console.warn('⚠️ GTM GA4: Some validation checks failed:', validationResults.errors);
            }

            return validationResults;

        } catch (error: any) {
            console.error('GTM GA4: Validation failed:', error);
            return {
                ga4ConfigurationValid: false,
                ecommerceEventsValid: false,
                customDimensionsValid: false,
                dataLayerValid: false,
                measurementIdValid: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Run ecommerce event tests
     */
    private async runEcommerceEventTests(): Promise<TestResults> {
        try {
            const testResults: TestResults = {
                success: true,
                errors: []
            };

            // Test view_item event
            const viewItemTest = this.trackGA4ViewItem({
                value: 5000,
                items: [{
                    item_id: 'test_tour',
                    item_name: 'Test Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour',
                tourCategory: 'night',
                tourLocation: 'kyoto'
            });

            if (!viewItemTest) {
                testResults.success = false;
                testResults.errors.push('View item event test failed');
            }

            // Test begin_checkout event
            const beginCheckoutTest = this.trackGA4BeginCheckout({
                value: 5000,
                items: [{
                    item_id: 'test_tour',
                    item_name: 'Test Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour',
                tourCategory: 'night'
            });

            if (!beginCheckoutTest) {
                testResults.success = false;
                testResults.errors.push('Begin checkout event test failed');
            }

            // Test add_payment_info event
            const addPaymentInfoTest = this.trackGA4AddPaymentInfo({
                value: 5000,
                paymentProvider: 'stripe'
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour'
            });

            if (!addPaymentInfoTest) {
                testResults.success = false;
                testResults.errors.push('Add payment info event test failed');
            }

            // Test purchase event
            const purchaseTest = this.trackGA4Purchase({
                transactionId: 'test_' + Date.now(),
                value: 5000,
                items: [{
                    item_id: 'test_tour',
                    item_name: 'Test Tour',
                    item_category: 'Tour',
                    price: 5000,
                    quantity: 1
                }]
            }, {
                tourId: 'test_tour',
                tourName: 'Test Tour',
                tourCategory: 'night'
            });

            if (!purchaseTest) {
                testResults.success = false;
                testResults.errors.push('Purchase event test failed');
            }

            if (testResults.success) {
                console.log('✅ GTM GA4: All ecommerce event tests passed');
            }

            return testResults;

        } catch (error: any) {
            console.error('GTM GA4: Ecommerce event tests failed:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Validate custom dimensions configuration
     */
    private validateCustomDimensions(): TestResults {
        try {
            const requiredDimensions = [
                'tour_id', 'tour_name', 'tour_category', 'tour_location',
                'tour_duration', 'booking_date', 'payment_provider'
            ];

            const missingDimensions = requiredDimensions.filter(
                dimension => !this.customDimensions[dimension as keyof CustomDimensions]
            );

            if (missingDimensions.length > 0) {
                return {
                    success: false,
                    errors: [`Missing custom dimensions: ${missingDimensions.join(', ')}`]
                };
            }

            console.log('✅ GTM GA4: Custom dimensions validation passed');
            return { success: true, errors: [] };

        } catch (error: any) {
            console.error('GTM GA4: Custom dimensions validation failed:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Get GA4 configuration status
     */
    getStatus(): Status {
        return {
            isInitialized: this.isInitialized,
            measurementId: this.ga4MeasurementId,
            debugMode: this.debugMode,
            customDimensions: this.customDimensions,
            enhancedEcommerceEnabled: true,
            dataLayerLength: window.dataLayer ? window.dataLayer.length : 0
        };
    }

    /**
     * Enable debug mode for detailed logging
     */
    enableDebugMode(enabled: boolean = true): void {
        this.debugMode = enabled;

        if (enabled) {
            console.log('GTM GA4: Debug mode enabled');

            // Push debug configuration
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'gtm_ga4_debug_mode',
                    debug_mode: true,
                    measurement_id: this.ga4MeasurementId,
                    _timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Get enhanced ecommerce configuration
     */
    getEnhancedEcommerceConfig(): EnhancedEcommerceConfig {
        return this.enhancedEcommerceConfig;
    }
}

// Create singleton instance
const gtmGA4Config = new GTMGA4Config();

export default gtmGA4Config;