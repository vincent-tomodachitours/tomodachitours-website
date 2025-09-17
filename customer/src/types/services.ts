// Service layer interface definitions

import {
    AnalyticsEvent,
    ConversionData,
    TrackingData,
    PaymentFormData,
    PaymentResult,
    TransactionData,
    ValidationResult,
    TourData,
    TourType,
    BookingData,
    AttributionData,
    GoogleAdsConversionConfig
} from './index';

// ============================================================================
// ANALYTICS SERVICE INTERFACES
// ============================================================================

export interface AnalyticsService {
    // Core tracking methods
    trackEvent(event: AnalyticsEvent): Promise<boolean>;
    trackPageView(page: string, title?: string): Promise<boolean>;
    trackConversion(data: ConversionData): Promise<boolean>;

    // E-commerce tracking
    trackPurchase(transactionData: TransactionData): Promise<boolean>;
    trackBeginCheckout(tourData: TrackingData): Promise<boolean>;
    trackTourView(tourData: TrackingData): Promise<boolean>;
    trackAddToCart(tourData: TrackingData): Promise<boolean>;
    trackViewItem(tourData: TrackingData): Promise<boolean>;

    // User engagement
    trackEngagementTime(timeOnPage: number): void;
    setUserProperties(properties: Record<string, any>): void;

    // Custom events
    trackCustomEvent(eventName: string, parameters?: Record<string, any>): Promise<boolean>;
    trackTourImageClick(tourId: string, imageIndex: number): void;
    trackTourTabClick(tourId: string, tabName: string): void;

    // Initialization
    initialize(): Promise<void>;
}

export interface GoogleAdsService {
    // Initialization
    initializeGoogleAdsTracking(): void;

    // Core conversion tracking
    trackGoogleAdsConversion(
        conversionAction: string,
        conversionData?: Partial<ConversionData>,
        options?: TrackingOptions
    ): Promise<boolean>;

    // E-commerce conversions
    trackGoogleAdsPurchase(transactionData: TransactionData, options?: TrackingOptions): Promise<boolean>;
    trackGoogleAdsBeginCheckout(tourData: TrackingData, options?: TrackingOptions): Promise<boolean>;
    trackGoogleAdsViewItem(tourData: TrackingData, options?: TrackingOptions): Promise<boolean>;
    trackGoogleAdsAddToCart(tourData: TrackingData, options?: TrackingOptions): Promise<boolean>;

    // Advanced tracking
    trackCustomGoogleAdsConversion(conversionAction: string, customData?: Record<string, any>): void;
    trackTourSpecificGoogleAdsConversion(
        tourId: string,
        conversionAction: string,
        conversionData?: Partial<ConversionData>
    ): void;
    trackEnhancedConversion(
        conversionAction: string,
        conversionData: ConversionData,
        enhancedData?: EnhancedConversionData
    ): void;

    // Cross-device and offline tracking
    trackCrossDeviceConversion(crossDeviceData: CrossDeviceConversionData): void;
    trackServerSideConversion(serverConversionData: ServerSideConversionData): void;
    trackOfflineConversion(gclid: string, conversionData: ConversionData): void;

    // Configuration
    enableConversionLinker(): void;
    getGoogleAdsConfig(): GoogleAdsConfig;
}

export interface TrackingOptions {
    maxRetries?: number;
    timeout?: number;
    validateData?: boolean;
}

export interface EnhancedConversionData {
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    gclid?: string;
    device_id?: string;
    user_agent?: string;
    conversion_environment?: Record<string, any>;
}

export interface CrossDeviceConversionData {
    customer_email_hash?: string;
    customer_phone_hash?: string;
    gclid?: string;
    device_id?: string;
    user_agent?: string;
    original_device_type?: string;
    conversion_device_type?: string;
    time_to_conversion?: number;
    value: number;
    currency?: string;
    transaction_id: string;
    tour_id: string;
    tour_name: string;
}

export interface ServerSideConversionData {
    value: number;
    currency?: string;
    transaction_id: string;
    gclid?: string;
    conversion_date_time?: string;
    enhanced_conversion_data?: EnhancedConversionData;
    attribution_source?: string;
    attribution_medium?: string;
    attribution_campaign?: string;
    tour_id: string;
    tour_name: string;
    tour_category?: string;
}

export interface GoogleAdsConfig {
    conversionId?: string;
    conversionLabels: Record<string, string>;
    isEnabled: boolean;
}

// ============================================================================
// PAYMENT SERVICE INTERFACES
// ============================================================================

export interface PaymentService {
    // Core payment processing
    processPayment(paymentData: PaymentFormData): Promise<PaymentResult>;

    // Payment validation
    validateCard(cardData: any): boolean;
    validatePaymentData(paymentData: PaymentFormData): ValidationResult<PaymentFormData>;

    // Payment provider specific methods
    createToken(cardElement: any): Promise<{ id: string; error?: any }>;
    confirmPayment(clientSecret: string, paymentMethod: any): Promise<PaymentResult>;

