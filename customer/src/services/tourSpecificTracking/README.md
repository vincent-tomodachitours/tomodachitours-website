# Cross-Device and Offline Conversion Tracking

This document explains the cross-device and offline conversion tracking functionality implemented for Google Ads analytics integration.

## Overview

The cross-device and offline conversion tracking system enables:

1. **GCLID Capture and Storage** - Captures Google Click IDs for long-term attribution
2. **Cross-Device Attribution** - Tracks users across multiple devices
3. **Offline Conversion Import** - Handles phone bookings and offline conversions
4. **Server-Side Validation** - Validates critical conversions server-side
5. **Enhanced Conversions** - Uses Google's enhanced conversion features

## Components

### 1. Attribution Service (Enhanced)

The attribution service has been enhanced with cross-device tracking capabilities:

```javascript
import attributionService from '../services/attributionService.js';

// Initialize with cross-device tracking
attributionService.initializeWithCrossDevice();

// Store GCLID for long-term attribution
attributionService.storeGCLID('gclid_123', {
    source: 'google',
    medium: 'cpc',
    campaign: 'summer_tours'
});

// Get enhanced attribution data
const enhancedAttribution = attributionService.getEnhancedAttributionForAnalytics();
```

### 2. Offline Conversion Service

Handles offline conversions like phone bookings:

```javascript
import offlineConversionService from '../services/offlineConversionService.js';

// Record a phone booking
await offlineConversionService.recordPhoneBooking({
    value: 15000,
    currency: 'JPY',
    transactionId: 'phone_booking_123',
    tourId: 'gion-tour',
    tourName: 'Gion District Walking Tour',
    customerPhone: '+81-90-1234-5678',
    customerEmail: 'customer@example.com',
    bookingDate: '2024-03-15',
    tourDate: '2024-03-20',
    quantity: 2
});

// Record cross-device conversion
await offlineConversionService.recordCrossDeviceConversion({
    value: 12000,
    currency: 'JPY',
    transactionId: 'cross_device_123',
    originalDeviceId: 'device_mobile_123',
    conversionDeviceId: 'device_desktop_456',
    tourId: 'morning-tour',
    tourName: 'Arashiyama Morning Tour',
    timeToConversion: 7200000, // 2 hours
    originalDeviceType: 'mobile',
    conversionDeviceType: 'desktop',
    customerEmail: 'customer@example.com',
    customerPhone: '+81-90-1234-5678'
});
```

### 3. Server-Side Conversion Tracker

Validates critical conversions server-side:

```javascript
import serverSideConversionTracker from '../services/serverSideConversionTracker.js';

// Track booking confirmation with server validation
await serverSideConversionTracker.trackBookingConfirmation({
    booking_id: 'booking_123',
    total_amount: 15000,
    currency: 'JPY',
    tour_id: 'gion-tour',
    tour_name: 'Gion District Walking Tour',
    tour_category: 'Cultural Tour',
    quantity: 2,
    customer_email: 'customer@example.com',
    customer_phone: '+81-90-1234-5678',
    customer_name: 'John Doe',
    booking_date: '2024-03-15',
    tour_date: '2024-03-20'
});

// Track payment success
await serverSideConversionTracker.trackPaymentSuccess({
    payment_id: 'payment_123',
    amount: 15000,
    currency: 'JPY',
    tour_id: 'morning-tour',
    tour_name: 'Arashiyama Morning Tour',
    tour_category: 'Nature Tour',
    quantity: 1,
    customer_email: 'customer@example.com',
    customer_phone: '+81-90-1234-5678',
    customer_name: 'Jane Smith',
    payment_method: 'credit_card',
    payment_provider: 'stripe'
});
```

### 4. Enhanced Google Ads Tracking

Enhanced conversion tracking with cross-device data:

```javascript
import { 
    trackEnhancedConversion, 
    trackCrossDeviceConversion, 
    trackServerSideConversion 
} from '../services/googleAdsTracker.js';

// Track enhanced conversion
trackEnhancedConversion('purchase', {
    value: 15000,
    currency: 'JPY',
    transaction_id: 'booking_123'
}, {
    email: 'hashed_email_123',
    phone_number: 'hashed_phone_123',
    gclid: 'test_gclid_123',
    device_id: 'device_123456789_abcdef'
});

// Track cross-device conversion
trackCrossDeviceConversion({
    customer_email_hash: 'hashed_email_123',
    customer_phone_hash: 'hashed_phone_123',
    gclid: 'test_gclid_123',
    device_id: 'device_123456789_abcdef',
    value: 12000,
    currency: 'JPY',
    transaction_id: 'cross_device_123',
    tour_id: 'gion-tour',
    tour_name: 'Gion District Walking Tour',
    original_device_type: 'mobile',
    conversion_device_type: 'desktop',
    time_to_conversion: 3600000
});

// Track server-side conversion
trackServerSideConversion({
    value: 15000,
    currency: 'JPY',
    transaction_id: 'server_123',
    gclid: 'test_gclid_123',
    conversion_date_time: '2024-03-15T10:30:00Z',
    enhanced_conversion_data: {
        email: 'hashed_email_123',
        phone_number: 'hashed_phone_123'
    },
    attribution_source: 'google',
    attribution_medium: 'cpc',
    attribution_campaign: 'summer_tours',
    tour_id: 'gion-tour',
    tour_name: 'Gion District Walking Tour',
    tour_category: 'Cultural Tour'
});
```

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# Server endpoints for offline and server-side conversions
REACT_APP_OFFLINE_CONVERSION_ENDPOINT=/api/offline-conversions
REACT_APP_SERVER_CONVERSION_ENDPOINT=/api/server-conversions

