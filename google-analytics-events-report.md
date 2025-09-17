# Google Analytics Events Comprehensive Report

*Generated on: December 17, 2024*

## Overview

This document provides a complete reference of all Google Analytics events implemented in the customer application, including their trigger points, data structures, and associated services.

## Core E-commerce Events

### 1. **purchase**
- **Event Name**: `purchase`
- **Location**: `customer/src/Pages/Thankyou.tsx`
- **Trigger**: Thank you page load after successful payment completion
- **Data Structure**:
  ```javascript
  {
    event: 'purchase',
    ecommerce: {
      transaction_id: string,
      value: number,
      currency: 'JPY',
      items: [{
        item_id: string,
        item_name: string,
        item_category: 'tour',
        quantity: number,
        price: number
      }]
    },
    tour_id: string,
    tour_name: string,
    booking_date: string,
    payment_provider: string,
    user_data: object // Enhanced conversion data
  }
  ```
- **Services**: GTM Service (Event Tracking Service), Google Ads Tracker, Server-side Conversion Tracker
- **Notes**: 
  - Uses proper GA4 ecommerce structure with `ecommerce` object
  - Includes duplicate prevention and fallback tracking
  - Enhanced with debug logging for troubleshooting
  - Supports both `transaction_id` and `transactionId` formats for compatibility

### 2. **begin_checkout**
- **Event Name**: `begin_checkout`
- **Location**: 
  - `customer/src/Components/TourPages/BaseTourPage.tsx` (Mobile Book Now button)
  - `customer/src/Components/Checkout/useCheckoutLogic.ts` (Checkout initiation)
- **Trigger**: 
  - Mobile "Book Now" button click
  - Checkout process initiation
- **Data Structure**:
  ```javascript
  {
    value: number,
    currency: 'JPY',
    items: [{
      item_id: string,
      item_name: string,
      category: 'tour',
      quantity: 1,
      price: number
    }],
    tourData: object
  }
  ```
- **Services**: GTM Service, Booking Flow Manager

### 3. **view_item**
- **Event Name**: `view_item`
- **Location**: `customer/src/services/analytics/basicTracking.ts`
- **Trigger**: Tour page view with attribution tracking
- **Data Structure**:
  ```javascript
  {
    currency: 'JPY',
    value: number,
    items: [{
      item_id: string,
      item_name: string,
      category: 'tour',
      quantity: 1,
      price: number
    }],
    tour_id: string,
    tour_name: string
  }
  ```
- **Services**: GTM Service, GA4 Config

### 4. **add_payment_info**
- **Event Name**: `add_payment_info`
- **Location**: `customer/src/Components/StripePaymentForm.tsx`
- **Trigger**: Before payment processing begins
- **Data Structure**:
  ```javascript
  {
    currency: 'JPY',
    value: number,
    payment_type: 'stripe',
    items: array,
    tourData: object
  }
  ```
- **Services**: GTM Service, Booking Flow Manager

### 5. **conversion**
- **Event Name**: `conversion`
- **Location**: Multiple services (Google Ads Tracker, Enhanced Conversion Service)
- **Trigger**: Various conversion points throughout the funnel
- **Data Structure**:
  ```javascript
  {
    send_to: string, // Google Ads conversion label
    value: number,
    currency: 'JPY',
    transaction_id: string,
    user_data: object // Enhanced conversion data
  }
  ```
- **Services**: Google Ads integration, Enhanced Conversion Service

## Engagement Events

### 6. **tour_image_click**
- **Event Name**: `tour_image_click`
- **Location**: `customer/src/services/analytics/basicTracking.ts`
- **Trigger**: User clicks on tour images in the image showcase
- **Data Structure**:
  ```javascript
  {
    event_category: 'engagement',
    event_label: string, // Tour name
    tour_id: string,
    tour_name: string,
    image_index: number,
    click_type: string,
    content_type: 'tour_image'
  }
  ```
- **Services**: Basic Tracking, Remarketing Manager
- **Notes**: Includes remarketing audience tracking

