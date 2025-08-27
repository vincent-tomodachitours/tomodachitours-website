# Google Tag Manager Conversion Tracking Setup

This document provides comprehensive instructions for setting up and testing Google Ads conversion tracking using Google Tag Manager (GTM).

## Overview

The GTM conversion tracking system consists of:

1. **GTM Service** - Centralized tag management and dataLayer integration
2. **GTM Conversion Config** - Google Ads conversion configuration and validation
3. **GTM Testing Utils** - Testing and debugging utilities
4. **GTM Container Configuration** - Tag, trigger, and variable setup

## Environment Configuration

### Required Environment Variables

```bash
# Google Tag Manager
REACT_APP_GTM_CONTAINER_ID=GTM-XXXXXXX
REACT_APP_GTM_AUTH=your_auth_token
REACT_APP_GTM_PREVIEW=your_preview_token

# Google Ads Conversion Tracking
REACT_APP_GOOGLE_ADS_CONVERSION_ID=AW-17482092392
REACT_APP_GOOGLE_ADS_CONVERSION_LABELS={
  "purchase": "AbC-D_efGhIjKlMnOp",
  "begin_checkout": "XyZ-A_bcDeFgHiJkLm",
  "view_item": "QrS-T_uvWxYzAbCdEf",
  "add_payment_info": "MnO-P_qrStUvWxYzAb"
}

# Enhanced Conversions
REACT_APP_ENHANCED_CONVERSIONS_ENABLED=true
REACT_APP_CUSTOMER_DATA_HASHING_SALT=your_secure_salt
```

## GTM Container Setup

### 1. Create GTM Container

