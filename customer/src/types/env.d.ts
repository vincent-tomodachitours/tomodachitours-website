// Environment variable type definitions for the customer application

declare namespace NodeJS {
    interface ProcessEnv {
        // React App Environment
        NODE_ENV: 'development' | 'production' | 'test';
        REACT_APP_ENVIRONMENT?: 'development' | 'staging' | 'production';

        // Google Analytics & Ads
        REACT_APP_GA_MEASUREMENT_ID?: string;
        REACT_APP_GOOGLE_ADS_CONVERSION_ID?: string;
        REACT_APP_GOOGLE_ADS_CONVERSION_LABELS?: string;
        REACT_APP_TOUR_SPECIFIC_CONVERSION_LABELS?: string;
        REACT_APP_GTM_ID?: string;

        // Supabase Configuration
        REACT_APP_SUPABASE_URL: string;
        REACT_APP_SUPABASE_ANON_KEY: string;

        // Payment Providers
        REACT_APP_STRIPE_PUBLISHABLE_KEY?: string;


        // Feature Flags
        REACT_APP_ENABLE_ANALYTICS?: 'true' | 'false';
        REACT_APP_ENABLE_GOOGLE_ADS?: 'true' | 'false';
        REACT_APP_ENABLE_STRIPE?: 'true' | 'false';


        // API Configuration
        REACT_APP_API_BASE_URL?: string;
        REACT_APP_BOKUN_API_URL?: string;

        // TripAdvisor
        REACT_APP_TRIPADVISOR_LOCATION_ID?: string;

        // Currency Service
        REACT_APP_EXCHANGE_RATE_API_KEY?: string;

        // Debug and Development
        REACT_APP_DEBUG_MODE?: 'true' | 'false';
        REACT_APP_CONSOLE_SUPPRESS?: 'true' | 'false';

        // Security
        REACT_APP_ENABLE_SECURITY_HEADERS?: 'true' | 'false';
        REACT_APP_CSP_REPORT_URI?: string;
    }
}

// Global window extensions for third-party libraries
declare global {
    interface Window {
        // Google Analytics & GTM
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];

        // Payment Providers
        Stripe?: any;


        // Custom functions exposed by components
        submitPaymentForm?: () => Promise<void>;

        // TripAdvisor
        taWidgets?: any;

        // Development/Debug
        __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
        performanceMonitor?: any;
        attributionService?: any;
        offlineConversionService?: any;
        remarketingManager?: any;
        dynamicRemarketingService?: any;
        tourSpecificTracking?: any;
        bookingFlowManager?: any;
    }
}

// SVG Module Declarations
declare module '*.svg' {
    import React from 'react';
    const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    export { ReactComponent };
    const src: string;
    export default src;
}

export { };