### 7. **tour_tab_click**
- **Event Name**: `tour_tab_click`
- **Location**: `customer/src/Components/TourPages/BaseTourPage.tsx`
- **Trigger**: User navigates between tour tabs (Overview, Details, Itinerary, Meeting Point)
- **Data Structure**:
  ```javascript
  {
    event_category: 'engagement',
    event_label: string, // Tab name - Tour name
    tour_id: string,
    tour_name: string,
    tab_name: string,
    tab_index: number,
    content_type: 'tour_tab',
    engagement_type: 'tab_interaction'
  }
  ```
- **Services**: Basic Tracking, Remarketing Manager

### 8. **modified_participants**
- **Event Name**: `modified_participants`
- **Location**: `customer/src/services/analytics/basicTracking.ts`
- **Trigger**: User changes participant count in the date picker
- **Data Structure**:
  ```javascript
  {
    event_category: 'booking_interaction',
    event_label: string, // Tour name - Participant type
    participant_type: string,
    old_count: number,
    new_count: number,
    total_participants: number,
    change_direction: 'increase' | 'decrease',
    change_amount: number
  }
  ```
- **Services**: Basic Tracking, Remarketing Manager

### 9. **user_engagement**
- **Event Name**: `user_engagement`
- **Location**: `customer/src/services/analytics/basicTracking.ts`
- **Trigger**: Time-based engagement tracking
- **Data Structure**:
  ```javascript
  {
    engagement_time_msec: number
  }
  ```
- **Services**: Basic Tracking

## Abandonment Tracking Events

### 10. **abandon_cart**
- **Event Name**: `abandon_cart`
- **Location**: `customer/src/services/analytics/abandonmentTracking.ts`
- **Trigger**: Cart abandonment detection based on user behavior
- **Data Structure**:
  ```javascript
  {
    currency: 'JPY',
    value: number,
    items: array,
    abandonment_stage: 'cart',
    time_in_cart: number,
    cart_items_count: number,
    // Attribution data included
  }
  ```
- **Services**: Abandonment Tracking, Google Ads Tracker, Remarketing Manager

### 11. **abandon_checkout**
- **Event Name**: `abandon_checkout`
- **Location**: `customer/src/services/analytics/abandonmentTracking.ts`
- **Trigger**: User abandons checkout process at various stages
- **Data Structure**:
  ```javascript
  {
    currency: 'JPY',
    value: number,
    items: array,
    abandonment_stage: string,
    checkout_step: number
  }
  ```
- **Services**: Abandonment Tracking, Remarketing Manager

### 12. **funnel_step**
- **Event Name**: `funnel_step`
- **Location**: `customer/src/services/analytics/abandonmentTracking.ts`
- **Trigger**: Booking funnel progression tracking
- **Data Structure**:
  ```javascript
  {
    currency: 'JPY',
    value: number,
    items: array,
    funnel_step: string,
    step_number: number,
    tour_type: string
  }
  ```
- **Services**: Abandonment Tracking

## Remarketing Events

### 13. **remarketing_audience**
- **Event Name**: `remarketing_audience`
- **Location**: `customer/src/services/remarketingManager.ts`
- **Trigger**: Audience segmentation for Google Ads remarketing
- **Data Structure**:
  ```javascript
  {
    send_to: string, // Google Ads conversion ID
    audience_id: string,
    tour_engagement_data: object
  }
  ```
- **Services**: Remarketing Manager, Google Ads

### 14. **dynamic_remarketing**
- **Event Name**: `dynamic_[eventType]`
- **Location**: `customer/src/services/dynamicRemarketingService.ts`
- **Trigger**: Dynamic product remarketing events
- **Data Structure**:
  ```javascript
  {
    event_category: 'dynamic_remarketing',
    event_label: string, // Product ID
    ecomm_prodid: string,
    ecomm_pagetype: string,
    ecomm_totalvalue: number
  }
  ```
- **Services**: Dynamic Remarketing Service

## Migration & System Events

