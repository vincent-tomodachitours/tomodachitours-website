// Common data structures and utility types used across the application

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    code?: string;
    timestamp?: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// ============================================================================
// SUPABASE TYPES
// ============================================================================

export interface SupabaseResponse<T = any> {
    data: T | null;
    error: SupabaseError | null;
    count?: number;
    status: number;
    statusText: string;
}

export interface SupabaseError {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField<T = any> {
    value: T;
    error?: string;
    touched: boolean;
    required?: boolean;
    disabled?: boolean;
}

export interface FormState<T extends Record<string, any>> {
    fields: {
        [K in keyof T]: FormField<T[K]>;
    };
    isValid: boolean;
    isSubmitting: boolean;
    submitCount: number;
    errors: Record<string, string>;
}

export interface FormValidationRule<T = any> {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: T) => string | null;
}

export type FormValidationRules<T extends Record<string, any>> = {
    [K in keyof T]?: FormValidationRule<T[K]>;
};

// ============================================================================
// DATE AND TIME TYPES
// ============================================================================

export interface DateRange {
    start: Date;
    end: Date;
}

export interface TimeSlot {
    time: string;
    available: boolean;
    capacity: number;
    booked: number;
    remaining: number;
}

export interface CalendarDay {
    date: Date;
    available: boolean;
    timeSlots: TimeSlot[];
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;
}

// ============================================================================
// LOADING AND ERROR STATES
// ============================================================================

export interface LoadingState {
    isLoading: boolean;
    loadingMessage?: string;
    progress?: number;
}

export interface ErrorState {
    hasError: boolean;
    error?: Error | string;
    errorCode?: string;
    retryCount?: number;
    canRetry?: boolean;
}

export interface AsyncState<T = any> extends LoadingState, ErrorState {
    data?: T;
    lastUpdated?: Date;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    expiresAt: number;
    key: string;
}

export interface CacheConfig {
    ttl: number; // Time to live in milliseconds
    maxSize?: number;
    strategy?: 'lru' | 'fifo' | 'lfu';
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface CustomEvent<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    source?: string;
}

export interface UserInteractionEvent {
    type: 'click' | 'scroll' | 'focus' | 'blur' | 'input' | 'submit';
    element?: string;
    elementId?: string;
    elementClass?: string;
    value?: any;
    timestamp: number;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface AppConfig {
    environment: 'development' | 'staging' | 'production';
    apiBaseUrl: string;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
    features: FeatureFlags;
    thirdParty: ThirdPartyConfig;
}

export interface FeatureFlags {
    enableGoogleAds: boolean;
    enableStripe: boolean;
    enableTripAdvisor: boolean;
    enableCurrencyConversion: boolean;
    enableSecurityHeaders: boolean;
}

export interface ThirdPartyConfig {
    googleAnalytics?: {
        measurementId: string;
        enabled: boolean;
    };
    googleAds?: {
        conversionId: string;
        conversionLabels: Record<string, string>;
        enabled: boolean;
    };
    stripe?: {
        publishableKey: string;
        enabled: boolean;
    };
    tripAdvisor?: {
        locationId: string;
        enabled: boolean;
    };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type NonEmptyArray<T> = [T, ...T[]];

export type KeyOf<T> = keyof T;
export type ValueOf<T> = T[keyof T];

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// ============================================================================
// BRAND TYPES (for type safety)
// ============================================================================

export type Brand<T, B> = T & { __brand: B };

export type TourId = Brand<string, 'TourId'>;
export type BookingId = Brand<string, 'BookingId'>;
export type TransactionId = Brand<string, 'TransactionId'>;
export type UserId = Brand<string, 'UserId'>;
export type EmailAddress = Brand<string, 'EmailAddress'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;

// ============================================================================
// DISCRIMINATED UNION TYPES
// ============================================================================

export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ============================================================================
// COMPONENT STATE TYPES
// ============================================================================

export interface ComponentState {
    mounted: boolean;
    visible: boolean;
    focused: boolean;
    disabled: boolean;
    loading: boolean;
    error?: string;
}

export interface ModalState {
    isOpen: boolean;
    canClose: boolean;
    backdrop: 'static' | 'clickable';
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ToastState {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    duration?: number;
    persistent?: boolean;
    actions?: ToastAction[];
}

export interface ToastAction {
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
}

// ============================================================================
// RESPONSIVE DESIGN TYPES
// ============================================================================

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveValue<T> {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    '2xl'?: T;
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

export interface A11yProps {
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    'aria-expanded'?: boolean;
    'aria-hidden'?: boolean;
    'aria-live'?: 'off' | 'polite' | 'assertive';
    role?: string;
    tabIndex?: number;
}

// ============================================================================
// THEME TYPES
// ============================================================================

export interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: {
        primary: string;
        secondary: string;
        disabled: string;
    };
}

export interface ThemeSpacing {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
}

export interface Theme {
    colors: ThemeColors;
    spacing: ThemeSpacing;
    breakpoints: Record<Breakpoint, string>;
    typography: {
        fontFamily: string;
        fontSize: Record<string, string>;
        fontWeight: Record<string, number>;
        lineHeight: Record<string, string>;
    };
}