1. Go to [Google Tag Manager](https://tagmanager.google.com)
2. Create a new container for your website
3. Note the container ID (GTM-XXXXXXX)

### 2. Configure Tags

#### GA4 Configuration Tag
- **Tag Type**: Google Analytics: GA4 Configuration
- **Measurement ID**: G-5GVJBRE1SY
- **Trigger**: Initialization - All Pages

#### Google Ads Conversion Tags

**Purchase Conversion Tag**
- **Tag Type**: Google Ads Conversion Tracking
- **Conversion ID**: AW-17482092392
- **Conversion Label**: AbC-D_efGhIjKlMnOp
- **Conversion Value**: {{Conversion Value}}
- **Currency Code**: {{Currency Code}}
- **Order ID**: {{Transaction ID}}
- **Enhanced Conversions**: Enabled
- **Trigger**: Google Ads Conversion - Purchase

**Begin Checkout Conversion Tag**
- **Tag Type**: Google Ads Conversion Tracking
- **Conversion ID**: AW-17482092392
- **Conversion Label**: XyZ-A_bcDeFgHiJkLm
- **Conversion Value**: {{Conversion Value}}
- **Currency Code**: {{Currency Code}}
- **Enhanced Conversions**: Enabled
- **Trigger**: Google Ads Conversion - Begin Checkout

**View Item Conversion Tag**
- **Tag Type**: Google Ads Conversion Tracking
- **Conversion ID**: AW-17482092392
- **Conversion Label**: QrS-T_uvWxYzAbCdEf
- **Conversion Value**: {{Conversion Value}}
- **Currency Code**: {{Currency Code}}
- **Trigger**: Google Ads Conversion - View Item

**Add Payment Info Conversion Tag**
- **Tag Type**: Google Ads Conversion Tracking
- **Conversion ID**: AW-17482092392
- **Conversion Label**: MnO-P_qrStUvWxYzAb
- **Conversion Value**: {{Conversion Value}}
- **Currency Code**: {{Currency Code}}
- **Enhanced Conversions**: Enabled
- **Trigger**: Google Ads Conversion - Add Payment Info

### 3. Configure Triggers

#### Custom Event Triggers

**Google Ads Conversion - Purchase**
- **Trigger Type**: Custom Event
- **Event Name**: google_ads_conversion
- **Condition**: Event Label equals purchase

**Google Ads Conversion - Begin Checkout**
- **Trigger Type**: Custom Event
- **Event Name**: google_ads_conversion
- **Condition**: Event Label equals begin_checkout

**Google Ads Conversion - View Item**
- **Trigger Type**: Custom Event
- **Event Name**: google_ads_conversion
- **Condition**: Event Label equals view_item

**Google Ads Conversion - Add Payment Info**
- **Trigger Type**: Custom Event
- **Event Name**: google_ads_conversion
- **Condition**: Event Label equals add_payment_info

### 4. Configure Variables

#### Built-in Variables
- Click Element
- Click ID
- Click Target
- Page URL
- Page Hostname
- Referrer

#### Custom Variables

**Data Layer Variables**
- Conversion Value: `value`
- Currency Code: `currency`
- Transaction ID: `transaction_id`
- Items Array: `items`
- Tour ID: `custom_parameters.tour_id`
- Tour Name: `custom_parameters.tour_name`
- Booking Date: `custom_parameters.booking_date`
- Payment Provider: `custom_parameters.payment_provider`

**Enhanced Conversion Variables**
- Enhanced - Email Hash: `enhanced_conversion_data.email`
- Enhanced - Phone Hash: `enhanced_conversion_data.phone_number`
- Enhanced - First Name Hash: `enhanced_conversion_data.first_name`
- Enhanced - Last Name Hash: `enhanced_conversion_data.last_name`

## Implementation Usage

### Basic Usage

```javascript
import gtmService from './services/gtmService.js';

// Initialize GTM
await gtmService.initialize();

// Track purchase conversion
gtmService.trackPurchaseConversion({
  value: 15000,
  currency: 'JPY',
  transaction_id: 'txn_123',
  items: [{
    item_id: 'morning_tour',
    item_name: 'Morning Arashiyama Tour',
    price: 15000,
    quantity: 1
  }],
  tour_id: 'morning_tour',
  tour_name: 'Morning Arashiyama Tour',
  booking_date: '2025-01-15',
  payment_provider: 'stripe'
}, {
  email: 'hashed_email',
  phone_number: 'hashed_phone'
});
```

### Conversion Tracking Methods

#### Purchase Conversion
```javascript
gtmService.trackPurchaseConversion(transactionData, customerData);
```

#### Begin Checkout Conversion
```javascript
gtmService.trackBeginCheckoutConversion(checkoutData, customerData);
```

#### View Item Conversion
```javascript
gtmService.trackViewItemConversion(itemData);
```

#### Add Payment Info Conversion
```javascript
gtmService.trackAddPaymentInfoConversion(paymentData, customerData);
```

## Testing and Debugging

### 1. Enable Debug Mode

```javascript
gtmService.enableDebugMode(true);
```

### 2. Use Testing Utilities

```javascript
import gtmTestingUtils from './services/gtmTestingUtils.js';

// Test all conversions
const results = gtmTestingUtils.testAllConversions();

// Generate diagnostic report
const report = gtmTestingUtils.generateDiagnosticReport();

// Enable GTM preview mode
gtmTestingUtils.enablePreviewMode('GTM-XXXXXXX', 'preview-token');
```

### 3. Manual Testing

```javascript
// Load manual testing script
import './services/gtmManualTest.js';

// Run full test suite
gtmTester.runFullTest();

// Test specific conversion
gtmTester.testSingleConversion('purchase');
```

### 4. GTM Preview Mode

1. In GTM interface, click "Preview"
2. Enter your website URL
3. Copy the preview token
4. Use `gtmTestingUtils.enablePreviewMode()` with the token
5. Navigate to your website to see real-time tag firing

## DataLayer Event Structure

### Google Ads Conversion Event

```javascript
{
  event: 'google_ads_conversion',
  event_category: 'ecommerce',
  event_label: 'purchase', // or 'begin_checkout', 'view_item', 'add_payment_info'
  conversion_id: 'AW-17482092392',
  conversion_label: 'AbC-D_efGhIjKlMnOp',
  value: 15000,
  currency: 'JPY',
  transaction_id: 'txn_123',
  items: [{
    item_id: 'morning_tour',
    item_name: 'Morning Arashiyama Tour',
    item_category: 'tour',
    price: 15000,
    quantity: 1
  }],
  enhanced_conversion_data: {
    email: 'hashed_email',
    phone_number: 'hashed_phone'
  },
  custom_parameters: {
    tour_id: 'morning_tour',
    tour_name: 'Morning Arashiyama Tour',
    booking_date: '2025-01-15',
    payment_provider: 'stripe'
  }
}
```

### Standard Ecommerce Event

```javascript
{
  event: 'purchase', // or 'begin_checkout', 'view_item', 'add_payment_info'
  value: 15000,
  currency: 'JPY',
  transaction_id: 'txn_123',
  items: [{
    item_id: 'morning_tour',
    item_name: 'Morning Arashiyama Tour',
    item_category: 'tour',
    price: 15000,
    quantity: 1
  }],
  tour_id: 'morning_tour',
  tour_name: 'Morning Arashiyama Tour',
  booking_date: '2025-01-15',
  payment_provider: 'stripe',
  user_data: {
    email: 'hashed_email',
    phone_number: 'hashed_phone'
  }
}
```

## Validation and Monitoring

### 1. Conversion Validation

```javascript
// Check GTM service status
const status = gtmService.getStatus();
console.log('GTM Status:', status);

// Validate conversion configuration
const config = status.conversionConfig;
console.log('Conversion Config Valid:', config.configurationValid);
```

### 2. DataLayer Monitoring

```javascript
// Monitor dataLayer events
const monitoredEvents = gtmTestingUtils.monitorDataLayerEvents(30000);

// Check dataLayer contents
console.log('DataLayer Events:', window.dataLayer);
```

### 3. Google Ads Validation

1. Go to Google Ads interface
2. Navigate to Tools & Settings > Conversions
3. Check conversion status and recent conversions
4. Use Google Ads conversion diagnostics

## Troubleshooting

### Common Issues

1. **GTM Container Not Loading**
   - Check container ID in environment variables
   - Verify GTM script is loaded
   - Check browser console for errors

2. **Conversion Tags Not Firing**
   - Enable GTM preview mode
   - Check trigger conditions
   - Verify dataLayer event structure

3. **Enhanced Conversions Not Working**
   - Ensure customer data is properly hashed
   - Check enhanced conversion configuration in Google Ads
   - Verify privacy compliance

4. **Conversion Values Incorrect**
   - Check currency and value formatting
   - Verify conversion value variables in GTM
   - Test with known transaction amounts

### Debug Commands

```javascript
// Check GTM loading
gtmTestingUtils.validateGTMLoading('GTM-XXXXXXX');

// Generate diagnostic report
const report = gtmTestingUtils.generateDiagnosticReport();

// Test conversion accuracy
const testResults = gtmTestingUtils.testAllConversions();

// Monitor real-time events
gtmTestingUtils.monitorDataLayerEvents(60000);
```

## Production Deployment

### 1. Update Environment Variables

Replace test values with production values:
- GTM container ID
- Google Ads conversion ID
- Actual conversion labels from Google Ads
- Production GTM auth tokens

### 2. Publish GTM Container

1. In GTM interface, review all changes
2. Create a version with descriptive name
3. Publish the container
4. Verify tags are firing in production

### 3. Validate Production Setup

1. Test all conversion types in production
2. Verify Google Ads is receiving conversions
3. Check conversion accuracy against actual bookings
4. Monitor for any errors or warnings

## Support and Maintenance

### Regular Checks

1. **Weekly**: Check conversion accuracy in Google Ads
2. **Monthly**: Review GTM container for any issues
3. **Quarterly**: Update conversion labels if needed
4. **As needed**: Debug any conversion tracking issues

### Performance Monitoring

- Monitor GTM loading performance
- Check conversion tracking accuracy
- Review Google Ads conversion reports
- Validate enhanced conversion data quality

For additional support, refer to:
- [Google Tag Manager Documentation](https://developers.google.com/tag-manager)
- [Google Ads Conversion Tracking Guide](https://support.google.com/google-ads/answer/1722022)
- [Enhanced Conversions Documentation](https://support.google.com/google-ads/answer/9888656)