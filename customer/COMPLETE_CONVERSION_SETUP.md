# Complete Google Ads Conversion Actions Setup

## Current Status
✅ **Purchase Conversion** - Already created (A9-4CJbbgocbEOiejpBB)
❌ **Page View Conversion** - Needs to be created
❌ **Begin Checkout Conversion** - Needs to be created  
❌ **Add to Cart Conversion** - Needs to be created

## Step 1: Create Missing Conversion Actions in Google Ads

### 1. Tour Page View Conversion
**Purpose**: Track when users view tour pages (valuable for remarketing)

**Settings:**
- **Name**: Tour Page View
- **Category**: Page view
- **Value**: No value (or set fixed value like ¥100)
- **Count**: One per click
- **Conversion window**: 30 days click, 1 day view
- **Attribution model**: Data-driven

**Steps to create:**
1. Go to Google Ads > Tools & Settings > Conversions
2. Click "+" to create new conversion
3. Select "Website"
4. Configure with settings above
5. **Copy the conversion label** (format: XXXXXXXXX/XXXXXXXXXXXXX)

### 2. Begin Checkout Conversion  
**Purpose**: Track when users start the booking process

**Settings:**
- **Name**: Tour Booking Started
- **Category**: Lead
- **Value**: Use transaction-specific values
- **Count**: One per click
- **Conversion window**: 30 days click, 1 day view
- **Attribution model**: Data-driven

### 3. Add to Cart Conversion
**Purpose**: Track when users select a tour (add to cart equivalent)

**Settings:**
- **Name**: Tour Selection
- **Category**: Lead  
- **Value**: Use transaction-specific values
- **Count**: One per click
- **Conversion window**: 30 days click, 1 day view
- **Attribution model**: Data-driven

## Step 2: Update Environment Variables

After creating the conversion actions, update your `.env` file:

```bash
# Current (working)
REACT_APP_GOOGLE_ADS_CONVERSION_ID=AW-17482092392
REACT_APP_GOOGLE_ADS_CONVERSION_LABELS={"purchase":"A9-4CJbbgocbEOiejpBB","begin_checkout":"NEW_CHECKOUT_LABEL","view_item":"NEW_VIEW_LABEL","add_to_cart":"NEW_CART_LABEL"}
```

**Replace with actual labels from Google Ads:**
- `NEW_CHECKOUT_LABEL` → Your actual begin checkout label
- `NEW_VIEW_LABEL` → Your actual page view label  
- `NEW_CART_LABEL` → Your actual add to cart label

## Step 3: Test Each Conversion Action

After updating the environment variables, test each conversion:

```javascript
// Test page view conversion
window.testAnalytics.testTourView()

// Test add to cart conversion  
window.testAnalytics.testAddToCart()

// Test begin checkout conversion
window.testAnalytics.testBeginCheckout()

// Test purchase conversion
window.testAnalytics.testPurchase()
```

## Step 4: Implement Conversion Tracking in Your App

The analytics service is already set up to handle all these conversions. You just need to call them at the right times:

### Page View Tracking (Tour Pages)
```javascript
// In your tour page components (MorningTour.jsx, NightTour.jsx, etc.)
useEffect(() => {
    trackTourView({
        tourId: 'morning_tour', // or 'night_tour', 'uji_tour', 'gion_tour'
        tourName: 'Morning Tour',
        price: 5000,
        currency: 'JPY'
    });
}, []);
```

### Add to Cart Tracking (Tour Selection)
```javascript
// When user selects a tour or clicks "Book Now"
const handleTourSelection = () => {
    trackAddToCart({
        tourId: 'morning_tour',
        tourName: 'Morning Tour', 
        price: 5000,
        currency: 'JPY',
        quantity: 1
    });
};
```

### Begin Checkout Tracking (Booking Process)
```javascript
// When user starts the booking form
const handleBeginCheckout = () => {
    trackBeginCheckout({
        tourId: 'morning_tour',
        tourName: 'Morning Tour',
        price: 5000,
        currency: 'JPY',
        quantity: 1
    });
};
```

## Step 5: Verify All Conversions

After setup, verify each conversion action shows as "Active" in Google Ads:

1. **Go to Google Ads > Tools & Settings > Conversions**
2. **Check status of each conversion action:**
   - ✅ Purchase → Should be "Active" 
   - ✅ Tour Page View → Should be "Active"
   - ✅ Tour Booking Started → Should be "Active"
   - ✅ Tour Selection → Should be "Active"

## Step 6: Set Up Remarketing Audiences

With these conversions, you can create powerful remarketing audiences:

### Audience 1: Tour Page Viewers (30 days)
- **Users who**: Completed "Tour Page View" conversion
- **Duration**: 30 days
- **Use for**: General tour promotion ads

### Audience 2: Checkout Abandoners (7 days)  
- **Users who**: Completed "Tour Booking Started" but NOT "Purchase"
- **Duration**: 7 days
- **Use for**: Abandoned booking recovery ads

### Audience 3: Tour Selectors (14 days)
- **Users who**: Completed "Tour Selection" but NOT "Purchase"  
- **Duration**: 14 days
- **Use for**: Booking completion ads

### Audience 4: Past Customers (365 days)
- **Users who**: Completed "Purchase" conversion
- **Duration**: 365 days  
- **Use for**: Repeat booking or review request ads

## Expected Timeline

- **Conversion actions creation**: 5-10 minutes each
- **Environment variable update**: 2 minutes
- **Code deployment**: 5-10 minutes
- **Google Ads verification**: 3-24 hours
- **Conversion data**: Immediate for testing, 24-48 hours for real data
- **Remarketing audiences**: 24-48 hours to populate

## Troubleshooting

If any conversion action shows as "Inactive":
1. **Check the conversion label** is correct in your .env file
2. **Test the specific conversion** using the test functions
3. **Verify gtag is firing** using Google Tag Assistant
4. **Wait 24-48 hours** for Google to verify the tag
5. **Check conversion window settings** (should be at least 30 days)

## Success Metrics

After full setup, you should see:
- ✅ All 4 conversion actions showing as "Active"
- ✅ Conversion data flowing into Google Ads
- ✅ Remarketing audiences populating
- ✅ Better attribution and optimization data
- ✅ Improved campaign performance through better targeting