    // Configuration
    initialize(publicKey: string, options?: any): void;
    isReady(): boolean;
    getProvider(): string;
}

export interface StripeService extends PaymentService {
    // Stripe-specific methods
    createPaymentIntent(amount: number, currency: string, metadata?: Record<string, any>): Promise<any>;
    retrievePaymentIntent(paymentIntentId: string): Promise<any>;
    handleCardAction(clientSecret: string): Promise<PaymentResult>;
}

export interface PayJPService extends PaymentService {
    // PayJP-specific methods
    createToken(cardElement: any): Promise<{ id: string; error?: any }>;
    handle3DSecure(tokenId: string): Promise<PaymentResult>;
}

// ============================================================================
// BOOKING SERVICE INTERFACES
// ============================================================================

export interface BookingService {
    // Booking management
    createBooking(bookingData: BookingData): Promise<{ success: boolean; bookingId?: string; error?: string }>;
    updateBooking(bookingId: string, updates: Partial<BookingData>): Promise<boolean>;
    cancelBooking(bookingId: string, reason?: string): Promise<boolean>;
    getBooking(bookingId: string): Promise<BookingData | null>;

    // Availability checking
    checkAvailability(
        tourType: TourType,
        date: string,
        timeSlot: string,
        participantCount?: number
    ): Promise<boolean>;
    getAvailableTimeSlots(tourType: TourType, date: string): Promise<string[]>;

    // Validation
    validateBookingData(bookingData: Partial<BookingData>): ValidationResult<BookingData>;
}

// ============================================================================
// TOUR SERVICE INTERFACES
// ============================================================================

export interface TourService {
    // Tour data management
    fetchTours(): Promise<Record<string, TourData>>;
    getTour(configKey: string): Promise<TourData | null>;
    clearToursCache(): void;

    // Availability integration
    checkAvailability(
        tourType: string,
        date: string,
        timeSlot: string,
        participantCount?: number
    ): Promise<boolean>;
    getAvailableTimeSlots(tourType: string, date: string): Promise<Array<{
        time: string;
        availableSpots: number;
        source: string;
    }>>;

    // Cache management
    invalidateAvailabilityCache(tourType: string, date: string): Promise<void>;
    refreshAvailabilityForDate(date: string): Promise<void>;
}

// ============================================================================
// CURRENCY SERVICE INTERFACES
// ============================================================================

export interface CurrencyService {
    // Exchange rate management
    getJPYToUSDRate(): Promise<number>;
    convertJPYToUSD(jpyAmount: number): Promise<number>;

    // Formatting
    formatUSD(usdAmount: number): string;
    getFormattedUSDConversion(jpyAmount: number): Promise<string>;

    // Cache management
    clearCache(): void;
}

// ============================================================================
// ATTRIBUTION SERVICE INTERFACES
// ============================================================================

export interface AttributionService {
    // Attribution tracking
    initialize(): void;
    trackAttribution(source: string, medium: string, campaign?: string): void;
    getAttribution(): AttributionData | null;

    // UTM parameter handling
    captureUTMParameters(): void;
    getUTMParameters(): Record<string, string>;

    // Cross-session attribution
    persistAttribution(attribution: AttributionData): void;
    getPersistedAttribution(): AttributionData | null;
}

// ============================================================================
// DATA VALIDATION SERVICE INTERFACES
// ============================================================================

export interface DataValidationService {
    // Google Ads validation
    validateGoogleAdsConversion(config: GoogleAdsConversionConfig): ValidationResult<GoogleAdsConversionConfig>;

    // Transaction validation
    validateTransaction(transactionData: TransactionData): ValidationResult<TransactionData>;

    // Tour validation
    validateTour(tourData: any): ValidationResult<TourData>;

    // Customer data validation
    validateCustomerInfo(customerInfo: any): ValidationResult<any>;

    // General validation utilities
    sanitizeString(input: string): string;
    validateEmail(email: string): boolean;
    validatePhone(phone: string): boolean;
}

// ============================================================================
// PERFORMANCE MONITORING INTERFACES
// ============================================================================

export interface PerformanceMonitorService {
    // Error handling
    handleError(errorType: string, errorData: any): void;

    // Metrics recording
    recordMetric(metricName: string, metricData: any): void;

    // Performance tracking
    startTimer(timerName: string): void;
    endTimer(timerName: string): number;

    // Initialization
    initialize(): void;
}

// ============================================================================
// PRIVACY MANAGEMENT INTERFACES
// ============================================================================

export interface PrivacyManagerService {
    // Consent management
    canTrackAnalytics(): boolean;
    canTrackMarketing(): boolean;
    canTrackFunctional(): boolean;

    // Consent setting
    setConsent(consentType: string, granted: boolean): void;

    // Privacy compliance
    anonymizeData(data: any): any;
    hashPersonalData(data: string): Promise<string>;
}