# Google Ads configuration (already configured)
REACT_APP_GOOGLE_ADS_CONVERSION_ID=AW-123456789
REACT_APP_GOOGLE_ADS_CONVERSION_LABELS={"purchase":"abcdef123456/conversion_label_123"}
```

## Data Storage

The system uses both localStorage and sessionStorage:

- **localStorage**: Long-term data (GCLID, device ID, cross-device data)
- **sessionStorage**: Session-specific data (current attribution, session ID)

### Storage Keys

- `gclid_data`: Stored GCLID with 90-day expiration
- `cross_device_data`: Cross-device attribution data
- `device_id`: Unique device identifier
- `offline_conversions_queue`: Queued offline conversions
- `attribution_data`: Current session attribution
- `attribution_chain`: Multi-touch attribution chain

## Privacy Compliance

All personal data is hashed before storage:

```javascript
// Phone numbers are normalized and hashed
const hashedPhone = offlineConversionService.hashPhoneNumber('+81-90-1234-5678');

// Emails are normalized and hashed
const hashedEmail = offlineConversionService.hashEmail('customer@example.com');

// Personal data is hashed
const hashedName = offlineConversionService.hashPersonalData('John Doe');
```

## Cross-Device Flow Example

```javascript
// Step 1: User clicks ad on mobile device
attributionService.storeGCLID('gclid_mobile_123', {
    source: 'google',
    medium: 'cpc',
    campaign: 'summer_tours',
    landing_page: '/gion-tour'
});

// Step 2: Store cross-device data
attributionService.storeCrossDeviceData({
    gclid: 'gclid_mobile_123',
    attribution_data: {
        source: 'google',
        medium: 'cpc',
        campaign: 'summer_tours'
    }
});

// Step 3: User completes booking on desktop (2 hours later)
const crossDeviceData = {
    value: 15000,
    currency: 'JPY',
    transactionId: 'cross_device_booking_123',
    originalDeviceId: 'device_mobile_123',
    conversionDeviceId: 'device_desktop_456',
    tourId: 'gion-tour',
    tourName: 'Gion District Walking Tour',
    timeToConversion: 7200000, // 2 hours
    originalDeviceType: 'mobile',
    conversionDeviceType: 'desktop',
    customerEmail: 'customer@example.com',
    customerPhone: '+81-90-1234-5678'
};

// Step 4: Track with server validation
await serverSideConversionTracker.trackCrossDeviceConversionWithValidation(crossDeviceData);
```

## Monitoring and Debugging

### Queue Statistics

```javascript
// Check offline conversion queue
const offlineStats = offlineConversionService.getQueueStats();
console.log('Offline conversions:', offlineStats);

// Check server-side conversion status
const serverStats = serverSideConversionTracker.getPendingConversionsStats();
console.log('Server conversions:', serverStats);
```

### Debug Mode

In development, services are available on the window object:

```javascript
// Available in development mode
window.attributionService
window.offlineConversionService
window.serverSideConversionTracker
```

## Error Handling

The system includes comprehensive error handling:

- **Network failures**: Automatic retry with exponential backoff
- **Storage failures**: Graceful degradation
- **Privacy compliance**: Automatic opt-out handling
- **Data validation**: Input sanitization and validation

## Testing

Run the integration tests:

```bash
npm test -- --testPathPattern=crossDeviceOfflineTracking.integration.test.js
```

The tests verify:
- GCLID storage and retrieval
- Cross-device data management
- Offline conversion queuing
- Server-side validation
- Enhanced Google Ads tracking
- End-to-end cross-device flows

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **4.4**: Cross-device attribution using Google's enhanced conversions
- **1.3**: Multi-touch attribution and campaign source tracking
- **2.1**: Conversion event tracking with enhanced data

The system provides comprehensive cross-device and offline conversion tracking while maintaining privacy compliance and data accuracy.