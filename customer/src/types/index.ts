// Central type definitions for the customer application
// This file serves as the main export point for all application types

// Re-export all types from other type files
export * from './services';
export * from './common';

// ============================================================================
// WINDOW DECLARATIONS
// ============================================================================

declare global {
    interface Window {
        submitPaymentForm?: () => Promise<void>;
        handleStripe3DSecure?: (clientSecret: string) => Promise<any>;
        stripeHandlersReady?: boolean;
    }
}

// ============================================================================
// TOUR TYPES
// ============================================================================

export interface TourData {
    id: string;
    type: TourType;
    'tour-title': string;
    'tour-description': string;
    'tour-price': number;
    'original-price'?: number;
    'tour-duration': string;
    reviews: number;
    'time-slots': string[];
    'max-participants': number;
    'min-participants': number;
    'cancellation-cutoff-hours': number;
    'cancellation-cutoff-hours-with-participant': number;
    'next-day-cutoff-time'?: string;
    'meeting-point': string;
    updated_at?: string;
}

export type TourType =
    | 'NIGHT_TOUR'
    | 'MORNING_TOUR'
    | 'UJI_TOUR'
    | 'UJI_WALKING_TOUR'
    | 'GION_TOUR'
    | 'MUSIC_TOUR'
    | 'MUSIC_PERFORMANCE';

export type TourConfigKey =
    | 'night-tour'
    | 'morning-tour'
    | 'uji-tour'
    | 'uji-walking-tour'
    | 'gion-tour'
    | 'music-tour'
    | 'music-performance';

export interface TourAvailability {
    time: string;
    availableSpots: number;
    source: 'bokun' | 'fallback' | 'database';
}

export interface AvailabilityData {
    timeSlots: TourAvailability[];
    fallback?: boolean;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface BookingData {
    tourId: string;
    tourType: TourType;
    tourName: string;
    bookingDate: string;
    bookingTime: string;
    totalParticipants: number;
    adultParticipants: number;
    childParticipants: number;
    infantParticipants: number;
    customerInfo: CustomerInfo;
    paymentInfo: PaymentInfo;
    totalPrice: number;
    status: BookingStatus;
    transactionId?: string;
    discountCode?: string;
    appliedDiscount?: number;
}

export type BookingStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'COMPLETED';

export interface CustomerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    specialRequests?: string;
}

export interface PaymentInfo {
    provider: PaymentProvider;
    token?: string;
    transactionId?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
}

export type PaymentProvider = 'stripe';

export type PaymentStatus =
    | 'pending'
    | 'processing'
    | 'succeeded'
    | 'failed'
    | 'cancelled';

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsEvent {
    event: string;
    category: string;
    action: string;
    label?: string;
    value?: number;
    custom_parameters?: Record<string, any>;
}

export interface ConversionData {
    value: number;
    currency: string;
    transaction_id?: string;
    tour_id?: string;
    tour_name?: string;
    tour_category?: string;
    tour_location?: string;
    quantity?: number;
    attribution_source?: string;
    attribution_medium?: string;
    attribution_campaign?: string;
    gclid?: string;
}

export interface TrackingData {
    tourId: string;
    tourName: string;
    price: number;
    participants?: number;
    date?: string;
    time?: string;
    attribution?: AttributionData;
    tour_category?: string;
    customerData?: CustomerInfo;
    bookingDate?: string;
    paymentProvider?: string;
}

export interface AttributionData {
    source?: string;
    medium?: string;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
    gclid?: string | null;
    first_source?: string;
    first_medium?: string;
    first_campaign?: string | null;
    session_id?: string;
    landing_page?: string;
    referrer?: string;
    touchpoints?: number | string[];
    attribution_chain?: AttributionTouchpoint[];
}

export interface AttributionTouchpoint {
    source: string;
    medium: string;
    campaign?: string | null;
    gclid?: string | null;
    landing_page?: string;
    timestamp: number;
}

export interface GoogleAdsConversionConfig {
    send_to: string;
    value?: number;
    currency?: string;
    transaction_id?: string;
    tour_id?: string;
    tour_name?: string;
    tour_category?: string;
    tour_location?: string;
    quantity?: number;
    attribution_source?: string;
    attribution_medium?: string;
    attribution_campaign?: string;
    gclid?: string;
}

// Additional analytics types for GTM integration
export interface GTMEventData {
    transaction_id?: string;
    value?: number;
    currency?: string;
    items?: GTMItem[];
    tour_type?: string;
    tour_location?: string;
    price_range?: string;
    checkout_step?: number;
    checkout_timestamp?: number;
    purchase_timestamp?: number;
    view_timestamp?: number;
    add_to_cart_timestamp?: number;
    user_engagement_level?: string;
    tourData?: {
        tourId: string;
        tourName: string;
        tourCategory: string;
        tourLocation: string;
        tourDuration: string;
        bookingDate?: string;
        paymentProvider?: string;
        priceRange: string;
    };
    [key: string]: any; // Allow additional properties
}

export interface GTMItem {
    item_id: string;
    item_name: string;
    item_category: string;
    item_category2?: string;
    item_category3?: string;
    item_variant?: string;
    quantity?: number;
    price?: number;
}

