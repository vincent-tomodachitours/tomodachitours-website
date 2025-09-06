# Requirements Document

## Introduction

This feature addresses critical issues with the current Google Ads conversion tracking implementation that is preventing proper campaign optimization and causing Google Ads to report conversion setup problems. The solution combines two key approaches: migrating to Google Tag Manager for centralized tag management and redesigning the booking/payment flow for cleaner conversion tracking. This hybrid approach will implement a robust, reliable conversion tracking system using GTM, enhanced conversions, server-side validation, and simplified conversion points to ensure accurate attribution and campaign performance measurement.

## Requirements

### Requirement 1

**User Story:** As a marketing manager, I want reliable Google Ads conversion tracking that works consistently, so that I can optimize campaigns based on accurate conversion data and resolve Google Ads setup warnings.

#### Acceptance Criteria

1. WHEN a user completes a booking THEN the system SHALL fire a verified conversion event to Google Ads within 30 seconds
2. WHEN Google Ads reviews the conversion setup THEN the system SHALL pass all conversion tracking validation checks
3. WHEN viewing Google Ads conversion reports THEN the system SHALL show accurate conversion counts matching actual bookings
4. IF a conversion fails to track THEN the system SHALL retry the conversion event and log the failure for debugging

### Requirement 2

**User Story:** As a business owner, I want to switch from direct gtag implementation to Google Tag Manager, so that I can have better control over tracking, easier debugging, and more reliable conversion attribution.

#### Acceptance Criteria

1. WHEN implementing Google Tag Manager THEN the system SHALL migrate all existing GA4 and Google Ads tracking to GTM containers
2. WHEN a user interacts with the site THEN the system SHALL fire events through GTM's dataLayer instead of direct gtag calls
3. WHEN debugging tracking issues THEN the system SHALL provide GTM preview mode and debug console access
4. IF GTM fails to load THEN the system SHALL fall back to direct tracking to ensure no data loss

### Requirement 3

**User Story:** As a digital marketer, I want to implement enhanced conversions with customer data, so that I can improve conversion attribution accuracy and enable cross-device tracking for better campaign optimization.

#### Acceptance Criteria

1. WHEN a conversion occurs THEN the system SHALL send hashed customer email and phone data to Google Ads for enhanced attribution
2. WHEN users convert across multiple devices THEN the system SHALL maintain attribution chain through enhanced conversion data
3. WHEN implementing enhanced conversions THEN the system SHALL comply with privacy regulations and hash all personal data
4. IF enhanced conversion data is unavailable THEN the system SHALL still fire standard conversions to maintain tracking continuity

### Requirement 4

**User Story:** As a website administrator, I want to implement server-side conversion validation, so that I can ensure all successful bookings are properly tracked even if client-side tracking fails.

#### Acceptance Criteria

1. WHEN a booking payment is confirmed THEN the system SHALL fire a server-side conversion event as backup validation
2. WHEN client-side tracking fails THEN the system SHALL rely on server-side conversion data to maintain accurate reporting
3. WHEN processing server-side conversions THEN the system SHALL include all necessary attribution data (GCLID, campaign data)
4. IF server-side conversion tracking fails THEN the system SHALL log errors and alert administrators

### Requirement 5

**User Story:** As a tour business operator, I want to add Google Merchant Center integration for Shopping campaigns, so that I can run product-based ads for individual tours and improve conversion tracking through product feeds.

#### Acceptance Criteria

1. WHEN setting up Merchant Center THEN the system SHALL create product feeds for all tour offerings with accurate pricing and availability
2. WHEN users click Shopping ads THEN the system SHALL track product-specific conversions with tour details
3. WHEN running Shopping campaigns THEN the system SHALL enable dynamic remarketing with product-level data
4. IF product feed updates fail THEN the system SHALL maintain current product data and alert administrators

### Requirement 6

**User Story:** As a performance marketer, I want to redesign the booking flow conversion points combined with Google Tag Manager implementation, so that I can have clearer, more reliable conversion tracking that aligns with Google Ads best practices while leveraging GTM's management capabilities.

#### Acceptance Criteria

1. WHEN redesigning the booking flow THEN the system SHALL identify optimal conversion tracking points that work seamlessly with GTM dataLayer events
2. WHEN a user progresses through booking steps THEN the system SHALL fire structured dataLayer events that GTM can reliably process for both GA4 and Google Ads
3. WHEN implementing the new flow THEN the system SHALL simplify conversion tracking points to reduce complexity and improve reliability
4. IF the redesigned flow conflicts with existing tracking THEN the system SHALL provide parallel tracking during migration to ensure no data loss

### Requirement 7

**User Story:** As a data analyst, I want comprehensive conversion tracking validation and monitoring, so that I can quickly identify and resolve tracking issues before they impact campaign performance.

#### Acceptance Criteria

1. WHEN conversion tracking is active THEN the system SHALL provide real-time validation of conversion events
2. WHEN tracking discrepancies occur THEN the system SHALL alert administrators within 15 minutes
3. WHEN analyzing conversion data THEN the system SHALL provide detailed attribution reports showing conversion paths
4. IF conversion tracking accuracy drops below 95% THEN the system SHALL automatically investigate and report potential causes

### Requirement 8

**User Story:** As a marketing manager, I want to implement proper conversion value tracking with dynamic pricing, so that I can optimize campaigns for revenue rather than just conversion volume.

#### Acceptance Criteria

1. WHEN tracking conversions THEN the system SHALL include accurate conversion values reflecting actual booking prices including discounts
2. WHEN using automated bidding THEN the system SHALL provide conversion value data for Target ROAS campaigns
3. WHEN analyzing campaign performance THEN the system SHALL show revenue attribution by campaign, ad group, and keyword
4. IF conversion values are inaccurate THEN the system SHALL provide correction mechanisms and historical data updates
### Req
uirement 9

**User Story:** As a developer, I want to implement a simplified booking flow architecture that works optimally with Google Tag Manager, so that I can reduce tracking complexity while maintaining all necessary conversion data for campaign optimization.

#### Acceptance Criteria

1. WHEN redesigning the booking flow THEN the system SHALL consolidate tracking events into clear, well-defined conversion points (view_item, begin_checkout, add_payment_info, purchase)
2. WHEN a user interacts with the booking flow THEN the system SHALL push structured data to GTM's dataLayer with consistent naming conventions and data formats
3. WHEN implementing the new architecture THEN the system SHALL reduce the number of tracking services from multiple direct integrations to a single GTM-based approach
4. IF the simplified flow needs additional data THEN the system SHALL extend the dataLayer structure rather than adding new tracking methods

### Requirement 10

**User Story:** As a marketing manager, I want the combined GTM + redesigned booking flow solution to resolve all current Google Ads conversion setup warnings, so that I can confidently run automated bidding campaigns and trust the conversion data.

#### Acceptance Criteria

1. WHEN the new system is implemented THEN Google Ads SHALL show no conversion setup warnings or errors
2. WHEN running conversion tracking diagnostics THEN the system SHALL pass all Google Ads validation tests
3. WHEN comparing conversion data THEN the system SHALL show 95%+ accuracy between tracked conversions and actual bookings
4. IF any conversion setup issues remain THEN the system SHALL provide detailed diagnostic information and resolution steps