### 15. **parallel_tracking_error**
- **Event Name**: `parallel_tracking_error`
- **Location**: `customer/src/services/parallelTrackingValidator.ts`
- **Trigger**: Critical tracking discrepancies during system migration
- **Data Structure**:
  ```javascript
  {
    event_category: 'migration',
    event_label: 'high_severity_discrepancy',
    error_type: string,
    discrepancy_details: object
  }
  ```
- **Services**: Parallel Tracking Validator

### 16. **migration_alert**
- **Event Name**: `migration_alert`
- **Location**: `customer/src/services/migrationMonitor.ts`
- **Trigger**: Migration system monitoring alerts
- **Data Structure**:
  ```javascript
  {
    event_category: 'migration',
    event_label: string, // Alert type
    alert_severity: string,
    migration_context: object
  }
  ```
- **Services**: Migration Monitor

### 17. **migration_emergency_rollback**
- **Event Name**: `migration_emergency_rollback`
- **Location**: `customer/src/services/migrationFeatureFlags.ts`
- **Trigger**: Emergency rollback scenarios
- **Data Structure**:
  ```javascript
  {
    event_category: 'migration',
    event_label: string, // Rollback reason
    rollback_phase: string
  }
  ```
- **Services**: Migration Feature Flags

### 18. **rollback_validation_test**
- **Event Name**: `rollback_validation_test`
- **Location**: `customer/src/services/rollbackManager.ts`
- **Trigger**: Rollback system validation testing
- **Data Structure**:
  ```javascript
  {
    event_category: 'rollback',
    event_label: 'validation_success',
    validation_context: object
  }
  ```
- **Services**: Rollback Manager

## Server-side & Enhanced Events

### 19. **booking_confirmation**
- **Event Name**: `booking_confirmation`
- **Location**: `customer/src/services/serverSideConversionTracker.ts`
- **Trigger**: Server-validated booking confirmation
- **Data Structure**:
  ```javascript
  {
    event_type: 'booking_confirmation',
    transaction_id: string,
    value: number,
    currency: 'JPY',
    tour_id: string,
    tour_name: string,
    customer_email_hash: string,
    customer_phone_hash: string,
    booking_date: string,
    tour_date: string
  }
  ```
- **Services**: Server-side Conversion Tracker, Enhanced Conversion Service

### 20. **payment_success**
- **Event Name**: `payment_success`
- **Location**: `customer/src/services/serverSideConversionTracker.ts`
- **Trigger**: Server-validated payment completion
- **Data Structure**:
  ```javascript
  {
    event_type: 'payment_success',
    transaction_id: string,
    value: number,
    currency: 'JPY',
    payment_method: string,
    payment_provider: string,
    tour_data: object
  }
  ```
- **Services**: Server-side Conversion Tracker

### 21. **cross_device_purchase**
- **Event Name**: `cross_device_purchase`
- **Location**: `customer/src/services/serverSideConversionTracker.ts`
- **Trigger**: Cross-device conversion tracking
- **Data Structure**:
  ```javascript
  {
    event_type: 'cross_device_purchase',
    transaction_id: string,
    value: number,
    original_device_id: string,
    conversion_device_id: string,
    time_to_conversion: number,
    customer_hashes: object
  }
  ```
- **Services**: Server-side Conversion Tracker, Offline Conversion Service

## Page View Events

### 22. **Page Views**
- **Event Name**: `config` (GA4 page view)
- **Location**: 
  - `customer/src/services/analytics/basicTracking.ts`
  - `customer/src/components/PageViewTracker.jsx`
- **Trigger**: Route changes, page navigation
- **Data Structure**:
  ```javascript
  {
    page_title: string,
    page_location: string,
    page_path: string,
    attribution_data: object
  }
  ```
- **Services**: Basic Tracking, GTM Service

## Custom Events

### 23. **Custom Events**
- **Event Name**: Variable (custom event names)
- **Location**: `customer/src/services/analytics/basicTracking.ts`
- **Trigger**: Various custom tracking needs throughout the application
- **Data Structure**:
  ```javascript
  {
    // Custom parameters based on event type
    [key: string]: any
  }
  ```