export interface EnhancedTourData {
    tourId: string;
    tourName: string;
    price: number;
    tour_category: string;
    tour_duration: string;
    tour_location: string;
    price_range: string;
    participants?: number;
    date?: string;
    time?: string;
    attribution?: AttributionData;
    bookingDate?: string;
    paymentProvider?: string;
    customerData?: CustomerInfo;
}

export interface AbandonmentData {
    type: 'cart' | 'checkout';
    data: any;
    stage?: string;
    timestamp: number;
}

export interface CartData {
    tourId: string;
    tourName: string;
    price: number;
    tour_category?: string;
    tour_duration?: string;
    tour_location?: string;
    price_range?: string;
    add_to_cart_timestamp?: number;
    added_at?: number;
    updated_at?: number;
}

export interface FunnelStepData {
    stepName: string;
    stepNumber?: number;
    tourData: TrackingData;
    attribution?: AttributionData;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentFormData {
    provider: PaymentProvider;
    token?: string;
    amount: number;
    currency: string;
    paymentMethod?: string;
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
    requiresAction?: boolean;
    clientSecret?: string;
}

export interface CardData {
    number?: string;
    expiry?: string;
    cvc?: string;
    name?: string;
}

export interface TransactionData {
    transactionId: string;
    value: number;
    currency: string;
    tourId: string;
    tourName: string;
    tour_category?: string;
    tour_location?: string;
    quantity?: number;
    attribution?: AttributionData;
    price?: number;
    customerData?: CustomerInfo;
    bookingDate?: string;
    paymentProvider?: string;
}

// ============================================================================
// CURRENCY TYPES
// ============================================================================

export interface CurrencyConversion {
    jpyAmount: number;
    usdAmount: string;
    rate: number;
    timestamp: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ValidationResult<T = any> {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
    sanitizedData?: T;
}

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
    details?: any;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface DatePickerProps {
    className?: string;
    tourName: string;
    maxSlots: number;
    minParticipants?: number;
    availableTimes: string[];
    sheetId: string;
    tourId: string;
    price: number;
    originalPrice?: number;
    cancellationCutoffHours: number;
    cancellationCutoffHoursWithParticipant: number;
    nextDayCutoffTime?: string;
}

export interface PaymentFormProps {
    totalPrice: number;
    originalPrice?: number;
    appliedDiscount?: number;
    onCreateBookingAndPayment: (paymentData: PaymentFormData) => Promise<void>;
    onError: (error: string) => void;
    onProcessing: (message: string) => void;
    isProcessing: boolean;
}

export interface PriceDisplayProps {
    jpyPrice: number;
    originalPrice?: number;
    className?: string;
    showPerGuest?: boolean;
    showViatorComparison?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export interface CheckoutProps {
    onClose: () => void;
    tourName: string;
    sheetId: string;
    tourDate: string;
    tourTime: string;
    adult: number;
    child: number;
    infant: number;
    tourPrice: number;
}

export interface CheckoutFormData {
    fname: string;
    lname: string;
    email: string;
    phone: string;
    terms: boolean;
}

export interface CheckoutFormProps {
    formData: CheckoutFormData;
    onInputChange: (event: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string; type: string; } }) => void;
    emailError: string | null;
    emailTouched: boolean;
    onEmailBlur: () => void;
    paymentProcessing: boolean;
}

export interface PaymentSectionProps {
    childRef: React.RefObject<any>;
    formRef: React.RefObject<any>;
    sheetId: string;
    tourDate: string;
    tourTime: string;
    adult: number;
    child: number;
    infant: number;
    finalPrice: number;
    originalPrice: number;
    appliedDiscount: any;
    tourName: string;
    formData: CheckoutFormData;
    paymentProcessing: boolean;
    setPaymentProcessing: (processing: boolean) => void;
    setIs3DSInProgress: (inProgress: boolean) => void;
}

export interface StripePaymentFormProps {
    totalPrice: number;
    originalPrice: number;
    appliedDiscount: any;
    onCreateBookingAndPayment: (paymentData: any) => Promise<void>;
    onError: (error: string) => void;
    onProcessing: (message: string) => void;
    isProcessing: boolean;
}

export interface CardFormProps {
    totalPrice: number;
    originalPrice: number;
    appliedDiscount: any;
    formRef: React.RefObject<any>;
    tourName: string;
    sheetId: string;
    tourDate: string;
    tourTime: string;
    adult: number;
    child: number;
    infant: number;
    formData: CheckoutFormData;
    paymentProcessing: boolean;
    setPaymentProcessing: (processing: boolean) => void;
    setIs3DSInProgress: (inProgress: boolean) => void;
}

export interface PaymentProviderHook {
    primaryProvider: string;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export interface UseCheckoutLogicReturn {
    // State
    paymentProcessing: boolean;
    setPaymentProcessing: (processing: boolean) => void;
    discountCode: string;
    setDiscountCode: (code: string) => void;
    appliedDiscount: any;
    discountLoading: boolean;
    discountError: string;
    emailError: string;
    emailTouched: boolean;
    is3DSInProgress: boolean;
    setIs3DSInProgress: (inProgress: boolean) => void;
    paymentAllowed: boolean;
    formData: CheckoutFormData;
    finalPrice: number;
    bookingId: string | null;
    conversionValidated: boolean;
    conversionRetryCount: number;
    maxRetries: number;

    // Refs
    childRef: React.RefObject<any>;
    formRef: React.RefObject<any>;

    // Handlers
    handleInputChange: (event: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string; type: string; } }) => void;
    handleEmailBlur: () => void;
    handleApplyDiscount: () => void;
    handlePayNowButton: () => void;
}

