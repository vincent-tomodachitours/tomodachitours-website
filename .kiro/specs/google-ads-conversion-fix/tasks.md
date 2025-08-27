# Implementation Plan

- [x] 1. Set up Google Tag Manager foundation and container configuration
  - Create GTM container in Google Tag Manager interface with proper workspace setup
  - Configure GTM container with GA4 and Google Ads account linking
  - Add GTM container script to customer/public/index.html with proper async loading
  - Create environment variables for GTM container ID and configuration
  - _Requirements: 2.1, 2.2, 10.1_

- [x] 2. Implement GTM service layer to replace direct gtag calls
  - Create customer/src/services/gtmService.js with dataLayer management functions
  - Implement pushEvent, setUserProperties, and initialization methods
  - Add GTM loading validation and fallback mechanisms for gtag
  - Write unit tests for GTM service functionality
  - _Requirements: 2.1, 2.4, 9.3_

- [x] 3. Create simplified booking flow state management
  - Create customer/src/services/bookingFlowManager.js for centralized booking state
  - Implement clear booking progression steps (view_item, begin_checkout, add_payment_info, purchase)
  - Add booking state validation and conversion point tracking
  - Write unit tests for booking flow state management
  - _Requirements: 6.1, 9.1, 9.2_

- [x] 4. Configure Google Ads conversion actions and labels in GTM
  - Set up Google Ads conversion tracking tags in GTM container
  - Configure proper conversion labels for purchase, begin_checkout, and view_item events
  - Add conversion value and currency configuration with dynamic values
  - Test conversion tag firing using GTM preview mode
  - _Requirements: 1.1, 1.2, 10.1, 10.2_

- [x] 5. Implement enhanced conversions service with customer data hashing
  - Create customer/src/services/enhancedConversionService.js for customer data processing
  - Implement SHA-256 hashing for email, phone, and name data
  - Add privacy compliance validation and GDPR consent checking
  - Write unit tests for data hashing and privacy compliance
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Migrate existing analytics events to GTM dataLayer structure
  - Update customer/src/services/analytics/ecommerceTracking.js to use GTM service
  - Modify trackPurchase, trackBeginCheckout, and trackTourView to push dataLayer events
  - Replace direct gtag calls with structured dataLayer events
  - Test parallel tracking to ensure no data loss during migration
  - _Requirements: 2.1, 2.2, 9.3_

- [x] 7. Redesign Checkout component with simplified conversion tracking
  - Modify customer/src/Components/Checkout.jsx to use bookingFlowManager
  - Implement clear begin_checkout event firing with structured data
  - Add conversion validation and retry logic for failed tracking
  - Remove complex attribution service calls in favor of GTM attribution
  - _Requirements: 6.1, 6.2, 9.1, 9.2_

- [x] 8. Update payment components to use GTM-based conversion tracking
  - Modify customer/src/Components/StripePaymentForm.jsx to fire add_payment_info events
  - Update payment success callbacks to use bookingFlowManager for purchase tracking
  - Add payment provider information to conversion data
  - Test payment flow conversion tracking with GTM debug console
  - _Requirements: 6.2, 9.2, 1.1_

- [x] 9. Redesign Thankyou page with comprehensive purchase conversion tracking
  - Update customer/src/Pages/Thankyou.jsx to use simplified GTM-based purchase tracking
  - Implement enhanced conversion data collection and firing
  - Add server-side conversion validation trigger
  - Remove complex session storage cleanup in favor of GTM-managed data
  - _Requirements: 1.1, 3.1, 4.1, 8.1_

- [x] 10. Implement server-side conversion backup system
  - Create supabase/functions/google-ads-conversion/index.ts for server-side conversion tracking
  - Implement Google Ads Conversion API integration for backup conversions
  - Add booking success validation and automatic conversion firing
  - Create conversion reconciliation logic to compare client vs server conversions
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11. Set up conversion monitoring and validation system
  - Create customer/src/services/conversionMonitor.js for real-time conversion validation
  - Implement conversion firing success tracking and failure alerting
  - Add conversion accuracy comparison between tracked and actual bookings
  - Create diagnostic reporting for conversion tracking issues
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Configure GTM tags for GA4 integration and ecommerce tracking
  - Set up GA4 configuration tag in GTM with enhanced ecommerce enabled
  - Configure GA4 event tags for purchase, begin_checkout, view_item, and add_payment_info
  - Add custom dimensions and parameters for tour-specific data
  - Test GA4 data flow and ecommerce reporting accuracy
  - _Requirements: 2.1, 8.2, 8.3_

- [x] 13. Implement conversion value optimization with dynamic pricing
  - Update conversion tracking to include accurate pricing with discounts applied
  - Add conversion value validation to ensure pricing accuracy
  - Implement Target ROAS campaign support with proper value tracking
  - Create revenue attribution reporting by campaign and keyword
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 14. Create comprehensive testing suite for GTM and conversion tracking
  - Write integration tests for GTM container loading and tag firing
  - Create end-to-end tests for complete booking flow conversion tracking
  - Implement conversion accuracy validation tests
  - Add GTM debug mode testing and validation scenarios
  - _Requirements: 1.4, 2.3, 7.1, 10.2_

- [x] 15. Set up production GTM container and Google Ads conversion actions
  - Create production GTM container with all configured tags and triggers
  - Set up actual Google Ads conversion actions with proper labels and values
  - Configure enhanced conversions in Google Ads interface
  - Update production environment variables with actual GTM and conversion IDs
  - _Requirements: 1.2, 3.1, 10.1, 10.2_

- [x] 16. Implement gradual migration strategy with parallel tracking
  - Create feature flag system to gradually enable GTM tracking alongside existing system
  - Implement parallel tracking validation to compare old vs new conversion data
  - Add migration monitoring to ensure no conversion data loss
  - Create rollback mechanisms for emergency reversion to old system
  - _Requirements: 2.4, 6.3, 7.1_

- [x] 17. Add Google Merchant Center integration for Shopping campaigns
  - Create product feed generation for tour offerings with accurate pricing
  - Implement dynamic remarketing with product-level data in GTM
  - Set up Shopping campaign conversion tracking with product-specific data
  - Add product feed update automation and error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 18. Deploy and validate complete conversion tracking system
  - Deploy GTM container and updated booking flow to production
  - Validate all conversion tracking using Google Ads conversion diagnostics
  - Test enhanced conversions and server-side backup systems
  - Monitor conversion accuracy and resolve any remaining Google Ads warnings
  - _Requirements: 1.3, 7.2, 10.1, 10.3_