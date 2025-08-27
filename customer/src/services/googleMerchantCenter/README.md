# Google Merchant Center Integration

This module provides comprehensive Google Merchant Center integration for Tomodachi Tours, enabling Shopping campaigns with product feeds, dynamic remarketing, and conversion tracking.

## Features

### 1. Product Feed Generation (`productFeedService.js`)
- Generates XML and JSON product feeds for Google Merchant Center
- Supports date-specific products with real-time availability
- Includes proper product categorization and pricing
- Validates feed data before submission

### 2. Dynamic Remarketing (`dynamicRemarketingService.js`)
- Tracks product-level interactions for remarketing campaigns
- Integrates with GTM for structured data layer events
- Supports all ecommerce events (view_item, add_to_cart, purchase, etc.)
- Caches product data for performance optimization

### 3. Shopping Campaign Conversions (`shoppingConversionService.js`)
- Tracks Shopping campaign-specific conversions
- Includes enhanced conversions with customer data
- Supports product-specific attribution data
- Validates Shopping campaign setup

### 4. Feed Automation (`feedAutomationService.js`)
- Automated feed updates with configurable intervals
- Error handling and retry mechanisms
- Health monitoring and performance metrics
- Multiple submission endpoints support

## Setup

### Environment Variables

Add the following to your `.env` file:

```bash
# Google Merchant Center Configuration
REACT_APP_GOOGLE_MERCHANT_ID=your_merchant_id
REACT_APP_BASE_URL=https://tomodachitours.com
REACT_APP_MERCHANT_CENTER_ENDPOINT=https://shoppingcontent.googleapis.com/content/v2.1
REACT_APP_FEED_SUBMISSION_URL=https://api.tomodachitours.com/merchant-feed
REACT_APP_FEED_API_TOKEN=your_api_token

# Shopping Campaign Conversion Labels
REACT_APP_SHOPPING_PURCHASE_LABEL=your_purchase_label
REACT_APP_SHOPPING_ADD_TO_CART_LABEL=your_add_to_cart_label
REACT_APP_SHOPPING_VIEW_ITEM_LABEL=your_view_item_label
```

### Initialization

```javascript
import googleMerchantCenter from './services/googleMerchantCenter';

// Initialize all services
await googleMerchantCenter.initialize({
    enableAutomation: true,
    validateSetup: true,
    automationOptions: {
        feedUpdateInterval: 6 * 60 * 60 * 1000, // 6 hours
        availabilityUpdateInterval: 30 * 60 * 1000 // 30 minutes
    }
});
```

## Usage

### Product Feed Management

```javascript
// Generate JSON feed
const jsonFeed = await googleMerchantCenter.productFeed.generateJSONFeed({
    includeAvailability: true,
    daysAhead: 30
});

// Generate XML feed
const xmlFeed = await googleMerchantCenter.productFeed.generateXMLFeed({
    includeAvailability: true,
    daysAhead: 30
});

// Validate feed
const validation = googleMerchantCenter.productFeed.validateFeed(jsonFeed.products);

// Get feed statistics
const stats = googleMerchantCenter.productFeed.getFeedStatistics(jsonFeed.products);
```

### Dynamic Remarketing

```javascript
// Track view item
await googleMerchantCenter.remarketing.trackViewItem('night-tour', tourData, {
    source: 'search',
    position: 1
});

// Track view item list
await googleMerchantCenter.remarketing.trackViewItemList(
    ['night-tour', 'morning-tour'],
    { listName: 'Popular Tours' }
);

// Track add to cart
await googleMerchantCenter.remarketing.trackAddToCart('night-tour', {
    participants: 2,
    date: '2025-08-28',
    time: '18:00'
}, tourData);

// Track purchase
await googleMerchantCenter.remarketing.trackPurchase('night-tour', {
    participants: 1,
    date: '2025-08-28',
    time: '18:00',
    amount: 6500,
    transaction_id: 'txn_123456'
}, tourData);
```

### Shopping Campaign Tracking

```javascript
// Track shopping campaign events
await googleMerchantCenter.trackShoppingEvent(
    'view_item',
    'night-tour',
    { source: 'shopping_ad' },
    { 
        campaign_id: 'camp_123',
        ad_group_id: 'adg_456',
        gclid: 'gclid_789'
    }
);

// Track purchase with enhanced conversions
await googleMerchantCenter.trackShoppingEvent(
    'purchase',
    'night-tour',
    {
        participants: 1,
        amount: 6500,
        transaction_id: 'txn_123456'
    },
    { campaign_id: 'camp_123' },
    { 
        email_hash: 'hashed_email',
        phone_hash: 'hashed_phone'
    }
);
```

### Feed Automation

```javascript
// Start automation
googleMerchantCenter.automation.start({
    feedUpdateInterval: 6 * 60 * 60 * 1000, // 6 hours
    availabilityUpdateInterval: 30 * 60 * 1000 // 30 minutes
});

// Trigger manual update
const result = await googleMerchantCenter.automation.triggerUpdate({
    daysAhead: 7,
    includeAvailability: true
});

// Monitor health
const health = await googleMerchantCenter.automation.monitorFeedHealth();

// Get statistics
const stats = googleMerchantCenter.automation.getStatistics();

// Stop automation
googleMerchantCenter.automation.stop();
```

## Product Feed Structure

### JSON Feed Format