- **Services**: Basic Tracking

## Event Tracking Architecture

### Primary Services

1. **GTM Service** (`customer/src/services/gtmService.ts`)
   - Central event management through Google Tag Manager
   - Handles conversion optimization and dynamic pricing
   - Manages fallback to gtag when GTM fails

2. **Basic Tracking** (`customer/src/services/analytics/basicTracking.ts`)
   - Core GA4 event tracking
   - User engagement and interaction events
   - Privacy-compliant tracking with consent checks

3. **Abandonment Tracking** (`customer/src/services/analytics/abandonmentTracking.ts`)
   - Cart and checkout abandonment detection
   - Funnel progression tracking
   - Attribution-aware abandonment events

4. **Remarketing Manager** (`customer/src/services/remarketingManager.ts`)
   - Audience segmentation for remarketing
   - Google Ads remarketing pixel management
   - Cross-platform remarketing coordination

5. **Server-side Conversion Tracker** (`customer/src/services/serverSideConversionTracker.ts`)
   - Critical event validation
   - Cross-device conversion tracking
   - Enhanced conversion data with server validation

6. **Migration Services**
   - System migration and rollback tracking
   - Parallel tracking validation
   - Feature flag-based event routing

### Key Trigger Points

#### Tour Pages
- **Image Showcase**: `tour_image_click` events
- **Tab Navigation**: `tour_tab_click` events  
- **Page Views**: `view_item` events with attribution
- **Mobile Book Button**: `begin_checkout` events

#### Date Picker & Booking Flow
- **Participant Changes**: `modified_participants` events
- **Calendar Interactions**: Engagement tracking
- **Checkout Initiation**: `begin_checkout` events
- **Payment Processing**: `add_payment_info` events

#### System Events
- **Migration Monitoring**: Various migration-related events
- **Error Tracking**: System error and validation events
- **Performance Monitoring**: Engagement and timing events

### Data Flow Architecture

```
User Interaction
    ↓
Event Trigger Detection
    ↓
Privacy & Consent Checks
    ↓
Data Collection & Attribution
    ↓
Multiple Service Notification:
    ├── GTM Service (Primary)
    ├── Basic Tracking (GA4)
    ├── Google Ads Tracker
    ├── Remarketing Manager
    └── Server-side Validation
    ↓
Event Processing & Optimization
    ↓
External Service Delivery:
    ├── Google Analytics 4
    ├── Google Ads
    ├── Google Tag Manager
    └── Server-side APIs
```

### Privacy & Compliance

- **Consent Management**: All marketing events respect user privacy preferences
- **Data Hashing**: Personal data is hashed for server-side events
- **Attribution Tracking**: UTM parameters and GCLID tracking
- **Cross-device Tracking**: Enhanced conversion data for better attribution

### Migration & Rollback Support

- **Feature Flags**: Control event routing during migration
- **Parallel Tracking**: Validate new vs. old tracking systems
- **Rollback Capability**: Emergency rollback with validation
- **Migration Monitoring**: Real-time migration health tracking

## Usage Guidelines

### For Developers
1. Always check privacy consent before firing marketing events
2. Include attribution data for conversion events
3. Use GTM Service for new event implementations
4. Follow the established data structure patterns
5. Test events in both GTM and fallback modes

### For Analytics Teams
1. Events include comprehensive attribution data
2. Server-side validation available for critical conversions
3. Cross-device tracking implemented for enhanced attribution
4. Remarketing audiences automatically updated
5. Migration events provide system health insights

### For Marketing Teams
1. All e-commerce events support Google Ads conversion tracking
2. Remarketing audiences are automatically segmented
3. Abandonment events enable retargeting campaigns
4. Enhanced conversion data improves attribution accuracy
5. Dynamic remarketing events support product-specific campaigns

---

*This report was generated by analyzing the customer application codebase and provides a comprehensive reference for all implemented Google Analytics events and their associated tracking infrastructure.*