export interface UseCheckoutLogicParams {
    sheetId: string;
    tourName: string;
    adult: number;
    child: number;
    infant: number;
    tourDate: string;
    tourTime: string;
    tourPrice: number;
}

export interface TimeSlotSelectorProps {
    calendarSelectedDate: Date;
    loadingAvailability: boolean;
    tourTime: string;
    handleTourTimeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    availableTimesForDate: string[];
    participantsByDate: Record<string, Record<string, number>> | {};
    cancellationCutoffHours: number;
    cancellationCutoffHoursWithParticipant: number;
    tourName: string;
    tourId: string;
    adultParticipants: number;
    childParticipants: number;
    infantParticipants: number;
    totalPrice: number;
    minParticipants?: number;
    handleGoBack: () => void;
    handleOpenCheckout: () => void;
}

export interface PeopleSelectorProps {
    min?: number;
    max?: number;
    title?: string;
    participants: number;
    value: number;
    onChange: (value: number) => void;
    ageRange?: string;
    price?: number;
}

// Tour Page Component Props
export interface DurationReviewProps {
    tourDuration: string;
    tourReviews: number;
}

export interface ExpandableContentProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    children: React.ReactNode;
    maxHeight?: string;
    isMobile?: boolean;
}

export interface TourHeaderProps {
    tourTitle: string;
    tourReviews: number;
    showSharePopup: boolean;
    showInfoTooltip: boolean;
    setShowInfoTooltip: (show: boolean) => void;
    handleShare: () => void;
    customMessage?: string | null;
}

export interface ImageShowcaseProps {
    isMobile: boolean;
    images: Array<{ src: string; alt?: string }>;
    tourId: string;
    tourName: string;
}

export interface TourDetailsProps {
    tourData: TourData;
    children?: React.ReactNode;
}

export interface TourItineraryProps {
    itinerary: ItineraryItem[];
}

export interface ItineraryItem {
    title: string;
    description: string;
    duration?: string;
    image?: string;
}

export interface TourMeetingPointProps {
    meetingPoint: string;
    tourTitle: string;
}

export interface TourOverviewProps {
    content: string[];
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    isMobile: boolean;
}

export interface TourTabsProps {
    activeContent: number;
    setActiveContent: (content: number) => void;
    tourId: string;
    tourTitle: string;
    trackTourTabClick: (tourId: string, tourName: string, tabName: string, tabIndex?: number) => void;
}

export interface TabItem {
    id: string;
    label: string;
    content: React.ReactNode;
}

export interface BaseTourPageProps {
    tourId: string;
    images: Array<{ src: string; alt?: string }>;
    overviewContent: string[];
    tourDetails: {
        included: string[];
        notIncluded: string[];
        accessibility: string[];
    };
    itineraryStops: ItineraryItem[];
    meetingPointData: {
        location: string;
        googleMapsUrl: string;
        instructions: string;
    };
    SEOComponent?: React.ReactNode;
    StructuredDataComponent?: React.ReactNode;
    showReviews?: boolean;
    customHeaderMessage?: string | null;
}

export interface TourDetailsComponentProps {
    maxSlots: number;
    tourDuration: string;
    included: string[];
    notIncluded: string[];
    accessibility: string[];
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    isMobile: boolean;
}

export interface TourItineraryComponentProps {
    stops: ItineraryItem[];
    meetingPoint: {
        location: string;
        googleMapsUrl: string;
        instructions: string;
    };
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    isMobile: boolean;
}

export interface TourMeetingPointComponentProps {
    meetingPoint: {
        location: string;
        googleMapsUrl: string;
        instructions: string;
    };
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    isMobile: boolean;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseTourDataReturn {
    tourData: TourData | null;
    loading: boolean;
    error: Error | null;
}

export interface UseCurrencyReturn {
    usdAmount: string | null;
    loading: boolean;
    error: Error | null;
}

export interface UseAvailabilityReturn {
    preloadedAvailability: Record<string, AvailabilityData>;
    availabilityLoading: boolean;
    setAvailabilityLoading: (loading: boolean) => void;
    preloadAvailabilityForDates: (startDate: Date, endDate: Date) => Promise<void>;
    returnAvailableTimes: (date: Date, participants: number) => Promise<string[]>;
    isDateFull: (date: Date, participants: number) => boolean;
    findNextAvailableDate: () => Promise<Date>;
}

export interface UseBookingsReturn {
    bookings: BookingData[];
    participantsByDate: Record<string, Record<string, number>> | {};
    fetchBookings: () => Promise<void>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;