```json
{
    "version": "1.0",
    "title": "Tomodachi Tours - Kyoto Walking Tours",
    "description": "Authentic Kyoto walking tours with local guides",
    "link": "https://tomodachitours.com",
    "updated": "2025-08-27T10:00:00.000Z",
    "products": [
        {
            "id": "tour_night-tour_2025-08-28_1800",
            "title": "Kyoto Fushimi-Inari Night Walking Tour - Wed, Aug 28 at 18:00",
            "description": "Join us an unforgettable evening walking tour...",
            "link": "https://tomodachitours.com/tours/night-tour?date=2025-08-28&time=18:00",
            "image_link": "https://tomodachitours.com/static/media/fushimi-inari-night.webp",
            "availability": "in stock",
            "price": "6500 JPY",
            "brand": "Tomodachi Tours",
            "condition": "new",
            "google_product_category": "Arts & Entertainment > Events & Attractions > Tours",
            "custom_label_0": "night-tour_2025-08-28",
            "custom_label_1": "18:00 - 90-120 minutes",
            "custom_label_2": "8 spots available",
            "tour_date": "2025-08-28",
            "tour_time": "18:00",
            "available_spots": 8
        }
    ]
}
```

### XML Feed Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Tomodachi Tours - Kyoto Walking Tours</title>
<link>https://tomodachitours.com</link>
<description>Authentic Kyoto walking tours with local guides</description>

<item>
<g:id>tour_night-tour_2025-08-28_1800</g:id>
<g:title>Kyoto Fushimi-Inari Night Walking Tour - Wed, Aug 28 at 18:00</g:title>
<g:description>Join us an unforgettable evening walking tour...</g:description>
<g:link>https://tomodachitours.com/tours/night-tour?date=2025-08-28&amp;time=18:00</g:link>
<g:image_link>https://tomodachitours.com/static/media/fushimi-inari-night.webp</g:image_link>
<g:availability>in stock</g:availability>
<g:price>6500 JPY</g:price>
<g:brand>Tomodachi Tours</g:brand>
<g:condition>new</g:condition>
<g:google_product_category>Arts &amp; Entertainment &gt; Events &amp; Attractions &gt; Tours</g:google_product_category>
</item>

</channel>
</rss>
```

## Integration with Existing Systems

### GTM Integration

The services integrate seamlessly with the existing GTM service:

```javascript
// Events are automatically pushed to GTM dataLayer
gtmService.pushEvent('view_item', eventData);
gtmService.pushEvent('dynamic_remarketing', remarketingData);
gtmService.pushEvent('shopping_conversion', conversionData);
```

### Tour Service Integration

Product feeds automatically sync with tour data:

```javascript
// Fetches latest tour data
const tours = await fetchTours();

// Checks real-time availability
const availability = await getAvailableTimeSlots(tourKey, date);
```

## Error Handling

### Retry Mechanisms

```javascript
// Automatic retries with exponential backoff
const result = await feedAutomationService.updateProductFeed();
if (!result.success) {
    console.log(`Failed after ${result.attempts} attempts: ${result.error}`);
}
```

### Health Monitoring

```javascript
// Continuous health monitoring
const health = await feedAutomationService.monitorFeedHealth();
switch (health.status) {
    case 'healthy': // All systems operational
    case 'warning': // High error rate
    case 'critical': // Missing data or broken generation
    case 'stopped': // Automation not running
    case 'error': // Monitoring error
}
```

### Validation

```javascript
// Feed validation before submission
const validation = productFeedService.validateFeed(products);
if (!validation.valid) {
    console.error('Feed validation errors:', validation.errors);
    console.warn('Feed validation warnings:', validation.warnings);
}
```

## Performance Optimization

### Caching

- Product data is cached for 5 minutes to reduce computation
- Tour data is cached by the tour service
- Availability data is refreshed every 30 minutes

### Batch Operations

- Multiple date/time combinations are generated in batches
- Availability updates are batched for multiple dates
- Feed submissions support multiple endpoints

## Testing

Run the test suite:

```bash
npm test -- --testPathPattern=googleMerchantCenter
```

### Test Coverage

- Unit tests for all services
- Integration tests for complete workflows
- Error handling and edge cases
- Performance and caching behavior

## Monitoring and Analytics

### Key Metrics

- Feed generation success rate
- Conversion tracking accuracy
- Automation uptime
- Error rates and types

### Logging

All services include comprehensive logging:

```javascript
// Debug mode for detailed logging
googleMerchantCenter.remarketing.enableDebugMode(true);

// Error logging with context
console.error('Feed generation failed:', error, { tourKey, options });
```

## Troubleshooting

### Common Issues

1. **Feed Validation Errors**
   - Check required fields (id, title, description, link, image_link, availability, price)
   - Validate URL formats
   - Ensure price format matches "AMOUNT CURRENCY"

2. **Conversion Tracking Issues**
   - Verify GTM container is loaded
   - Check conversion labels configuration
   - Validate customer data hashing

3. **Automation Problems**
   - Check tour service availability
   - Verify environment variables
   - Monitor error logs and retry attempts

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// Enable debug mode for all services
googleMerchantCenter.remarketing.enableDebugMode(true);
gtmService.enableDebugMode(true);

// Check service status
const status = googleMerchantCenter.getStatus();
console.log('Service status:', status);
```

## API Reference

See individual service files for detailed API documentation:

- [`productFeedService.js`](./productFeedService.js) - Product feed generation
- [`dynamicRemarketingService.js`](./dynamicRemarketingService.js) - Remarketing events
- [`shoppingConversionService.js`](./shoppingConversionService.js) - Shopping conversions
- [`feedAutomationService.js`](./feedAutomationService.js) - Feed automation
- [`index.js`](./index.js) - Main service interface