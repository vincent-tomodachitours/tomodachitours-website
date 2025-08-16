# Google Ads Conversion Tracking Troubleshooting Guide

## Issue: Conversion Action Shows as "Inactive"

When your Google Ads conversion action shows as "Inactive" but Google Analytics is tracking purchases, it usually indicates one of these issues:

### 1. Conversion Action Configuration Issues

**Check these settings in Google Ads:**

1. **Go to Google Ads > Tools & Settings > Conversions**
2. **Click on your "Purchase" conversion action**
3. **Verify these settings:**

   - **Status**: Should be "Enabled" (not Paused)
   - **Conversion source**: Should be "Website"
   - **Category**: Should be "Purchase"
   - **Value**: Should be "Use different values for each conversion"
   - **Count**: Should be "One" (not "Every")
   - **Conversion window**: 30 days click, 1 day view (recommended)
   - **Attribution model**: Data-driven or Last click

### 2. Conversion Label Issues

**Current Configuration Check:**
- Your conversion ID: `AW-17482092392`
- Your purchase label: `A9-4CJbbgocbEOiejpBB`

**Verify the label is correct:**
1. In Google Ads, click on your Purchase conversion action
2. Look for the "Tag setup" section
3. The conversion label should match exactly: `A9-4CJbbgocbEOiejpBB`

### 3. Tracking Code Issues

**Test your tracking:**
1. Open your website in Chrome
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run: `window.testGoogleAds.testGoogleAdsConversion()`
5. Check for any errors

### 4. Common Fixes

#### Fix 1: Enable the Conversion Action
1. Go to Google Ads > Tools & Settings > Conversions
2. Find your Purchase conversion action
3. If it shows "Paused" or "Removed", click on it
4. Click "Edit settings"
5. Change status to "Enabled"
6. Save changes

#### Fix 2: Check Conversion Window
1. Click on your Purchase conversion action
2. Check the "Conversion window" setting
3. Make sure it's set to at least "30 days click, 1 day view"
4. If it's too short, recent conversions might not be counted

#### Fix 3: Verify Attribution Model
1. In your conversion action settings
2. Check "Attribution model"
3. Try changing to "Last click" temporarily for testing
4. Save and wait 24 hours to see if conversions appear

#### Fix 4: Create a New Conversion Action
If the current one is problematic:

1. **Create New Conversion Action:**
   - Go to Tools & Settings > Conversions
   - Click "+" to create new conversion
   - Choose "Website"
   - Name: "Tour Purchase"
   - Category: "Purchase"
   - Value: "Use different values for each conversion"
   - Count: "One"
   - Click "Create and continue"

2. **Get New Conversion Details:**
   - Copy the new Conversion ID (AW-XXXXXXXXXX)
   - Copy the new Conversion Label
   - Update your environment variables

3. **Update Environment Variables:**
   ```bash
   REACT_APP_GOOGLE_ADS_CONVERSION_ID=AW-NEW_CONVERSION_ID
   REACT_APP_GOOGLE_ADS_CONVERSION_LABELS={"purchase":"NEW_PURCHASE_LABEL","begin_checkout":"XXXXXXXXX/XXXXXXXXXXXXX","view_item":"XXXXXXXXX/XXXXXXXXXXXXX","add_to_cart":"XXXXXXXXX/XXXXXXXXXXXXX"}
   ```

### 5. Testing Steps

#### Step 1: Test in Browser Console
```javascript
// Run this in your browser console on your website
window.testGoogleAds.checkConversionStatus()
window.testGoogleAds.testGoogleAdsConversion()
```

#### Step 2: Use Google Tag Assistant
1. Install Google Tag Assistant Chrome extension
2. Navigate to your thank you page
3. Check if Google Ads conversion tag is firing
4. Look for any errors or warnings

#### Step 3: Check Google Ads Real-Time
1. Go to Google Ads > Tools & Settings > Conversions
2. Click on your conversion action
3. Look at the "Recent conversions" section
4. Test conversions should appear within a few hours

### 6. Advanced Debugging

#### Enable Enhanced Conversions
Add this to your conversion tracking:

```javascript
// In your analytics service
trackPurchase(purchaseData) {
    // ... existing code ...
    
    // Enhanced conversions
    if (customerEmail) {
        window.gtag('config', this.googleAdsId, {
            allow_enhanced_conversions: true
        });
        
        window.gtag('event', 'conversion', {
            send_to: `${this.googleAdsId}/${this.conversionLabels.purchase}`,
            value: price * quantity,
            currency: currency,
            transaction_id: transactionId,
            user_data: {
                email_address: customerEmail
            }
        });
    }
}
```

#### Check Network Requests
1. Open Developer Tools > Network tab
2. Filter by "google"
3. Complete a test purchase
4. Look for requests to "google-analytics.com" or "googleadservices.com"
5. Check if the conversion data is being sent

### 7. Timeline Expectations

- **Google Analytics**: Events appear within minutes
- **Google Ads**: Conversions can take 3-24 hours to appear
- **Attribution**: Full attribution data may take up to 7 days

### 8. Contact Support

If none of these steps work:

1. **Google Ads Support:**
   - Go to Google Ads > Help
   - Contact support with your conversion ID and label
   - Mention that GA4 is tracking but Ads conversions are inactive

2. **Provide This Information:**
   - Conversion ID: AW-17482092392
   - Purchase Label: A9-4CJbbgocbEOiejpBB
   - Website: https://tomodachitours.com
   - Issue: Conversions tracking in GA4 but not appearing in Google Ads

### 9. Quick Checklist

- [ ] Conversion action is "Enabled" in Google Ads
- [ ] Conversion label matches exactly
- [ ] Conversion window is appropriate (30 days recommended)
- [ ] Test conversion fires without errors
- [ ] Google Tag Assistant shows no issues
- [ ] Waited at least 24 hours for data to appear
- [ ] Enhanced conversions enabled (optional)

### 10. Emergency Workaround

If you need immediate results, create a simple test:

1. Create a new "Test Purchase" conversion action
2. Use a simple label without special characters
3. Test with a manual conversion
4. Once working, apply the same setup to your main conversion action